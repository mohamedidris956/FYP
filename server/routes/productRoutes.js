const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public: list active products for shop
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: list all (including inactive) for dashboard
router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: create product
router.post("/", protect, admin, async (req, res) => {
  try {
    const { name, price, img, desc, isActive } = req.body;

    const product = await Product.create({
      name,
      price,
      img,
      desc: desc || "",
      isActive: isActive !== false
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: "Invalid product data" });
  }
});

// Admin: update product
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Invalid update data" });
  }
});

// Admin: delete product
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product removed" });
  } catch (err) {
    res.status(400).json({ message: "Invalid product id" });
  }
});

module.exports = router;