const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;

const VERIFY_TOKEN = "Miriha229";

const CAFE_KNOWLEDGE = `
Sən kafedə çalışan AI müştəri xidmətisən.

Müştərilərə Azərbaycan dilində, səmimi və qısa cavab ver.
Bilmədiyin məlumatı uydurma.
`;

export default async function handler(req, res) {
  console.log("WEBHOOK REQUEST:", req.method);

  // Meta webhook verification
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("VERIFY:", { mode, token });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK VERIFIED");
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Forbidden");
  }

  // Instagram message event
  if (req.method === "POST") {
    console.log("POST BODY:", JSON.stringify(req.body));

    try {
      const body = req.body;

      if (body.object !== "instagram") {
        console.log("Not an Instagram event");
        return res.status(200).send("OK");
      }

      for (const entry of body.entry || []) {
        for (const messaging of entry.messaging || []) {
          const senderId = messaging.sender?.id;
          const messageText = messaging.message?.text;

          console.log("SENDER:", senderId);
          console.log("MESSAGE:", messageText);

          // Text mesajı deyilsə keç
          if (!senderId || !messageText) {
            console.log("No text message");
            continue;
          }

          // Öz mesajımıza cavab verməmək üçün
          if (messaging.message?.is_echo) {
            console.log("Echo message - skipped");
            continue;
          }

          console.log("Getting AI reply...");

          const aiReply = await getAiReply(messageText);

          console.log("AI REPLY:", aiReply);

          await sendInstagramReply(senderId, aiReply);

          console.log("INSTAGRAM REPLY SENT");
        }
      }

      return res.status(200).send("EVENT_RECEIVED");

    } catch (error) {
      console.error("WEBHOOK ERROR:", error);
      return res.status(500).send("Internal Server Error");
    }
  }

  return res.status(405).send("Method Not Allowed");
}


async function getAiReply(userText) {
  console.log("Sending message to Claude...");

  const response = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },

      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,

        system: CAFE_KNOWLEDGE,

        messages: [
          {
            role: "user",
            content: userText,
          },
        ],
      }),
    }
  );

  const data = await response.json();

  console.log("CLAUDE STATUS:", response.status);

  if (!response.ok) {
    console.error("CLAUDE ERROR:", data);
    throw new Error("Claude API error");
  }

  const textBlock = data?.content?.find(
    (c) => c.type === "text"
  );

  return (
    textBlock?.text ||
    "Üzr istəyirik, hazırda cavab verə bilmirik. Zəhmət olmasa bir az sonra yenidən yazın."
  );
}


async function sendInstagramReply(recipientId, messageText) {
  console.log("Sending Instagram reply...");

  const url =
    `https://graph.instagram.com/v21.0/me/messages` +
    `?access_token=${IG_ACCESS_TOKEN}`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      recipient: {
        id: recipientId,
      },

      message: {
        text: messageText,
      },
    }),
  });

  const data = await response.json();

  console.log("INSTAGRAM STATUS:", response.status);
  console.log("INSTAGRAM RESPONSE:", data);

  if (!response.ok) {
    throw new Error(
      "Instagram API error: " + JSON.stringify(data)
    );
  }

  return data;
}
