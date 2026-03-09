// src/modules/order/order.routes.ts
import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import { OrderController } from './order.controller';
import { OrderValidations } from './order.validation';

const router = Router();


// User Creating Order
router.post(
    '/create-order',
    auth(USER_ROLE.USER),
    validateRequest(OrderValidations.createOrderValidationSchema),
    OrderController.createOrder
);

// Get User's own orders
router.get('/my-orders', auth(USER_ROLE.USER), OrderController.getMyOrders);

// Admin: Get all orders
router.get('/all', auth(USER_ROLE.ADMIN), OrderController.getAllOrders);

// Admin: Update Status
router.patch('/:orderId', auth(USER_ROLE.ADMIN), OrderController.updateOrderStatus);

// NEW: Verification route for Stripe
router.post(
    '/verify-payment',
    auth(USER_ROLE.USER),
    OrderController.verifyPayment // We'll create this controller method next
);

// User must be logged in to cancel their own order
router.patch(
    '/cancel/:orderId',
    auth(USER_ROLE.USER),
    OrderController.cancelOrder
);

// Only Admins should have access to the refund button
router.patch(
    '/refund/:orderId',
    auth(USER_ROLE.ADMIN),
    OrderController.refundOrder
);

// User applies for a refund
router.patch(
  '/request-refund/:orderId',
  auth(USER_ROLE.USER),
  OrderController.requestRefund // This is the controller we just planned
);

export const OrderRouter = router;