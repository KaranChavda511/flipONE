// Seller Management (by Admin)
// getAllSellers, toggleSellerStatus

import Seller from "../../models/Seller.js";
import logger from "../../services/logger.js";

const adminSellerLogger = logger.child({
  label: "/AdminController/AdminSellerController.js",
});

export const getAllSellers = async (req, res) => {
  try {
    const { search } = req.query;

    // Log the search attempt
    if (search) {
      adminSellerLogger.info(`Searching sellers with query: ${search}`);
    }

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { licenseID: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const sellers = await Seller.find(query);
    const count = await Seller.countDocuments(query);

    adminSellerLogger.info(
      `Fetched ${sellers.length} of ${count} total sellers`
    );

    res.json({
      success: true,
      count,
      sellers,
    });
  } catch (error) {
    adminSellerLogger.error(`Get Sellers Error: ${error.message}`, {
      stack: error.stack,
      query: req.query,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch sellers",
    });
  }
};

export const toggleSellerStatus = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) {
      adminSellerLogger.warn(`Seller not found with ID: ${req.params.id}`);

      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // seller.isActive = !seller.isActive;
    const newStatus = !seller.isActive;
    adminSellerLogger.info(
      `Toggling seller status for ${seller._id} from ${seller.isActive} to ${newStatus}`
    );
    seller.isActive = newStatus;
    await seller.save();

    // Deactivate all products if seller is deactivated
    if (!seller.isActive) {
      await Product.updateMany({ seller: seller._id }, { isActive: false });
      adminSellerLogger.info(
        `Deactivated ${result.modifiedCount} products for seller ${seller._id}`
      );
    }

    adminSellerLogger.info(
      `Successfully ${newStatus ? "activated" : "deactivated"} seller ${
        seller._id
      }`
    );
    res.json({
      success: true,
      message: `Seller ${seller.isActive ? "activated" : "deactivated"}`,
    });
  } catch (error) {
    adminSellerLogger.error(`Toggle Seller Status Error: ${error.message}`, {
      stack: error.stack,
      sellerId: req.params.id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update seller status",
    });
  }
};
