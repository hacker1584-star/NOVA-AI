export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages must be an array."
      });
    }


    // Convert NOVA's internal "ai" role
    // into the standard "assistant" role.

    const cleanMessages = messages.map(message => ({
      role:
        message.role === "ai"
          ? "assistant"
          : message.role,

      content: message.content
    }));


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
            "https://nova-ai039-e2a9fyejy-hacker1584-star.vercel.app",

          "X-Title":
            "NOVA AI"
        },

        body: JSON.stringify({

          model: "openrouter/free",

          messages: [
            {
              role: "system",

              content:
                "You are NOVA, a helpful AI assistant. Be clear, useful, honest, and practical. Help users understand problems, write code, analyze information, and create plans."
            },

            ...cleanMessages

          ]

        })
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "OpenRouter error:",
        data
      );

      return res.status(response.status).json({

        error:
          data?.error?.message ||
          "OpenRouter returned an error."

      });

    }


    const answer =
      data?.choices?.[0]?.message?.content;


    if (!answer) {

      return res.status(500).json({

        error:
          "OpenRouter returned no answer."

      });

    }


    return res.status(200).json({

      answer

    });


  } catch (error) {

    console.error(
      "NOVA backend error:",
      error
    );

    return res.status(500).json({

      error:
        "NOVA could not connect to the AI service."

    });

  }

}
