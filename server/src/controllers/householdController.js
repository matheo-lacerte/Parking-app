import { supabaseAdmin, supabasePublic } from "../utils/supabase.js"

export const getHouseholdMembers = async (req, res) => {
  try {
    const client = supabaseAdmin || supabasePublic

    const householdId = req.userProfile?.household_id
    if (!householdId) {
      return res.status(400).json({ error: "householdId manquant." })
    }

    const { data: members, error } = await client
      .from("household_members")
      .select("user_id, role, status")
      .eq("household_id", householdId)

    if (error) {
      console.error("getHouseholdMembers error:", error)
      return res.status(500).json({ error: "Erreur lors de la récupération des membres du foyer." })
    }


    const userIds = (members || []).map(m => m.user_id).filter(Boolean)

    if (userIds.length === 0) {
      return res.status(200).json([])
    }

    const { data: users, error: usersError } = await client
      .from("users")
      .select("id, name, last_name")
      .in("id", userIds)

    if (usersError) {
      console.error("getHouseholdMembers usersError:", usersError)
      return res.status(200).json(members)
    }

    const byId = new Map(users.map(u => [u.id, u]))
    const enriched = members.map(m => {
      const u = byId.get(m.user_id)
      return {
        user_id: m.user_id,
        name: u?.name ?? null,
        last_name: u?.last_name ?? null,
        role: m.role,
        status: m.status,
        numberOfMembers: members.length,
      }
    })

    return res.status(200).json(enriched)
  } catch (err) {
    console.error("getHouseholdMembers crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}

export const getHouseholdInfo = async (req, res) => {
    try {
    const client = supabaseAdmin || supabasePublic
    const { data, error } = await client
      .from("households")
      .select("*")
      .eq("id", req.userProfile?.household_id)

    if (error) {
      console.error("getHouseholdInfo error:", error)
      return res.status(500).json({ error: "Erreur lors de la récupération de l'adresse du foyer." })
    }


    return res.status(200).json(data)
  } catch (err) {
    console.error("getHouseholdInfo crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}

export const quitHousehold = async (req, res) => {
  try {
    const client = supabaseAdmin || supabasePublic
    const userId = req.userProfile?.id
    if (!userId) {
      return res.status(400).json({ error: "userId manquant." })
    }
    // Fetch quitting user's membership to determine role and household
    const { data: currentMembership, error: membershipErr } = await client
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", userId)
      .maybeSingle()
    if (membershipErr) {
      console.error("quitHousehold membershipErr:", membershipErr)
      return res.status(500).json({ error: "Erreur lors de la lecture du rôle du membre." })
    }

    const householdId = currentMembership?.household_id
    const wasOwner = currentMembership?.role === 'Owner'

    // Remove the member from the household
    const { error: deleteErr } = await client
      .from("household_members")
      .delete()
      .eq("user_id", userId)
    if (deleteErr) {
      console.error("quitHousehold deleteErr:", deleteErr)
      return res.status(500).json({ error: "Erreur lors de la suppression du membre du foyer." })
    }

    // If the user was the Owner, transfer ownership to another member deterministically
    if (householdId && wasOwner) {
      const { data: remaining, error: remErr } = await client
        .from("household_members")
        .select("user_id, role, status")
        .eq("household_id", householdId)
      if (remErr) {
        console.error("quitHousehold remainingErr:", remErr)
      } else if (Array.isArray(remaining) && remaining.length > 0) {
        // Prefer a member with status 'active'; otherwise pick first
        const activeMembers = remaining.filter(m => m.status === 'active')
        const nextOwner = (activeMembers[0] || remaining[0])
        try {
          const { error: promoteErr } = await client
            .from("household_members")
            .update({ role: 'Owner' })
            .eq("household_id", householdId)
            .eq("user_id", nextOwner.user_id)
          if (promoteErr) {
            console.error("quitHousehold promoteErr:", promoteErr)
          }
        } catch (e) {
          console.error("quitHousehold promote crash:", e)
        }
      }
    }

    // Update quitting user's profile
    const { error: updateError } = await client
      .from("users")
      .update({ household_id: null, account_status: 'pending' })
      .eq("id", userId)

    if (updateError) {
      console.error("quitHousehold updateError:", updateError)
      return res.status(500).json({ error: "Erreur lors de la mise à jour du profil utilisateur." })
    }

    return res.status(200).json({ message: "Membre supprimé du foyer et transfert du rôle si nécessaire." })
  } catch (err) {
    console.error("quitHousehold crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}

export const inviteMember = async (req, res) => {
  try {
    const client = supabaseAdmin || supabasePublic
    const inviter = req.userProfile
    const householdId = inviter?.household_id
    const { email } = req.body || {}

    if (!householdId) {
      return res.status(400).json({ error: "householdId manquant." })
    }
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Paramètre 'email' manquant ou invalide." })
    }

    const { data: existingUsers, error: userErr } = await client
      .from("users")
      .select("id, email, name, last_name")
      .ilike("email", email)

    if (userErr) {
      console.error("inviteMember users error:", userErr)
      return res.status(500).json({ error: "Erreur lors de la vérification de l'utilisateur." })
    }

    const targetUser = Array.isArray(existingUsers) && existingUsers.length > 0 ? existingUsers[0] : null

    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM,
      APP_BASE_URL,
    } = process.env

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      return res.status(500).json({
        error: "Configuration SMTP manquante dans .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).",
      })
    }

    const nodemailer = (await import("nodemailer")).default
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })

    const baseUrl = APP_BASE_URL || "https://parking-app.example.com"
    const householdParam = encodeURIComponent(String(householdId))
    const emailParam = encodeURIComponent(email)

    const acceptInviteUrl = `${baseUrl}/households?accept=1&householdId=${householdParam}&email=${emailParam}`
    const signupThenJoinUrl = `${baseUrl}/auth/signup?householdId=${householdParam}&email=${emailParam}`

    const inviterName = [inviter?.name, inviter?.last_name].filter(Boolean).join(" ") || "Un membre"
    const subjectExisting = `Invitation à rejoindre un foyer`
    const subjectNew = `Créez votre compte et rejoignez un foyer`

    const htmlExisting = `
      <div style="font-family:Arial,sans-serif;color:#222">
        <h2>Invitation à rejoindre un foyer</h2>
        <p>${inviterName} vous a invité à rejoindre son foyer.</p>
        <p>Appuyez sur le bouton ci-dessous pour accepter l'invitation.</p>
        <p><a href="${acceptInviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 16px;border-radius:6px;text-decoration:none">Accepter l'invitation</a></p>
        <p style="font-size:12px;color:#555">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br />
        <a href="${acceptInviteUrl}">${acceptInviteUrl}</a></p>
      </div>
    `

    const htmlNew = `
      <div style="font-family:Arial,sans-serif;color:#222">
        <h2>Vous êtes invité à rejoindre un foyer</h2>
        <p>${inviterName} vous a invité à rejoindre son foyer, mais vous n'avez pas encore de compte.</p>
        <p>Créez d'abord votre compte, puis vous pourrez rejoindre le foyer immédiatement.</p>
        <p><a href="${signupThenJoinUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 16px;border-radius:6px;text-decoration:none">Créer mon compte et rejoindre</a></p>
        <p style="font-size:12px;color:#555">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br />
        <a href="${signupThenJoinUrl}">${signupThenJoinUrl}</a></p>
      </div>
    `

    const mailOptions = {
      from: SMTP_FROM,
      to: email,
      subject: targetUser ? subjectExisting : subjectNew,
      html: targetUser ? htmlExisting : htmlNew,
    }

    await transporter.sendMail(mailOptions)

    if (targetUser?.id) {
      try {
        const { error: upsertErr } = await client
          .from("household_members")
          .upsert({
            household_id: householdId,
            user_id: targetUser.id,
            role: "Member",
            status: "invited",
          }, { onConflict: "household_id,user_id" })
        if (upsertErr) {
          console.warn("inviteMember upsert warning:", upsertErr)
        }
      } catch (e) {
        console.warn("inviteMember upsert crash:", e)
      }
    }

    return res.status(200).json({ message: "Invitation envoyée.", invitedEmail: email, existingAccount: Boolean(targetUser) })
  } catch (err) {
    console.error("inviteMember crash:", err)
    return res.status(500).json({ error: "Erreur serveur lors de l'envoi de l'invitation." })
  }
}
