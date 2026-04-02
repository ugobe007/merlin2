#!/usr/bin/env python3
"""Full seed: insert vendors + vendor_products for all categories."""
import urllib.request, urllib.error, json, re, uuid

env = open('/Users/robertchristopher/merlin3/.env').read()
url  = re.search(r'^VITE_SUPABASE_URL=(.+)$', env, re.M).group(1).strip()
skey = re.search(r'^SUPABASE_SERVICE_ROLE_KEY=(.+)$', env, re.M).group(1).strip()

H = {
    "apikey": skey,
    "Authorization": f"Bearer {skey}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}
HG = {**H}
HG.pop("Prefer", None)

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{url}/rest/v1/{path}", data=body, headers=H, method="POST")
    try:
        res = urllib.request.urlopen(req)
        return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def get(path):
    req = urllib.request.Request(f"{url}/rest/v1/{path}", headers=HG, method="GET")
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# ── Known vendor IDs (already in DB) ─────────────────────────────────────────
V_BATTERY  = "9f03c2aa-3083-4ee8-8173-ec65edf5e9ec"   # ACME Battery Solutions
V_INVERTER = "556e8cd3-c9cd-4978-8053-1909f6f78609"   # PowerTech Inverters

# ── Insert missing vendors ────────────────────────────────────────────────────
V_SOLAR    = str(uuid.uuid5(uuid.NAMESPACE_DNS, "merlin-solar-vendor-v1"))
V_GEN      = str(uuid.uuid5(uuid.NAMESPACE_DNS, "merlin-generator-vendor-v1"))
V_EV       = str(uuid.uuid5(uuid.NAMESPACE_DNS, "merlin-ev-vendor-v1"))

new_vendors = [
    {
        "id": V_SOLAR, "company_name": "Merlin Solar Partners",
        "contact_name": "Merlin System", "email": "solar@merlin.energy",
        "phone": "(800) 555-0001", "specialty": "solar", "status": "approved",
        "description": "Curated solar panel supplier network",
    },
    {
        "id": V_GEN, "company_name": "Merlin Generator Partners",
        "contact_name": "Merlin System", "email": "generator@merlin.energy",
        "phone": "(800) 555-0002", "specialty": "generator", "status": "approved",
        "description": "Curated generator supplier network",
    },
    {
        "id": V_EV, "company_name": "Merlin EV Partners",
        "contact_name": "Merlin System", "email": "ev@merlin.energy",
        "phone": "(800) 555-0003", "specialty": "ev_charger", "status": "approved",
        "description": "Curated EV charger supplier network",
    },
]

print("=== Inserting vendors ===")
for v in new_vendors:
    s, body = post("vendors", v)
    ok = s in (200, 201, 204) or "already exists" in str(body) or "duplicate" in str(body).lower()
    sym = "OK  " if s in (200, 201, 204) else ("DUP " if "already" in str(body) or "duplicate" in str(body).lower() else "FAIL")
    print(f"  {sym} {v['company_name']:35} specialty={v['specialty']}")
    if sym == "FAIL":
        print(f"       HTTP {s}: {body[:200]}")

# ── Products ──────────────────────────────────────────────────────────────────
products = [
    # SOLAR
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-jinko-580")),
        "vendor_id": V_SOLAR, "product_category": "solar", "status": "approved",
        "manufacturer": "Jinko Solar", "model": "Tiger Neo 580W N-Type TOPCon",
        "power_kw": 0.58, "efficiency_percent": 22.4,
        "price_per_kw": 280, "lead_time_weeks": 10, "warranty_years": 30, "voltage_v": 48,
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-maxeon-440")),
        "vendor_id": V_SOLAR, "product_category": "solar", "status": "approved",
        "manufacturer": "Maxeon Solar", "model": "Maxeon 6 AC 440W Bifacial",
        "power_kw": 0.44, "efficiency_percent": 22.8,
        "price_per_kw": 340, "lead_time_weeks": 8, "warranty_years": 40, "voltage_v": 48,
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-canadian-665")),
        "vendor_id": V_SOLAR, "product_category": "solar", "status": "approved",
        "manufacturer": "Canadian Solar", "model": "HiKu7 Mono PERC 665W",
        "power_kw": 0.665, "efficiency_percent": 21.4,
        "price_per_kw": 260, "lead_time_weeks": 12, "warranty_years": 25, "voltage_v": 48,
    },
    # INVERTERS
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "inverter-sma-110")),
        "vendor_id": V_INVERTER, "product_category": "inverter", "status": "approved",
        "manufacturer": "SMA Solar", "model": "Sunny Tripower CORE2 110kW",
        "power_kw": 110, "efficiency_percent": 98.7,
        "price_per_kw": 65, "lead_time_weeks": 10, "warranty_years": 10, "voltage_v": 480,
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "inverter-sungrow-250")),
        "vendor_id": V_INVERTER, "product_category": "inverter", "status": "approved",
        "manufacturer": "Sungrow", "model": "SG250HX 250kW",
        "power_kw": 250, "efficiency_percent": 98.9,
        "price_per_kw": 55, "lead_time_weeks": 12, "warranty_years": 10, "voltage_v": 480,
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "inverter-solaredge-100")),
        "vendor_id": V_INVERTER, "product_category": "inverter", "status": "approved",
        "manufacturer": "SolarEdge", "model": "StorEdge 100kW PCS",
        "power_kw": 100, "efficiency_percent": 98.0,
        "price_per_kw": 75, "lead_time_weeks": 8, "warranty_years": 12, "voltage_v": 480,
    },
    # GENERATORS
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-cat-550-diesel")),
        "vendor_id": V_GEN, "product_category": "generator", "status": "approved",
        "manufacturer": "Caterpillar", "model": "DE550 GC 550kW Diesel",
        "power_kw": 550, "price_per_kw": 780,
        "lead_time_weeks": 16, "warranty_years": 2, "voltage_v": 480, "chemistry": "diesel",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-cummins-1000-natgas")),
        "vendor_id": V_GEN, "product_category": "generator", "status": "approved",
        "manufacturer": "Cummins", "model": "C1000N5 1000kW Natural Gas",
        "power_kw": 1000, "price_per_kw": 620,
        "lead_time_weeks": 20, "warranty_years": 2, "voltage_v": 480, "chemistry": "natural_gas",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-generac-200-diesel")),
        "vendor_id": V_GEN, "product_category": "generator", "status": "approved",
        "manufacturer": "Generac", "model": "SG200 200kW Diesel",
        "power_kw": 200, "price_per_kw": 800,
        "lead_time_weeks": 10, "warranty_years": 2, "voltage_v": 480, "chemistry": "diesel",
    },
    # EV CHARGERS
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-chargepoint-l2")),
        "vendor_id": V_EV, "product_category": "ev_charger", "status": "approved",
        "manufacturer": "ChargePoint", "model": "CPE250 Level 2 7.2kW",
        "power_kw": 7.2, "price_per_kw": 764,
        "lead_time_weeks": 4, "warranty_years": 3, "voltage_v": 240, "chemistry": "l2",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-abb-dcfc-180")),
        "vendor_id": V_EV, "product_category": "ev_charger", "status": "approved",
        "manufacturer": "ABB", "model": "Terra 184 DC Fast 180kW",
        "power_kw": 180, "price_per_kw": 389,
        "lead_time_weeks": 10, "warranty_years": 3, "voltage_v": 480, "chemistry": "dcfc",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-tritium-75")),
        "vendor_id": V_EV, "product_category": "ev_charger", "status": "approved",
        "manufacturer": "Tritium", "model": "RTM 75kW DC Fast",
        "power_kw": 75, "price_per_kw": 600,
        "lead_time_weeks": 6, "warranty_years": 3, "voltage_v": 480, "chemistry": "dcfc",
    },
    # BATTERY (additional — CATL already has 1 row)
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "bess-gp-500")),
        "vendor_id": V_BATTERY, "product_category": "battery", "status": "approved",
        "manufacturer": "Great Power", "model": "GP-BESS-500 LFP",
        "power_kw": 250, "efficiency_percent": 94.0, "price_per_kwh": 108, "price_per_kw": 45,
        "capacity_kwh": 500, "lead_time_weeks": 16, "warranty_years": 10, "voltage_v": 480, "chemistry": "LFP",
    },
    {
        "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "bess-byd-200")),
        "vendor_id": V_BATTERY, "product_category": "battery", "status": "approved",
        "manufacturer": "BYD", "model": "Battery-Box Premium 200kWh",
        "power_kw": 100, "efficiency_percent": 95.0, "price_per_kwh": 120, "price_per_kw": 50,
        "capacity_kwh": 200, "lead_time_weeks": 14, "warranty_years": 10, "voltage_v": 480, "chemistry": "LFP",
    },
]

print(f"\n=== Inserting {len(products)} products ===\n")
ok, fail = 0, 0
for p in products:
    s, body = post("vendor_products", p)
    cat = p["product_category"]
    mfr = p["manufacturer"]
    mdl = p["model"][:40]
    if s in (200, 201, 204):
        print(f"  OK   {cat:12} | {mfr:32} | {mdl}")
        ok += 1
    elif "duplicate" in str(body).lower() or "already exists" in str(body).lower() or "unique" in str(body).lower():
        print(f"  DUP  {cat:12} | {mfr:32} | {mdl}")
        ok += 1
    else:
        err = json.loads(body) if body.startswith("{") else {}
        msg = err.get("message", body[:150])
        print(f"  FAIL {cat:12} | {mfr:32} | {mdl}")
        print(f"         HTTP {s}: {msg}")
        fail += 1

print(f"\nDone: {ok} OK, {fail} failed")

# Verify
print("\n=== Final row counts ===")
s, rows = get("vendor_products?select=product_category")
if isinstance(rows, list):
    from collections import Counter
    counts = Counter(r["product_category"] for r in rows)
    for cat, n in sorted(counts.items()):
        print(f"  {cat:15} {n} rows")
    print(f"  {'TOTAL':15} {len(rows)}")
