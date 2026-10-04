export default async function handler(req, res) {

  /* =========================================
     METHOD CHECK
  ========================================= */

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });

  }


  try {

    /* =========================================
       CHECK API KEY
    ========================================= */

    const apiKey =
      process.env.OPENROUTER_API_KEY;


    if (!apiKey) {

      console.error(
        "OPENROUTER_API_KEY is missing."
      );

      return res.status(500).json({
        error:
          "OPENROUTER_API_KEY is not configured in Vercel."
      });

    }


    /* =========================================
       READ REQUEST
    ========================================= */

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;


    const messages =
      body?.messages;


    if (!Array.isArray(messages)) {

      return res.status(400).json({
        error:
          "Messages must be an array."
      });

    }


    /* =========================================
       CLEAN MESSAGE ROLES
    ========================================= */

    const cleanedMessages =
      messages
        .filter(
          message =>
            message &&
            typeof message.content === "string"
        )
        .map(message => {

          let role =
            message.role;


          /*
           Convert NOVA's internal "ai"
           role to OpenAI/OpenRouter
           compatible "assistant".
          */

          if (role === "ai") {
            role = "assistant";
          }


          /*
           Only allow supported roles.
          */

          if (
            ![
              "system",
              "user",
              "assistant"
            ].includes(role)
          ) {

            role = "user";

          }


          return {
            role,
            content:
              message.content
          };

        });


    /* =========================================
       NOVA SYSTEM INSTRUCTIONS
    ========================================= */

    const systemMessage = {

      role: "system",

      content: `
You are NOVA, an advanced AI workspace assistant.

Your job is to help users:
- understand difficult topics
- write and debug code
- build software
- analyze problems
- create practical plans
- brainstorm ideas
- learn technical subjects
- work through projects step by step

Be clear, useful, accurate and practical.

When writing code:
- provide complete working code when appropriate
- explain important parts briefly
- avoid unnecessary complexity

When the user is building a project, maintain context from the conversation.

Do not claim that you performed an action that you did not actually perform.
      `.trim()

    };


    /* =========================================
       SEND TO OPENROUTER
    ========================================= */

    const response =
      await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {

          method: "POST",

          headers: {

            "Authorization":
              `Bearer ${apiKey}`,

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
                systemMessage,
                ...cleanedMessages
              ]

            })

        }
      );


    /* =========================================
       READ OPENROUTER RESPONSE
    ========================================= */

    const data =
      await response.json();


    /* =========================================
       PROVIDER ERROR
    ========================================= */

    if (!response.ok) {

      console.error(
        "OPENROUTER ERROR:",
        data
      );


      return res
        .status(response.status)
        .json({

          error:
            data?.error?.message ||
            data?.error?.code ||
            "OpenRouter returned an error.",

          providerStatus:
            response.status

        });

    }


    /* =========================================
       EXTRACT ANSWER
    ========================================= */

    const answer =
      data?.choices?.[0]?.message?.content;


    if (!answer) {

      console.error(
        "EMPTY OPENROUTER RESPONSE:",
        data
      );


      return res.status(500).json({

        error:
          "OpenRouter returned no AI message."

      });

    }


    /* =========================================
       SUCCESS
    ========================================= */

    return res.status(200).json({

      answer

    });


  } catch (error) {

    console.error(
      "NOVA BACKEND ERROR:",
      error
    );


    return res.status(500).json({

      error:
        error?.message ||
        "Unexpected NOVA backend error."

    });

  }

}
