/**
 * Stripe Backend API Server
 * Handles checkout sessions and customer portal for Merlin Widget
 * 
 * Start: node stripe-server.js
 * Port: 3000
 */

import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

// IMPORTANT: Set STRIPE_SECRET_KEY environment variable before running
// Example: STRIPE_SECRET_KEY="sk_live_xxx..." node stripe-server.js
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY environment variable is required');
  console.error('Usage: STRIPE_SECRET_KEY="sk_live_xxx..." node stripe-server.js');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5184', // Your Vite dev server
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/stripe/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stripe API server running' });
});

// Create Checkout Session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { priceId, partnerId, customerEmail, successUrl, cancelUrl } = req.body;

    console.log('📝 Creating checkout session:', {
      priceId,
      partnerId,
      customerEmail,
      successUrl,
      cancelUrl,
    });

    // Validate inputs
    if (!priceId || !partnerId || !customerEmail) {
      return res.status(400).json({
        error: 'Missing required fields: priceId, partnerId, customerEmail',
      });
    }

    // Determine tier from price ID
    const tier = priceId.includes('enterprise') ? 'enterprise' : 'pro';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: customerEmail,
      metadata: {
        partnerId,
        tier,
      },
      success_url: successUrl || 'http://localhost:5184/dashboard?upgrade=success',
      cancel_url: cancelUrl || 'http://localhost:5184/dashboard?upgrade=canceled',
      // Enable tax collection if needed
      // automatic_tax: { enabled: true },
    });

    console.log('✅ Checkout session created:', session.id);

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Checkout session error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    });
  }
});

// Create Customer Portal Session
app.post('/api/stripe/create-portal-session', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;

    console.log('📝 Creating portal session:', { customerId, returnUrl });

    if (!customerId) {
      return res.status(400).json({
        error: 'Missing required field: customerId',
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'http://localhost:5184/dashboard',
    });

    console.log('✅ Portal session created');

    res.json({
      url: session.url,
    });
  } catch (error) {
    console.error('❌ Portal session error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to create portal session',
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎉 Stripe API Server Running                                ║
║                                                               ║
║   📍 Port: ${PORT}                                               ║
║   🔗 Health: http://localhost:${PORT}/api/stripe/health          ║
║   🛒 Checkout: POST /api/stripe/create-checkout-session      ║
║   👤 Portal: POST /api/stripe/create-portal-session          ║
║                                                               ║
║   ✅ Ready to handle Merlin Widget subscriptions              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
  
  console.log('\n📋 Environment Check:');
  console.log(`   STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Using: ${stripe.apiKey ? stripe.apiKey.substring(0, 20) + '...' : 'Hardcoded fallback'}`);
  console.log('\n💡 Test with: curl http://localhost:3000/api/stripe/health\n');
});
