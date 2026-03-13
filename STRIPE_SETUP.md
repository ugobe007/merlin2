# Stripe Integration Setup Guide

## Phase 6: Stripe Billing Integration Complete

### ✅ Files Created:

1. **`src/services/stripeService.ts`** - Core Stripe integration
   - createCheckoutSession() - Initiate subscription checkout
   - createCustomerPortalSession() - Manage billing
   - Price configuration (Pro $99/mo, Enterprise $499/mo)
   - Demo mode for testing without Stripe configured

2. **`src/components/billing/UpgradeModal.tsx`** - Upgrade UI
   - Side-by-side pricing comparison
   - Feature lists for each tier
   - Loading states during checkout
   - Redirects to Stripe Checkout

3. **`supabase/functions/stripe-webhook/index.ts`** - Webhook handler
   - checkout.session.completed - Upgrade tier on purchase
   - customer.subscription.updated - Handle plan changes
   - customer.subscription.deleted - Downgrade to free
   - invoice.payment_succeeded - Reset monthly quota
   - invoice.payment_failed - Mark subscription past_due

4. **Updated: `src/pages/PartnerDashboard.tsx`**
   - "Upgrade Now" button opens modal
   - "Manage Billing" card links to Stripe portal
   - Integrated upgrade flow

### 🔧 Configuration Required:

#### 1. Stripe Dashboard Setup:

```bash
# Create products in Stripe Dashboard (https://dashboard.stripe.com/products)

Product 1: Pro Plan
- Name: Merlin Widget Pro
- Price: $99/month recurring
- Copy Price ID: price_xxxxxxxxxxxxx

Product 2: Enterprise Plan
- Name: Merlin Widget Enterprise
- Price: $499/month recurring
- Copy Price ID: price_yyyyyyyyyyyyy
```

#### 2. Environment Variables (.env):

```bash
# Frontend (Vite)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY=price_yyyyyyyyyyyyy
VITE_STRIPE_API_URL=/api/stripe  # Your backend API endpoint

# Backend (Supabase Edge Function or Node.js)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 3. Deploy Webhook Handler:

```bash
# Option A: Supabase Edge Function (recommended)
cd supabase/functions/stripe-webhook
supabase functions deploy stripe-webhook

# Set environment secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key

# Get webhook URL
# https://your-project.supabase.co/functions/v1/stripe-webhook

# Option B: Node.js/Express backend
# Deploy to your existing backend infrastructure
```

#### 4. Configure Stripe Webhook:

```bash
# In Stripe Dashboard > Developers > Webhooks
# Add endpoint: https://your-project.supabase.co/functions/v1/stripe-webhook

# Select events to listen to:
✓ checkout.session.completed
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_succeeded
✓ invoice.payment_failed

# Copy webhook signing secret → STRIPE_WEBHOOK_SECRET
```

### 🧪 Testing:

#### Test Mode (Without Stripe):

- Modal shows "Demo Mode" alert
- No actual payment processing
- Can test UI flow

#### Test Mode (With Stripe Test Keys):

```bash
# Use Stripe test cards
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

# Test scenarios:
- Successful payment: 4242 4242 4242 4242
- Declined payment: 4000 0000 0000 0002
- Requires authentication: 4000 0025 0000 3155
```

### 📊 What Happens on Upgrade:

1. User clicks "Upgrade Now" in dashboard
2. Modal opens with Pro/Enterprise options
3. User selects tier → createCheckoutSession()
4. Backend creates Stripe Checkout Session with metadata:
   ```json
   {
     "partnerId": "uuid",
     "tier": "pro",
     "customerEmail": "partner@example.com"
   }
   ```
5. User redirected to Stripe Checkout (hosted page)
6. User completes payment
7. Stripe sends webhook → checkout.session.completed
8. Webhook handler updates widget_partners:
   ```sql
   UPDATE widget_partners SET
     tier = 'pro',
     monthly_quote_limit = 500,
     stripe_customer_id = 'cus_xxxxx',
     stripe_subscription_id = 'sub_xxxxx',
     subscription_status = 'active'
   WHERE id = 'partner-uuid'
   ```
9. User redirected back to dashboard with success message

### 💳 Billing Portal:

Partners can self-manage subscriptions via Stripe Customer Portal:

- Update payment methods
- View invoices
- Cancel subscription
- Upgrade/downgrade plans

Access via "Manage Billing" button in dashboard (Pro/Enterprise only).

### 🔄 Monthly Quota Reset:

On successful renewal (invoice.payment_succeeded):

```sql
UPDATE widget_partners SET
  current_month_quotes = 0,
  subscription_status = 'active'
WHERE stripe_customer_id = 'cus_xxxxx'
```

### ⚠️ Payment Failures:

On failed payment (invoice.payment_failed):

```sql
UPDATE widget_partners SET
  subscription_status = 'past_due'
WHERE stripe_customer_id = 'cus_xxxxx'
```

Widget API will still work but dashboard shows warning.
After 3 failed attempts, Stripe cancels subscription → tier = 'free'.

### 🚀 Production Checklist:

- [ ] Replace test keys with live keys (pk*live*, sk*live*)
- [ ] Update webhook URL to production domain
- [ ] Test full upgrade flow end-to-end
- [ ] Monitor Stripe Dashboard for events
- [ ] Set up Stripe email notifications
- [ ] Configure tax collection (if applicable)
- [ ] Add terms of service and privacy policy links
- [ ] Test subscription cancellation flow
- [ ] Verify quota reset on renewal
- [ ] Test past_due → canceled flow

### 📈 Revenue Tracking:

All subscription data visible in:

1. Stripe Dashboard → Billing → Subscriptions
2. Supabase → widget_partners table (tier, subscription_status)
3. Monthly Recurring Revenue (MRR):
   ```sql
   SELECT
     tier,
     COUNT(*) as subscribers,
     CASE tier
       WHEN 'pro' THEN COUNT(*) * 99
       WHEN 'enterprise' THEN COUNT(*) * 499
       ELSE 0
     END as mrr
   FROM widget_partners
   WHERE subscription_status = 'active'
   GROUP BY tier;
   ```

### 🎉 What's Ready:

- ✅ Pricing configured (Pro $99, Enterprise $499)
- ✅ Upgrade modal with feature comparison
- ✅ Stripe Checkout integration
- ✅ Webhook handler for all subscription events
- ✅ Customer Portal for self-service
- ✅ Automatic quota reset on renewal
- ✅ Downgrade to free on cancellation
- ✅ Demo mode for testing without Stripe

### Next Steps:

**Phase 7: Beta Testing**

- Recruit 3-5 real partners
- Onboard with free Pro tier (3 months)
- Track metrics (conversion, accuracy, technical issues)
- Gather feedback and iterate
