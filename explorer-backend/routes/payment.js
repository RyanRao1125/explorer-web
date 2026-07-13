const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ==========================================================================
// Map your cart class IDs to Stripe Price IDs
// Replace these placeholders with the real Price IDs from your Stripe Dashboard
// ==========================================================================
const PRICE_MAP = {
  'robot-rookie':   'price_1NX4oKJCgvsaNJe4kNrqcBpO',
  'robot-rookie-1230': 'price_REPLACE_ROBOT_ROOKIE_1230',
  'robot-45':       'price_1NX4oKJCgvsaNJe4kNrqcBpO',
  'robot-67':       'price_1NX4oKJCgvsaNJe4kNrqcBpO',
  'python':         'price_1NX4oKJCgvsaNJe4kNrqcBpO',
  'python-robot':   'price_1NX4oKJCgvsaNJe4kNrqcBpO',
  '3dprinting':     'price_1NX4oKJCgvsaNJe4kNrqcBpO',
  'fll': 'price_REPLACE_FLL',
  'ai-78':          'price_1NX4oKJCgvsaNJe4kNrqcBpO',
  'electronics':    'price_1NX4oKJCgvsaNJe4kNrqcBpO',
  'ai-910':         'price_1NX4oKJCgvsaNJe4kNrqcBpO'
};

// One-time materials fee for Electronics class
const ELECTRONICS_MATERIALS_PRICE = 'price_1NX4oKJCgvsaNJe4kNrqcBpO';

// POST /api/payment/create-subscription
// Creates a Stripe customer + subscription combining all cart items into one bill
router.post('/create-subscription', async (req, res) => {
  const { cartItems, email, name, paymentMethodId } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }
  if (!email || !name || !paymentMethodId) {
    return res.status(400).json({ error: 'Missing customer or payment details.' });
  }

  try {
    // 1. Create or find the Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    // 2. Build subscription line items from cart
    const items = cartItems
      .filter(id => PRICE_MAP[id])
      .map(id => ({ price: PRICE_MAP[id] }));

    if (items.length === 0) {
      return res.status(400).json({ error: 'No valid classes found in cart.' });
    }

    // 3. If Electronics is in the cart, add the one-time materials fee as an invoice item
    if (cartItems.includes('electronics')) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        price: ELECTRONICS_MATERIALS_PRICE,
        description: 'Electronics class one-time materials fee'
      });
    }

    // 4. Create the subscription combining all classes into one monthly bill
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });

    res.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      status: subscription.latest_invoice.payment_intent.status
    });

  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message || 'Payment processing failed.' });
  }
});

module.exports = router;
