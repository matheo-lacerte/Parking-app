import { supabasePublic, supabaseAdmin } from "../utils/supabase.js"

export const signup = async (req, res) => {
    const { name, last_name, email, password, address, invite } = req.body

    if (!name || !last_name || !email || !password)
        return res.status(400).json({ error: "Champs manquants." })

    // 1. Signup auth
    if (!supabasePublic) return res.status(500).json({ error: "Configuration Supabase ANON manquante." })
    const { data: authData, error: authError } = await supabasePublic.auth.signUp({
        email,
        password,
        options: { data: { name, last_name } }
    })

    if (authError) return res.status(400).json({ error: authError.message })

    const user = authData.user
    if (!user) return res.status(500).json({ error: "Signup OK mais user null" })

    // 2. Insérer user dans ta DB
    let household_id = null
    // If an invite token is present, keep account pending until acceptance
    let account_status = invite ? "pending" : "pending"

    const client = supabaseAdmin || supabasePublic
    const { error: userInsertError } = await client
        .from("users")
        .insert({
            id: user.id,
            name,
            last_name,
            email,
            role: "user",
            account_status
        })

    if (userInsertError) return res.status(500).json({ error: "Erreur DB lors du user insert." })

    // 3. If invite token present, DO NOT create or join a household here
    //    User will accept the invite later via /api/household/accept when authenticated.
    //    Otherwise, proceed with address-based household creation if address provided.
    if (!invite) {
        if (!address) {
            // No invite and no address → cannot create household, keep pending
            // Return an explicit message to frontend
            return res.status(200).json({
                message: "Compte créé. Veuillez saisir une adresse pour créer votre foyer ou accepter une invitation.",
                account_status,
                household_id,
                user_id: user.id
            })
        }

        // 4. Vérifier si household existe déjà
        const { data: existingHousehold } = await client
            .from("households")
            .select("*")
            .eq("address", address)
            .maybeSingle()

        // 5. Si aucun foyer → en créer un
        if (!existingHousehold) {
            const { data: newHousehold, error: houseError } = await client
                .from("households")
                .insert({
                    address,
                    primary_user: user.id
                })
                .select()
                .single()

            if (houseError) return res.status(500).json({ error: "Erreur création household", houseError })

            household_id = newHousehold.id
            account_status = "active"

            await client
                .from("users")
                .update({ household_id, account_status })
                .eq("id", user.id)

            await client
                .from("household_members")
                .insert({
                    household_id,
                    user_id: user.id,
                    role: "Owner",
                    status: "accepted"
                })
        } else {
            // If address exists already, keep pending and wait for owner to invite
            account_status = "pending"
            await client
                .from("users")
                .update({ account_status })
                .eq("id", user.id)
        }
    }

    return res.status(200).json({
        message: invite
            ? "Compte créé. Confirmez votre email puis acceptez l'invitation."
            : account_status === "active"
                ? "Foyer créé, compte actif immédiat ✔"
                : "Adresse déjà existante — compte en attente d'invitation",
        account_status,
        household_id,
        user_id: user.id
    })
}




export const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password)
        return res.status(400).json({ error: "email et mot de passe requis." })

    if (!supabasePublic) return res.status(500).json({ error: "Configuration Supabase ANON manquante." })
    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password })

    if (error) return res.status(401).json({ error: "Identifiants incorrects." })

    const { user, session } = data

    if (!session)
        return res.status(401).json({ error: "Email non confirmé." })


    const client = supabaseAdmin || supabasePublic
    const { data: profile } = await client
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

    return res.status(200).json({
        message: "Connexion réussie.",
        user: profile,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
    })
}

export const logout = async (req, res) => {
    // With bearer tokens, server-side signOut is not needed and may fail in service context.
    // Frontend should drop the token; we just acknowledge the request.
    return res.status(200).json({ message: "Déconnexion réussie." })
}

export const getProfile = async (req, res) => {
    // Profil déjà attaché par le middleware authMiddleware
    if (!req.userProfile) return res.status(500).json({ error: "Profil non chargé." })
    return res.status(200).json({ user: req.userProfile })
}   