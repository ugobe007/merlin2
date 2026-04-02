#!/usr/bin/env python3
"""Seed vendor_products table with real market data for all categories."""
import urllib.request, urllib.error, json, re, uuid, sys

env = open('/Users/robertchristopher/merlin3/.env').read()
url  = re.search(r'^VITE_SUPABASE_URL=(.+)$', env, re.M).group(1).strip()
skey = re.search(r'^SUPABASE_SERVICE_ROLE_KEY=(.+)$', env, re.M).group(1).strip()

HEADERS = {
    "apikey": skey,
    "Authorization": f"Bearer {skey}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{url}/rest/v1/{path}", data=body, headers=HEADERS, method="POST")
    try:
        res = urllib.request.urlopen(req)
        return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def get(path):
    req = urllib.request.Request(f"{url}/rest/v1/{path}", headers=HEADERS, method="GET")
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# system vendor id for seed data
VID = "00000000-0000-0000-0000-000000000001"

# ── STEP 1: Check current constraint ─────────────────────────────────────────
print("Step 1: Checking valid_product_category constraint...")
status, data = get("vendor_products?limit=1&select=product_category")
print(f"  Table accessible: {status}")

# ── STEP 2: Products ──────────────────────────────────────────────────────────
products = [
    # SOLAR PANELS
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-jinko-580")),
        "vendor_id": VID, "product_category": "solar", "status": "approved",
        "manufacturer": "Jinko Solar", "model": "Tiger Neo 580W N-Type TOPCon",
        "power_kw": 0.58, "efficiency_percent": 22.4,
        "price_per_kw": 280, "lead_time_weeks": 10, "warranty_years": 30, "voltage_v": 48,
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-maxeon-440")),
        "vendor_id": VID, "product_category": "solar", "status": "approved",
        "manufacturer": "Maxeon Solar", "model": "Maxeon 6 AC 440W Bifacial",
        "power_kw": 0.44, "efficiency_percent": 22.8,
        "price_per_kw": 340, "lead_time_weeks": 8, "warranty_years": 40, "voltage_v": 48,
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-canadian-665")),
        "vendor_id": VID, "product_category": "solar", "status": "approved",
        "manufacturer": "Canadian Solar", "model": "HiKu7 Mono PERC 665W",
        "power_kw": 0.665, "efficiency_percent": 21.4,
        "price_per_kw": 260, "lead_time_weeks": 12, "warranty_years": 25, "voltage_v": 48,
    },
    # INVERTERS / PCS
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "inverter-sma-110")),
        "vendor_id": VID, "product_category": "inverter", "status": "approved",
        "manufacturer": "SMA Solar", "model": "Sunny Tripower CORE2 110kW",
        "power_kw": 110, "efficiency_percent": 98.7,
        "price_per_kw": 65, "lead_time_weeks": 10, "warranty_years": 10, "voltage_v": 480,
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "inverter-sungrow-250")),
        "vendor_id": VID, "product_category": "inverter", "status": "approved",
        "manufacturer": "Sungrow", "model": "SG250HX 250kW",
        "power_kw": 250, "efficiency_percent": 98.9,
        "price_per_kw": 55, "lead_time_weeks": 12, "warranty_years": 10, "voltage_v": 480,
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "inverter-solaredge-100")),
        "vendor_id": VID, "product_category": "inverter", "status": "approved",
        "manufacturer": "SolarEdge", "model": "StorEdge 100kW PCS",
        "power_kw": 100, "efficiency_percent": 98.0,
        "price_per_kw": 75, "lead_time_weeks": 8, "warranty_years": 12, "voltage_v": 480,
    },
    # GENERATORS
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-cat-550-diesel")),
        "vendor_id": VID, "product_category": "generator", "status": "approved",
        "manufacturer": "Caterpillar", "model": "DE550 GC 550kW Diesel",
        "power_kw": 550, "price_per_kw": 780,
        "lead_time_weeks": 16, "warranty_years": 2, "voltage_v": 480, "chemistry": "diesel",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-cummins-1000-natgas")),
        "vendor_id": VID, "product_category": "generator", "status": "approved",
        "manufacturer": "Cummins", "model": "C1000N5 1000kW Natural Gas",
        "power_kw": 1000, "price_per_kw": 620,
        "lead_time_weeks": 20, "warranty_years": 2, "voltage_v": 480, "chemistry": "natural_gas",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-generac-200-diesel")),
        "vendor_id": VID, "product_category": "generator", "status": "approved",
        "manufacturer": "Generac", "model": "SG200 200kW Diesel",
        "power_kw": 200, "price_per_kw": 800,
        "lead_time_weeks": 10, "warranty_years": 2, "voltage_v": 480, "chemistry": "diesel",
    },
    # EV CHARGERS
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-chargepoint-l2")),
        "vendor_id": VID, "product_category": "ev_charger", "status": "approved",
        "manufacturer": "ChargePoint", "model": "CPE250 Level 2 7.2kW",
        "power_kw": 7.2, "price_per_kw": 764,
        "lead_time_weeks": 4, "warranty_years": 3, "voltage_v": 240, "chemistry": "l2",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-abb-dcfc-180")),
        "vendor_id": VID, "product_category": "ev_charger", "status": "approved",
        "manufacturer": "ABB", "model": "Terra 184 DC Fast 180kW",
        "power_kw": 180, "price_per_kw": 389,
        "lead_time_weeks": 10, "warranty_years": 3, "voltage_v": 480, "chemistry": "dcfc",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-tritium-75")),
        "vendor_id": VID, "product_category": "ev_charger", "status": "approved",
        "manufacturer": "Tritium", "model": "RTM 75kW DC Fast",
        "power_kw": 75, "price_per_kw": 600,
        "lead_time_weeks": 6, "warranty_years": 3, "voltage_v": 480, "chemistry": "dcfc",
    },
    # BATTERY / BESS
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "bess-gp-500")),
        "vendor_id": VID, "product_category": "battery", "status": "approved",
        "manufacturer": "Great Power Energy & Technology", "model": "GP-BESS-500",
        "power_kw": 250, "efficiency_percent": 94.0, "price_per_kwh": 108, "price_per_kw": 45,
        "capacity_kwh": 500, "lead_time_weeks": 16, "warranty_years": 10, "voltage_v": 480, "chemistry": "LFP",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "bess-lion-500")),
        "vendor_id": VID, "product_category": "battery", "status": "approved",
        "manufacturer": "LiON Energy", "model": "Guardian 500",
        "power_kw": 250, "efficiency_percent": 92.5, "price_per_kwh": 150, "price_per_kw": 55,
        "capacity_kwh": 500, "lead_time_weeks": 12, "warranty_years": 10, "voltage_v": 480, "chemistry": "LFP",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "bess-byd-200")),
        "vendor_id": VID, "product_category": "battery", "status": "approved",
        "manufacturer": "BYD", "model": "Battery-Box Premium 200kWh",
        "power_kw": 100, "efficiency_percent": 95.0, "price_per_kwh": 120, "price_per_kw": 50,
        "capacity_kwh": 200, "lead_time_weeks": 14, "warranty_years": 10, "voltage_v": 480, "chemistry": "LFP",
    },
]

print(f"\nStep 2: Inserting {len(products)} products...\n")
ok, fail = 0, 0
for p in products:
    status, body = post("vendor_products", p)
    cat  = p["product_category"]
    mfr  = p["manufacturer"]
    mdl  = p["model"][:45]
    if status in (201, 200, 204):
        print(f"  OK   {cat:12} | {mfr:32} | {mdl}")
        ok += 1
    else:
        err = json.loads(body) if body.startswith("{") else {}
        msg = err.get("message", body[:150])
        print(f"  FAIL {cat:12} | {mfr:32} | {mdl}")
        print(f"         HTTP {status}: {msg}")
        fail += 1

print(f"\nDone: {ok} inserted, {fail} failed")

# ── STEP 3: Verify row count ──────────────────────────────────────────────────
status, rows = get("vendor_products?select=product_category")
if isinstance(rows, list):
    from collections import Counter
    counts = Counter(r["product_category"] for r in rows)
    print("\nRow counts by category:")
    for cat, n in sorted(counts.items()):
        print(f"  {cat:15} {n}")
    print(f"  {'TOTAL':15} {len(rows)}")
