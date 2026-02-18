#!/usr/bin/env python3
"""Create Stripe products and prices for Merlin plans."""
import subprocess
import json
import os

# Read Stripe key from .env
stripe_key = None
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
with open(env_path) as f:
    for line in f:
        if line.startswith('STRIPE_SECRET_KEY='):
            stripe_key = line.strip().split('=', 1)[1]
            break

if not stripe_key:
    print("ERROR: STRIPE_SECRET_KEY not found in .env")
    exit(1)

print(f"Using key: {stripe_key[:12]}...{stripe_key[-4:]}")


def stripe_api(endpoint, data):
    cmd = ['curl', '-s', f'https://api.stripe.com/v1/{endpoint}', '-u', f'{stripe_key}:']
    for k, v in data.items():
        cmd.extend(['-d', f'{k}={v}'])
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)


# Plans to create
plans = [
    {'name': 'Builder', 'tier': 'starter', 'monthly': 2900, 'annual': 29000,
     'desc': 'Professional BESS quotes and project sizing'},
    {'name': 'Pro', 'tier': 'pro', 'monthly': 4900, 'annual': 49000,
     'desc': 'Advanced analytics and professional deliverables'},
    {'name': 'Advanced', 'tier': 'advanced', 'monthly': 9900, 'annual': 99000,
     'desc': 'Full platform with bank-ready models and market intelligence'},
]

results = {}

for plan in plans:
    print(f"\n--- Creating {plan['name']} ---")

    # Create product
    prod = stripe_api('products', {
        'name': f"Merlin {plan['name']}",
        'description': plan['desc'],
        'metadata[tier]': plan['tier'],
    })

    if 'id' not in prod:
        print(f"  ERROR creating product: {prod.get('error', {}).get('message', prod)}")
        continue

    prod_id = prod['id']
    print(f"  Product: {prod_id}")

    # Create monthly price
    mp = stripe_api('prices', {
        'product': prod_id,
        'unit_amount': str(plan['monthly']),
        'currency': 'usd',
        'recurring[interval]': 'month',
        'metadata[tier]': plan['tier'],
        'metadata[billing]': 'monthly',
    })

    if 'id' not in mp:
        print(f"  ERROR creating monthly price: {mp.get('error', {}).get('message', mp)}")
        continue

    print(f"  Monthly: {mp['id']}  (${plan['monthly'] / 100:.0f}/mo)")

    # Create annual price
    ap = stripe_api('prices', {
        'product': prod_id,
        'unit_amount': str(plan['annual']),
        'currency': 'usd',
        'recurring[interval]': 'year',
        'metadata[tier]': plan['tier'],
        'metadata[billing]': 'annual',
    })

    if 'id' not in ap:
        print(f"  ERROR creating annual price: {ap.get('error', {}).get('message', ap)}")
        continue

    print(f"  Annual:  {ap['id']}  (${plan['annual'] / 100:.0f}/yr)")

    results[plan['tier']] = {
        'product': prod_id,
        'monthly': mp['id'],
        'annual': ap['id'],
    }

print("\n" + "=" * 60)
print("STRIPE PRICE IDS (update subscriptionService.ts)")
print("=" * 60)
for tier, ids in results.items():
    print(f"\n{tier}:")
    print(f"  stripePriceIdMonthly: '{ids['monthly']}',")
    print(f"  stripePriceIdAnnual:  '{ids['annual']}',")

# Also output the webhook mapping
print("\n" + "=" * 60)
print("WEBHOOK PRICE_TO_TIER MAP (update stripe-webhook/index.ts)")
print("=" * 60)
for tier, ids in results.items():
    print(f"  '{ids['monthly']}': '{tier}',  // monthly")
    print(f"  '{ids['annual']}': '{tier}',  // annual")

print("\n" + "=" * 60)
print("WEBHOOK PRICE_TO_BILLING MAP")
print("=" * 60)
for tier, ids in results.items():
    print(f"  '{ids['monthly']}': 'monthly',")
    print(f"  '{ids['annual']}': 'annual',")
