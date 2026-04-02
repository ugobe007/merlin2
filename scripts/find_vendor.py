#!/usr/bin/env python3
"""Seed vendor_products with correct vendor_id and relaxed constraint."""
import urllib.request, urllib.error, json, re, uuid

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

def rpc(sql):
    data = json.dumps({"sql_query": sql}).encode()
    req = urllib.request.Request(f"{url}/rest/v1/rpc/exec_sql_modify",
                                  data=data, headers=HEADERS, method="POST")
    try:
        res = urllib.request.urlopen(req)
        return res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# Step 1: Get vendors table columns
print("=== vendors table columns ===")
s, rows = get("vendors?limit=5")
if isinstance(rows, list):
    if rows:
        print(f"  Columns: {list(rows[0].keys())}")
        for r in rows:
            print(f"  {r}")
    else:
        print("  0 rows — need to insert a vendor")
else:
    print(f"  HTTP {s}: {str(rows)[:300]}")

# Step 2: Try inserting a system vendor (if vendors table is empty or none fits)
# Try with common column names
print("\n=== Trying to insert system vendor ===")
sys_vendor_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, "merlin-system-vendor"))
for attempt in [
    {"id": sys_vendor_id, "company_name": "Merlin System", "status": "approved"},
    {"id": sys_vendor_id, "name": "Merlin System", "status": "approved"},
    {"id": sys_vendor_id, "business_name": "Merlin System", "status": "approved"},
    {"id": sys_vendor_id, "status": "approved"},
]:
    s, body = post("vendors", attempt)
    print(f"  Attempt {list(attempt.keys())}: HTTP {s} -> {body[:100]}")
    if s in (200, 201, 204):
        print(f"  SUCCESS with: {attempt}")
        break
    if "already exists" in str(body):
        print(f"  Already exists")
        break

# Step 3: Get all vendor ids to pick a usable one
print("\n=== All vendor_ids currently in vendor_products ===")
s, rows = get("vendor_products?select=vendor_id,manufacturer&limit=20")
if isinstance(rows, list):
    seen = set()
    for r in rows:
        vid = r.get("vendor_id")
        if vid and vid not in seen:
            seen.add(vid)
            print(f"  vendor_id={vid}  mfr={r.get('manufacturer')}")
    if not seen:
        print("  (no vendor_ids found)")
