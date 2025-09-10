import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing CARTESIA_API_KEY' });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  try {
    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2024-06-30",
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        model_id: "sonic-english",
        transcript: text,
        voice: {
          mode: "id",
          id: "b7d50908-b17c-442d-ad8d-810c63997ed9",
        },
        output_format: {
          container: "raw",
          encoding: "pcm_f32le",
          sample_rate: 24000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cartesia API error:', error);
      return res.status(response.status).json({ 
        error: 'TTS failed', 
        details: error 
      });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/x-raw');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ 
      error: 'TTS failed',
      details: err.message || err 
    });
  }
}
