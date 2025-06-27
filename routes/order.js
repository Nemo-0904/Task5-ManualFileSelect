const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const Order = require('../models/Order');

// POST /api/orders - Create a new order
router.post('/', protect, async (req, res) => {
  const { items, totalAmount, paymentId } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Order must contain items." });
  }

  try {
    const newOrder = new Order({
      user: req.user._id,
      items,
      totalAmount,
      isPaid: true,
      paymentId
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
