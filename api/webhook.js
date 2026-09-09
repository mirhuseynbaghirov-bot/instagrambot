// api/webhook.js
// Instagram DM -> Claude API -> avtomatik cavab
 
const CAFE_KNOWLEDGE = `
Sən bir kafenin Instagram hesabında müştərilərə cavab verən köməkçisən.
Aşağıdakı məlumatlara əsaslanaraq müştərilərin suallarına səmimi, qısa və
Azərbaycan dilində cavab ver. Bilmədiyin bir şey soruşularsa, uydurma -
"bunu bilmirəm, zəhmət olmasa kafeyə zəng edin" kimi cavab ver.
 
1. İş saatları:
- Açılış: 12:00 (günorta)
- Bağlanış: 03:00 - 04:00 (gecə)
 
2. Pivə çeşidləri:
- Bağrov
- Xırdalan
- Salyan
- Süzülməmiş Salyan
- Süzülməmiş Xırdalan
 
3. Xidmətlər və menyu:
- Yeməklər: zəngin menyu, müxtəlif növ kabablar
- Qəlyan mövcuddur
 
4. Kabinetlər (2-ci mərtəbədə, cəmi 7 kabinet) və depozit şərtləri:
- Kabinet 1: 30 AZN depozit
- Kabinet 2 və 3: 50 AZN depozit
- Kabinet 4: 70 AZN depozit
- Kabinet 5, 6, 7: 40 AZN depozit
 
Cavabların qısa (2-4 cümlə), dostcasına və Instagram DM formatına uyğun olsun.
Emoji istifadə edə bilərsən, amma həddindən artıq deyil.
`;
 
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
 
export default async function handler(req, res) {
  // 1) Meta webhook verification (GET)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
 
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }
 
  // 2) Incoming messages (POST)
  if (req.method === "POST") {
    try {
      const body = req.body;
 
      // Instagram webhook payload structure
      const entry = body.entry?.[0];
      const messaging = entry?.messaging?.[0];
 
      if (!messaging || !messaging.message) {
        // Not a normal text message (could be read receipt, echo, etc.)
        return res.status(200).send("EVENT_RECEIVED");
      }
 
      // Ignore echo of our own sent messages
      if (messaging.message.is_echo) {
        return res.status(200).send("EVENT_RECEIVED");
      }
 
      const senderId = messaging.sender.id;
      const userText = messaging.message.text;
 
      if (!userText) {
        return res.status(200).send("EVENT_RECEIVED");
      }
 
      // 3) Ask Claude for a reply
      const aiReply = await getAiReply(userText);
 
      // 4) Send reply back via Instagram Send API
      await sendInstagramReply(senderId, aiReply);
 
      return res.status(200).send("EVENT_RECEIVED");
    } catch (err) {
      console.error("Webhook error:", err);
      // Still return 200 so Meta doesn't keep retrying aggressively
      return res.status(200).send("EVENT_RECEIVED");
    }
  }
 
  return res.status(405).send("Method Not Allowed");
}
 
async function getAiReply(userText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
      messages: [{ role: "user", content: userText }],
    }),
  });
 
  const data = await response.json();
  const textBlock = data?.content?.find((c) => c.type === "text");
  return textBlock?.text || "Üzr istəyirik, hazırda cavab verə bilmirik. Zəhmət olmasa bir az sonra yenidən yazın.";
}
 
async function sendInstagramReply(recipientId, messageText) {
  const url = `https://graph.instagram.com/v21.0/me/messages?access_token=${IG_ACCESS_TOKEN}`;
 
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: messageText },
    }),
  });
}
