
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages must be an array."
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${process.env.OPENROUTER_API_KEY}`,

          "Content-Type":
            "application/json",

          "HTTP-Referer":
            "https://hacker1584-star.github.io/NOVA-AI/",

          "X-Title":
            "NOVA AI"
        },

        body: JSON.stringify({
          model: "openrouter/free",

          messages: [
            {
              role: "system",
              content:
                "You are NOVA, a helpful AI assistant. Be clear, useful, honest, and concise. Help users understand problems, write code, analyze information, and create practical plans."
            },

            ...messages
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "The AI provider returned an error."
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({
        error: "NOVA received an empty response."
      });
    }

    return res.status(200).json({
      answer
    });

  } catch (error) {

    console.error("NOVA backend error:", error);

    return res.status(500).json({
      error: "NOVA could not reach the AI service."
    });
  }
}
