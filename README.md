# AreaIntel

AreaIntel is a Business Success Intelligence platform for operators, franchise buyers, commercial advisors, and investors.

It answers the core decision question:

```text
Should this business open here?
```

The product combines market demographics, competitive signals, consumer demand, mobility, local activity, risk signals, modeled foot traffic, and explainable decision analysis.

## Run locally

Use the Node server when you want live API keys and server-side routes to work.

```bash
npm start
```

Open:

```text
http://localhost:5174
```

## Current product surface

- Business type + ZIP/address analysis
- Executive decision: Open, Conditional, Do Not Open, or Needs More Data
- Success probability and evidence confidence
- Business fit, food concept intelligence, risk signals, site intelligence, map, and modeled foot traffic
- Revenue estimator and unit economics screens
- AI assistant
- Saved reports, share links, comparison table
- Executive PDF, full PDF, and text exports
- Pricing section
- Paid report request flow
- Contact/lead capture form
- Consultation waitlist request flow
- Account signup/sign-in MVP
- Admin lead dashboard
- Internal productized agents and task queue

## API keys

Do not put API keys in frontend code. Put them in `.env` locally or Render environment variables in production:

```text
CENSUS_API_KEY=
GOOGLE_PLACES_API_KEY=
NYC_OPEN_DATA_APP_TOKEN=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NODE_ENV=production
```

The app checks `/api/key-status` and `/api/health` without exposing secret values.

## Launch/revenue environment variables

AreaIntel can accept report requests immediately. To enable checkout links, add one or more payment URLs:

```text
STRIPE_REPORT_PAYMENT_URL=
STRIPE_FULL_REPORT_PAYMENT_URL=
STRIPE_THREE_LOCATION_COMPARE_PAYMENT_URL=
```

If payment URLs are not configured, the paid report request is still saved and the admin dashboard shows the lead.

Launch pricing:

- Free Demo: decision, score, and summary
- Full Report: $9
- Compare 3 Locations: $29
- Team / Enterprise: custom

Protect the admin dashboard with:

```text
ADMIN_TOKEN=
```

Optional persistent storage path:

```text
AREAINTEL_DATA_DIR=
```

Without `AREAINTEL_DATA_DIR`, AreaIntel writes accounts, sessions, leads, and agent-task JSON files to `data/` in the project folder. For production durability, use a Render disk or migrate the same API shape to Postgres/Supabase.

## Admin and agents

Admin routes:

```text
GET /api/admin/leads
GET /api/admin/agent-tasks
POST /api/admin/agent-tasks
```

Public/launch routes:

```text
GET /api/pricing
GET /api/agents
POST /api/signup
POST /api/login
POST /api/contact
POST /api/report-request
POST /api/advisor-request
```

Productized agent roles:

- Product Manager Agent
- Software Engineer Agent
- Data Research Agent
- Sales Agent
- Customer Support Agent
- Marketing Agent

Incoming contact, report, and advisor requests automatically create follow-up tasks for the appropriate agent queue.

## Deploy on Render

1. Push the repository to GitHub.
2. In Render, deploy from `render.yaml` or create a Web Service manually.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the environment variables listed above.

Do not upload `.env` to GitHub or Render.
