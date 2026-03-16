import { model, Schema } from "mongoose";
import { IEquipment } from "./equipment.interface";

const EquipmentSchema = new Schema<IEquipment>(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    images: [
      {
        public_id: { type: String },
        url: { type: String },
      },
    ],
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    price_per_hour: { type: Number },
    price_per_day: { type: Number },
    price_per_week: { type: Number },
    price_per_month: { type: Number },
    deliveryCharge: { type: Number },
    setupCharge: { type: Number },
    // quantity: { type: Number },
    availableDates: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      quantity: { type: Number, required: true },
    },
    model: { type: String },
    manufacture_year: { type: Number },
    brand: { type: String },
    status: {
      type: String,
      enum: ["available", "maintenance", "inactive"],
      default: "available",
    },
  },
  { timestamps: true },
);

const Equipment = model<IEquipment>("Equipment", EquipmentSchema);
export default Equipment;
