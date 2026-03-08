import { Router } from 'express';
import auth from '../../middleware/auth';
import { CartController } from './cart.controller';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middleware/validateRequest';
import { cartValidations } from './cart.validation';

const router = Router();

// All cart routes require authentication
router.get('/get-cart',
    auth(USER_ROLE.USER),
    CartController.getMyCart);

router.post('/add-to-cart',
    auth(USER_ROLE.USER),
    validateRequest(cartValidations.addToCartValidationSchema),
    CartController.addToCart);

router.patch('/update-cart-item',
    auth(USER_ROLE.USER),
    validateRequest(cartValidations.updateCartItemValidationSchema),
    CartController.updateCartItem);

// Clear the entire cart
router.delete('/clear-cart', 
    auth(USER_ROLE.USER), 
    CartController.clearCart
);

// Remove a specific item
router.delete('/:equipmentId/:rentalType', 
    auth(USER_ROLE.USER), 
    CartController.removeItem
);

export const cartRouter = router;
