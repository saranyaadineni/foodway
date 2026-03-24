import User from "../models/user.model.js";
import DeliveryAssignment from "../models/deliveryassignment.model.js";


export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};


export const updateUserLocation = async (req, res) => {
  try {
    const { lat, lon } = req.body;


    if (
      typeof lat !== "number" ||
      typeof lon !== "number" ||
      lat < -90 || lat > 90 ||
      lon < -180 || lon > 180
    ) {
      return res.status(400).json({ message: "Invalid latitude or longitude" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        location: {
          type: "Point",
          coordinates: [lon, lat],
        },
        locationUpdatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("updateUserLocation error:", error);
    return res.status(500).json({ message: "Failed to update location" });
  }
};


export const updateActiveStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

   
    if (user.role === "deliveryBoy" && isActive) {
      const busy = await DeliveryAssignment.findOne({
        assignedTo: user._id,
        status: { $nin: ["brodcasted", "completed"] },
      });

      if (!busy) {
        const assignments = await DeliveryAssignment.find({
          status: "brodcasted",
        })
          .populate("order")
          .populate("shop");

        const io = req.app.get("io");

        for (const a of assignments) {
          if (!a.brodcastedTo.includes(user._id)) {
            a.brodcastedTo.push(user._id);
            await a.save();
          }

          if (io && user.socketId) {
            const shopOrder = a.order.shopOrders.find(so =>
              so._id.equals(a.shopOrderId)
            );

            io.to(user.socketId).emit("newAssignment", {
              sentTo: user._id,
              assignmentId: a._id,
              orderId: a.order._id,
              shopName: a.shop.name,
              deliveryAddress: a.order.deliveryAddress,
              items: shopOrder?.shopOrderItems || [],
              subtotal: shopOrder?.subtotal,
              receiptNumber: shopOrder?.receipt?.receiptNumber || null,
            });
          }
        }
      }
    }

    return res.status(200).json({
      message: "Active status updated successfully",
      user,
    });
  } catch (error) {
    console.error("updateActiveStatus error:", error);
    return res.status(500).json({ message: "Failed to update active status" });
  }
};
