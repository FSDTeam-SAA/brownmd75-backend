// src/modules/payment/payment.routes.ts
import { Router } from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';

const router = Router();

// Admin: Get Payment History
router.get(
    '/history',
    auth(USER_ROLE.ADMIN),
    PaymentController.getPaymentHistory
);

// Admin: Get Single Payment History
router.get(
    '/history/:orderId',
    auth(USER_ROLE.ADMIN),
    PaymentController.getSinglePaymentHistory
);

// Admin: Delete Payment History
router.delete(
    '/history/:orderId',
    auth(USER_ROLE.ADMIN),
    PaymentController.deletePaymentHistory
);

// We keep verify-payment here if needed, or in order.routes.ts
// The prompt asked for GET /history route with Admin middleware.

export const PaymentRouter = router;
