import { model, Schema } from 'mongoose';
import { IEquipment } from './equipment.interface';

const equipmentSchema = new Schema<IEquipment>(
    {
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            public_id: { type: String },
            url: { type: String },
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },

        // Pricing
        price_per_hour: { type: Number, required: true },
        price_per_day: { type: Number, required: true },
        price_per_week: { type: Number, required: true },
        price_per_month: { type: Number, required: true },

        // Tax
        total_taxes: { type: Number, required: true, default: 0 },

        // Specifications
        maximum_reach: { type: String, required: true },
        operating_weight: { type: String, required: true },
        model: { type: String, required: true },
        manufacture_year: { type: Number, required: true },
        brand: { type: String, required: true },
        rated_power: { type: String, required: true },

        deliveryCharge: { type: String, required: true },
        setupCharge: { type: String, required: true },

        // Status
        is_available: { type: Boolean, default: true },
    },
    { timestamps: true, versionKey: false }
);

export const Equipment = model<IEquipment>('Equipment', equipmentSchema);