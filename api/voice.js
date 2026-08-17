export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      enabled: false,
      message: "Browser voice fallback should be used."
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const text = String(body.text || "").trim().slice(0, 500);

    if (!text) {
      return res.status(400).json({
        error: "Text is required."
      });
    }

    const voiceId =
      process.env.ELEVENLABS_VOICE_ID ||
      "JBFqnCBsd6RMkjVDRZzb";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
        voiceId
      )}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg"
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error("ElevenLabs request failed");
    }

    const audioBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(audioBuffer);
  } catch (error) {
    return res.status(200).json({
      enabled: false,
      error: "Premium voice unavailable. Use browser voice fallback."
    });
  }
      }
