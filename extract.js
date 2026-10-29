// POST /api/extract  { prompt }  ->  { result }
// Sends the extraction prompt to OpenAI (if OPENAI_API_KEY is set) or Claude (if ANTHROPIC_API_KEY is set)
// and returns the parsed JSON. Set the key in Vercel > Project Settings > Environment Variables.
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const MAX_PROMPT = 200000;
const SYSTEM = "You extract data from private equity fund reports. Reply with a single JSON object only, no prose and no code fences.";

function parseJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch {} }
  return null;
}

async function callOpenAI(prompt) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + process.env.OPENAI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: 16000,
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }]
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data && data.error && data.error.message) || "OpenAI request failed");
  return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
}

async function callAnthropic(prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 8000, system: SYSTEM, messages: [{ role: "user", content: prompt }] })
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data && data.error && data.error.message) || "Anthropic request failed");
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
  if (!useOpenAI && !process.env.ANTHROPIC_API_KEY) return res.status(501).json({ error: "AI extraction is not configured on this deployment" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const prompt = body && body.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) return res.status(400).json({ error: "Missing prompt" });
  if (prompt.length > MAX_PROMPT) return res.status(413).json({ error: "Document is too large for this demo" });

  try {
    const text = useOpenAI ? await callOpenAI(prompt) : await callAnthropic(prompt);
    const result = parseJson(text);
    if (!result) return res.status(502).json({ error: "Model reply was not valid JSON" });
    return res.status(200).json({ result });
  } catch (e) {
    return res.status(502).json({ error: String(e && e.message || "Extraction request failed").slice(0, 300) });
  }
};
