// GET /api/health: tells the front end whether AI extraction is configured, and with which provider.
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const provider = process.env.OPENAI_API_KEY ? "openai" : process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
  res.status(200).json({ ok: true, ai: Boolean(provider), provider });
};
