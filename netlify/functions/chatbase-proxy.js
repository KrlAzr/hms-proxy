// netlify/functions/chatbase-proxy.js
const fetch = globalThis.fetch;

exports.handler = async (event) => {
  // Simple browser test
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, message: "Function alive. Use POST with { message }." }),
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing 'message' in body" }) };
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "OPENAI_API_KEY not set" }) };
    }

    // Call OpenAI
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              "You are HMS AI, the official HealthMetrics assistant. Use short paragraphs. Never give medical advice. Route sensitive, payment, or claim issues to https://healthmetrics.com/contact-us. Only use approved links (book-a-demo, book-a-demo-sme, industry solutions, contact-us).",
          },
          { role: "user", content: message },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { statusCode: 502, body: JSON.stringify({ error: "OpenAI error", detail: text }) };
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I couldn’t generate a reply.";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error", detail: String(e) }) };
  }
};
