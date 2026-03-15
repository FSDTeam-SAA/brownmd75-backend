import { Schema, model } from 'mongoose';
import { ICart } from './cart.interface';
import Equipment from '../equipment/equipment.model';


const cartSchema = new Schema<ICart>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
        {
            equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
            quantity: { type: Number, required: true, min: 1, default: 1 },
            rentalType: { // Make sure this is camelCase!
                type: String,
                enum: ['price_per_hour', 'price_per_day', 'price_per_week', 'price_per_month'],
                required: true
            },
        },
    ],
    totalPrice: { type: Number, required: true, default: 0 },
}, { timestamps: true });

/**
 * PRE-SAVE HOOK: Automatically calculate totalPrice
 * We use 'save' so it triggers on .create() and .save() calls.
 */
cartSchema.pre('save', async function (next) {
    const cart = this;
    if (!cart.items || cart.items.length === 0) {
        cart.totalPrice = 0;
        return next();
    }

    try {
        const equipmentIds = cart.items.map((item) => item.equipment);

        // Fetch all relevant price fields
        const equipments = await Equipment.find({ _id: { $in: equipmentIds } })
            .select('price_per_hour price_per_day price_per_week price_per_month');

        const total = cart.items.reduce((acc, item) => {
            const equipmentDoc = equipments.find(
                (e: any) => e._id.toString() === item.equipment.toString()
            );

            if (equipmentDoc) {
                // Dynamic Key Access: item.rental_type will be 'price_per_week', etc.
                const unitPrice = (equipmentDoc as any)[item.rentalType] || 0;
                return acc + (unitPrice * item.quantity);
            }
            return acc;
        }, 0);

        cart.totalPrice = Number(total.toFixed(2));
        next();
    } catch (error: any) {
        next(error);
    }
});

export const Cart = model<ICart>('Cart', cartSchema);