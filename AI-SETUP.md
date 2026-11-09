# ReklamaTop site assistant

The bottom-right site helper has two clearly identified modes:

- Guide mode: searches the public site guide in Uzbek, Russian and English. This is not an LLM and is labelled accordingly. It works without API credentials.
- AI mode: server calls Vercel AI Gateway Chat Completions with the public site guide as context. Chat has no database-reading tools and cannot access accounts, private messages or admin data. It cannot modify offers.

Enable AI through the existing site's production environment settings:

- `AI_GATEWAY_API_KEY`: a valid AI Gateway key, stored as a **secret**.
- `AI_MODEL`: an available text model ID selected from the provider's current model catalogue, in `provider/model` form.

Republish the current saved site version after configuring runtime environment variables. Preserve all existing variables. Never put keys in public files, Git, ZIPs, screenshots or chat messages. API access/credits are separate from a ChatGPT subscription; provider charges may apply. No AI provider has been provisioned or paid for by this change.

Without both variables, GET /api/help returns guide mode; POST returns AI_NOT_CONFIGURED. The site never pretends that guide answers came from an AI. If AI errors or reaches a limit, the UI reports it and visitors can retry by typing a question.

Only user-submitted chat history (at most 10 messages, each up to 1,200 characters) and the public guide are sent to the AI provider. The browser holds chat in memory; the site does not save chat transcripts. The provider may apply its own retention policies. The chat has no topic chips or navigation buttons. Guide-mode replies answer typed site questions and politely decline unrelated questions. Request limits: 8 AI calls per source IP per 10-minute window and 200 AI calls site-wide per UTC day; counters use D1. Deployments do not reset counters. Unknown source addresses share a limit. Anonymous access is allowed; these controls bound casual usage, not distributed abuse.

Validation: `node scripts/build.mjs`, `node scripts/test-help.cjs`, `node scripts/test-api.cjs`, `node scripts/validate-artifact.mjs`. Provider tests use a stub, not live credentials or billed calls. A live model response still needs verification after real credentials are configured.
