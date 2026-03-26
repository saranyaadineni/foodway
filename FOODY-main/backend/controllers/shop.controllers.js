import Shop from "../models/shop.model.js";
import Item from "../models/item.model.js";
import User from "../models/user.model.js";
import uploadToCloudinary from "../utils/s3Upload.js";

const normalize = (val = "") =>
  val.toString().trim().toLowerCase();

/* ---------------- CREATE / EDIT SHOP ---------------- */
export const createEditShop = async (req, res) => {
  try {
    const { name, city, state, address, upiVpa, upiPayeeName } = req.body;

    // --- Backend Validation ---
    const shopName = name?.trim();
    const alphaRegex = /^[A-Za-z\s]+$/;

    if (!shopName) {
      return res.status(400).json({ message: "Shop name is required" });
    }
    // Only alphabets and spaces, 3-50 chars
    if (!alphaRegex.test(shopName) || shopName.length < 3 || shopName.length > 50) {
      return res.status(400).json({ message: "Please enter a valid shop name (3-50 letters only)" });
    }

    // Payee Name Validation (TC_018, TC_019)
    const payee = upiPayeeName?.trim();
    if (!payee) {
      return res.status(400).json({ message: "Payee name is required" });
    }
    if (!alphaRegex.test(payee)) {
      return res.status(400).json({ message: "Invalid payee name" });
    }

    // City Validation (TC_020)
    const cityName = city?.trim();
    if (!cityName) {
      return res.status(400).json({ message: "City is required" });
    }
    if (!alphaRegex.test(cityName)) {
      return res.status(400).json({ message: "Invalid city name" });
    }

    // State Validation (TC_022, TC_023)
    const stateName = state?.trim();
    if (!stateName) {
      return res.status(400).json({ message: "State is required" });
    }
    if (!alphaRegex.test(stateName)) {
      return res.status(400).json({ message: "Invalid state name" });
    }

    // Address Validation (TC_025)
    if (!address || !address.trim()) {
      return res.status(400).json({ message: "Address is required" });
    }

    let image;
    if (req.file) {
      image = await uploadToCloudinary(req.file);
    }

    let shop = await Shop.findOne({ owner: req.userId });

    // Image is mandatory for both creation and updates (if no image currently exists and no new image is provided)
    if (!image && (!shop || !shop.image)) {
      return res.status(400).json({ message: "Please upload shop image" });
    }

    const payload = {
      name: shopName,
      city: normalize(city),
      state: normalize(state),
      address: address?.trim(),
      upiVpa: upiVpa || null,
      upiPayeeName: upiPayeeName || null,
    };

    if (!shop) {
      shop = await Shop.create({
        ...payload,
        image: image, // No fallback to PLACEHOLDER_IMAGE
        owner: req.userId,
        isOpen: true,
      });
    } else {
      if (image) payload.image = image;

      shop = await Shop.findByIdAndUpdate(
        shop._id,
        payload,
        { new: true }
      );

      // sync city/state to items
      await Item.updateMany(
        { shop: shop._id },
        { $set: { city: payload.city, state: payload.state } }
      );
    }

    await shop.populate("owner items");
    return res.status(201).json(shop);
  } catch (error) {
    console.error("❌ createEditShop:", error);
    return res.status(500).json({ message: "Failed to save shop" });
  }
};

/* ---------------- GET MY SHOP ---------------- */
export const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId })
      .populate("owner")
      .populate({
        path: "items",
        options: { sort: { updatedAt: -1 } },
      });

    return res.status(200).json(shop || null);
  } catch (error) {
    console.error("❌ getMyShop:", error);
    return res.status(500).json({ message: "Failed to fetch shop" });
  }
};

/* ---------------- GET ALL SHOPS ---------------- */
export const getAllShops = async (_req, res) => {
  try {
    const shops = await Shop.find()
      .populate("owner", "name email")
      .populate("items")
      .lean();

    return res.status(200).json(shops);
  } catch (error) {
    console.error("❌ getAllShops:", error);
    return res.status(500).json({ message: "Failed to fetch shops" });
  }
};

/* ---------------- GET SHOPS BY CITY ---------------- */
export const getShopByCity = async (req, res) => {
  try {
    const requestedCity = normalize(req.params.city);

    const query =
      requestedCity && requestedCity !== "all"
        ? { city: requestedCity }
        : {};

    const shops = await Shop.find(query)
      .populate("items")
      .populate("owner", "name email")
      .lean();

    return res.status(200).json(
      shops.map((shop) => ({
        ...shop,
        name: shop.name || "Unnamed Shop",
      }))
    );
  } catch (error) {
    console.error("❌ getShopByCity:", error);
    return res.status(500).json({ message: "Failed to fetch shops" });
  }
};

/* ---------------- UPDATE SHOP STATUS ---------------- */
export const updateShopStatus = async (req, res) => {
  try {
    const { isOpen } = req.body;

    if (typeof isOpen !== "boolean") {
      return res.status(400).json({ message: "isOpen must be boolean" });
    }

    const shop = await Shop.findOneAndUpdate(
      { owner: req.userId },
      { isOpen },
      { new: true }
    ).populate("owner")
     .populate({
        path: "items",
        options: { sort: { updatedAt: -1 } },
      });

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    req.io?.emit("shopStatusUpdate", {
      shopId: shop._id,
      isOpen: shop.isOpen,
      city: shop.city,
    });

    return res.status(200).json(shop);
  } catch (error) {
    console.error("❌ updateShopStatus:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

/* ---------------- GET BEST SELLING ITEMS ---------------- */
export const getBestSellingItems = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const items = await Item.find({ shop: shop._id })
      .sort({ popularity: -1 })
      .limit(5);

    return res.status(200).json(items);
  } catch (error) {
    console.error("❌ getBestSellingItems:", error);
    return res.status(500).json({ message: "Failed to fetch best selling items" });
  }
};

/* ---------------- GET TOP RATED ITEMS ---------------- */
export const getTopRatedItems = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId });
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    const items = await Item.find({
      shop: shop._id,
      "rating.count": { $gt: 3 },
    })
      .sort({ "rating.average": -1 })
      .limit(5);

    return res.status(200).json(items);
  } catch (error) {
    console.error("❌ getTopRatedItems:", error);
    return res.status(500).json({ message: "Failed to fetch top rated items" });
  }
};

/* ---------------- FIX SHOP OWNERS (Utility) ---------------- */
export const fixShopOwners = async (req, res) => {
  try {
    const shops = await Shop.find();
    let updatedCount = 0;

    for (const shop of shops) {
      if (shop.owner) {
        const user = await User.findById(shop.owner);
        if (user && user.role !== "owner") {
          user.role = "owner";
          await user.save();
          updatedCount++;
        }
      }
    }

    return res.status(200).json({
      message: `Checked ${shops.length} shops. Updated ${updatedCount} users to 'owner' role.`,
    });
  } catch (error) {
    console.error("❌ fixShopOwners:", error);
    return res.status(500).json({ message: "Failed to fix shop owners" });
  }
};
