import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY' });
  }

  // Parse multipart form
  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Form parse error' });
    }
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'Missing audio file or filepath' });
    }
    try {
      const fileStream = fs.createReadStream(file.filepath);
      const formData = new FormData();
      formData.append('file', fileStream, {
        filename: 'audio.wav',
        contentType: 'audio/wav',
      });
      
      // Handle array values from formidable fields
      const model = Array.isArray(fields.model) ? fields.model[0] : fields.model;
      const responseFormat = Array.isArray(fields.response_format) ? fields.response_format[0] : fields.response_format;
      
      formData.append('model', model || 'whisper-large-v3');
      formData.append('response_format', responseFormat || 'text');

      const response = await axios.post(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
          responseType: 'text',
        }
      );
      res.status(200).json({ transcript: response.data });
    } catch (err) {
      console.error('Groq Whisper API error:', err);
      res.status(500).json({ error: 'Transcription failed', details: err?.message || err });
    }
  });
}
