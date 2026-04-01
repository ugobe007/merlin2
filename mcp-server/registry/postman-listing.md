# Postman Public API Network — Merlin Partner API

# Submit at: https://www.postman.com/explore/api

# Import src/api/openapi.yaml into a Postman Workspace, then publish to Public API Network.

## Steps to Publish

1. Open Postman → New Workspace → "Merlin Energy Partner API"
2. Import → `src/api/openapi.yaml` (OpenAPI 3.1.0)
3. Set base URL variable: `baseUrl = https://api.merlinpro.energy/v1`
4. Add example responses to each endpoint
5. Workspace → Settings → "Make Public"
6. Submit to Postman Public API Network via "Explore" → "Submit API"

## Collection Name

Merlin Energy Partner API

## Workspace Name

Merlin Energy

## Summary (Postman "About" field)

REST API for programmatic BESS quoting, SMB lead generation, and energy benchmarks.
Generate TrueQuote™ estimates in seconds, manage quotes, retrieve NREL/EIA data,
and configure real-time webhooks.

## Category (Postman)

Finance & Payments (primary)
Business Intelligence (secondary)

## Endpoints to Highlight in Published Collection

- `POST /auth/token` — Get access token
- `POST /quotes` — Generate a TrueQuote™
- `GET /quotes/{id}/proposal` — Export proposal
- `GET /industries/{slug}/benchmarks` — Industry benchmarks
- `POST /leads` — Submit lead for enrichment
- `GET /health` — Health check

## Example Environment Variables

```
baseUrl         = https://api.merlinpro.energy/v1
clientId        = your_client_id
clientSecret    = your_client_secret
accessToken     = (auto-filled by auth request)
```

## Pre-request Script (auto-auth, add to collection root)

```javascript
// Auto-refresh Bearer token before each request
const tokenUrl = pm.environment.get("baseUrl") + "/auth/token";
const clientId = pm.environment.get("clientId");
const clientSecret = pm.environment.get("clientSecret");

pm.sendRequest(
  {
    url: tokenUrl,
    method: "POST",
    header: { "Content-Type": "application/json" },
    body: {
      mode: "raw",
      raw: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  },
  (err, res) => {
    if (!err) {
      pm.environment.set("accessToken", res.json().access_token);
    }
  }
);
```

## Tags

energy, bess, battery-storage, quoting, solar, truequote, nrel, commercial-energy

## Website

<https://merlinpro.energy>
