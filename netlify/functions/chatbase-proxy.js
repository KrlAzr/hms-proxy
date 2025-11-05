// netlify/functions/chatbase-webhook.js
export async function handler(event) {
  try {
    const body = JSON.parse(event.body);
    const userMessage = body?.inputs?.message || "Hello";

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or whichever model you use
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await openaiResponse.json();
    const reply = data.choices?.[0]?.message?.content || "No response";

    return {
      statusCode: 200,
      body: JSON.stringify({
        outputs: { reply }  // Chatbase will read this
      })
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}
