import { Types } from "mongoose";

export interface IEquipmentImage {
  public_id: string;
  url: string;
}

export interface IEquipment {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  category: Types.ObjectId;
  images: IEquipmentImage[];
  rating: number;
  totalReviews: number;
  price_per_hour?: number;
  price_per_day?: number;
  price_per_week?: number;
  price_per_month?: number;
  deliveryCharge?: number;
  setupCharge?: number;
  quantity: number;
  availableDates?: {
    startDate: Date;
    endDate: Date;
    quantity: number;
  };
  model?: string;
  manufacture_year?: number;
  brand?: string;
  status: "available" | "unavailable";
  createdAt?: Date;
  updatedAt?: Date;
}
