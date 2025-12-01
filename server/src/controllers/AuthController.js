import { supabase } from "../utils/supabase.js"

export const signup = async (req, res) => {
    const { name, last_name, email, password, address } = req.body

    if (!name || !last_name || !email || !password || !address)
        return res.status(400).json({ error: "Champs manquants." })

    // 1. Signup auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, last_name } }
    })

    if (authError) return res.status(400).json({ error: authError.message })

    const user = authData.user
    if (!user) return res.status(500).json({ error: "Signup OK mais user null" })

    // 2. Insérer user dans ta DB
    let household_id = null
    let account_status = "pending"

    const { error: userInsertError } = await supabase
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

    // 3. Vérifier si household existe déjà
    const { data: existingHousehold } = await supabase
        .from("households")
        .select("*")
        .eq("address", address)
        .maybeSingle()

    // 4. Si aucun foyer → en créer un (MAINTENANT tu peux mettre primary_user)
    if (!existingHousehold) {
        const { data: newHousehold, error: houseError } = await supabase
            .from("households")
            .insert({
                address,
                primary_user: user.id // maintenant ça marche
            })
            .select()
            .single()

        if (houseError) return res.status(500).json({ error: "Erreur création household", houseError })

        household_id = newHousehold.id
        account_status = "active"

        // update user maintenant que household existe
        await supabase
            .from("users")
            .update({ household_id, account_status })
            .eq("id", user.id)
    }

    return res.status(200).json({
        message: account_status === "active"
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return res.status(401).json({ error: "Identifiants incorrects." })

    const { user, session } = data

    if (!session)
        return res.status(401).json({ error: "Email non confirmé." })


    const { data: profile } = await supabase
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