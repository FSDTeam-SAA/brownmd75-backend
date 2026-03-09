// src/modules/order/order.service.ts

import mongoose, { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Cart } from '../cart/cart.model';
import { Order } from './order.model';
import { IOrder } from './order.interface';
import { IEquipment } from '../equipment/equipment.interface';
import { PaymentService } from '../payment/payment.service';
import { Equipment } from '../equipment/equipment.model';
import Stripe from 'stripe';
import config from '../../config';

// Initialize stripe instance
const stripe = new Stripe((config.stripe.stripe_secret_key as string), {
    apiVersion: '2024-11-20.acacia' as any,
});

const createOrderIntoDB = async (userId: string, payload: Partial<IOrder>) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1. Get current Cart and populate Equipment
        const cart = await Cart.findOne({ user: userId }).populate('items.equipment').session(session);

        if (!cart || cart.items.length === 0) {
            throw new AppError('Cannot checkout an empty cart', StatusCodes.BAD_REQUEST);
        }

        // 2. Prepare Order Items (Snapshotting)
        const orderItems = cart.items.map((item) => {
            const equipment = item.equipment as unknown as IEquipment;
        // We explicitly type the map return to match the IOrder['items'] definition
        const orderItems = cart.items.map((item) => {
            const equipment = item.equipment as unknown as IEquipment;

            // Map rentalType to the actual price field in Equipment
            const priceAtBooking = (equipment as any)[item.rentalType];

            if (priceAtBooking === undefined) {
                throw new AppError(`Price not found for ${item.rentalType}`, StatusCodes.INTERNAL_SERVER_ERROR);
            }

            return {
                equipment: new Types.ObjectId(equipment._id),
                equipment: new Types.ObjectId(equipment._id), // Explicitly cast to ObjectId
                title: equipment.title,
                priceAtBooking: Number(priceAtBooking),
                rentalType: item.rentalType as string,
                quantity: item.quantity,
            };
        });

        // 3. Prepare Order Object
        const orderData: any = {
        // 3. Construct the Order data
        const orderData = {
            user: new Types.ObjectId(userId),
            items: orderItems,
            totalAmount: cart.totalPrice,
            shippingAddress: payload.shippingAddress,
            orderNotes: payload.orderNotes,
            paymentMethod: payload.paymentMethod,
            paymentStatus: 'pending',
            orderStatus: 'pending',
        };

        let clientSecret = null;

        // 4. Handle Stripe Payment Intent (Branching Logic)
        if (payload.paymentMethod === 'stripe') {
            const paymentIntent = await PaymentService.createPaymentIntent(cart.totalPrice);
            orderData.transactionId = paymentIntent.transactionId; // Store the Stripe ID (pi_...)
            clientSecret = paymentIntent.clientSecret; // Send this to frontend
        }

        // 5. Create the Order in DB
        const [newOrder] = await Order.create([orderData], { session });

        // 6. Post-order logic
        if (payload.paymentMethod === 'cod') {
            // For COD, clear cart immediately
            paymentStatus: 'pending' as const,
            orderStatus: 'pending' as const,
        };

        // 4. Create the Order
        // Using [orderData] because .create with a session expects an array
        const [newOrder] = await Order.create([orderData], { session });

        // 5. Atomic Cart Cleanup (For COD)
        if (payload.paymentMethod === 'cod') {
            await Cart.findOneAndUpdate(
                { user: userId },
                { items: [], totalPrice: 0 },
                { session, new: true }
            );
        }
        // Note: For Stripe, we DON'T clear the cart here. 
        // We clear it in the 'verifyPayment' service after the user pays.

        await session.commitTransaction();

        // Return BOTH the order and the secret (if any)
        return {
            order: newOrder,
            clientSecret,
        };

        await session.commitTransaction();
        return newOrder;
    } catch (error: any) {
        await session.abortTransaction();
        throw new AppError(error.message, error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
    } finally {
        await session.endSession();
    }
};

/**
 * Get all orders for the logged-in user
 */
const getMyOrdersFromDB = async (userId: string) => {
    return await Order.find({ user: userId })
        .populate('items.equipment')
        .sort('-createdAt'); // Latest orders first
  return await Order.find({ user: userId })
    .populate('items.equipment')
    .sort('-createdAt'); // Latest orders first
};

/**
 * Get all orders in the system (Admin only)
 */
const getAllOrdersFromDB = async () => {
    return await Order.find()
        .populate('user', 'name email phone') // Only get necessary user details
        .populate('items.equipment')
        .sort('-createdAt');
  return await Order.find()
    .populate('user', 'name email phone') // Only get necessary user details
    .populate('items.equipment')
    .sort('-createdAt');
};

/**
 * Update Order or Payment Status (Admin only)
 */
const updateOrderStatusInDB = async (orderId: string, payload: Partial<IOrder>) => {
    const order = await Order.findByIdAndUpdate(
        orderId,
        payload,
        { new: true, runValidators: true }
    );

    if (!order) {
        throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }
    return order;
};


const cancelOrderFromDB = async (orderId: string, userId: string) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1. Fetch Order with session
        const order = await Order.findOne({ _id: orderId, user: userId }).session(session);
        if (!order) {
            throw new AppError("Order not found or you don't have permission to cancel it", 404);
        }

        // 2. STRIPE GUARDRAIL: If they already paid, they can't cancel via this API
        if (order.paymentMethod === 'stripe' && order.paymentStatus === 'paid') {
            throw new AppError("This order is already paid. Please contact support for a refund.", 400);
        }

        // 3. LOGISTICS GUARDRAIL: Block cancellation if it's already being handled by Admin
        // For COD, this is the most important check.
        const nonCancellableStatuses = ['shipped', 'delivered', 'completed', 'cancelled'];
        if (nonCancellableStatuses.includes(order.orderStatus)) {
            throw new AppError(`Cannot cancel order because it is already ${order.orderStatus}.`, 400);
        }

        // 4. Update Order Status
        order.orderStatus = 'cancelled';
        // If it was a Stripe order that timed out, we also ensure paymentStatus is marked appropriately
        if (order.paymentMethod === 'stripe' && order.paymentStatus === 'pending') {
            order.paymentStatus = 'failed'; // Or 'cancelled' if your enum supports it
        }

        await order.save({ session });

        // 5. INVENTORY RECOVERY: Return the items to the "Available" pool
        // We loop through the items array in the order
        for (const item of order.items) {
            await Equipment.findByIdAndUpdate(
                item.equipment,
                { $inc: { availableQuantity: item.quantity } }, // Incrementing back the stock
                { session, new: true }
            );
        }

        // Commit all changes together
        await session.commitTransaction();
        return order;

    } catch (error) {
        // If anything fails (DB error, stock update error), undo everything
        await session.abortTransaction();
        throw error;
    } finally {
        // Always close the session
        await session.endSession();
    }
};






