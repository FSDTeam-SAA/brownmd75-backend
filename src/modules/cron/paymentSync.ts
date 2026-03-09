// src/cron/paymentSync.ts
import cron from 'node-cron';
import { Order } from '../order/order.model';
import { PaymentService } from '../payment/payment.service';


const syncStripePayments = () => {
    // Runs every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
        console.log('[Cron] Checking for pending Stripe payments...');

        try {
            // 1. Find orders that are pending and have a transactionId
            const pendingOrders = await Order.find({
                paymentMethod: 'stripe',
                paymentStatus: 'pending',
                transactionId: { $exists: true },
                // Only check orders created in the last 24 hours
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            for (const order of pendingOrders) {
                try {
                    // 2. Reuse your existing verification logic
                    // It already checks Stripe API and updates DB/Cart
                    await PaymentService.verifyPaymentInDB(
                        order._id.toString(),
                        order.transactionId as string
                    );
                    console.log(`[Cron] Successfully verified Order: ${order._id}`);
                } catch (error: any) {
                    // We expect "Payment has not succeeded yet" if they haven't paid
                    // so we just log and move to the next order.
                    console.log(`[Cron] Order ${order._id} still pending or error: ${error.message}`);
                }
            }
        } catch (err) {
            console.error('[Cron Error] Global sync failed:', err);
        }
    });
};

export default syncStripePayments;