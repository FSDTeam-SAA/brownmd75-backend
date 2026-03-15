import { IReview } from './review.interface';
import { Review } from './review.model';
import { Order } from '../order/order.model';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import Equipment from '../equipment/equipment.model';

/**
 * Verified Review Service
 */
const createReviewInDB = async (userId: string, payload: Partial<IReview>) => {
    const { reviewType, equipment, order } = payload;

    // --- LOGIC 1: EQUIPMENT REVIEW VERIFICATION ---
    if (reviewType === 'equipment') {
        if (!equipment || !order) {
            throw new AppError(
                "Equipment ID and Order ID are required for equipment reviews.",
                httpStatus.BAD_REQUEST
            );
        }

        // Verified Purchase Check
        const verifiedOrder = await Order.findOne({
            _id: order,
            user: userId,
            orderStatus: { $in: ['delivered', 'completed'] },
            'items.equipment': equipment,
        });

        if (!verifiedOrder) {
            throw new AppError(
                "Verification failed. You can only review equipment you have received and used.",
                httpStatus.FORBIDDEN
            );
        }
    }

    // --- FINAL STEP: CREATE ---
    // We use ...payload here, so rating and comment are passed safely to the DB
    const result = await Review.create({
        user: userId,
        ...payload,
    });

    return result;
};


const getAllReviewsFromDB = async (query: Record<string, unknown>) => {
  // 1. Filtering Logic
  const queryObj = { ...query };
  const excludeFields = ['page', 'limit', 'sort', 'fields'];
  excludeFields.forEach((el) => delete queryObj[el]);

  // 2. Pagination Logic
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // 3. Sorting Logic
  const sort = (query.sort as string) || '-createdAt';

  // 4. Field Selection Logic
  const fields = (query.fields as string)?.split(',').join(' ') || '-__v';

  // Execute Query
  const result = await Review.find(queryObj)
    .populate('user', 'fullName image')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select(fields);

  // 5. Meta Data for Frontend
  const totalData = await Review.countDocuments(queryObj);
  const totalPage = Math.ceil(totalData / limit);

  return {
    meta: {
      page,
      limit,
      totalData,
      totalPage,
    },
    result,
  };
};

const toggleReviewPublishStatusFromDB = async (reviewId: string) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError("Review not found", httpStatus.NOT_FOUND);

  // Flip the status
  review.isPublished = !review.isPublished;
  await review.save();

  // IMPORTANT: If status changed, we MUST re-calculate the equipment rating
  if (review.reviewType === 'equipment' && review.equipment) {
    await (Review as any).calculateAverageRating(review.equipment);
  }

  return review;
};

const deleteReviewFromDB = async (reviewId: string) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError("Review not found", httpStatus.NOT_FOUND);

  const equipmentId = review.equipment;
  const type = review.reviewType;

  await Review.findByIdAndDelete(reviewId);

  // Re-sync equipment stats after deletion
  if (type === 'equipment' && equipmentId) {
    await (Review as any).calculateAverageRating(equipmentId);
  }

  return null;
};

const getTopRatedEquipmentFromDB = async () => {
  return await Equipment.find({ is_available: true })
    .sort({ rating: -1, totalReviews: -1 }) // Sort by highest stars, then most reviews
    .limit(4); // Get top 4 for the homepage
};

/**
 * Calculate the overall Website Rating and Total Feedback count
 */
const getWebsiteRatingStatsFromDB = async () => {
  const stats = await Review.aggregate([
    { 
      $match: { 
        reviewType: 'website', 
        isPublished: true 
      } 
    },
    {
      $group: {
        _id: null, // We want a global average, so no specific ID grouping
        averageRating: { $avg: '$rating' },
        totalFeedback: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        averageRating: { $round: ['$averageRating', 1] }, // Round to 4.5, 4.8, etc.
        totalFeedback: 1
      }
    }
  ]);

  // Return default values if no reviews exist yet
  return stats.length > 0 ? stats[0] : { averageRating: 0, totalFeedback: 0 };
};

export const ReviewService = {
    createReviewInDB,
    getAllReviewsFromDB,
    toggleReviewPublishStatusFromDB,
    deleteReviewFromDB,
    getTopRatedEquipmentFromDB,
    getWebsiteRatingStatsFromDB
};