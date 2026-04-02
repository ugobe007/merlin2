#!/usr/bin/env python3
"""
MCP Commerce Status Dashboard
Usage: python3 scripts/check_mcp_status.py
"""
import urllib.request, json, sys

SB = "https://fvmpmozybmtzjvikrctq.supabase.co"
SK = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bXBtb3p5Ym10emp2aWtyY3RxIiwi"
    "cm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4MjI5MCwiZXhwIjoyMDc3O"
    "DU4MjkwfQ.pGemfuUEr17rYU1atovIgrfwLNZ7gcC0_k2wpmiHzAg"
)
HDR = {"apikey": SK, "Authorization": f"Bearer {SK}"}

MCP_URL = "https://merlin-mcp-agent-production.up.railway.app"

def sb_get(path):
    req = urllib.request.Request(f"{SB}/rest/v1/{path}", headers=HDR)
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def http_get(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def http_post(url, data, headers=None):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json, text/event-stream")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode()
    except Exception as e:
        return str(e)

# ── 1. Railway MCP server health ──────────────────────────────────────────────
print("\n" + "="*60)
print("  MCP SERVER — Railway")
print("="*60)
try:
    health = http_get(f"{MCP_URL}/health")
    print(f"  Status  : {health.get('status', '?').upper()}")
    print(f"  Server  : {health.get('server')}  v{health.get('version')}")
    auth_mode = health.get('auth', 'NOT SET (old build)')
    print(f"  Auth    : {auth_mode}")
    print(f"  URL     : {MCP_URL}")
except Exception as e:
    print(f"  ⚠️  Health check failed: {e}")

# ── 2. Tool inventory ─────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  AVAILABLE MCP TOOLS")
print("="*60)
tools_resp = http_post(f"{MCP_URL}/mcp", {
    "jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}
})
try:
    tools = []
    for line in tools_resp.split("\n"):
        line = line.strip()
        if line.startswith("data:"):
            obj = json.loads(line[5:])
            tools = obj.get("result", {}).get("tools", [])
    NEW_TOOLS = {"register_agent", "check_usage"}
    for t in tools:
        tag = " ✨ NEW" if t["name"] in NEW_TOOLS else ""
        print(f"  {'✅' if t['name'] in NEW_TOOLS else '  '} {t['name']}{tag}")
    if not any(t["name"] in NEW_TOOLS for t in tools):
        print("  ⚠️  Commerce tools NOT live — Railway still running old build")
except Exception:
    print(f"  Raw response: {tools_resp[:200]}")

# ── 3. Registered API keys ────────────────────────────────────────────────────
print("\n" + "="*60)
print("  REGISTERED AGENT API KEYS (mcp_api_keys)")
print("="*60)
try:
    keys = sb_get(
        "mcp_api_keys?select=id,key_prefix,owner_name,owner_email,"
        "plan,monthly_quota,usage_this_month,is_active,created_at"
        "&order=created_at.desc"
    )
    if keys:
        for k in keys:
            status = "🟢 active" if k["is_active"] else "🔴 disabled"
            bar_used = k["usage_this_month"]
            bar_max = k["monthly_quota"]
            pct = int((bar_used / bar_max) * 10) if bar_max else 0
            bar = "█" * pct + "░" * (10 - pct)
            print(f"  {status}  {k['key_prefix']}...")
            print(f"           {k['owner_name']} <{k['owner_email']}>")
            print(f"           plan={k['plan']}  usage=[{bar}] {bar_used}/{bar_max}  registered={k['created_at'][:10]}")
    else:
        print("  (no keys registered yet — commerce layer awaiting Railway redeploy)")
except Exception as e:
    print(f"  Error: {e}")

# ── 4. Usage log ──────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  RECENT TOOL CALLS (mcp_usage_log)")
print("="*60)
try:
    logs = sb_get(
        "mcp_usage_log?select=tool_name,industry,location,response_ms,created_at"
        "&order=created_at.desc&limit=25"
    )
    if logs:
        for l in logs:
            ms = f"{l['response_ms']}ms" if l["response_ms"] else "    —"
            ind = l["industry"] or "—"
            loc = l["location"] or "—"
            print(f"  {l['created_at'][:19]}  {l['tool_name']:<28} industry={ind:<15} loc={loc:<12} {ms}")
    else:
        print("  (no calls logged yet)")
except Exception as e:
    print(f"  Error: {e}")

# ── 5. Summary view ───────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  USAGE SUMMARY (mcp_usage_summary view)")
print("="*60)
try:
    summary = sb_get(
        "mcp_usage_summary?select=key_prefix,owner_name,plan,"
        "usage_this_month,monthly_quota,total_calls_all_time,last_call_at"
        "&order=total_calls_all_time.desc"
    )
    if summary:
        print(f"  {'Key Prefix':<16} {'Owner':<20} {'Plan':<12} {'This Month':<12} {'All Time':<10} Last Call")
        print(f"  {'-'*16} {'-'*20} {'-'*12} {'-'*12} {'-'*10} {'-'*19}")
        for s in summary:
            last = s["last_call_at"][:19] if s["last_call_at"] else "never"
            print(f"  {s['key_prefix']:<16} {s['owner_name']:<20} {s['plan']:<12} "
                  f"{s['usage_this_month']}/{s['monthly_quota']:<8}  {str(s['total_calls_all_time']):<10} {last}")
    else:
        print("  (empty)")
except Exception as e:
    print(f"  Error: {e}")

print("\n" + "="*60 + "\n")
