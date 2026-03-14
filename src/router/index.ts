import { Router } from "express";
import analyticsRouter from "../modules/analytics/analytics.router";
import authRouter from "../modules/auth/auth.router";
import { cartRouter } from "../modules/cart/cart.routes";
import categoryRouter from "../modules/category/category.router";
import contactRouter from "../modules/contact/contact.router";
import equipmentRouter from "../modules/equipment/equipment.routes";
import { OrderRouter } from "../modules/order/order.routes";
import { ReviewRouter } from "../modules/review/review.routes";
import userRouter from "../modules/user/user.router";

import { PaymentRouter } from "../modules/payment/payment.routes";

const router = Router();

router.use("/user", userRouter);
router.use("/auth", authRouter);
router.use("/contact", contactRouter);
router.use("/category", categoryRouter);
router.use("/equipments", equipmentRouter);
router.use("/cart", cartRouter);
router.use("/order", OrderRouter);
router.use("/review", ReviewRouter);
router.use("/analytics", analyticsRouter);
router.use("/payment", PaymentRouter);

export default router;
