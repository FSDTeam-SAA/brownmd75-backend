import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { ReviewService } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await ReviewService.createReviewInDB(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Review submitted successfully!',
        data: result,
    });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    const result = await ReviewService.getAllReviewsFromDB(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reviews fetched successfully',
        data: result,
    });
});

const toggleReviewPublishStatus = catchAsync(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const result = await ReviewService.toggleReviewPublishStatusFromDB(reviewId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review status toggled successfully',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const result = await ReviewService.deleteReviewFromDB(reviewId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

const getTopRatedEquipment = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getTopRatedEquipmentFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Top rated equipment fetched successfully',
    data: result,
  });
});

const getWebsiteRatingStats = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getWebsiteRatingStatsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Website rating stats fetched successfully',
    data: result,
  });
});

export const ReviewController = {
    createReview,
    getAllReviews,
    toggleReviewPublishStatus,
    deleteReview,
    getTopRatedEquipment,
    getWebsiteRatingStats
};