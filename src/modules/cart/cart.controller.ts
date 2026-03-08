// src/modules/cart/cart.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import { CartService } from './cart.service';
import sendResponse from '../../utils/sendResponse'; 
import { TRentalType } from './cart.interface';

const addToCart = catchAsync(async (req: Request, res: Response) => {
    // Extract userId from auth middleware (req.user)
    const userId = req.user._id;
    const payload = req.body;

    const result = await CartService.addToCartIntoDB(userId, payload);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Item added to cart successfully',
        data: result,
    });
});

const getMyCart = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;

    const result = await CartService.getMyCartFromDB(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Cart retrieved successfully',
        data: result || { items: [], totalPrice: 0 }, // Return empty cart if none exists
    });
});

const updateCartItem = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { equipmentId, rentalType, quantity, newRentalType } = req.body;

    const result = await CartService.updateCartItemInDB(
        userId,
        equipmentId,
        rentalType,
        {
            quantity, // Passing quantity from body to the service payload
            newRentalType
        }
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Cart updated successfully',
        data: result,
    });
});


const removeItem = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { equipmentId, rentalType } = req.params;

    const result = await CartService.removeItemFromCart(userId, equipmentId, rentalType as TRentalType);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Item removed from cart',
        data: result,
    });
});

const clearCart = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await CartService.clearCartFromDB(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Cart cleared successfully',
        data: result,
    });
});

export const CartController = {
    addToCart,
    getMyCart,
    updateCartItem,
    removeItem,
    clearCart,
};