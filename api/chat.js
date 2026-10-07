/* =========================================
   NOVA AI — CHAT API
========================================= */

export default async function handler(req, res) {

  /* -----------------------------------------
     ONLY POST
  ----------------------------------------- */

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });

  }


  try {

    const {
      messages
    } = req.body || {};


    /* -----------------------------------------
       VALIDATE MESSAGES
    ----------------------------------------- */

    if (
      !Array.isArray(messages)
    ) {

      return res.status(400).json({
        error:
          "Messages must be an array."
      });

    }


    /* -----------------------------------------
       CLEAN MESSAGES
    ----------------------------------------- */

    const cleanMessages =
      messages
        .filter(
          message =>
            message &&
            typeof message.content === "string"
        )
        .map(
          message => ({

            role:
              message.role === "ai"
                ? "assistant"
                : message.role,

            content:
              message.content

          })
        );


    /* -----------------------------------------
       OPENROUTER
    ----------------------------------------- */

    if (
      !process.env.OPENROUTER_API_KEY
    ) {

      console.error(
        "OPENROUTER_API_KEY is missing."
      );


      return res.status(500).json({
        error:
          "NOVA AI service is not configured."
      });

    }


    const response =
      await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {

          method: "POST",

          headers: {

            "Authorization":
              `Bearer ${process.env.OPENROUTER_API_KEY}`,

            "Content-Type":
              "application/json",

            "HTTP-Referer":
              "https://nova-ai039.vercel.app",

            "X-Title":
              "NOVA AI"

          },

          body:
            JSON.stringify({

              model:
                "openrouter/free",

              messages: [

                {

                  role:
                    "system",

                  content:
                    `
You are NOVA, an AI assistant.

Your job is to be useful, clear, practical and honest.

You can:
- answer questions
- explain difficult topics
- help with programming
- analyze information
- write and rewrite content
- help users plan projects
- reason through problems
- assist with technical work

When a tool result is supplied by the application, treat that result as authoritative for the calculation or operation that was performed.

Do not claim to have used a tool that was not supplied.

Do not invent current information.

Keep answers reasonably concise unless the user asks for detail.
`
                },

                ...cleanMessages

              ]

            })

        }
      );


    console.log(
      "OpenRouter status:",
      response.status
    );


    const data =
      await response.json();


    /* -----------------------------------------
       HANDLE API ERROR
    ----------------------------------------- */

    if (
      !response.ok
    ) {

      console.error(
        "OpenRouter error:",
        data
      );


      return res.status(
        response.status
      ).json({

        error:
          data?.error?.message ||
          "OpenRouter returned an error."

      });

    }


    /* -----------------------------------------
       EXTRACT ANSWER
    ----------------------------------------- */

    const answer =
      data?.choices?.[0]?.message?.content;


    if (!answer) {

      return res.status(500).json({

        error:
          "OpenRouter returned no answer."

      });

    }


    /* -----------------------------------------
       SUCCESS
    ----------------------------------------- */

    return res.status(200).json({

      answer

    });

  }


  catch (error) {

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
