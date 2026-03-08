import { Types } from 'mongoose';

export type TRentalType = 'price_per_hour' | 'price_per_day' | 'price_per_week' | 'price_per_month';

export interface ICartItem {
    equipment: Types.ObjectId; // Reference to Equipment model
    quantity: number;
    rentalType: TRentalType;
}

export interface ICart {
    user: Types.ObjectId; // Reference to User model
    items: ICartItem[];
    totalPrice: number;
}