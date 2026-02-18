const express = require('express');
const Stripe = require('stripe');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// =======================
// Create Stripe Session
// =======================
router.post('/create-session', protect, async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const line_items = cartItems.map(item => ({
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
      success_url: `${process.env.CLIENT_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart.html`,
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
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('⚠️ Webhook signature verification failed.');
    return res.sendStatus(400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const cartItems = JSON.parse(session.metadata.cart);

    const newOrder = new Order({
      user: session.metadata.userId,
      items: cartItems,
      totalAmount: session.amount_total / 100,
      stripeSessionId: session.id,
      paymentStatus: 'paid'
    });

    await newOrder.save();

    console.log('Order saved to database');
  }

  res.json({ received: true });
});
// =======================
// Get Order By Session ID
// =======================
router.get('/order/:sessionId', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      stripeSessionId: req.params.sessionId
    }).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
