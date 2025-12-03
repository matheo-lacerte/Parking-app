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
      }
    })

    return res.status(200).json(enriched)
  } catch (err) {
    console.error("getHouseholdMembers crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}

export const getHouseholdAddress = async (req, res) => {
    try {
    const client = supabaseAdmin || supabasePublic
    const { data, error } = await client
      .from("households")
      .select("id, address")
      .eq("id", req.userProfile?.household_id)
      .maybeSingle()

    if (error) {
      console.error("getHouseholdAddress error:", error)
      return res.status(500).json({ error: "Erreur lors de la récupération de l'adresse du foyer." })
    }

    return res.status(200).json(data || {})
  } catch (err) {
    console.error("getHouseholdAddress crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}