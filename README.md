# Sourcemark (proof of concept)

Upload private equity fund reports (PDF), extract fund/LP and portfolio fields with source pages,
review and approve, export to Excel. Built by Clustox as an internal demonstration.

## Structure
- `index.html`: the whole front end (landing page, sign-in flow, review app). PDF parsing and Excel export run in the browser.
- `api/extract.js`: serverless function that sends the extraction prompt to OpenAI or Claude, whichever key is set.
- `api/health.js`: tells the front end whether AI extraction is configured.

## Deploy on Vercel
1. Import this folder as a new Vercel project (Framework preset: Other; no build command).
2. In Project Settings > Environment Variables add ONE of:
   - `OPENAI_API_KEY` (optional `OPENAI_MODEL`, default `gpt-5.5`), or
   - `ANTHROPIC_API_KEY` (optional `ANTHROPIC_MODEL`, default `claude-sonnet-5-5`).
   If both are set, OpenAI is used.
3. Redeploy. The header badge shows "OpenAI extraction" or "Claude extraction" when a key is active,
   or "Rule-based mode" when none is.
4. Recommended for client demos: enable Deployment Protection (password) so the API key can't be used by strangers.

## Notes
- Sign-in is a demo flow: accounts are stored in the visitor's browser only. Replace with a real provider (e.g. Auth0, Clerk, Entra ID) for production.
- Sample reports are synthetic. Use only public or synthetic data.
- Scanned PDFs (no text layer) are not supported in this POC.
