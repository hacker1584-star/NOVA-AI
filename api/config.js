/* =========================================================
   NOVA AI — PUBLIC CONFIG
========================================================= */

export default async function handler(req, res) {

  if (req.method !== "GET") {

    return res.status(405).json({
      error: "Method not allowed"
    });
  }


  const url =
    process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY;


  if (!url || !key) {

    console.error(
      "Supabase environment variables are missing."
    );

    return res.status(500).json({
      error:
        "NOVA authentication is not configured."
    });
  }


  return res.status(200).json({

    supabaseUrl: url,

    supabaseKey: key

  });
}
