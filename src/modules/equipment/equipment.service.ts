import { isValidObjectId } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { Equipment } from './equipment.model';
import { Category } from '../category/category.model';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';
import type { IEquipment } from './equipment.interface';
import type {
    CreateEquipmentBody,
    UpdateEquipmentBody,
    ListEquipmentQuery,
} from './equipment.validation';


// ─── Create ───────────────────────────────────────────────────────────────────

const createEquipmentIntoDB = async (
    payload: CreateEquipmentBody,
    file: Express.Multer.File | undefined
): Promise<IEquipment> => {

    // Remove after fix
    console.log('payload.category:', payload.category);
    console.log('type:', typeof payload.category);
    console.log('isValid:', isValidObjectId(payload.category));


    // 1. Image is required
    if (!file) {
        throw new AppError('Equipment image is required', StatusCodes.BAD_REQUEST);
    }

    // 2. Validate category ID format
    if (!isValidObjectId(payload.category)) {
        throw new AppError('Invalid category ID format', StatusCodes.BAD_REQUEST);
    }

    // 3. Check category exists
    const category = await Category.findById(payload.category);
    if (!category) {
        throw new AppError(
            `Category not found with id: ${payload.category}`,
            StatusCodes.NOT_FOUND
        );
    }

    // 4. Check duplicate title under same category
    const existing = await Equipment.findOne({
        title: { $regex: new RegExp(`^${payload.title}$`, 'i') },
        category: payload.category,
    });

    if (existing) {
        throw new AppError(
            `Equipment "${payload.title}" already exists in this category`,
            StatusCodes.CONFLICT
        );
    }

    // 5. Upload image to Cloudinary
    const uploadResult = await uploadToCloudinary(file.path, 'equipment');

    const image = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
    };

    // 6. Create equipment — spread payload + image separately
    const result = await Equipment.create({ ...payload, image });
    return result;
};


// ─── Get All ──────────────────────────────────────────────────────────────────

const getAllEquipmentsFromDB = async (query: ListEquipmentQuery) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, unknown> = {};

    if (query.search) {
        filter['title'] = { $regex: query.search, $options: 'i' };
    }

    if (query.category) {
        if (!isValidObjectId(query.category)) {
            throw new AppError('Invalid category ID format', StatusCodes.BAD_REQUEST);
        }
        filter['category'] = query.category;
    }

    if (query.brand) {
        filter['brand'] = { $regex: query.brand, $options: 'i' };
    }

    if (query.is_available !== undefined) {
        filter['is_available'] = query.is_available;
    }

    if (query.min_price !== undefined || query.max_price !== undefined) {
        const priceFilter: Record<string, number> = {};
        if (query.min_price !== undefined) priceFilter['$gte'] = query.min_price;
        if (query.max_price !== undefined) priceFilter['$lte'] = query.max_price;
        filter['price_per_hour'] = priceFilter;
    }

    // Build sort
    const sortField = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const data = await Equipment.find(filter)
        .populate('category', 'title image')
        .sort(sort)
        .skip(skip)
        .limit(limit);

    const total = await Equipment.countDocuments(filter);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        data,
    };
};

// ─── Get Single ───────────────────────────────────────────────────────────────

const getSingleEquipmentFromDB = async (id: string): Promise<IEquipment> => {
    if (!isValidObjectId(id)) {
        throw new AppError('Invalid equipment ID format', StatusCodes.BAD_REQUEST);
    }

    const equipment = await Equipment.findById(id).populate('category', 'title image');

    if (!equipment) {
        throw new AppError(
            `Equipment not found with id: ${id}`,
            StatusCodes.NOT_FOUND
        );
    }

    return equipment;
};

// ─── Update ───────────────────────────────────────────────────────────────────

