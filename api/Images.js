
/*
 * NOVA image generation through OpenRouter's image-generation server tool.
 * The API key stays on the server. The image tool can incur separate charges.
 * Optional Vercel environment variable: OPENROUTER_IMAGE_CHAT_MODEL
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Use POST for this endpoint." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: "OPENROUTER_API_KEY is missing in Vercel." });

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const aspectRatio = typeof req.body?.aspectRatio === "string" ? req.body.aspectRatio : "1:1";
  const allowedRatios = new Set(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"]);

  if (!prompt) return res.status(400).json({ success: false, error: "Describe the image you want to generate." });
  if (prompt.length > 4000) return res.status(413).json({ success: false, error: "Prompt is too long (maximum 4,000 characters)." });

  // Use a capable text model to call OpenRouter's hosted image-generation tool.
  // Configure a model that supports this server tool if your default model does not.
  const model = process.env.OPENROUTER_IMAGE_CHAT_MODEL || "openai/gpt-5.2";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nova-ai039.vercel.app",
        "X-Title": "NOVA AI Image Studio"
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: "user",
          content: `Generate an image, not merely a description. Follow this visual prompt closely: ${prompt}. Aspect ratio: ${allowedRatios.has(aspectRatio) ? aspectRatio : "1:1"}.`
        }],
        tools: [{
          type: "openrouter:image_generation",
          parameters: {
            aspect_ratio: allowedRatios.has(aspectRatio) ? aspectRatio : "1:1",
            output_format: "png"
          }
        }]
      }),
      signal: controller.signal
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = data?.error?.message || data?.message || `OpenRouter returned HTTP ${upstream.status}.`;
      return res.status(upstream.status).json({ success: false, error: message, model });
    }

    const message = data?.choices?.[0]?.message || {};
    const images = [];

    // Providers may expose image output in message.images.
    if (Array.isArray(message.images)) {
      for (const item of message.images) {
        const url = item?.image_url?.url || item?.imageUrl?.url || item?.url;
        if (typeof url === "string" && /^(https?:|data:image\/)/i.test(url)) images.push(url);
      }
    }

    // Some responses include markdown image URLs in content.
    const content = typeof message.content === "string" ? message.content : "";
    const markdownImages = [...content.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)].map(match => match[1]);
    for (const url of markdownImages) if (!images.includes(url)) images.push(url);

    if (!images.length) {
      return res.status(502).json({
        success: false,
        error: "The model did not return an image. Confirm image generation is supported for your OpenRouter account/model, then set OPENROUTER_IMAGE_CHAT_MODEL in Vercel to a compatible model.",
        model: data?.model || model,
        answer: content
      });
    }

    return res.status(200).json({ success: true, model: data?.model || model, images, answer: content });
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return res.status(timedOut ? 504 : 500).json({ success: false, error: timedOut ? "Image generation timed out. Try again with a shorter prompt." : "Image generation failed. Try again." });
  } finally {
    clearTimeout(timeout);
  }
}
