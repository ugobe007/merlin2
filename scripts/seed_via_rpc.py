#!/usr/bin/env python3
"""Use exec_sql_modify to seed everything via raw SQL — bypasses REST constraints."""
import urllib.request, urllib.error, json, re, uuid

env = open('/Users/robertchristopher/merlin3/.env').read()
url  = re.search(r'^VITE_SUPABASE_URL=(.+)$', env, re.M).group(1).strip()
skey = re.search(r'^SUPABASE_SERVICE_ROLE_KEY=(.+)$', env, re.M).group(1).strip()

H = {"apikey": skey, "Authorization": f"Bearer {skey}", "Content-Type": "application/json"}

def rpc(sql):
    data = json.dumps({"sql_query": sql}).encode()
    req = urllib.request.Request(f"{url}/rest/v1/rpc/exec_sql_modify", data=data, headers=H, method="POST")
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def get(path):
    req = urllib.request.Request(f"{url}/rest/v1/{path}", headers=H, method="GET")
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

# IDs for products
P = {
    "solar-jinko":     str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-jinko-580")),
    "solar-maxeon":    str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-maxeon-440")),
    "solar-canadian":  str(uuid.uuid5(uuid.NAMESPACE_DNS, "solar-canadian-665")),
    "gen-cat":         str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-cat-550-diesel")),
    "gen-cummins":     str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-cummins-1000-natgas")),
    "gen-generac":     str(uuid.uuid5(uuid.NAMESPACE_DNS, "gen-generac-200-diesel")),
    "ev-chargepoint":  str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-chargepoint-l2")),
    "ev-abb":          str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-abb-dcfc-180")),
    "ev-tritium":      str(uuid.uuid5(uuid.NAMESPACE_DNS, "ev-tritium-75")),
}

