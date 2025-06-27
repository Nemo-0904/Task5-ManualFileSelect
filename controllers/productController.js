// backend/routes/products.js

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ message: 'Server error while fetching products.' });
  }
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Public or Protected (consider securing in future)
router.post('/', async (req, res) => {
  const { title, price, description, image, category } = req.body;

  // Basic validation
  if (!title || !price) {
    return res.status(400).json({ message: 'Title and price are required.' });
  }

  try {
    const newProduct = new Product({
      title,
      price,
      description,
      image,
      category
    });

    const saved = await newProduct.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error saving product:", error.message);
    res.status(500).json({ message: 'Server error while adding product.' });
  }
});

module.exports = router;
