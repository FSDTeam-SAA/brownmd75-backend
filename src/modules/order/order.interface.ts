// src/modules/order/order.interface.ts

import { Types } from "mongoose";

export type TPaymentMethod = 'cod' | 'stripe';
export type TOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type TPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type TRefundStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface IOrder {
  user: Types.ObjectId;
  items: {
    equipment: Types.ObjectId;
    title: string;          // Snapshot
    priceAtBooking: number; // Snapshot
    rentalType: string;
    quantity: number;
  }[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    houseNumber: string;
    streetAddress: string;
    cityName: string;
    stateName: string;
    zipCode: string;
    phone: string;
    email: string;
  };
  orderNotes?: string;
  paymentMethod: TPaymentMethod;
  paymentStatus: TPaymentStatus;
  orderStatus: TOrderStatus;
  transactionId?: string; // For Stripe
  refundRequestStatus: TRefundStatus; 
  refundReason?: string;
}