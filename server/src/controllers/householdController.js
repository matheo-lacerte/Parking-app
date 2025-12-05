import { supabaseAdmin, supabasePublic } from "../utils/supabase.js"
import crypto from "crypto"

const getClient = () => supabaseAdmin || supabasePublic

/* -------------------------------------------------------------------------- */
/*                            GET HOUSEHOLD MEMBERS                           */
/* -------------------------------------------------------------------------- */

export const getHouseholdMembers = async (req, res) => {
  try {
    const client = getClient()
    const householdId = req.userProfile?.household_id

    if (!householdId) {
      return res.status(400).json({ error: "householdId manquant." })
    }

    const { data: members, error } = await client
      .from("household_members")
      .select("user_id, role, status, email")
      .eq("household_id", householdId)

    if (error) {
      console.error("getHouseholdMembers error:", error)
      return res
        .status(500)
        .json({ error: "Erreur lors de la récupération des membres du foyer." })
    }

    const userIds = (members || [])
      .map((m) => m.user_id)
      .filter(Boolean)

    if (userIds.length === 0) {
      return res.status(200).json([])
    }

    const { data: users, error: usersError } = await client
      .from("users")
      .select("id, name, last_name")
      .in("id", userIds)

    if (usersError) {
      console.error("getHouseholdMembers usersError:", usersError)
      // On renvoie quand même la liste brute des members
      return res.status(200).json(members)
    }

    const byId = new Map(users.map((u) => [u.id, u]))

    const enriched = members.map((m) => {
      const u = byId.get(m.user_id)
      return {
        user_id: m.user_id,
        name: u?.name ?? null,
        last_name: u?.last_name ?? null,
        role: m.role,
        status: m.status,
        email: m.email ?? null,
        numberOfMembers: members.length,
      }
    })

    return res.status(200).json(enriched)
  } catch (err) {
    console.error("getHouseholdMembers crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}

/* -------------------------------------------------------------------------- */
/*                             GET HOUSEHOLD INFO                             */
/* -------------------------------------------------------------------------- */

export const getHouseholdInfo = async (req, res) => {
  try {
    const client = getClient()
    const householdId = req.userProfile?.household_id

    if (!householdId) {
      return res.status(400).json({ error: "householdId manquant." })
    }

    const { data, error } = await client
      .from("households")
      .select("*")
      .eq("id", householdId)

    if (error) {
      console.error("getHouseholdInfo error:", error)
      return res
        .status(500)
        .json({ error: "Erreur lors de la récupération de l'adresse du foyer." })
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error("getHouseholdInfo crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}

/* -------------------------------------------------------------------------- */
/*                               QUIT HOUSEHOLD                               */
/* -------------------------------------------------------------------------- */

export const quitHousehold = async (req, res) => {
  try {
    const client = getClient()
    const userId = req.userProfile?.id

    if (!userId) {
      return res.status(400).json({ error: "userId manquant." })
    }

    // Rôle + foyer actuel
    const { data: currentMembership, error: membershipErr } = await client
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", userId)
      .maybeSingle()

    if (membershipErr) {
      console.error("quitHousehold membershipErr:", membershipErr)
      return res
        .status(500)
        .json({ error: "Erreur lors de la lecture du rôle du membre." })
    }

    const householdId = currentMembership?.household_id
    const wasOwner = currentMembership?.role === "Owner"

    // Supprimer l'entrée dans household_members
    const { error: deleteErr } = await client
      .from("household_members")
      .delete()
      .eq("user_id", userId)

    if (deleteErr) {
      console.error("quitHousehold deleteErr:", deleteErr)
      return res
        .status(500)
        .json({ error: "Erreur lors de la suppression du membre du foyer." })
    }

    // Si c'était le propriétaire -> transférer
    if (householdId && wasOwner) {
      const { data: remaining, error: remErr } = await client
        .from("household_members")
        .select("user_id, role, status")
        .eq("household_id", householdId)

      if (remErr) {
        console.error("quitHousehold remainingErr:", remErr)
      } else if (Array.isArray(remaining) && remaining.length > 0) {
        const activeMembers = remaining.filter((m) => m.status === "active")
        const nextOwner = activeMembers[0] || remaining[0]

        try {
          const { error: promoteErr } = await client
            .from("household_members")
            .update({ role: "Owner" })
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

    // Mettre à jour le profil user
    const { error: updateError } = await client
      .from("users")
      .update({ household_id: null, account_status: "pending" })
      .eq("id", userId)

    if (updateError) {
      console.error("quitHousehold updateError:", updateError)
      return res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du profil utilisateur." })
    }

    return res.status(200).json({
      message: "Membre supprimé du foyer et transfert du rôle si nécessaire.",
    })
  } catch (err) {
    console.error("quitHousehold crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}

/* -------------------------------------------------------------------------- */
/*                               INVITE MEMBER                                */
/* -------------------------------------------------------------------------- */

export const inviteMember = async (req, res) => {
  try {
    const client = getClient()
    const inviter = req.userProfile
    const householdId = inviter?.household_id
    const { email } = req.body || {}

    if (!householdId) {
      return res.status(400).json({ error: "householdId manquant." })
    }

    if (!email || typeof email !== "string") {
      return res
        .status(400)
        .json({ error: "Paramètre 'email' manquant ou invalide." })
    }

    const { data: existingUsers, error: userErr } = await client
      .from("users")
      .select("id, email, name, last_name")
      .ilike("email", email)

    if (userErr) {
      console.error("inviteMember users error:", userErr)
      return res
        .status(500)
        .json({ error: "Erreur lors de la vérification de l'utilisateur." })
    }

    const targetUser =
      Array.isArray(existingUsers) && existingUsers.length > 0
        ? existingUsers[0]
        : null

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
        error:
          "Configuration SMTP manquante dans .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).",
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

    // Token signé
    const INVITE_SECRET =
      process.env.APP_INVITE_SECRET ||
      process.env.APP_SECRET ||
      process.env.JWT_SECRET

    const makeToken = (payload) => {
      const data = Buffer.from(JSON.stringify(payload)).toString("base64url")
      const sig = crypto
        .createHmac("sha256", String(INVITE_SECRET || "fallback-secret"))
        .update(data)
        .digest("base64url")
      return `${data}.${sig}`
    }

    const expiration =
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 jours

    const tokenPayload = targetUser?.id
      ? {
        householdId,
        userId: targetUser.id,
        iat: Date.now(),
        exp: expiration,
      }
      : {
        householdId,
        email,
        iat: Date.now(),
        exp: expiration,
      }

    const inviteToken = makeToken(tokenPayload)

    const acceptInviteUrl = `${baseUrl}/households?accept=1&invite=${encodeURIComponent(
      inviteToken
    )}`
    const signupThenJoinUrl = `${baseUrl}/auth/signup?invite=${encodeURIComponent(
      inviteToken
    )}`

    // Adresse du foyer pour le contexte
    let householdAddress = null
    try {
      const { data: hh } = await client
        .from("households")
        .select("address")
        .eq("id", householdId)
        .maybeSingle()
      householdAddress = hh?.address || null
    } catch {
      // pas bloquant
    }

    const inviterName =
      [inviter?.name, inviter?.last_name].filter(Boolean).join(" ") ||
      "Un membre"

    const subjectExisting = "Invitation à rejoindre un foyer"
    const subjectNew = "Créez votre compte et rejoignez un foyer"

    const htmlBaseHeader = `
      <h2 style="font-size:20px; font-weight:600; margin-bottom:10px;">EspaceD — Invitation</h2>
    `
    const htmlFooter = `
      <hr style="margin:30px 0; opacity:0.25;" />
      <p style="font-size:13px; color:#777; margin-bottom:10px;">
        Si vous n'êtes pas à l'origine de cette invitation, vous pouvez ignorer ce message.
      </p>
      <p style="font-size:12px; color:#999; text-align:center;">
        ⚠ Ceci est un courriel automatique — merci de ne pas répondre à ce message.
      </p>
    `

    const htmlExisting = `
      <div style="font-family:Arial,sans-serif;color:#222">
        ${htmlBaseHeader}
        <p style="font-size:16px; margin-bottom:15px;">
          ${inviterName} vous a invité à rejoindre son foyer sur EspaceD.
        </p>
        ${householdAddress
        ? `<p style="font-size:15px; margin-bottom:12px; color:#444;">Adresse du foyer: <strong>${householdAddress}</strong></p>`
        : ""
      }
        <p style="font-size:16px; margin-bottom:20px;">
          Cliquez sur le bouton ci-dessous pour accepter l'invitation :
        </p>
        <p style="text-align:center; margin:30px 0;">
          <a href="${acceptInviteUrl}"
             style="background:#2563eb; padding:12px 22px; border-radius:6px; color:white; font-weight:600; text-decoration:none; font-size:16px;">
             Accepter l'invitation
          </a>
        </p>
        <p style="margin-top:25px; font-size:14px; color:#666;">
          Si le bouton ne fonctionne pas, vous pouvez copier-coller ce lien dans votre navigateur :<br/>
          <span style="color:#2563eb; word-break:break-all;">${acceptInviteUrl}</span>
        </p>
        ${htmlFooter}
      </div>
    `

    const htmlNew = `
      <div style="font-family:Arial,sans-serif;color:#222">
        ${htmlBaseHeader}
        <p style="font-size:16px; margin-bottom:15px;">
          ${inviterName} vous a invité à rejoindre son foyer sur EspaceD.
          Vous n'avez pas encore de compte.
        </p>
        ${householdAddress
        ? `<p style="font-size:15px; margin-bottom:12px; color:#444;">Adresse du foyer: <strong>${householdAddress}</strong></p>`
        : ""
      }
        <p style="font-size:16px; margin-bottom:20px;">
          Créez d'abord votre compte, puis vous pourrez rejoindre le foyer immédiatement :
        </p>
        <p style="text-align:center; margin:30px 0;">
          <a href="${signupThenJoinUrl}"
             style="background:#16a34a; padding:12px 22px; border-radius:6px; color:white; font-weight:600; text-decoration:none; font-size:16px;">
             Créer mon compte et rejoindre
          </a>
        </p>
        <p style="margin-top:25px; font-size:14px; color:#666;">
          Si le bouton ne fonctionne pas, vous pouvez copier-coller ce lien dans votre navigateur :<br/>
          <span style="color:#16a34a; word-break:break-all;">${signupThenJoinUrl}</span>
        </p>
        ${htmlFooter}
      </div>
    `

    const mailOptions = {
      from: `EspaceD <${SMTP_FROM}>`,
      to: email,
      subject: targetUser ? subjectExisting : subjectNew,
      html: targetUser ? htmlExisting : htmlNew,
    }

    await transporter.sendMail(mailOptions)

    // Enregistrer l'invite dans household_members
    if (targetUser?.id) {
      try {
        const { error: upsertErr } = await client
          .from("household_members")
          .upsert(
            {
              household_id: householdId,
              user_id: targetUser.id,
              role: "invited",
              status: "pending",
            },
            { onConflict: "user_id" }
          )
        if (upsertErr) {
          console.warn("inviteMember upsert warning:", upsertErr)
        }
      } catch (e) {
        console.warn("inviteMember upsert crash:", e)
      }
    } else {
      try {
        const { error: insertErr } = await client.from("household_members").insert({
          household_id: householdId,
          user_id: null,
          role: "invited",
          status: "pending",
          email,
        })
        if (insertErr) {
          console.warn("inviteMember insert warning:", insertErr)
        }
      } catch (e) {
        console.warn("inviteMember insert crash:", e)
      }
    }

    return res.status(200).json({
      message: "Invitation envoyée.",
      invitedEmail: email,
      existingAccount: Boolean(targetUser),
    })
  } catch (err) {
    console.error("inviteMember crash:", err)
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de l'envoi de l'invitation." })
  }
}

/* -------------------------------------------------------------------------- */
/*                               ACCEPT INVITE                                */
/* -------------------------------------------------------------------------- */

export const acceptInvite = async (req, res) => {
  try {
    const client = getClient()

    const authUser = req.userProfile
    const authUserId = authUser?.id

    const householdIdParam = Number(
      req.body?.householdId || req.query?.householdId
    )
    const emailParam = (req.body?.email || req.query?.email || "").trim()
    const inviteToken = (req.body?.invite || req.query?.invite || "").trim()

    let householdId = householdIdParam || null
    let email = emailParam || ""
    let tokenUserId = null

    // Si token signé présent, on le vérifie
    if (inviteToken) {
      try {
        const [dataB64, sigB64] = inviteToken.split(".")
        if (!dataB64 || !sigB64) throw new Error("Bad token format")

        const secret = String(
          process.env.APP_INVITE_SECRET ||
          process.env.APP_SECRET ||
          process.env.JWT_SECRET ||
          "fallback-secret"
        )

        const expectedSig = crypto
          .createHmac("sha256", secret)
          .update(dataB64)
          .digest("base64url")

        if (expectedSig !== sigB64) throw new Error("Invalid token signature")

        const payloadJson = Buffer.from(dataB64, "base64url").toString("utf8")
        const payload = JSON.parse(payloadJson)

        if (typeof payload.exp === "number" && Date.now() > payload.exp) {
          throw new Error("Token expired")
        }

        if (payload.householdId) {
          householdId = Number(payload.householdId)
        }

        if (payload.userId) {
          tokenUserId = String(payload.userId)
          email = "" // si userId fourni, on ne se base pas sur l'email
        } else if (payload.email) {
          email = String(payload.email)
        }
      } catch (e) {
        console.warn("acceptInvite token verify warn:", e?.message || e)
        // on retombe sur les params bruts si dispo
      }
    }

    // user effectif (soit authentifié, soit fourni par token)
    const effectiveUserId = authUserId || tokenUserId

    if (!effectiveUserId) {
      return res.status(401).json({
        error: "Non authentifié et aucun identifiant utilisateur dans le jeton.",
      })
    }

    // Si on n’a toujours pas de foyer, on essaie de le déduire via une invitation pending
    if (!householdId) {
      // 1) invite pending attachée à un email
      if (email) {
        const { data: membershipByEmailOnly } = await client
          .from("household_members")
          .select("*")
          .eq("status", "pending")
          .ilike("email", email)
          .maybeSingle()

        if (membershipByEmailOnly?.household_id) {
          householdId = Number(membershipByEmailOnly.household_id)
        }
      }

      // 2) invite pending attachée à un user_id
      if (!householdId) {
        const { data: membershipByUserOnly } = await client
          .from("household_members")
          .select("*")
          .eq("status", "pending")
          .eq("user_id", effectiveUserId)
          .maybeSingle()

        if (membershipByUserOnly?.household_id) {
          householdId = Number(membershipByUserOnly.household_id)
        }
      }

      if (!householdId) {
        return res.status(400).json({ error: "householdId manquant." })
      }
    }

    // Chercher une membership pending pour cet user OU cet email
    const { data: membershipByUser } = await client
      .from("household_members")
      .select("*")
      .eq("household_id", householdId)
      .eq("user_id", effectiveUserId)
      .maybeSingle()

    let pendingMembership = membershipByUser || null

    if (!pendingMembership && email) {
      const { data: membershipByEmail } = await client
        .from("household_members")
        .select("*")
        .eq("household_id", householdId)
        .ilike("email", email)
        .maybeSingle()

      pendingMembership = membershipByEmail || null
    }

    if (!pendingMembership) {
      return res.status(404).json({ error: "Invitation introuvable." })
    }

    if (pendingMembership.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Cette invitation n'est pas en attente." })
    }

    // Mettre à jour la membership
    const updateFields = { status: "accepted" }

    // Si l'invite a été créée seulement avec email, on bind le user_id
    if (!pendingMembership.user_id) {
      updateFields.user_id = effectiveUserId
      updateFields.email = null
    } else {
      // si user_id déjà là, on nettoie l'email
      updateFields.email = null
    }

    // Rôle : invited -> member
    const currentRole = (pendingMembership.role || "").toLowerCase()
    if (currentRole === "invited" || currentRole === "") {
      updateFields.role = "member"
    }

    const { error: updateErr } = await client
      .from("household_members")
      .update(updateFields)
      .eq("id", pendingMembership.id)

    if (updateErr) {
      console.error("acceptInvite updateErr:", updateErr)
      return res
        .status(500)
        .json({ error: "Erreur lors de l'activation de l'invitation." })
    }

    // Mettre à jour le profil user
    const { error: userUpdateErr } = await client
      .from("users")
      .update({ household_id: householdId, account_status: "active" })
      .eq("id", effectiveUserId)

    if (userUpdateErr) {
      console.error("acceptInvite userUpdateErr:", userUpdateErr)
      // on ne bloque pas la réponse pour ça
    }

    return res
      .status(200)
      .json({ message: "Invitation acceptée. Membre actif du foyer." })
  } catch (err) {
    console.error("acceptInvite crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}

/* -------------------------------------------------------------------------- */
/*                               CANCEL INVITE                                */
/* -------------------------------------------------------------------------- */

export const cancelInvite = async (req, res) => {
  try {
    const client = getClient()
    const inviter = req.userProfile
    const inviterHouseholdId = inviter?.household_id
    const { householdId, email, userId } = req.body || {}

    if (!inviterHouseholdId) {
      return res
        .status(400)
        .json({ error: "householdId manquant pour l'inviteur." })
    }

    const targetHouseholdId = Number(householdId || inviterHouseholdId)
    if (!targetHouseholdId) {
      return res.status(400).json({ error: "householdId manquant." })
    }

    if (!email && !userId) {
      return res
        .status(400)
        .json({ error: "Spécifiez email ou userId de l'invité." })
    }

    // Trouver la membership pending à annuler
    let query = client
      .from("household_members")
      .select("*")
      .eq("household_id", targetHouseholdId)

    if (userId) query = query.eq("user_id", userId)
    if (email) query = query.ilike("email", email)

    const { data: membership, error: findErr } = await query.maybeSingle()

    if (findErr) {
      console.error("cancelInvite findErr:", findErr)
      return res
        .status(500)
        .json({ error: "Erreur lors de la recherche de l'invitation." })
    }

    if (!membership) {
      return res.status(404).json({ error: "Invitation introuvable." })
    }

    if (membership.status !== "pending") {
      return res.status(400).json({
        error: "Seules les invitations en attente peuvent être annulées.",
      })
    }

    // Suppression
    const { error: delErr } = await client
      .from("household_members")
      .delete()
      .eq("id", membership.id)

    if (delErr) {
      console.error("cancelInvite delErr:", delErr)
      return res
        .status(500)
        .json({ error: "Erreur lors de l'annulation de l'invitation." })
    }

    // Email d'annulation (optionnel)
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM,
      APP_BASE_URL,
    } = process.env

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM) {
      try {
        const nodemailer = (await import("nodemailer")).default
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT),
          secure: Number(SMTP_PORT) === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        })

        const baseUrl = APP_BASE_URL || "https://parking-app.example.com"
        const inviterName =
          [inviter?.name, inviter?.last_name].filter(Boolean).join(" ") ||
          "Un membre"
        const toAddress = membership.email || email

        if (toAddress) {
          const html = `
            <div style="font-family:Arial,sans-serif;color:#222">
              <h2 style="font-size:20px; font-weight:600; margin-bottom:10px;">EspaceD — Invitation annulée</h2>
              <p style="font-size:16px; margin-bottom:15px;">${inviterName} a annulé l'invitation à rejoindre son foyer sur EspaceD.</p>
              <p style="font-size:14px; color:#666; margin-bottom:20px;">Si vous pensez que c'est une erreur, contactez l'inviteur.</p>
              <hr style="margin:30px 0; opacity:0.25;" />
              <p style="font-size:12px; color:#999; text-align:center;">⚠ Ceci est un courriel automatique — merci de ne pas répondre à ce message.</p>
              <p style="font-size:12px; color:#666; text-align:center;">EspaceD • <a href="${baseUrl}">${baseUrl}</a></p>
            </div>
          `
          await transporter.sendMail({
            from: `EspaceD <${SMTP_FROM}>`,
            to: toAddress,
            subject: "Invitation annulée",
            html,
          })
        }
      } catch (e) {
        console.warn("cancelInvite mail warn:", e)
      }
    }

    return res.status(200).json({ message: "Invitation annulée." })
  } catch (err) {
    console.error("cancelInvite crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}

/* -------------------------------------------------------------------------- */
/*                               REMOVE MEMBER                                */
/* -------------------------------------------------------------------------- */

export const removeMember = async (req, res) => {
  try {
    const client = getClient()
    const requester = req.userProfile
    const requesterHouseholdId = requester?.household_id
    const { householdId, userId } = req.body || {}

    if (!requesterHouseholdId) {
      return res
        .status(400)
        .json({ error: "householdId manquant pour l'utilisateur." })
    }

    // Vérifier que le requester est Owner
    const { data: requesterMembership } = await client
      .from("household_members")
      .select("role, status")
      .eq("household_id", requesterHouseholdId)
      .eq("user_id", requester?.id)
      .maybeSingle()

    if (!requesterMembership || requesterMembership.role !== "Owner") {
      return res
        .status(403)
        .json({ error: "Seul le propriétaire peut retirer des membres." })
    }

    const targetHouseholdId = Number(householdId || requesterHouseholdId)
    if (!targetHouseholdId) {
      return res.status(400).json({ error: "householdId manquant." })
    }

    if (!userId) {
      return res.status(400).json({ error: "Paramètre userId manquant." })
    }

    // Vérifier que le membre cible existe
    const { data: targetMembership } = await client
      .from("household_members")
      .select("*")
      .eq("household_id", targetHouseholdId)
      .eq("user_id", userId)
      .maybeSingle()

    if (!targetMembership) {
      return res
        .status(404)
        .json({ error: "Membre introuvable dans ce foyer." })
    }

    if (targetMembership.status !== "accepted") {
      return res.status(400).json({
        error: "Utilisez l'annulation pour une invitation en attente.",
      })
    }

    if (targetMembership.role === "Owner") {
      return res.status(400).json({
        error: "Impossible de retirer le propriétaire via cette action.",
      })
    }

    // Supprimer la membership
    const { error: delErr } = await client
      .from("household_members")
      .delete()
      .eq("household_id", targetHouseholdId)
      .eq("user_id", userId)

    if (delErr) {
      console.error("removeMember delErr:", delErr)
      return res
        .status(500)
        .json({ error: "Erreur lors de la suppression du membre." })
    }

    // Détacher le user du foyer
    const { error: userUpdateErr } = await client
      .from("users")
      .update({ household_id: null, account_status: "pending" })
      .eq("id", userId)

    if (userUpdateErr) {
      console.error("removeMember userUpdateErr:", userUpdateErr)
      // On continue quand même
    }

    // Email de notification
    try {
      const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASS,
        SMTP_FROM,
        APP_BASE_URL,
      } = process.env

      if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM) {
        const nodemailer = (await import("nodemailer")).default
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT),
          secure: Number(SMTP_PORT) === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        })

        const [{ data: userRow }, { data: hhRow }] = await Promise.all([
          client
            .from("users")
            .select("email,name,last_name")
            .eq("id", userId)
            .maybeSingle(),
          client
            .from("households")
            .select("address")
            .eq("id", targetHouseholdId)
            .maybeSingle(),
        ])

        const targetEmail = userRow?.email
        const targetName = [userRow?.name, userRow?.last_name]
          .filter(Boolean)
          .join(" ")
        const hhAddress = hhRow?.address || ""
        const baseUrl = APP_BASE_URL || "https://parking-app.example.com"

        if (targetEmail) {
          const subject = "Notification — retrait du foyer"
          const html = `
            <div style="font-family:Arial,sans-serif;color:#222">
              <h2 style="font-size:20px; font-weight:600; margin-bottom:10px;">EspaceD — Retrait du foyer</h2>
              <p style="font-size:16px; margin-bottom:15px;">Bonjour ${targetName ||
            ""},</p>
              <p style="font-size:16px; margin-bottom:10px;">
                Vous avez été retiré du foyer sur EspaceD.
              </p>
              ${hhAddress
              ? `<p style="font-size:15px; margin-bottom:12px; color:#444;">Adresse du foyer: <strong>${hhAddress}</strong></p>`
              : ""
            }
              <p style="font-size:14px; color:#666; margin-top:20px;">
                Si vous pensez qu'il s'agit d'une erreur, contactez le propriétaire du foyer.
              </p>
              <hr style="margin:30px 0; opacity:0.25;" />
              <p style="font-size:12px; color:#999; text-align:center;">
                ⚠ Ceci est un courriel automatique — merci de ne pas répondre à ce message.
              </p>
              <p style="font-size:12px; color:#666; text-align:center;">
                EspaceD • <a href="${baseUrl}">${baseUrl}</a>
              </p>
            </div>
          `
          await transporter.sendMail({
            from: `EspaceD <${SMTP_FROM}>`,
            to: targetEmail,
            subject,
            html,
          })
        }
      }
    } catch (e) {
      console.warn("removeMember mail warn:", e)
    }

    return res.status(200).json({ message: "Membre retiré du foyer." })
  } catch (err) {
    console.error("removeMember crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}
