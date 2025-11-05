// netlify/functions/chatbase-webhook.js

export async function handler(event, context) {
  try {
    // Parse incoming Chatbase request
    const body = JSON.parse(event.body || '{}');
    console.log("Incoming Chatbase payload:", body);

    // Extract user message
    const userMessage = body.message || "Hello!";

    // Send the message to OpenAI (using GPT-4o-mini for cost efficiency)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are HMS AI, a helpful assistant for HealthMetrics users." },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API Error:", errText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to fetch from OpenAI", details: errText })
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // Return formatted response for Chatbase
    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: reply,
        success: true
      })
    };

  } catch (error) {
    console.error("Webhook error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || "Internal server error"
      })
    };
  }
}
