import { Router } from "express";
import analyticsController from "./analytics.controller";

const router = Router();

router.get("/", analyticsController.dashboardAnalytics);
router.get("/chart-revenue", analyticsController.monthlyRevenueChart);
router.get("/chart-equipment", analyticsController.mostOrderedEquipment);

const analyticsRouter = router;
export default analyticsRouter;
