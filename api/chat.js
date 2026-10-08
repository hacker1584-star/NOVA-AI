/* =========================================
   NOVA AI — V4 CHAT API
   Server Tool Architecture
========================================= */

export default async function handler(req, res) {

  /* =========================================
     ONLY POST
  ========================================= */

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });

  }


  try {

    const {
      messages
    } = req.body || {};


    /* =========================================
       VALIDATE
    ========================================= */

    if (!Array.isArray(messages)) {

      return res.status(400).json({
        error:
          "Messages must be an array."
      });

    }


    /* =========================================
       API KEY
    ========================================= */

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


    /* =========================================
       CLEAN MESSAGES
    ========================================= */

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


    /* =========================================
       NOVA SYSTEM
    ========================================= */

    const systemPrompt = `

You are NOVA, an advanced AI workspace assistant.

Your job is to provide accurate, useful, practical,
and honest assistance.

CORE CAPABILITIES:

- General conversation
- Explanation and tutoring
- Programming
- Debugging
- Writing
- Rewriting
- Planning
- Problem solving
- Research
- Technical analysis
- Data reasoning
- Project development
- Current information research

IMPORTANT TOOL BEHAVIOR:

You have access to server-side tools.

Use web search when the user needs:
- current information
- recent events
- current technology information
- current company information
- current prices or availability
- news
- research
- facts that may have changed
- information you are not confident is current

Use web fetch when:
- the user gives you a URL
- you need to inspect a webpage
- you need the contents of a source
- you need to investigate a page found during research

Use the datetime tool when:
- the exact current date or time matters.

Use the advisor when:
- a difficult technical or reasoning problem would benefit
  from additional expert guidance.

Do NOT claim that you searched the web unless a web tool
actually ran.

Do NOT invent sources.

Do NOT pretend to have capabilities that were not provided.

When web tools return sources, use the available source
information in your answer and provide useful citations
or links when appropriate.

For normal questions that do not require current
information, answer normally without unnecessary tool use.

For complex research tasks, perform enough investigation
to produce a useful answer rather than immediately
giving a shallow response.

Be concise by default, but give detailed answers when
the user asks for depth.

You are NOVA.
`;


    /* =========================================
       SERVER TOOLS
    ========================================= */

    const tools = [

      {
        type:
          "openrouter:web_search",

        parameters: {

          max_results:
            5,

          max_total_results:
            12

        }

      },


      {
        type:
          "openrouter:web_fetch",

        parameters: {

          engine:
            "openrouter",

          max_content_tokens:
            30000

        }

      },


      {
        type:
          "openrouter:datetime",

        parameters: {}

      },


      {
        type:
          "openrouter:advisor",

        parameters: {

          model:
            "~anthropic/claude-opus-latest"

        }

      }

    ];


    /* =========================================
       OPENROUTER REQUEST
    ========================================= */

    const response =
      await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {

          method:
            "POST",

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

              /*
               * We keep the current free router
               * for now.
               *
               * If the selected free model does
               * not support tools, the fallback
               * below will retry without them.
               */

              model:
                "openrouter/free",


              messages: [

                {
                  role:
                    "system",

                  content:
                    systemPrompt
                },

                ...cleanMessages

              ],


              tools

            })

        }
      );


    console.log(
      "NOVA OpenRouter status:",
      response.status
    );


    let data =
      await response.json();


    /* =========================================
       TOOL COMPATIBILITY FALLBACK
    ========================================= */

    /*
     * Some free-routed models/providers may not
     * support server tools.
     *
     * If OpenRouter rejects the tool request,
     * retry without tools rather than breaking
     * ordinary NOVA chat.
     */

    if (
      !response.ok &&
      isToolCompatibilityError(data)
    ) {

      console.warn(
        "NOVA tool request unsupported. Retrying without tools."
      );


      const fallbackResponse =
        await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {

            method:
              "POST",

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
                      systemPrompt
                  },

                  ...cleanMessages

                ]

              })

          }
        );


      data =
        await fallbackResponse.json();


      if (!fallbackResponse.ok) {

        console.error(
          "NOVA fallback OpenRouter error:",
          data
        );


        return res.status(
          fallbackResponse.status
        ).json({

          error:
            data?.error?.message ||
            "OpenRouter returned an error."

        });

      }

    }


    /* =========================================
       NORMAL API ERROR
    ========================================= */

    else if (!response.ok) {

      console.error(
        "NOVA OpenRouter error:",
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


    /* =========================================
       EXTRACT ANSWER
    ========================================= */

    const message =
      data?.choices?.[0]?.message;


    const answer =
      message?.content;


    if (!answer) {

      console.error(
        "NOVA empty model response:",
        JSON.stringify(data)
      );


      return res.status(500).json({

        error:
          "NOVA returned no answer."

      });

    }


    /* =========================================
       SUCCESS
    ========================================= */

    return res.status(200).json({

      answer:

        typeof answer === "string"

          ? answer

          : JSON.stringify(answer)

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


/* =========================================
   TOOL ERROR DETECTION
========================================= */

function isToolCompatibilityError(
  data
) {

  const message =
    String(
      data?.error?.message ||
      ""
    ).toLowerCase();


  const code =
    String(
      data?.error?.code ||
      ""
    ).toLowerCase();


  return (

    message.includes(
      "tool"
    )

    ||

    message.includes(
      "unsupported"
    )

    ||

    message.includes(
      "function calling"
    )

    ||

    message.includes(
      "does not support"
    )

    ||

    code.includes(
      "tool"
    )

    ||

    code.includes(
      "unsupported"
    )

  );

}
