export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { url, email, token } = req.body;
  try {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const jiraUrl = `${url.replace(/\/$/, '')}/rest/api/3/myself`;
    const response = await fetch(jiraUrl, {
      headers: { "Accept": "application/json", "Authorization": `Basic ${auth}` }
    });
    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ status: 'success', message: `Connected to Jira as ${data.displayName}` });
    }
    const detail = response.status === 401 ? 'Auth failed' : await response.text();
    return res.status(400).json({ detail });
  } catch (e) {
    return res.status(400).json({ detail: `Error: ${e.message}` });
  }
}
