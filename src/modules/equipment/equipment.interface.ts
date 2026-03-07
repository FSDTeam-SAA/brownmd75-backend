import { Types } from "mongoose";

export interface IEquipmentImage {
    public_id: string;
    url: string;
}

export interface IEquipment {
    _id?: string;
    category: Types.ObjectId; // ref: Category

    // Basic Info
    title: string;
    image: IEquipmentImage;
    rating: number;

    // Pricing
    price_per_hour: number;
    price_per_day: number;
    price_per_week: number;
    price_per_month: number;

    // Tax
    total_taxes: number;

    // Specifications
    maximum_reach: string;        // e.g. "7 Meter"
    operating_weight: string;     // e.g. "4lt/Minute"
    model: string;                // e.g. "Mid51351"
    manufacture_year: number;     // e.g. 2022
    brand: string;                // e.g. "Caterpiller"
    rated_power: string;          // e.g. "4kw/Hour"

    // Status
    is_available: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}