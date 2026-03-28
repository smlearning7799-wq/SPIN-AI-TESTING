export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { provider, url_or_key, issues } = req.body;
  if (!issues || issues.length === 0) return res.status(400).json({ detail: "No issues provided." });

  const issuesText = issues.map(i => `- ${i.key}: ${i.summary} (Type: ${i.type}, Status: ${i.status})`).join("\n");
  const prompt = `
You are an expert Quality Assurance Engineer. Based on the following Jira issues, generate a comprehensive Test Plan in Markdown format.

Jira Issues:
${issuesText}

The Test Plan should include:
1. Introduction & Scope
2. Test Scenarios (for each issue)
3. Positive and Negative Test Cases
4. Test Data Requirements
5. Success Criteria

Format everything clearly as Markdown.
  `;

  try {
    if (provider.toLowerCase() === 'ollama') {
      const baseUrl = url_or_key.replace(/\/$/, '');
      const listResponse = await fetch(`${baseUrl}/api/tags`);
      const availableModels = listResponse.ok ? (await listResponse.json()).models.map(m => m.name) : [];
      let targetModel = "llama3";
      if (!availableModels.includes(targetModel) && availableModels.length > 0) targetModel = availableModels[0];
      
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: targetModel, prompt, stream: false })
      });
      if (response.ok) {
        let content = (await response.json()).response || "";
        content = content.trim().replace(/^```markdown\n/, "").replace(/^```\n/, "").replace(/```$/, "").trim();
        return res.status(200).json({ status: 'success', test_plan: content });
      }
      return res.status(500).json({ detail: `Ollama failed: ${response.status} ${await response.text()}` });
    } else if (['groq', 'grok'].includes(provider.toLowerCase())) {
      let url = "https://api.groq.com/openai/v1/chat/completions";
      let model = "llama3-8b-8192";
      if (provider.toLowerCase() === 'grok') {
        url = "https://api.x.ai/v1/chat/completions";
        model = "grok-beta";
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${url_or_key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.5 })
      });
      if (response.ok) {
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        content = content.trim().replace(/^```markdown\n/, "").replace(/^```\n/, "").replace(/```$/, "").trim();
        return res.status(200).json({ status: 'success', test_plan: content });
      }
      return res.status(500).json({ detail: `${provider.toUpperCase()} failed: ${await response.text()}` });
    }
    return res.status(400).json({ detail: 'Unsupported provider' });
  } catch (e) {
    return res.status(500).json({ detail: `Error: ${e.message}` });
  }
}
