import express from "express";
import {
  createEditShop,
  getMyShop,
  getShopByCity,
  getAllShops,
  updateShopStatus,
} from "../controllers/shop.controllers.js";

import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const shopRouter = express.Router();

shopRouter.get("/", getAllShops);
shopRouter.get("/get-all", getAllShops);
shopRouter.get("/get-by-city/:city", getShopByCity);

shopRouter.post(
  "/create-edit",
  isAuth,
  upload.single("image"),
  createEditShop
);

shopRouter.get("/get-my", isAuth, getMyShop);
shopRouter.put("/update-status", isAuth, updateShopStatus);

export default shopRouter;
