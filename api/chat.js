export default async function handler(req, res) {
  // Only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    // Check API key exists
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is missing");

      return res.status(500).json({
        error: "NOVA server is missing the OpenRouter API key."
      });
    }

    const { messages } = req.body || {};

    // Validate messages
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Messages must be an array."
      });
    }

    // Convert NOVA's internal roles into OpenRouter-compatible roles
    const cleanMessages = messages
      .filter(message =>
        message &&
        typeof message.content === "string" &&
        message.content.trim()
      )
      .map(message => {
        let role = message.role;

        if (role === "ai") {
          role = "assistant";
        }

        if (role !== "user" && role !== "assistant") {
          role = "user";
        }

        return {
          role,
          content: message.content
        };
      });

    if (cleanMessages.length === 0) {
      return res.status(400).json({
        error: "No valid messages were provided."
      });
    }

    const openRouterMessages = [
      {
        role: "system",
        content:
          "You are NOVA, a helpful AI assistant and workspace. Be clear, useful, honest, practical, and concise. Help users understand problems, write and debug code, analyze information, brainstorm ideas, and create practical plans."
      },
      ...cleanMessages
    ];

    console.log("NOVA request:", {
      messageCount: openRouterMessages.length,
      lastRole:
        openRouterMessages[openRouterMessages.length - 1]?.role
    });

    // Call OpenRouter
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
            "https://4-star.vercel.app",

          "X-Title":
            "NOVA AI"
        },

        body: JSON.stringify({
          model: "openrouter/free",
          messages: openRouterMessages
        })
      }
    );

    const data = await response.json();

    console.log("OpenRouter status:", response.status);

    // OpenRouter returned an error
    if (!response.ok) {
      console.error(
        "OpenRouter error:",
        JSON.stringify(data)
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          data?.error?.code ||
          "OpenRouter returned an error."
      });
    }

    // Check for an error inside a successful response
    if (
      data?.choices?.[0]?.finish_reason === "error" ||
      data?.choices?.[0]?.error
    ) {
      const choiceError =
        data?.choices?.[0]?.error;

      console.error(
        "OpenRouter choice error:",
        JSON.stringify(choiceError)
      );

      return res.status(500).json({
        error:
          choiceError?.message ||
          "The AI model failed to generate a response."
      });
    }

    // Get answer
    const answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      console.error(
        "OpenRouter returned no answer:",
        JSON.stringify(data)
      );

      return res.status(500).json({
        error:
          "NOVA received an empty response from the AI."
      });
    }

    // Success
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
        error?.message ||
        "NOVA could not reach the AI service."
    });
  }
}
