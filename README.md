# Appie — Multi-Workspace AI Split & PayPal Invoicing OS

**Built for the PayPal AI Hackathon 2026** · **License:** MIT

Appie turns messy group receipts and freelance WhatsApp/Slack messages into proportional, human-approved **PayPal Invoicing v2 Sandbox** invoices across isolated workspaces.

## Key Features
1. **Multi-Workspace Context Isolation:** Switch between **Roommates & Dinner**, **Freelance Clients**, and **Party & Neighbors** (or create custom workspaces) with independent rosters, currencies, and invoice ledgers.
2. **Multimodal AI Extraction (@google/genai):** Upload a thermal receipt photo or paste a freelance scope DM; Gemini parses line items, quantities, tax, and tip into structured JSON.
3. **Customizable Glassmorphic Ledger & Tactile Receipt Mode:** Toggle between editable spreadsheet rows (customizable columns for split ratios, unit shares, and proportional tax/tip) and an interactive receipt ticket across 4 surface themes.
4. **Human-in-the-Loop Policy Guardrail:** Prevents autonomous AI money movement until the user explicitly verifies proportional tax/tip math and authorizes dispatch.
5. **Live PayPal Invoicing v2 Integration:** Creates draft invoices, dispatches them in PayPal Sandbox, generates scannable PayPal QR codes, syncs payment status, and triggers automated reminders.

## Run Locally
1. Clone: git clone [https://github.com/harshitdwivedi9oo9-ship-it/APPIE.git](https://github.com/harshitdwivedi9oo9-ship-it/APPIE.git)
2. Install: npm install
3. Add GEMINI_API_KEY, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, and PAYPAL_ENV=sandbox to .env.local
4. Start: npm run dev
