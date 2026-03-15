import { Model, Types } from "mongoose";

// Define the two types of reviews
export type TReviewType = 'equipment' | 'website';

export interface IReview {
    user?: Types.ObjectId;       // The reviewer (Optional for anonymous)
    reviewType?: TReviewType;    // Discriminator
    equipment?: Types.ObjectId;
    order?: Types.ObjectId;

    // Common fields
    rating?: number;             // 1 to 5
    comment?: string;            // The feedback text
    isPublished?: boolean;       // To allow admin to hide inappropriate content
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the static methods for the Model
export interface IReviewModel extends Model<IReview> {
    calculateAverageRating(equipmentId: Types.ObjectId): Promise<void>;
}