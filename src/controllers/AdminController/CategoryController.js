// Category Management (by Admin)
// createCategory, updateCategory, deleteCategory

import Category from '../../models/Category.js';
import Product from '../../models/Product.js';
import logger from '../../services/logger.js';

const adminCategoryLogger = logger.child({ label: "/AdminController/AdminCategoryController.js" });

export const createCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    adminCategoryLogger.info(`Creating category: ${name}`, {
      subcategories: subcategories,
      createdBy: req.account.id
    });

    // In your category controller update function
const existingCategory = await Category.findOne({ 
  name: req.body.name,
  _id: { $ne: req.params.id } 
});
if (existingCategory) {
  return res.status(409).json({ 
    success: false,
    message: 'Category name already exists' 
  });
}

    const category = await Category.create({
      name,
      subcategories,
      createdBy: req.account.id
    });

    adminCategoryLogger.info(`Category created successfully: ${category._id}`);

    res.status(201).json({
      success: true,
      category
    });

  } catch (error) {
    adminCategoryLogger.error(`Create Category Error: ${error.message}`, {
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create category, either category already exists or invalid data'
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'subcategories'];

    adminCategoryLogger.info(`Updating category: ${req.params.id}`, {
      updates: updates
    });

    if (!updates.every(update => allowedUpdates.includes(update))) {
      adminCategoryLogger.warn(`Invalid update attempt for category: ${req.params.id}`, {
        invalidUpdates: updates.filter(update => !allowedUpdates.includes(update))
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid updates!'
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      adminCategoryLogger.warn(`Category not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    adminCategoryLogger.info(`Category updated successfully: ${category._id}`);

    res.json({
      success: true,
      category
    });

  } catch (error) {
    adminCategoryLogger.error(`Update Category Error: ${error.message}`, {
      stack: error.stack,
      categoryId: req.params.id,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      adminCategoryLogger.warn(`Category not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    adminCategoryLogger.info(`Attempting to delete category: ${category._id}`);

    // Check if category is used in products
    const productsCount = await Product.countDocuments({ category: category._id });
    if (productsCount > 0) {
      adminCategoryLogger.warn(`Category deletion blocked due to associated products: ${category._id}`, {
        productsCount: productsCount
      });
      return res.status(400).json({
        success: false,
        message: 'Category cannot be deleted as it has associated products'
      });
    }

    await category.deleteOne();

    adminCategoryLogger.info(`Category deleted successfully: ${category._id}`);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    adminCategoryLogger.error(`Delete Category Error: ${error.message}`, {
      stack: error.stack,
      categoryId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
};