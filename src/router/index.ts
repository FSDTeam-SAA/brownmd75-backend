import { Router } from "express";
import authRouter from "../modules/auth/auth.router";
import categoryRouter from "../modules/category/category.router";
import contactRouter from "../modules/contact/contact.router";
import userRouter from "../modules/user/user.router";
import equipmentRouter from "../modules/equipment/equipment.routes";
import { cartRouter } from "../modules/cart/cart.routes";
import { OrderRouter } from "../modules/order/order.routes";

const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRouter,
  },
  {
    path: "/auth",
    route: authRouter,
  },
  {
    path: "/contact",
    route: contactRouter,
  },
  {
    path: "/category",
    route: categoryRouter,
  },
  {
    path: "/equipments",
    route: equipmentRouter,
  },
  {
    path: "/cart",
    route: cartRouter,
  },
  {
    path: "/order",
    route: OrderRouter,
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
