import { z } from 'zod';

export const createEquipmentSchema = z.object({
    body: z.object({
        category: z.string().min(1, 'Category is required'),

        title: z.string().min(1, 'Title is required').trim(),

        rating: z.coerce.number().min(0).max(5).default(0).optional(),

        // Pricing
        price_per_hour: z.coerce.number().positive('Price per hour must be positive'),
        price_per_day: z.coerce.number().positive('Price per day must be positive'),
        price_per_week: z.coerce.number().positive('Price per week must be positive'),
        price_per_month: z.coerce.number().positive('Price per month must be positive'),

        // Tax
        total_taxes: z.coerce.number().min(0, 'Total taxes must be 0 or more').default(0),

        // Specifications
        maximum_reach: z.string().min(1, 'Maximum reach is required'),
        operating_weight: z.string().min(1, 'Operating weight is required'),
        model: z.string().min(1, 'Model is required'),
        manufacture_year: z.coerce
            .number()
            .int()
            .min(1900, 'Invalid year')
            .max(new Date().getFullYear(), 'Year cannot be in the future'),
        brand: z.string().min(1, 'Brand is required'),
        rated_power: z.string().min(1, 'Rated power is required'),

        // Status
        is_available: z.coerce.boolean().default(true).optional(),
    }),
});

export const updateEquipmentSchema = z.object({
    body: z.object({
        category: z.string().min(1).optional(),
        title: z.string().min(1).trim().optional(),
        rating: z.coerce.number().min(0).max(5).optional(),

        // Pricing
        price_per_hour: z.coerce.number().positive().optional(),
        price_per_day: z.coerce.number().positive().optional(),
        price_per_week: z.coerce.number().positive().optional(),
        price_per_month: z.coerce.number().positive().optional(),

        // Tax
        total_taxes: z.coerce.number().min(0).optional(),

        // Specifications
        maximum_reach: z.string().min(1).optional(),
        operating_weight: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
        manufacture_year: z.coerce
            .number()
            .int()
            .min(1900)
            .max(new Date().getFullYear())
            .optional(),
        brand: z.string().min(1).optional(),
        rated_power: z.string().min(1).optional(),

        // Status
        is_available: z.coerce.boolean().optional(),
    }),
    params: z.object({
        equipmentId: z.string().min(1, 'Equipment ID is required'),
    }),
});

export const getEquipmentSchema = z.object({
    params: z.object({
        equipmentId: z.string().min(1, 'Equipment ID is required'),
    }),
});

export const listEquipmentSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
        search: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        is_available: z.coerce.boolean().optional(),
        min_price: z.coerce.number().positive().optional(),
        max_price: z.coerce.number().positive().optional(),
        sortBy: z
            .enum(['price_per_hour', 'price_per_day', 'rating', 'createdAt'])
            .optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

export type CreateEquipmentBody = z.infer<typeof createEquipmentSchema>['body'];
export type UpdateEquipmentBody = z.infer<typeof updateEquipmentSchema>['body'];
export type ListEquipmentQuery = z.infer<typeof listEquipmentSchema>['query'];