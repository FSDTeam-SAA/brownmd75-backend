// src/modules/order/order.model.ts

import { Schema, model } from 'mongoose';
import { IOrder } from './order.interface';

const orderItemSchema = new Schema({
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
    title: { type: String, required: true },
    priceAtBooking: { type: Number, required: true },
    rentalType: { type: String, required: true },
    quantity: { type: Number, required: true },
});

const shippingAddressSchema = new Schema({
    fullName: { type: String, required: true },
    houseNumber: { type: String, required: true },
    streetAddress: { type: String, required: true },
    cityName: { type: String, required: true },
    stateName: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
});

const orderSchema = new Schema<IOrder>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: [orderItemSchema],
        totalAmount: { type: Number, required: true },
        shippingAddress: shippingAddressSchema,
        orderNotes: { type: String },
        paymentMethod: { type: String, enum: ['cod', 'stripe'], required: true },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        orderStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        transactionId: { type: String },
    },
    { timestamps: true }
);

export const Order = model<IOrder>('Order', orderSchema);