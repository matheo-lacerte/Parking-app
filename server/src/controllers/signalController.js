import { supabaseAdmin, supabasePublic } from "../utils/supabase.js"

export const getObservationsByDate = async (req, res) => {
  try {
    const client = supabaseAdmin || supabasePublic
    const { data, error } = await client
      .from("observations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("getObservations error:", error)
      return res.status(500).json({ error: "Erreur lors de la récupération des observations." })
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error("getObservations crash:", err)
    return res.status(500).json({ error: "Erreur serveur." })
  }
}
