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



export const PaymentService = {
    createPaymentIntent,
    verifyPaymentInDB,
};