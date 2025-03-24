import mongoose from "mongoose";
import Category from "./Category.js";

const productSchema = mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    images: { 
      type: [String],
      validate: {
        validator: v => v.length <= 5,
        message: 'Exceeds maximum of 5 images'
      }
    },
    category: {
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true }
    },
    subcategories: {
      type: [String],
      required: true,
      validate: {
        validator: async function (subs) {
          if (!this.category) return false;
          const category = await Category.findById(this.category._id);
          return subs.every(sub => category?.subcategories?.includes(sub));
        },
        message: "Invalid subcategory for the selected category."
      }
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Corrected index
productSchema.index(
  { seller: 1, name: 1, "category._id": 1 }, 
  { unique: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;