// backend/routes/payment.js
const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const dotenv = require("dotenv");
const protect = require("../middleware/authMiddleware");

dotenv.config();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/payment/create-checkout-session
// @desc    Create Stripe Checkout session
// @access  Private (JWT protected)
router.post("/create-checkout-session", protect, async (req, res) => {
  try {
    const { items } = req.body; // expected to be an array

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid cart items." });
    }

    const line_items = items.map((item) => {
      if (!item.name || isNaN(item.price) || !item.quantity) {
        throw new Error("Invalid item format in cart");
      }

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // ₹ → paise
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      // Optional: Add metadata for tracking user or order
      metadata: {
        userId: req.user._id.toString(),
        email: req.user.email,
      },
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error("Stripe Checkout Error:", error.message);
    res.status(500).json({ message: "Payment failed: " + error.message });
  }
});

module.exports = router;
