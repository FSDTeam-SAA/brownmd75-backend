import { z } from 'zod';

const addToCartValidationSchema = z.object({
    body: z.object({
        equipmentId: z.string().min(1, 'Equipment ID is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
        rentalType: z.enum(['price_per_hour', 'price_per_day', 'price_per_week', 'price_per_month'], {
            required_error: 'Rental type is required',
            invalid_type_error: 'Invalid rental type',
        }),
    }),
});

const updateCartItemValidationSchema = z.object({
    body: z.object({
        equipmentId: z.string().min(1, 'Equipment ID is required'),
        rentalType: z.enum(['price_per_hour', 'price_per_day', 'price_per_week', 'price_per_month'], {
            required_error: 'Current rental type is required',
        }),
        quantity: z.number().int().min(0).optional(), 
        newRentalType: z.enum(['price_per_hour', 'price_per_day', 'price_per_week', 'price_per_month']).optional(),
    }).refine((data) => data.quantity !== undefined || data.newRentalType !== undefined, {
        message: "At least one of 'quantity' or 'newRentalType' must be provided",
    }),
});

export const cartValidations = {
    addToCartValidationSchema,
    updateCartItemValidationSchema,
};
