// Product Browsing (for all users) and Product Management (for sellers).
// getAllActiveProducts, searchProducts, getProductDetails

import Product from '../../models/Product.js';
import logger from '../../services/logger.js';

const productControllerLogger = logger.child({ label: '.controllers/ProductController/ProductController.js' });

// Get Active Products
export const getAllActiveProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query;

    productControllerLogger.info(`Fetching active products`, {
      category,
      minPrice,
      maxPrice
    });

    const query = {
      isActive: true,
      ...(category && { category }),
      ...(minPrice && { price: { $gte: minPrice } }),
      ...(maxPrice && { price: { $lte: maxPrice } })
    };

    const products = await Product.find(query)
      .populate('seller', 'name licenseID')
      .populate('category', 'name');

    const count = await Product.countDocuments(query);

    productControllerLogger.info(`Fetched ${products.length} active products`);

    res.json({
      success: true,
      products
    });

  } catch (error) {
    productControllerLogger.error(`Get Products Error: ${error.message}`, {
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// Search Products
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    productControllerLogger.info(`Searching products with query: ${q}`);

    if (!q) {
      productControllerLogger.warn(`Search query missing`);
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'category.name': { $regex: q, $options: 'i' } },
        { subcategories: { $regex: q, $options: 'i' } },
        { 'seller.name': { $regex: q, $options: 'i' } }
      ]
    })
      .populate('category', 'name');

    productControllerLogger.info(`Found ${products.length} products matching query: ${q}`);

    res.json({
      success: true,
      results: products.length,
      products
    });

  } catch (error) {
    productControllerLogger.error(`Search Error: ${error.message}`, {
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};

// Get Product Details by ID
export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    productControllerLogger.info(`Fetching product details: ${id}`);

    const product = await Product.findById(id)
      .populate('seller', 'name licenseID')
      .populate('category', 'name subcategories');

    if (!product?.isActive) {
      productControllerLogger.warn(`Product not found or inactive: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    productControllerLogger.info(`Product details fetched successfully: ${id}`);

    res.json({
      success: true,
      product
    });

  } catch (error) {
    productControllerLogger.error(`Product Details Error: ${error.message}`, {
      stack: error.stack,
      productId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product details'
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}, 'name subcategories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}