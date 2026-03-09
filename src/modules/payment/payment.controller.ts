// src/modules/payment/payment.controller.ts
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { Order } from '../order/order.model';

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
    const { transactionId, orderId } = req.body;

    // In a real ESWE setup, you'd check Stripe API here to confirm the status
    // For now, we update our records
    const order = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus: 'paid' },
        { new: true }
    );

    // Clear the cart now that payment is confirmed
    // await Cart.findOneAndUpdate({ user: order.user }, { items: [], totalPrice: 0 });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payment verified and order finalized',
        data: order,
    });
});

export const PaymentController = {
    verifyPayment,
};