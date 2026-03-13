import { Router } from "express";
import analyticsController from "./analytics.controller";

const router = Router();

router.get("/", analyticsController.dashboardAnalytics);
router.get("/chart-revenue", analyticsController.monthlyRevenueChart);

const analyticsRouter = router;
export default analyticsRouter;
