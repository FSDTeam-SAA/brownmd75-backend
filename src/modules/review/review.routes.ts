import express from 'express';
import { USER_ROLE } from '../user/user.constant';
import { ReviewController } from './review.controller';
import auth from '../../middleware/auth';

const router = express.Router();

router.post(
  '/create-review',
  auth(USER_ROLE.USER), // Reviewing is a User action
  ReviewController.createReview
  /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'Review details',
        required: true,
        schema: { $ref: '#/definitions/CreateReview' }
     }
  */
);

router.get(
  '/get-all-reviews', 
  ReviewController.getAllReviews // Publicly accessible
);

router.patch(
  '/toggle-publish/:reviewId',
  auth(USER_ROLE.ADMIN), // Only Admin can moderate
  ReviewController.toggleReviewPublishStatus
);

router.delete(
  '/delete-review/:reviewId',
  auth(USER_ROLE.ADMIN), // Only Admin can delete
  ReviewController.deleteReview
);

router.get(
  '/top-rated',
  ReviewController.getTopRatedEquipment
);

router.get(
  '/website-stats',
  ReviewController.getWebsiteRatingStats
);


export const ReviewRouter = router;