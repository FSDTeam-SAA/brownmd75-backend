// src/modules/order/order.service.ts

import mongoose, { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Cart } from '../cart/cart.model';
import { Order } from './order.model';
import { IOrder } from './order.interface';
import { IEquipment } from '../equipment/equipment.interface';

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
        // We explicitly type the map return to match the IOrder['items'] definition
        const orderItems = cart.items.map((item) => {
            const equipment = item.equipment as unknown as IEquipment;

            // Map rentalType to the actual price field in Equipment
            const priceAtBooking = (equipment as any)[item.rentalType];

            if (priceAtBooking === undefined) {
                throw new AppError(`Price not found for ${item.rentalType}`, StatusCodes.INTERNAL_SERVER_ERROR);
            }

            return {
                equipment: new Types.ObjectId(equipment._id), // Explicitly cast to ObjectId
                title: equipment.title,
                priceAtBooking: Number(priceAtBooking),
                rentalType: item.rentalType as string,
                quantity: item.quantity,
            };
        });

        // 3. Construct the Order data
        const orderData = {
            user: new Types.ObjectId(userId),
            items: orderItems,
            totalAmount: cart.totalPrice,
            shippingAddress: payload.shippingAddress,
            orderNotes: payload.orderNotes,
            paymentMethod: payload.paymentMethod,
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
};

/**
 * Get all orders in the system (Admin only)
 */
const getAllOrdersFromDB = async () => {
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

export const OrderService = {
    createOrderIntoDB,
    getMyOrdersFromDB,
    getAllOrdersFromDB,
    updateOrderStatusInDB,
};