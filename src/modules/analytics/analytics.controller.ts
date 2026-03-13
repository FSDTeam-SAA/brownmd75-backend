import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AnalyticsService from "./analytics.service";

const dashboardAnalytics = catchAsync(async (req, res) => {
  const result = await AnalyticsService.dashboardAnalytics();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Dashboard analytics fetched successfully",
    data: result,
  });
});

const monthlyRevenueChart = catchAsync(async (req, res) => {
  const result = await AnalyticsService.monthlyRevenueChart(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Revenue chart fetched successfully",
    data: result,
  });
});

const mostOrderedEquipment = catchAsync(async (req, res) => {
  const result = await AnalyticsService.mostOrderedEquipment(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Most ordered equipment fetched successfully",
    data: result,
  });
});

const analyticsController = {
  dashboardAnalytics,
  monthlyRevenueChart,
  mostOrderedEquipment,
};

export default analyticsController;
