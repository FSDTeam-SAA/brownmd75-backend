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

export const OrderController = {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
};