const updateEquipmentIntoDB = async (
    id: string,
    payload: UpdateEquipmentBody,
    file: Express.Multer.File | undefined
): Promise<IEquipment> => {
    // 1. Validate ID
    if (!isValidObjectId(id)) {
        throw new AppError('Invalid equipment ID format', StatusCodes.BAD_REQUEST);
    }

    // 2. Check equipment exists
    const equipment = await Equipment.findById(id);
    if (!equipment) {
        throw new AppError(
            `Equipment not found with id: ${id}`,
            StatusCodes.NOT_FOUND
        );
    }

    // 3. Validate new category if provided
    if (payload.category !== undefined) {
        if (!isValidObjectId(payload.category)) {
            throw new AppError('Invalid category ID format', StatusCodes.BAD_REQUEST);
        }
        const category = await Category.findById(payload.category);
        if (!category) {
            throw new AppError(
                `Category not found with id: ${payload.category}`,
                StatusCodes.NOT_FOUND
            );
        }
    }

    // 4. Check duplicate title if title is being changed
    if (payload.title !== undefined) {
        const categoryToCheck = payload.category ?? equipment.category.toString();

        const duplicate = await Equipment.findOne({
            _id: { $ne: id },
            title: { $regex: new RegExp(`^${payload.title}$`, 'i') },
            category: categoryToCheck,
        });

        if (duplicate) {
            throw new AppError(
                `Equipment "${payload.title}" already exists in this category`,
                StatusCodes.CONFLICT
            );
        }
    }

    // 5. Handle image replacement — keep image separate from payload
    let image: { public_id: string; url: string } | undefined;

    if (file) {
        // Delete old image from Cloudinary
        if (equipment.image?.public_id) {
            await deleteFromCloudinary(equipment.image.public_id);
        }

        // Upload new image
        const uploadResult = await uploadToCloudinary(file.path, 'equipment');
        image = {
            public_id: uploadResult.public_id,
            url: uploadResult.secure_url,
        };
    }

    // 6. Update — spread payload + image separately
    const updated = await Equipment.findByIdAndUpdate(
        id,
        {
            ...payload,
            ...(image !== undefined && { image }),
        },
        { new: true, runValidators: true }
    ).populate('category', 'title image');

    if (!updated) {
        throw new AppError('Failed to update equipment', StatusCodes.INTERNAL_SERVER_ERROR);
    }

    return updated;
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteEquipmentFromDB = async (id: string): Promise<void> => {
    if (!isValidObjectId(id)) {
        throw new AppError('Invalid equipment ID format', StatusCodes.BAD_REQUEST);
    }

    const equipment = await Equipment.findById(id);

    if (!equipment) {
        throw new AppError(
            `Equipment not found with id: ${id}`,
            StatusCodes.NOT_FOUND
        );
    }

    // Delete image from Cloudinary
    if (equipment.image?.public_id) {
        await deleteFromCloudinary(equipment.image.public_id);
    }

    await Equipment.findByIdAndDelete(id);
};

// ─── Toggle Availability ──────────────────────────────────────────────────────

// const toggleAvailabilityFromDB = async (id: string): Promise<IEquipment> => {
//     if (!isValidObjectId(id)) {
//         throw new AppError('Invalid equipment ID format', StatusCodes.BAD_REQUEST);
//     }

//     const equipment = await Equipment.findById(id);

//     if (!equipment) {
//         throw new AppError(
//             `Equipment not found with id: ${id}`,
//             StatusCodes.NOT_FOUND
//         );
//     }

//     equipment.is_available = !equipment.is_available;
//     await equipment.save();

//     return equipment;
// };

// ─── Toggle Availability (Optimized) ──────────────────────────────────────────

const toggleAvailabilityFromDB = async (id: string): Promise<IEquipment> => {
    if (!isValidObjectId(id)) {
        throw new AppError('Invalid equipment ID format', StatusCodes.BAD_REQUEST);
    }

    // 1. Fetch current state
    const equipment = await Equipment.findById(id).select('is_available');

    if (!equipment) {
        throw new AppError(
            `Equipment not found with id: ${id}`,
            StatusCodes.NOT_FOUND
        );
    }

    // 2. Perform atomic update with the flipped value
    const updatedEquipment = await Equipment.findByIdAndUpdate(
        id,
        { $set: { is_available: !equipment.is_available } },
        { new: true, runValidators: true }
    );

    if (!updatedEquipment) {
        throw new AppError('Failed to toggle status', StatusCodes.INTERNAL_SERVER_ERROR);
    }

    return updatedEquipment;
};

// ─── Export ───────────────────────────────────────────────────────────────────

const equipmentService = {
    createEquipmentIntoDB,
    getAllEquipmentsFromDB,
    getSingleEquipmentFromDB,
    updateEquipmentIntoDB,
    deleteEquipmentFromDB,
    toggleAvailabilityFromDB,
};

export default equipmentService;