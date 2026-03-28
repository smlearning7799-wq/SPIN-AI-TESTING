import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { url, email, token, project_key } = req.body;
  try {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const jql = `project = ${project_key} ORDER BY created DESC`;
    const jiraUrl = `${url.replace(/\/$/, '')}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=20&fields=summary,issuetype,status,description`;
    const response = await fetch(jiraUrl, {
      headers: { "Accept": "application/json", "Authorization": `Basic ${auth}` }
    });
    if (response.ok) {
      const data: any = await response.json();
      const issues = (data.issues || []).map((i: any) => ({
        key: i.key,
        summary: i.fields.summary || "No Summary",
        type: i.fields.issuetype?.name || "Unknown",
        status: i.fields.status?.name || "Unknown"
      }));
      return res.status(200).json({ status: 'success', message: `Found ${issues.length} issues.`, issues });
    }
    const detail = response.status === 401 ? 'Auth failed' : await response.text();
    return res.status(400).json({ detail });
  } catch (e: any) {
    return res.status(400).json({ detail: `Error: ${e.message}` });
  }
}
