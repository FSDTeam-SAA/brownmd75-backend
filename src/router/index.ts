import { Router } from "express";
import authRouter from "../modules/auth/auth.router";
import categoryRouter from "../modules/category/category.router";
import contactRouter from "../modules/contact/contact.router";
import userRouter from "../modules/user/user.router";
import equipmentRouter from "../modules/equipment/equipment.routes";
import { cartRouter } from "../modules/cart/cart.routes";
import { OrderRouter } from "../modules/order/order.routes";
import { ReviewRouter } from "../modules/review/review.routes";

const router = Router();

router.use("/user", userRouter);
router.use("/auth", authRouter);
router.use("/contact", contactRouter);
router.use("/category", categoryRouter);
router.use("/equipments", equipmentRouter);
router.use("/cart", cartRouter);
router.use("/order", OrderRouter);
router.use("/review", ReviewRouter);

export default router;
