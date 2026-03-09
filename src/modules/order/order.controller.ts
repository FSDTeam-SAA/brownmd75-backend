// src/modules/order/order.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import { OrderService } from './order.service';
import sendResponse from '../../utils/sendResponse';

const createOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await OrderService.createOrderIntoDB(userId, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Order placed successfully',
        data: result,
    });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user._id;
  const result = await OrderService.getMyOrdersFromDB(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Orders retrieved successfully',
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.getAllOrdersFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'All orders retrieved successfully',
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const result = await OrderService.updateOrderStatusInDB(orderId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Order updated successfully',
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const { orderId, transactionId } = req.body;

  // We depend on PaymentService to verify Stripe and clear cart
  const { PaymentService } = await import('../payment/payment.service');
  const result = await PaymentService.verifyPaymentInDB(orderId, transactionId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Payment verified successfully and cart cleared',
    data: result,
  });
});

/**
 * Controller to handle order cancellation for both COD and Stripe
 */
const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params; // The Order ID from the URL: /cancel/:id
  const userId = req.user._id; // Extracted by your auth() middleware

  const result = await OrderService.cancelOrderFromDB(orderId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order cancelled and inventory updated successfully",
    data: result,
  });
});


/**
 * Admin only: Process a refund for a paid order (Stripe or COD)
 */
const refundOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params; // The Order ID from the URL /refund/:id

  const result = await OrderService.refundOrderFromDB(orderId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Refund processed and inventory restored successfully",
    data: result,
  });
});

/**
 * User only: Submit a formal request for a refund
 */
const requestRefund = catchAsync(async (req, res) => {
  const { orderId } = req.params; // Order ID
  const { reason } = req.body; // Why they want a refund
  const userId = req.user._id; // From your auth middleware

  const result = await OrderService.requestRefundFromDB(orderId, userId, reason);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Refund request submitted successfully. Admin will review it shortly.",
    data: result,
  });
});

export const OrderController = {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    verifyPayment,
    cancelOrder,
    refundOrder,
    requestRefund
    
};