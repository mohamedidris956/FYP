const express = require('express');
const Stripe = require('stripe');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');

const router = express.Router();

const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
const endpointSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

let stripe = null;
if (stripeSecretKey) {
  try {
    stripe = Stripe(stripeSecretKey);
  } catch (err) {
    console.error('Invalid STRIPE_SECRET_KEY configuration:', err.message);
  }
}

async function saveOrderFromStripeSession(session) {
  const cartItems = JSON.parse(session.metadata?.cart || '[]');
  const userId = session.metadata?.userId;

  if (!userId || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Missing required checkout metadata to save order.');
  }

  const payload = {
    user: userId,
    items: cartItems,
    totalAmount: (session.amount_total || 0) / 100,
    stripeSessionId: session.id,
    paymentStatus: session.payment_status === 'paid' ? 'paid' : 'pending'
  };

  return Order.findOneAndUpdate(
    { stripeSessionId: session.id },
    payload,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate('user', 'name email');
}

// =======================
// Create Stripe Session
// =======================
router.post('/create-session', protect, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ message: 'Payments are temporarily unavailable.' });
    }

    const clientUrl = (process.env.CLIENT_URL || '').trim();
    if (!clientUrl || !/^https?:\/\//i.test(clientUrl)) {
      return res.status(500).json({
        message: 'Server payment configuration error: CLIENT_URL is missing or invalid.'
      });
    }

    const { cartItems } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const invalidItem = cartItems.find((item) => {
      const validName = typeof item.name === 'string' && item.name.trim().length > 0;
      const validPrice = Number.isFinite(Number(item.price)) && Number(item.price) > 0;
      return !validName || !validPrice;
    });

    if (invalidItem) {
      return res.status(400).json({ message: 'Invalid cart item data' });
    }

    const line_items = cartItems.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      metadata: {
        userId: req.user._id.toString(),
        cart: JSON.stringify(cartItems)
      },
      success_url: `${clientUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cart.html`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe error:', error);
    res.status(500).json({ message: error.message });
  }
});

// =======================
// Stripe Webhook
// =======================
router.post('/webhook', async (req, res) => {
  if (!stripe || !endpointSecret) {
    return res.status(503).json({ message: 'Webhook handling is unavailable.' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Webhook checkout.session.completed for session:', session.id);

    await saveOrderFromStripeSession(session);
    console.log('✅ Order saved to database:', session.id);
  }

  res.json({ received: true });
});

// =======================
// Get Order By Session ID
// =======================
router.get('/order/:sessionId', protect, async (req, res) => {
  try {
    let order = await Order.findOne({
      stripeSessionId: req.params.sessionId
    }).populate('user', 'name email');

    // Fallback: webhook may be delayed or not delivered in local dev
    if (!order && stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

        if (session && session.payment_status === 'paid') {
          order = await saveOrderFromStripeSession(session);
        }
      } catch (stripeErr) {
        console.error('Stripe lookup error:', stripeErr.message);
      }
    }

    // Ensure users can only read their own order
    if (!order || String(order.user?._id || order.user) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;