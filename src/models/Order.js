
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  price: Number,
  quantity: Number,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: 'COD' }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
