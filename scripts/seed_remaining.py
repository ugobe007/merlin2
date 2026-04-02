#!/usr/bin/env python3
"""Seed vendors (with password_hash) + all products."""
import urllib.request, urllib.error, json, re, uuid

env = open('/Users/robertchristopher/merlin3/.env').read()
url  = re.search(r'^VITE_SUPABASE_URL=(.+)$', env, re.M).group(1).strip()
skey = re.search(r'^SUPABASE_SERVICE_ROLE_KEY=(.+)$', env, re.M).group(1).strip()

H = {"apikey": skey, "Authorization": f"Bearer {skey}", "Content-Type": "application/json", "Prefer": "return=minimal"}
HG = {"apikey": skey, "Authorization": f"Bearer {skey}", "Content-Type": "application/json"}

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

V_BATTERY  = "9f03c2aa-3083-4ee8-8173-ec65edf5e9ec"
V_INVERTER = "556e8cd3-c9cd-4978-8053-1909f6f78609"
V_SOLAR    = str(uuid.uuid5(uuid.NAMESPACE_DNS, "merlin-solar-vendor-v1"))
V_GEN      = str(uuid.uuid5(uuid.NAMESPACE_DNS, "merlin-generator-vendor-v1"))
V_EV       = str(uuid.uuid5(uuid.NAMESPACE_DNS, "merlin-ev-vendor-v1"))

# Vendor inserts with password_hash
vendors = [
    {"id": V_SOLAR, "company_name": "Merlin Solar Partners", "contact_name": "Merlin System",
     "email": "solar@merlin.energy", "phone": "(800) 555-0001", "specialty": "solar",
     "description": "Curated solar panel supplier network", "status": "approved",
     "password_hash": "$2a$10$example_hash_here"},
    {"id": V_GEN, "company_name": "Merlin Generator Partners", "contact_name": "Merlin System",
     "email": "generator@merlin.energy", "phone": "(800) 555-0002", "specialty": "generator",
     "description": "Curated generator supplier network", "status": "approved",
     "password_hash": "$2a$10$example_hash_here"},
    {"id": V_EV, "company_name": "Merlin EV Partners", "contact_name": "Merlin System",
     "email": "ev@merlin.energy", "phone": "(800) 555-0003", "specialty": "ev_charger",
     "description": "Curated EV charger supplier network", "status": "approved",
     "password_hash": "$2a$10$example_hash_here"},
]

print("=== Inserting missing vendors ===")
for v in vendors:
    s, body = post("vendors", v)
    if s in (200, 201, 204):
        print(f"  OK   {v['company_name']}")
    elif "duplicate" in str(body).lower() or "already" in str(body).lower() or '"23505"' in str(body):
        print(f"  DUP  {v['company_name']} (already exists)")
    else:
        print(f"  FAIL {v['company_name']}: HTTP {s}: {body[:200]}")

