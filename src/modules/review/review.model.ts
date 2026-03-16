import { Schema, Types, model } from "mongoose";
import Equipment from "../equipment/equipment.model";
import { IReview, IReviewModel } from "./review.interface";

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewType: {
      type: String,
      enum: ["equipment", "website"],
      required: true,
    },
    // Optional: Only used if reviewType is 'equipment'
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Minimum rating is 1"],
      max: [5, "Maximum rating is 5"], // This stops the 5+ star trick
    },
    comment: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate reviews: One user, one order, one equipment = One Review
reviewSchema.index({ user: 1, equipment: 1, order: 1 }, { unique: true });

// --- THE AGGREGATION LOGIC ---

reviewSchema.statics.calculateAverageRating = async function (
  equipmentId: Types.ObjectId,
) {
  const stats = await this.aggregate([
    {
      $match: {
        equipment: equipmentId,
        isPublished: true, // CRITICAL: Only count visible reviews
      },
    },
    {
      $group: {
        _id: "$equipment",
        numberOfReviews: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Equipment.findByIdAndUpdate(equipmentId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].numberOfReviews,
    });
  } else {
    // If Admin hides ALL reviews, reset the score
    await Equipment.findByIdAndUpdate(equipmentId, {
      rating: 0,
      totalReviews: 0,
    });
  }
};

// Call calculateAverageRating after every save
reviewSchema.post("save", function () {
  if (this.reviewType === "equipment" && this.equipment) {
    (this.constructor as any).calculateAverageRating(this.equipment);
  }
});

export const Review = model<IReview, IReviewModel>("Review", reviewSchema);
