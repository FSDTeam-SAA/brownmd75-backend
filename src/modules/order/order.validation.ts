// src/modules/order/order.validation.ts
import { z } from 'zod';

const createOrderValidationSchema = z.object({
    body: z.object({
        shippingAddress: z.object({
            fullName: z.string().min(1, 'Full name is required'),
            houseNumber: z.string().min(1, 'House number is required'),
            streetAddress: z.string().min(1, 'Street address is required'),
            cityName: z.string().min(1, 'City name is required'),
            stateName: z.string().min(1, 'State name is required'),
            zipCode: z.string().min(1, 'Zip code is required'),
            phone: z.string().min(1, 'Phone number is required'),
            email: z.string().email('Invalid email address'),
        }),
        orderNotes: z.string().optional(),
        paymentMethod: z.enum(['cod', 'stripe'], {
            required_error: 'Payment method is required',
        }),
    }),
});

export const OrderValidations = {
    createOrderValidationSchema,
};