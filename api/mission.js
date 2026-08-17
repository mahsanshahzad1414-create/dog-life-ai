export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const fallback = [
    "Sniff out the hidden bone beside the flower garden.",
    "Sprint across the park and collect two golden treats.",
    "Patrol the yard without touching a puddle or the cat.",
    "Find the quiet path and return safely to the dog house.",
    "Collect three bones, then make a stylish victory lap."
  ];

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      mission: fallback[Math.floor(Math.random() * fallback.length)],
      source: "Dog Life offline mission deck"
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const dog = String(body.dog || "Buddy").slice(0, 30);
    const style = String(body.style || "fun").slice(0, 30);

    const prompt = `You are the mission director for a polished family-friendly browser game called Dog Life.
Create ONE short, immediately playable mission for a virtual dog.
Dog: ${dog}. Style: ${style}.
Use 8-16 words. It should involve exploring, collecting, avoiding, helping, or reaching a location.
Return only the mission text. No quotes, bullets, emojis, or explanation.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.95,
            maxOutputTokens: 60
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error("Gemini request failed");
    }

    const data = await response.json();

    const mission = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    return res.status(200).json({
      mission: mission || fallback[0],
      source: "Google Gemini"
    });
  } catch {
    return res.status(200).json({
      mission: fallback[Math.floor(Math.random() * fallback.length)],
      source: "Dog Life offline mission deck"
    });
  }
      }
