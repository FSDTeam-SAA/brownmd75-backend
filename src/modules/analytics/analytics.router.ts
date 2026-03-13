import { Router } from "express";
import analyticsController from "./analytics.controller";

const router = Router();

router.get("/", analyticsController.dashboardAnalytics);

const analyticsRouter = router;
export default analyticsRouter;