const refundOrderFromDB = async (orderId: string) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const order = await Order.findById(orderId).session(session);
        if (!order) throw new AppError("Order not found", 404);

        if (order.paymentStatus !== 'paid') {
            throw new AppError("Only paid orders can be refunded.", 400);
        }

        // --- STRIPE REFUND LOGIC START ---
        if (order.paymentMethod === 'stripe' && order.transactionId) {
            try {
                await stripe.refunds.create({
                    payment_intent: order.transactionId,
                });
            } catch (stripeError: any) {
                // ADD THE BLOCK HERE:
                if (stripeError.message.includes("does not have a successful charge")) {
                    throw new AppError(
                        "This payment was never completed by the user, so no money was taken to refund.",
                        400
                    );
                }
                // General Stripe error handler
                throw new AppError(`Stripe Refund Error: ${stripeError.message}`, 400);
            }

            console.log(`[Stripe] Refund processed for: ${order.transactionId}`);
        }
        // --- STRIPE REFUND LOGIC END ---

        // UPDATE BOTH STATUSES HERE
        order.paymentStatus = 'refunded';
        order.orderStatus = 'cancelled';
        order.refundRequestStatus = 'approved'; // Mark the request as completed!

        await order.save({ session });

        // Inventory recovery logic...
        for (const item of order.items) {
            await Equipment.findByIdAndUpdate(
                item.equipment,
                { $inc: { availableQuantity: item.quantity } },
                { session }
            );
        }

        await session.commitTransaction();
        return order;
    } catch (error: any) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
};

const requestRefundFromDB = async (orderId: string, userId: string, reason: string) => {
    // 1. Find the order and ensure it belongs to the user
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
        throw new AppError("Order not found", 404);
    }

    // 2. Guardrail: Can't request refund for unpaid orders
    if (order.paymentStatus !== 'paid') {
        throw new AppError("You can only request a refund for paid orders.", 400);
    }

    // 3. Guardrail: Prevent multiple requests
    if (order.refundRequestStatus === 'pending') {
        throw new AppError("A refund request is already pending for this order.", 400);
    }

    if (order.refundRequestStatus === 'approved') {
        throw new AppError("This order has already been refunded.", 400);
    }

    // 4. Update the order with the request details
    order.refundRequestStatus = 'pending';
    order.refundReason = reason;

    await order.save();
    return order;
};



  const order = await Order.findByIdAndUpdate(
    orderId,
    payload,
    { new: true, runValidators: true }
  );

  if (!order) {
    throw new AppError('Order not found', StatusCodes.NOT_FOUND);
  }
  return order;
};

export const OrderService = {
    createOrderIntoDB,
    getMyOrdersFromDB,
    getAllOrdersFromDB,
    updateOrderStatusInDB,
    cancelOrderFromDB,
    refundOrderFromDB,
    requestRefundFromDB
};