<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Account sign-ins — hard rule for ALL agents (Codex, Claude, others)

Never attempt to sign in to any of the user's accounts (Microsoft, SSL.com, e-mail, claude.ai, or any other service) from the agent's own environment or browser. Cloud agent environments run on US servers: the sign-in attempt triggers an MFA push on the user's phone showing a foreign location (e.g. Los Angeles), and the number-matching code renders on the agent's screen where the user cannot see it — the login can never complete and only spams his phone.

When a step requires a login:
1. STOP. Do not open the login page yourself.
2. Tell the user: the exact URL to open, what to do there step by step, and what to report back when done. He will do it in his own local browser (Istanbul), where MFA works normally.
3. Never ask the user for passwords, verification codes, or Authenticator approvals. Cancel any pending sign-in attempt you started.

Steps that don't require sign-in (coding, building, packaging, signing via local scripts) proceed normally.
