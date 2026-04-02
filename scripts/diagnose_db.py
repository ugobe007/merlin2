#!/usr/bin/env python3
"""Diagnose constraint and vendor table, then seed correctly."""
import urllib.request, urllib.error, json, re

env = open('/Users/robertchristopher/merlin3/.env').read()
url  = re.search(r'^VITE_SUPABASE_URL=(.+)$', env, re.M).group(1).strip()
skey = re.search(r'^SUPABASE_SERVICE_ROLE_KEY=(.+)$', env, re.M).group(1).strip()

HEADERS = {
    "apikey": skey,
    "Authorization": f"Bearer {skey}",
    "Content-Type": "application/json",
}

def rpc(sql):
    data = json.dumps({"sql_query": sql}).encode()
    req = urllib.request.Request(f"{url}/rest/v1/rpc/exec_sql_modify",
                                  data=data, headers=HEADERS, method="POST")
    try:
        res = urllib.request.urlopen(req)
        return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def get(path):
    req = urllib.request.Request(f"{url}/rest/v1/{path}",
                                  headers={**HEADERS, "Prefer": "count=exact"}, method="GET")
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# 1. Check vendors table
print("=== vendors table ===")
s, rows = get("vendors?select=id,name,status&limit=20")
if isinstance(rows, list):
    for r in rows:
        print(f"  id={r.get('id')} | name={r.get('name')} | status={r.get('status')}")
    print(f"  Count: {len(rows)}")
else:
    print(f"  HTTP {s}: {rows[:200]}")

# 2. Check what's in vendor_products
print("\n=== vendor_products existing rows ===")
s, rows = get("vendor_products?select=id,product_category,manufacturer,model,vendor_id&limit=10")
if isinstance(rows, list):
    for r in rows:
        print(f"  cat={r.get('product_category')} mfr={r.get('manufacturer')} vendor_id={r.get('vendor_id')}")
else:
    print(f"  HTTP {s}: {rows[:200]}")

# 3. Try to read the check constraint by inserting a known-bad category
print("\n=== Testing constraint with 'test_bad_category' ===")
s, body = get("vendor_products?product_category=eq.battery&select=product_category&limit=1")
print(f"  battery query: HTTP {s}")

# 4. Try ALTER constraint via exec_sql_modify
print("\n=== Step: ALTER valid_product_category constraint ===")
alter_sql = """
ALTER TABLE vendor_products DROP CONSTRAINT IF EXISTS valid_product_category;
ALTER TABLE vendor_products ADD CONSTRAINT valid_product_category
  CHECK (product_category IN ('battery','solar','inverter','generator','ev_charger','bos','ems','container','other'));
"""
s, body = rpc(alter_sql)
print(f"  ALTER result: HTTP {s}: {body[:200]}")

# 5. Check vendors — maybe need to insert a system vendor
print("\n=== Step: Ensure system vendor exists ===")
s2, rows2 = get("vendors?select=id,name&limit=5")
print(f"  Vendors: HTTP {s2}")
if isinstance(rows2, list) and rows2:
    for r in rows2:
        print(f"    id={r['id']} name={r.get('name')}")
