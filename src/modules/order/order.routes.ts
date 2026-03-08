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

export const OrderRouter = router;