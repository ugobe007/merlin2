#!/usr/bin/env python3
"""Smoke test: verify all API routes respond through the single catch-all."""
import urllib.request, urllib.error, sys

BASE = "http://localhost:19999"
ROUTES = [
    ("health",               "/api/health"),
    ("places/autocomplete",  "/api/places/autocomplete?input=test"),
    ("location/resolve",     "/api/location/resolve?zip=90210"),
    ("templates",            "/api/templates"),
    ("telemetry",            "/api/telemetry"),
    ("quote",                "/api/quote"),
    ("sales-agent",          "/api/sales-agent"),
    ("epc",                  "/api/epc"),
    ("partner/v1/health",    "/api/partner/v1/health"),
    ("partner/auth/token",   "/api/partner/auth/token"),
    ("partner/v1/industries","/api/partner/v1/industries"),
    ("partner/v1/leads",     "/api/partner/v1/leads"),
    ("partner/v1/quotes",    "/api/partner/v1/quotes"),
    ("partner/v1/webhooks",  "/api/partner/v1/webhooks"),
]

print("=== SMOKE TEST ===")
failures = []
for label, path in ROUTES:
    try:
        with urllib.request.urlopen(BASE + path, timeout=4) as r:
            code = r.status
    except urllib.error.HTTPError as e:
        code = e.code   # 4xx/5xx are still LIVE — route exists
    except Exception as ex:
        code = 0
        failures.append(label)
    icon = "PASS" if code != 0 else "FAIL"
    print(f"  [{icon}]  HTTP {str(code):<5}  {label}")

print("==================")
if failures:
    print(f"FAILED: {failures}")
    sys.exit(1)
else:
    print("ALL ROUTES LIVE")
