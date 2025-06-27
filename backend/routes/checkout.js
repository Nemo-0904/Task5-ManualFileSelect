// backend/routes/checkout.js

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config(); // Ensure dotenv is loaded here as well for this file

// Initialize Stripe with your SECRET key
// IMPORTANT: Make sure process.env.STRIPE_SECRET_KEY is correctly set in your backend's .env file
// Example: STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/checkout/create-checkout-session
// This route handles the creation of a Stripe Checkout Session
router.post('/create-checkout-session', async (req, res) => {
    console.log('Received request for create-checkout-session');
    console.log('Request body:', req.body); // Log the entire request body

    try {
        const { items } = req.body; // Expecting 'items' array from frontend
        console.log('Cart items received:', items); // Log the cart items

        if (!items || !Array.isArray(items) || items.length === 0) {
            console.warn('Checkout attempt with invalid or empty cart data.');
            return res.status(400).json({ message: 'Invalid or empty cart data provided for checkout.' });
        }

        // Map the cart items into Stripe's required line_items format
        const line_items = items.map(item => {
            if (!item.name || !item.price || !item.quantity) {
                // Log and throw error if any item is malformed
                console.error('Malformed item in cart:', item);
                throw new Error('One or more cart items are missing required properties (name, price, quantity).');
            }
            return {
                price_data: {
                    currency: 'inr', // Ensure this matches your Stripe account's supported currencies
                    product_data: {
                        name: item.name,
                        // Optionally include images for better Stripe Checkout page presentation
                        // Ensure 'item.image' is a publicly accessible URL
                        images: item.image ? [item.image] : [],
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe expects amount in cents/lowest currency unit, so multiply by 100
                },
                quantity: item.quantity,
            };
        });

        console.log('Transformed line_items for Stripe:', line_items);

        // Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Only 'card' is enabled by default in test mode
            mode: 'payment', // Set to 'payment' for one-time payments
            line_items: line_items,
            // These URLs should point to your frontend application
            // IMPORTANT: process.env.CLIENT_URL MUST be set to http://localhost:5173 in your backend's .env
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
        });

        console.log('Stripe session successfully created. Session ID:', session.id);
        res.status(200).json({ id: session.id });

    } catch (error) {
        // Detailed error logging from Stripe API or custom errors
        console.error("Stripe Checkout Session Creation Error:", error);
        res.status(500).json({ message: error.message || 'Failed to create checkout session due to an internal server error.' });
    }
});

module.exports = router;
