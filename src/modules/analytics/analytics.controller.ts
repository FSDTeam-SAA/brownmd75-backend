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

const analyticsController = {
  dashboardAnalytics,
};

export default analyticsController;