# Products
products = [
    # SOLAR
    {"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-jinko-580")),
     "vendor_id": V_SOLAR, "product_category": "solar", "status": "approved",
     "manufacturer": "Jinko Solar", "model": "Tiger Neo 580W N-Type TOPCon",
     "power_kw": 0.58, "efficiency_percent": 22.4, "price_per_kw": 280,
     "lead_time_weeks": 10, "warranty_years": 30, "voltage_v": 48},
    {"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-maxeon-440")),
     "vendor_id": V_SOLAR, "product_category": "solar", "status": "approved",
     "manufacturer": "Maxeon Solar", "model": "Maxeon 6 AC 440W Bifacial",
     "power_kw": 0.44, "efficiency_percent": 22.8, "price_per_kw": 340,
     "lead_time_weeks": 8, "warranty_years": 40, "voltage_v": 48},
    {"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-canadian-665")),
     "vendor_id": V_SOLAR, "product_category": "solar", "status": "approved",
     "manufacturer": "Canadian Solar", "model": "HiKu7 Mono PERC 665W",
     "power_kw": 0.665, "efficiency_percent": 21.4, "price_per_kw": 260,
     "lead_time_weeks": 12, "warranty_years": 25, "voltage_v": 48},
    # GENERATORS
    {"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-cat-550-diesel")),
     "vendor_id": V_GEN, "product_category": "generator", "status": "approved",
     "manufacturer": "Caterpillar", "model": "DE550 GC 550kW Diesel",
     "power_kw": 550, "price_per_kw": 780, "lead_time_weeks": 16,
     "warranty_years": 2, "voltage_v": 480, "chemistry": "diesel"},
    {"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-cummins-1000-natgas")),
     "vendor_id": V_GEN, "product_category": "generator", "status": "approved",
     "manufacturer": "Cummins", "model": "C1000N5 1000kW Natural Gas",
     "power_kw": 1000, "price_per_kw": 620, "lead_time_weeks": 20,
     "warranty_years": 2, "voltage_v": 480, "chemistry": "natural_gas"},
    {"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-generac-200-diesel")),
     "vendor_id": V_GEN, "product_category": "generator", "status": "approved",
     "manufacturer": "Generac", "model": "SG200 200kW Diesel",
     "power_kw": 200, "price_per_kw": 800, "lead_time_weeks": 10,
     "warranty_years": 2, "voltage_v": 480, "chemistry": "diesel"},
    # EV CHARGERS
    {"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-chargepoint-l2")),
     "vendor_id": V_EV, "product_category": "ev_charger", "status": "approved",
     "manufacturer": "ChargePoint", "model": "CPE250 Level 2 7.2kW",
     "power_kw": 7.2, "price_per_kw": 764, "lead_time_weeks": 4,
     "warranty_years": 3, "voltage_v": 240, "chemistry": "l2"},
    {"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-abb-dcfc-180")),
     "vendor_id": V_EV, "product_category": "ev_charger", "status": "approved",
     "manufacturer": "ABB", "model": "Terra 184 DC Fast 180kW",
     "power_kw": 180, "price_per_kw": 389, "lead_time_weeks": 10,
     "warranty_years": 3, "voltage_v": 480, "chemistry": "dcfc"},
    {"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-tritium-75")),
     "vendor_id": V_EV, "product_category": "ev_charger", "status": "approved",
     "manufacturer": "Tritium", "model": "RTM 75kW DC Fast",
     "power_kw": 75, "price_per_kw": 600, "lead_time_weeks": 6,
     "warranty_years": 3, "voltage_v": 480, "chemistry": "dcfc"},
]

print(f"\n=== Inserting {len(products)} products (solar/generator/ev) ===\n")
ok = fail = 0
for p in products:
    s, body = post("vendor_products", p)
    cat = p["product_category"]
    mfr = p["manufacturer"]
    mdl = p["model"][:40]
    if s in (200, 201, 204):
        print(f"  OK   {cat:12} | {mfr:32} | {mdl}")
        ok += 1
    elif '"23505"' in body or "duplicate" in body.lower() or "already" in body.lower():
        print(f"  DUP  {cat:12} | {mfr:32} | {mdl}")
        ok += 1
    else:
        err = json.loads(body) if body.startswith("{") else {}
        print(f"  FAIL {cat:12} | {mfr:32} | {mdl}")
        print(f"         HTTP {s}: {err.get('message', body[:150])}")
        fail += 1

print(f"\n{'ok' if fail == 0 else 'partial'}: {ok} OK, {fail} failed")

print("\n=== Final vendor_products totals ===")
s, rows = get("vendor_products?select=product_category")
if isinstance(rows, list):
    from collections import Counter
    counts = Counter(r["product_category"] for r in rows)
    for cat, n in sorted(counts.items()):
        print(f"  {cat:15} {n} rows")
    print(f"  {'TOTAL':15} {len(rows)}")
