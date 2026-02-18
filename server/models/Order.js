const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  items: [
    {
      name: String,
      price: Number
    }
  ],
  totalAmount: Number,
  stripeSessionId: String,
  paymentStatus: {
    type: String,
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
