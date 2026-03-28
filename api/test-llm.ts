import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { provider, url_or_key } = req.body;
  
  try {
    if (provider.toLowerCase() === 'ollama') {
      const url = `${url_or_key.replace(/\/$/, '')}/api/tags`;
      const response = await fetch(url);
      if (response.ok) {
        const data: any = await response.json();
        const models = (data.models || []).map((m: any) => m.name);
        return res.status(200).json({ status: 'success', message: `Connected to Ollama. Found ${models.length} models.` });
      }
      return res.status(400).json({ detail: `Ollama error code: ${response.status}` });
    } else if (['groq', 'grok'].includes(provider.toLowerCase())) {
      let url = "https://api.groq.com/openai/v1/models";
      if (provider.toLowerCase() === 'grok') url = "https://api.x.ai/v1/models";
      const response = await fetch(url, { headers: { "Authorization": `Bearer ${url_or_key}` } });
      if (response.ok) return res.status(200).json({ status: 'success', message: `Connected to ${provider.toUpperCase()} API.` });
      const text = await response.text();
      return res.status(400).json({ detail: `${provider.toUpperCase()} error: ${text}` });
    }
    return res.status(400).json({ detail: 'Unsupported provider' });
  } catch (e: any) {
    return res.status(400).json({ detail: `Connection failed: ${e.message}` });
  }
}