steps = [
    # ── Step 1: Fix vendors.specialty constraint (if any) ─────────────────────
    ("Drop specialty check on vendors", """
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'vendors'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%specialty%'
  ) THEN
    ALTER TABLE vendors DROP CONSTRAINT IF EXISTS valid_specialty;
    ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_specialty_check;
    ALTER TABLE vendors DROP CONSTRAINT IF EXISTS check_specialty;
  END IF;
END $$;
"""),

    ("Add broad specialty constraint on vendors", """
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'vendors'::regclass AND conname = 'valid_specialty'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT valid_specialty
      CHECK (specialty IN ('battery','solar','inverter','generator','ev_charger','bos','ems','container','other'));
  END IF;
END $$;
"""),

    # ── Step 2: Re-confirm vendor_products category constraint ────────────────
    ("Ensure vendor_products categories include all needed", """
ALTER TABLE vendor_products DROP CONSTRAINT IF EXISTS valid_product_category;
ALTER TABLE vendor_products ADD CONSTRAINT valid_product_category
  CHECK (product_category IN ('battery','solar','inverter','generator','ev_charger','bos','ems','container','other'));
"""),

    # ── Step 3: Insert vendors ────────────────────────────────────────────────
    ("Insert Merlin Solar vendor", f"""
INSERT INTO vendors (id, company_name, contact_name, email, phone, specialty, description, status, password_hash)
VALUES ('{V_SOLAR}', 'Merlin Solar Partners', 'Merlin System', 'solar@merlin.energy',
        '(800) 555-0001', 'solar', 'Curated solar panel supplier network', 'approved',
        '$2a$10$example_hash_here')
ON CONFLICT (id) DO NOTHING;
"""),
    ("Insert Merlin Generator vendor", f"""
INSERT INTO vendors (id, company_name, contact_name, email, phone, specialty, description, status, password_hash)
VALUES ('{V_GEN}', 'Merlin Generator Partners', 'Merlin System', 'generator@merlin.energy',
        '(800) 555-0002', 'generator', 'Curated generator supplier network', 'approved',
        '$2a$10$example_hash_here')
ON CONFLICT (id) DO NOTHING;
"""),
    ("Insert Merlin EV vendor", f"""
INSERT INTO vendors (id, company_name, contact_name, email, phone, specialty, description, status, password_hash)
VALUES ('{V_EV}', 'Merlin EV Partners', 'Merlin System', 'ev@merlin.energy',
        '(800) 555-0003', 'ev_charger', 'Curated EV charger supplier network', 'approved',
        '$2a$10$example_hash_here')
ON CONFLICT (id) DO NOTHING;
"""),

    # ── Step 4: Insert solar products ────────────────────────────────────────
    ("Insert solar products", f"""
INSERT INTO vendor_products (id, vendor_id, product_category, status, manufacturer, model,
  power_kw, efficiency_percent, price_per_kw, lead_time_weeks, warranty_years, voltage_v)
VALUES
  ('{P["solar-jinko"]}', '{V_SOLAR}', 'solar', 'approved',
   'Jinko Solar', 'Tiger Neo 580W N-Type TOPCon', 0.58, 22.4, 280, 10, 30, 48),
  ('{P["solar-maxeon"]}', '{V_SOLAR}', 'solar', 'approved',
   'Maxeon Solar', 'Maxeon 6 AC 440W Bifacial', 0.44, 22.8, 340, 8, 40, 48),
  ('{P["solar-canadian"]}', '{V_SOLAR}', 'solar', 'approved',
   'Canadian Solar', 'HiKu7 Mono PERC 665W', 0.665, 21.4, 260, 12, 25, 48)
ON CONFLICT (id) DO NOTHING;
"""),

    # ── Step 5: Insert generator products ────────────────────────────────────
    ("Insert generator products", f"""
INSERT INTO vendor_products (id, vendor_id, product_category, status, manufacturer, model,
  power_kw, price_per_kw, lead_time_weeks, warranty_years, voltage_v, chemistry)
VALUES
  ('{P["gen-cat"]}', '{V_GEN}', 'generator', 'approved',
   'Caterpillar', 'DE550 GC 550kW Diesel', 550, 780, 16, 2, 480, 'diesel'),
  ('{P["gen-cummins"]}', '{V_GEN}', 'generator', 'approved',
   'Cummins', 'C1000N5 1000kW Natural Gas', 1000, 620, 20, 2, 480, 'natural_gas'),
  ('{P["gen-generac"]}', '{V_GEN}', 'generator', 'approved',
   'Generac', 'SG200 200kW Diesel', 200, 800, 10, 2, 480, 'diesel')
ON CONFLICT (id) DO NOTHING;
"""),

    # ── Step 6: Insert EV charger products ───────────────────────────────────
    ("Insert EV charger products", f"""
INSERT INTO vendor_products (id, vendor_id, product_category, status, manufacturer, model,
  power_kw, price_per_kw, lead_time_weeks, warranty_years, voltage_v, chemistry)
VALUES
  ('{P["ev-chargepoint"]}', '{V_EV}', 'ev_charger', 'approved',
   'ChargePoint', 'CPE250 Level 2 7.2kW', 7.2, 764, 4, 3, 240, 'l2'),
  ('{P["ev-abb"]}', '{V_EV}', 'ev_charger', 'approved',
   'ABB', 'Terra 184 DC Fast 180kW', 180, 389, 10, 3, 480, 'dcfc'),
  ('{P["ev-tritium"]}', '{V_EV}', 'ev_charger', 'approved',
   'Tritium', 'RTM 75kW DC Fast', 75, 600, 6, 3, 480, 'dcfc')
ON CONFLICT (id) DO NOTHING;
"""),
]

print("=== Running SQL steps via exec_sql_modify ===\n")
all_ok = True
for name, sql in steps:
    s, body = rpc(sql.strip())
    if s == 200:
        rows = body.get("affected_rows", "?") if isinstance(body, dict) else "?"
        print(f"  OK   {name}  (affected_rows={rows})")
    else:
        all_ok = False
        print(f"  FAIL {name}")
        print(f"         HTTP {s}: {body[:300]}")

print("\n=== Final vendor_products totals ===")
s, rows = get("vendor_products?select=product_category")
if isinstance(rows, list):
    from collections import Counter
    counts = Counter(r["product_category"] for r in rows)
    for cat, n in sorted(counts.items()):
        print(f"  {cat:15} {n}")
    print(f"  {'TOTAL':15} {len(rows)}")
else:
    print(f"  HTTP {s}: {rows}")

print("\n=== Final vendors ===")
s, vrows = get("vendors?select=id,company_name,specialty,status")
if isinstance(vrows, list):
    for v in vrows:
        print(f"  {v.get('specialty','?'):12} | {v.get('company_name','?'):35} | {v.get('status','?')}")
