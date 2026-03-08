import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { Cart } from './cart.model';
import { TRentalType } from './cart.interface';
import { Equipment } from '../equipment/equipment.model';
import { Types } from 'mongoose';

/**
 * Add or Increment an Item in the Cart.
 * - Validates equipment exists and is available.
 * - Finds or lazily initialises the cart.
 * - Increments quantity when the same equipment + rentalType combo already exists.
 * - Pushes a new line item otherwise.
 * - Pre-save hook calculates totalPrice from live Equipment prices (zero-trust).
 */
const addToCartIntoDB = async (
    userId: string,
    payload: { equipmentId: string; quantity: number; rentalType: TRentalType }
) => {
    const { equipmentId, quantity, rentalType } = payload;

    // 1. Validate equipment
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
        throw new AppError('Equipment not found', StatusCodes.NOT_FOUND);
    }
    if (!equipment.is_available) {
        throw new AppError('Equipment is currently not available', StatusCodes.BAD_REQUEST);
    }

    // 2. Find or lazily initialise cart (never eagerly persisted until an item is added)
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
        cart = new Cart({
            user: new Types.ObjectId(userId),
            items: [],
            totalPrice: 0,
        });
    }

    // 3. Check for existing line item: same equipment + same rentalType = increment
    const existingItem = cart.items.find(
        (item) =>
            item.equipment.toString() === equipmentId &&
            item.rentalType === rentalType
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            equipment: new Types.ObjectId(equipmentId) as any,
            quantity,
            rentalType,
        });
    }

    // 4. Save triggers the pre-save hook which recalculates totalPrice server-side
    await cart.save();

    // 5. Return populated cart
    return Cart.findById(cart._id).populate('items.equipment');
};

/**
 * Directly set the quantity for a specific line item.
 * Treating quantity ≤ 0 as a remove command.
 */
const updateCartItemInDB = async (
    userId: string,
    equipmentId: string,
    rentalType: TRentalType,
    payload: { quantity?: number; newRentalType?: TRentalType }
) => {
    const { quantity, newRentalType } = payload;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new AppError('Cart not found', StatusCodes.NOT_FOUND);

    // 1. Identify the line item using a safe comparison
    const itemIndex = cart.items.findIndex((i) => {
        const itemEqId = (i.equipment as any)._id
            ? (i.equipment as any)._id.toString()
            : i.equipment.toString();

        return itemEqId === equipmentId && i.rentalType === rentalType;
    });

    if (itemIndex === -1) {
        throw new AppError('Item not found in your cart.', StatusCodes.NOT_FOUND);
    }

    const currentItem = cart.items[itemIndex];

    // 2. Apply Quantity Update (or removal if <= 0)
    if (quantity !== undefined) {
        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
            await cart.save();
            return await Cart.findById(cart._id).populate('items.equipment');
        }
        currentItem.quantity = quantity;
    }

    // 3. Apply Rental Type Change & Handle Merging
    if (newRentalType && newRentalType !== rentalType) {
        const duplicateIndex = cart.items.findIndex((i) => {
            const itemEqId = (i.equipment as any)._id
                ? (i.equipment as any)._id.toString()
                : i.equipment.toString();
            return itemEqId === equipmentId && i.rentalType === newRentalType;
        });

        if (duplicateIndex > -1) {
            cart.items[duplicateIndex].quantity += currentItem.quantity;
            cart.items.splice(itemIndex, 1);
        } else {
            currentItem.rentalType = newRentalType;
        }
    }

    await cart.save(); // Triggers the Pre-Save Hook for totalPrice
    return await Cart.findById(cart._id).populate('items.equipment');
};

/**
 * Remove a specific line item from the cart.
 * Uses $pull with an ObjectId cast to ensure MongoDB matches correctly.
 * After removal, triggers the pre-save hook to recalculate totalPrice.
 */
/**
 * Remove a specific line item
 */
const removeItemFromCart = async (userId: string, equipmentId: string, rentalType: TRentalType) => {
    // 1. Atomically pull the item
    const updatedCart = await Cart.findOneAndUpdate(
        { user: userId },
        { $pull: { items: { equipment: new Types.ObjectId(equipmentId), rentalType } } },
        { new: true }
    );

    if (!updatedCart) throw new AppError('Cart not found', StatusCodes.NOT_FOUND);

    // 2. Save triggers the pre-save hook to recalculate totalPrice
    await updatedCart.save(); 
    return updatedCart.populate('items.equipment');
};

/**
 * Clear the entire cart
 */
const clearCartFromDB = async (userId: string) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new AppError('Cart not found', StatusCodes.NOT_FOUND);

    cart.items = [];
    cart.totalPrice = 0;
    
    await cart.save();
    return cart;
};



/**
 * Get the current user's cart, fully populated.
 * If no cart document exists yet, returns a lightweight empty structure
 * WITHOUT creating a DB document (lazy initialisation).
 */
const getMyCartFromDB = async (userId: string) => {
    const cart = await Cart.findOne({ user: userId }).populate('items.equipment');

    // Return empty structure — do NOT persist until an item is actually added
    if (!cart) {
        return { user: userId, items: [], totalPrice: 0 };
    }

    return cart;
};

export const CartService = {
    addToCartIntoDB,
    updateCartItemInDB,
    removeItemFromCart,
    getMyCartFromDB,
    clearCartFromDB
};
