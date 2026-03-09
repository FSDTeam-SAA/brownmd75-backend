// src/modules/payment/payment.model.ts
import { Schema, model } from 'mongoose';
import { IPayment } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        transactionId: { type: String, required: true, unique: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'usd' },
        status: {
            type: String,
            enum: ['pending', 'succeeded', 'failed'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);