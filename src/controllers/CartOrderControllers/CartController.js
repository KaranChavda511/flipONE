// Cart Management (for logged in users)
// getCart, addToCart, updateCartItem, removeFromCart, clearCart
// Handle stock validation before cart operations
import mongoose from 'mongoose';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import logger from '../../services/logger.js';


const cartControllerLogger = logger.child({ label: '/CartController/CartController.js' });

export const getCart = async (req, res) => {
  try {
    const userId = req.account.id;
    cartControllerLogger.info(`Fetching cart for user: ${userId}`);

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name price images stock isActive category',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

    if (!cart) {
      return res.json({
        success: true,
        data: {
          items: [],
          meta: {
            totalItems: 0,
            totalAmount: 0,
            currency: 'INR',
            warnings: []
          }
        },
        // links: {
        //   continueShopping: '/api/products',
        //   checkout: '/api/checkout'
        // }
      });
    }

    const validatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = item.product;
        const available = product?.isActive ? Math.min(item.quantity, product.stock) : 0;
        
        return {
          id: item._id,
          product: {
            id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            category: product.category?.name,
            stockStatus: product.stock > 5 ? 'in-stock' : 
                        product.stock > 0 ? 'low-stock' : 'out-of-stock'
          },
          requestedQuantity: item.quantity,
          availableQuantity: available,
          lineTotal: product.price * available,
          warnings: available < item.quantity ? [
            `Only ${available} items available (requested ${item.quantity})`
          ] : []
        };
      })
    );

    const warnings = validatedItems.flatMap(item => item.warnings);
    const totalAmount = validatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalItems = validatedItems.reduce((sum, item) => sum + item.availableQuantity, 0);

    cartControllerLogger.info(`Cart fetched successfully for user: ${userId}`);

    res.json({
      success: true,
      data: {
        items: validatedItems,
        meta: {
          totalItems,
          totalAmount,
          currency: 'INR',
          warnings,
          hasIssues: warnings.length > 0
        }
      },
      // links: {
      //   continueShopping: '/api/products',
      //   checkout: '/api/checkout'
      // }
    });

  } catch (error) {
    cartControllerLogger.error(`Get Cart Error: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'CART_RETRIEVAL_FAILED',
      message: 'Failed to retrieve cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.account.id;

    // Validate input
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PRODUCT_ID',
        message: 'Invalid product identifier'
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_QUANTITY',
        message: 'Quantity must be a positive integer'
      });
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'PRODUCT_UNAVAILABLE',
        message: 'Product not found or inactive'
      });
    }

    const cart = await Cart.findOne({ user: userId }) || new Cart({ user: userId });
    const existingItem = cart.items.find(item => item.product.equals(productId));

    const totalRequested = (existingItem?.quantity || 0) + quantity;
    if (totalRequested > product.stock) {
      const available = product.stock - (existingItem?.quantity || 0);
      return res.status(409).json({
        success: false,
        error: 'INSUFFICIENT_STOCK',
        message: 'Cannot add requested quantity',
        details: {
          available: Math.max(available, 0),
          maximumAllowed: available > 0 ? available : 0
        }
      });
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    res.json({
      success: true,
      data: {
        cartItemId: existingItem?._id || cart.items[cart.items.length - 1]._id,
        productId,
        quantity: existingItem?.quantity || quantity
      },
      // links: {
      //   viewCart: `/api/cart`,
      //   product: `/api/products/${productId}`
      // }
    });

  } catch (error) {
    cartControllerLogger.error(`Add to Cart Error: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'CART_UPDATE_FAILED',
      message: 'Failed to update cart',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    cartControllerLogger.info(`Updating cart item: ${itemId} for user: ${req.account.id}`);

    const cart = await Cart.findOne({ user: req.account.id });
    const item = cart.items.id(itemId);

    if (!item) {
      cartControllerLogger.warn(`Cart item not found: ${itemId} for user: ${req.account.id}`);
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Validate stock
    const product = await Product.findById(item.product);
    if (!product || quantity > product.stock) {
      cartControllerLogger.warn(`Invalid quantity for cart item: ${itemId} for user: ${req.account.id}`);
      return res.status(400).json({
        success: false,
        message: 'Requested quantity not available'
      });
    }

    item.quantity = quantity;
    await cart.save();

    cartControllerLogger.info(`Cart item updated: ${itemId} for user: ${req.account.id}`);

    res.json({
      success: true,
      message: 'Cart updated'
    });

  } catch (error) {
    cartControllerLogger.error(`Update Cart Error: ${error.message}`, {
      stack: error.stack,
      userId: req.account.id,
      itemId: req.params.itemId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update cart'
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    cartControllerLogger.info(`Removing cart item: ${itemId} for user: ${req.account.id}`);

    const cart = await Cart.findOne({ user: req.account.id });
    cart.items.pull(itemId);
    await cart.save();

    cartControllerLogger.info(`Cart item removed: ${itemId} for user: ${req.account.id}`);

    res.json({
      success: true,
      message: 'Item removed from cart'
    });

  } catch (error) {
    cartControllerLogger.error(`Remove Item Error: ${error.message}`, {
      stack: error.stack,
      userId: req.account.id,
      itemId: req.params.itemId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    cartControllerLogger.info(`Clearing cart for user: ${req.account.id}`);

    await Cart.findOneAndUpdate(
      { user: req.account.id },
      { $set: { items: [] } }
    );

    cartControllerLogger.info(`Cart cleared for user: ${req.account.id}`);

    res.json({
      success: true,
      message: 'Cart cleared'
    });

  } catch (error) {
    cartControllerLogger.error(`Clear Cart Error: ${error.message}`, {
      stack: error.stack,
      userId: req.account.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};