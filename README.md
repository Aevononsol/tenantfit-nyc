# TenantFit NYC

TenantFit NYC is an MVP web app for real estate agents. Enter a NYC ZIP code and it returns a business category fit report with local demand signals, ranked categories, evidence, competition checks, and an exportable summary.

## Run locally

Use the Node server when you want API keys to work. It reads keys from `.env` and keeps them out of browser code.

```bash
npm start
```

Open:

```text
http://localhost:5174
```

## What is built

- ZIP code search with sample NYC areas
- Area signal cards for density, income, transit, and rent pressure
- Category scoring for coffee, fitness, lunch, daycare, med spa, discount retail, restaurants, and laundry
- Strong, mixed, and weak filtering
- Broker-style narrative and evidence list
- Text export for client notes

## API keys for the next version

Do not put API keys in frontend code. Put them in `.env`:

```text
CENSUS_API_KEY=
GOOGLE_PLACES_API_KEY=
NYC_OPEN_DATA_APP_TOKEN=
OPENAI_API_KEY=
```

The app checks `/api/key-status` and shows whether each key is connected without exposing the key itself.
You can also paste keys into the local API key form in the app. It saves them into `.env` on your machine.

## Deploy on Render

This app is ready for Render. The production site should use hosting environment variables instead of `.env`.

1. Push this folder to a GitHub repository.
2. In Render, create a new Blueprint or Web Service from the repo.
3. Render can use `render.yaml`, or set these manually:
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: `Node`
4. Add these environment variables in Render:

```text
CENSUS_API_KEY
GOOGLE_PLACES_API_KEY
NYC_OPEN_DATA_APP_TOKEN
OPENAI_API_KEY
OPENAI_MODEL=gpt-4o-mini
NODE_ENV=production
```

Do not upload `.env` to GitHub or Render. In production, the in-app key form is disabled and keys must be managed in Render.

Recommended next build step:

1. Fetch Census ACS ZIP data for population, income, age, household size, and commute.
2. Fetch Google Places competitors by category around the ZIP centroid.
3. Fetch NYC Open Data signals for permits, licenses, inspections, and 311 complaints.
4. Keep OpenAI optional for polished written reports after the structured score is calculated.
