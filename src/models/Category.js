import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    subcategories: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;
