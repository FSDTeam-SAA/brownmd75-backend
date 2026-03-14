// src/modules/payment/payment.service.ts
import Stripe from 'stripe';
import config from '../../config';
import mongoose from 'mongoose';
import { Order } from '../order/order.model';
import AppError from '../../errors/AppError';
import { Cart } from '../cart/cart.model';


import { Payment } from './payment.model';
import sendEmail from '../../utils/sendEmail';

const stripe = new Stripe((config.stripe.stripe_secret_key as string), {
    apiVersion: '2024-11-20.acacia' as any,
});

const createPaymentIntent = async (amount: number) => {
    // Stripe expects amount in cents ($10.50 -> 1050)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        payment_method_types: ['card'],
    });

    return {
        clientSecret: paymentIntent.client_secret,
        transactionId: paymentIntent.id,
    };
};

// const verifyPaymentInDB = async (orderId: string, transactionId: string) => {
//     // 1. Verify with Stripe API first
//     const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);

//     if (paymentIntent.status !== 'succeeded') {
//         throw new AppError('Payment has not succeeded yet', 400);
//     }

//     const session = await mongoose.startSession();
//     try {
//         session.startTransaction();

//         // 2. Update Order Status & POPULATE user to get the email
//         const order = await Order.findByIdAndUpdate(
//             orderId,
//             { paymentStatus: 'paid', orderStatus: 'confirmed' },
//             { new: true, session }
//         ).populate('user');

//         if (!order) throw new AppError("Order not found", 404);

//         // 3. Record the Payment
//         await Payment.create([{
//             user: order.user,
//             order: order._id,
//             transactionId: transactionId,
//             amount: paymentIntent.amount / 100,
//             status: 'succeeded'
//         }], { session });

//         // 4. Clear the User's Cart
//         await Cart.findOneAndUpdate(
//             { user: order.user },
//             { items: [], totalPrice: 0 },
//             { session }
//         );

//         await session.commitTransaction();

//         // 5. Send Email (Do this AFTER commit so it doesn't block the DB transaction)
//         const userEmail = (order.user as any)?.email;
//         if (userEmail) {
//             const emailHtml = `
//                 <div style="font-family: sans-serif; padding: 20px;">
//                     <h2>Payment Successful!</h2>
//                     <p>Hi ${(order.user as any)?.name || 'Valued Customer'},</p>
//                     <p>Your payment for Order <strong>#${order._id}</strong> has been received.</p>
//                     <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
//                     <p>Our team is now preparing your equipment for delivery.</p>
//                     <hr />
//                     <p>Thank you for choosing BrownMd!</p>
//                 </div>
//             `;

//             sendEmail({
//                 to: userEmail,
//                 subject: 'Payment Confirmation - BrownMd',
//                 html: emailHtml
//             });
//         }

//         return order;
//     } catch (error) {
//         await session.abortTransaction();
//         throw error;
//     } finally {
//         await session.endSession();
//     }
// };



const verifyPaymentInDB = async (orderId: string, transactionId: string) => {
    // 1. Verify with Stripe API first
    // const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
    
    // if (paymentIntent.status !== 'succeeded') {
    //     throw new AppError('Payment has not succeeded yet', 400);
    // }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // 2. Update Order Status & POPULATE user
        const order = await Order.findByIdAndUpdate(
            orderId,
            { paymentStatus: 'paid', orderStatus: 'confirmed' },
            { new: true, session }
        ).populate('user'); 

        if (!order) throw new AppError("Order not found", 404);

        // 3. Record the Payment 
        // FIX: Use order.totalAmount here because paymentIntent is commented out
        await Payment.create([{
            user: order.user,
            order: order._id,
            transactionId: transactionId,
            amount: order.totalAmount, // Use the DB totalAmount for testing
            status: 'succeeded'
        }], { session });

        // 4. Clear the User's Cart
        await Cart.findOneAndUpdate(
            { user: order.user },
            { items: [], totalPrice: 0 },
            { session }
        );

        await session.commitTransaction();

        // 5. Send Email logic... (rest of your code)
        // ...
        // 5. Send Email (Do this AFTER commit so it doesn't block the DB transaction)
        const userEmail = (order.user as any)?.email;
        if (userEmail) {
            const emailHtml = `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Payment Successful!</h2>
                    <p>Hi ${ (order.user as any)?.name || 'Valued Customer'},</p>
                    <p>Your payment for Order <strong>#${order._id}</strong> has been received.</p>
                    <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
                    <p>Our team is now preparing your equipment for delivery.</p>
                    <hr />
                    <p>Thank you for choosing BrownMd!</p>
                </div>
            `;

            sendEmail({
                to: userEmail,
                subject: 'Payment Confirmation - BrownMd',
                html: emailHtml
            });
        }
        
        return order;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};



const getPaymentHistoryFromDB = async (page: number = 1, limit: number = 10) => {
    // 1. Calculate skip parameter
    const skip = (page - 1) * limit;

    // 2. Fetch paginated orders
    const orders = await Order.find()
        .populate('user', 'name email profileImg')
        .populate('items.equipment', 'title')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

    // 3. Get total count of all orders for meta data
    const total = await Order.countDocuments();

    // 4. Calculate total revenue across ALL "paid" orders (bypass pagination)
    // We execute an aggregation pipeline for efficiency instead of fetching all docs.
    const revenueAggregation = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        totalRevenue,
        payments: orders,
    };
};



const getSinglePaymentHistoryFromDB = async (orderId: string) => {
    const order = await Order.findById(orderId)
        .populate('user', 'name email profileImg')
        .populate('items.equipment', 'title');

    if (!order) {
        throw new AppError('Payment history not found for this ID', 404);
    }

    return order;
};

const deletePaymentHistoryFromDB = async (orderId: string) => {
    // In many business applications, you don't actually delete an order record 
    // just because an admin "deleted it" from the "payment history" view. 
    // However, to satisfy the requirement verbatim, we delete the Order.
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
        throw new AppError('Payment history not found for this ID', 404);
    }
    
    // We should safely clear associated payments if it was a Stripe order
    if (deletedOrder.paymentMethod === 'stripe') {
        await Payment.deleteMany({ order: orderId });
    }

    return deletedOrder;
};

export const PaymentService = {
    createPaymentIntent,
    verifyPaymentInDB,
    getPaymentHistoryFromDB,
    getSinglePaymentHistoryFromDB,
    deletePaymentHistoryFromDB,
};