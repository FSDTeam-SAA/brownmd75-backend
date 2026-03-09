// src/modules/payment/payment.interface.ts
import { Types } from 'mongoose';

export interface IPayment {
    user: Types.ObjectId;
    order: Types.ObjectId;
    transactionId: string; // Stripe PaymentIntent ID (pi_...)
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed';
}