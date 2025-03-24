// deep seek 

import Product from "../../models/Product.js";
import Category from "../../models/Category.js";
import logger from "../../services/logger.js";

const sellerProductControllerLogger = logger.child({
  label: "/SellerProductController/SellerProductController.js",
});

// Helper: Validate category and subcategories
const validateCategorySubcats = async (categoryName, subcategories) => {

  // Convert all inputs to lowercase array
  const subs = Array.isArray(subcategories) 
    ? subcategories.map(s => s.toLowerCase())
    : subcategories.split(',').map(s => s.toLowerCase());

  const categoryDoc = await Category.findOne({ name: categoryName });
  if (!categoryDoc) return { valid: false, error: "Invalid category" };

  // Handle missing subcategories array in category
  if (!Array.isArray(categoryDoc.subcategories)) {
    return {
      valid: false,
      error: "Category has no valid subcategories",
      validSubcats: []
    };
  }

  if (subcategories?.length) {
    const invalidSubcats = subcategories.filter(
      (sc) => !categoryDoc.subcategories.includes(sc)
    );
    if (invalidSubcats.length > 0) {
      return {
        valid: false,
        error: "Invalid subcategories",
        validSubcats: categoryDoc.subcategories, // Return subcats explicitly
        invalidSubcats
      };
    }
  }
  
  return { valid: true, categoryDoc };
};


// Add product
export const addProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, subcategories } =
      req.body;

    // Destructure validSubcats from helper
    const { valid, error, categoryDoc, validSubcats } = await validateCategorySubcats(category, subcategories);
    if (!valid) {
      const categories = await Category.find({}, "name -_id");
      return res.status(400).json({
        success: false,
        message: error,
    // Always include available categories for "Invalid category" errors
    ...(error === "Invalid category" && { 
      availableCategories: categories.map((c) => c.name) 
    }),
    // Use validSubcats from helper instead of categoryDoc
    ...(error === "Invalid subcategories" && { 
      validSubcategories: validSubcats 
    })
  });
}

    // Duplicate Check
    const existingProduct = await Product.findOne({
      seller: req.account.id,
      name,
      "category._id": categoryDoc._id,
    });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: `Product '${name}' exists in ${categoryDoc.name}`,
        conflict: existingProduct._id,
      });
    }

    // Create Product
    const product = await Product.create({
      seller: req.account.id,
      name,
      description,
      price, 
      stock,
      category: { _id: categoryDoc._id, name: categoryDoc.name },
      subcategories: subcategories || [],
      images: req.files?.map((file) => `/uploads/${file.filename}`) || [],
    });

    res.status(201).json({ success: true,      seller : req.account.name,
      product });
  } catch (error) {
    sellerProductControllerLogger.error(`Add Product Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Product creation failed",
      error: error.message,
    });
  }
};



// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const sellerId = req.account.id;

    // Category Handling
    if (updates.category) {
      const { valid, error, categoryDoc } = await validateCategorySubcats(
        updates.category,
        updates.subcategories
      );
      if (!valid)
        return res.status(400).json({ success: false, message: error });
      updates.category = { _id: categoryDoc._id, name: categoryDoc.name };

      // Reset subcategories if not provided
      updates.subcategories = updates.subcategories || [];
    }

    // Numeric Conversions
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.stock) updates.stock = parseInt(updates.stock, 10);

    // Perform Update
    const product = await Product.findOneAndUpdate(
      { _id: id, seller: sellerId },
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found/unauthorized",
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    sellerProductControllerLogger.error(`Update Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message,
    });
  }
};


// Update product images
export const updateProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }


    const currentImageCount = product.images.length;
    const newImages = req.files?.map(file => `/uploads/${file.filename}`) || [];

    if (currentImageCount + newImages.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 images allowed',
        currentImages: currentImageCount,
        maxAllowed: 5 - currentImageCount
      });
    }
    res.json({ success: true, images: updateProduct.images });
  } catch (error) {
    sellerProductControllerLogger.error(`Update images error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Image update failed",
      error: error.message,
    });
  }
};


// Deactivate product
export const deactivateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndUpdate(
      { _id: id, seller: req.account.id },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({ success: true, message: "Product deactivated" });
  } catch (error) {
    sellerProductControllerLogger.error(`Deactivation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Deactivation failed",
      error: error.message,
    });
  }
};



// Get seller products
export const getSellerProducts = async (req, res) => {
  try {
    const { status = "active" } = req.query;
    const filter = {
      seller: req.account.id,
      isActive: status === "active",
    };

    sellerProductControllerLogger.info(
      `Fetching products for seller: ${req.account.id}`,
      {
        status,
      }
    );

   // In getSellerProducts (SellerProductController.js)
const products = await Product.find(filter).sort("-createdAt"); // Remove .populate()

    sellerProductControllerLogger.info(
      `Fetched ${products.length} products for seller: ${req.account.id}`
    );

    res.json({
      success: true,
      seller : req.account.name,
      products,
    });
  } catch (error) {
    sellerProductControllerLogger.error(
      `Get Products Error: ${error.message}`,
      {
        stack: error.stack,
        sellerId: req.account.id,
      }
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};
