import { StatusCodes } from "http-status-codes";
import { isValidObjectId } from "mongoose";
import AppError from "../../errors/AppError";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary";
import { Category } from "../category/category.model";
import type { IEquipment } from "./equipment.interface";
import Equipment from "./equipment.model";

const createEquipmentIntoDB = async (
  files: Express.Multer.File[],
  payload: IEquipment,
): Promise<IEquipment> => {
  // 1️⃣ Upload images
  const uploadedImages = [];
  for (const file of files) {
    const uploadResult = await uploadToCloudinary(file.path, "equipments");
    uploadedImages.push({
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    });
  }
  payload.images = uploadedImages;

  // 2️⃣ Ensure availableDates is parsed correctly
  if (payload.availableDates && payload.availableDates.length > 0) {
    payload.availableDates = payload.availableDates.map((date) => ({
      startDate: new Date(date.startDate),
      endDate: new Date(date.endDate),
      quantity: Number(date.quantity) || 0,
    }));

    // Calculate total quantity
    payload.quantity = payload.availableDates.reduce(
      (sum, date) => sum + date.quantity,
      0,
    );
  } else {
    payload.quantity = 0;
  }

  // 3️⃣ Create equipment
  const equipment = await Equipment.create({
    ...payload,
    status: "available",
  });

  return equipment;
};

const getAllEquipmentsFromDB = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  // Title search
  if (query.search) {
    filter.title = { $regex: query.search, $options: "i" };
  }

  // Category filter
  if (query.category) {
    if (!isValidObjectId(query.category)) {
      throw new AppError("Invalid category ID format", StatusCodes.BAD_REQUEST);
    }
    filter.category = query.category;
  }

  // Brand filter
  if (query.brand) {
    filter.brand = { $regex: query.brand, $options: "i" };
  }

  // Manufacture year filter
  if (query.manufacture_year) {
    filter.manufacture_year = Number(query.manufacture_year);
  }

  // Weight filter
  if (query.min_weight || query.max_weight) {
    const weightFilter: Record<string, number> = {};

    if (query.min_weight) weightFilter.$gte = Number(query.min_weight);
    if (query.max_weight) weightFilter.$lte = Number(query.max_weight);

    filter.weight = weightFilter;
  }

  // Price filter
  if (query.min_price || query.max_price) {
    const priceFilter: Record<string, number> = {};

    if (query.min_price) priceFilter.$gte = Number(query.min_price);
    if (query.max_price) priceFilter.$lte = Number(query.max_price);

    filter.price_per_hour = priceFilter;
  }

  // Date range filter
  if (query.startDate && query.endDate) {
    filter.availableDates = {
      $elemMatch: {
        startDate: { $lte: new Date(query.startDate) },
        endDate: { $gte: new Date(query.endDate) },
      },
    };
  }

  const sortField = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const data = await Equipment.find(filter)
    .populate("category", "title image")
    .sort({ [sortField]: sortOrder })
    .skip(skip)
    .limit(limit);

  const total = await Equipment.countDocuments(filter);

  // Analytics
  const totalEquipments = await Equipment.countDocuments();
  const totalAvailableEquipments = await Equipment.countDocuments({
    status: "available",
  });

  const totalCategories = await Category.countDocuments();

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    analytics: {
      totalEquipments,
      totalAvailableEquipments,
      totalCategories,
    },
  };
};

const getSingleEquipmentFromDB = async (id: string): Promise<IEquipment> => {
  if (!isValidObjectId(id)) {
    throw new AppError("Invalid equipment ID format", StatusCodes.BAD_REQUEST);
  }

  const equipment = await Equipment.findById(id).populate(
    "category",
    "title image",
  );

  if (!equipment) {
    throw new AppError(
      `Equipment not found with id: ${id}`,
      StatusCodes.NOT_FOUND,
    );
  }

  return equipment;
};

const updateEquipmentIntoDB = async (
  id: string,
  files: Express.Multer.File[] | undefined,
  payload: Partial<IEquipment>,
): Promise<IEquipment> => {
  const equipment = await Equipment.findById(id);

  if (!equipment) {
    throw new AppError("Equipment not found", StatusCodes.NOT_FOUND);
  }

  // Upload new images
  if (files && files.length > 0) {
    const uploadedImages = [];

    for (const file of files) {
      const result = await uploadToCloudinary(file.path, "equipments");

      uploadedImages.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    // Delete old images
    if (equipment.images?.length) {
      for (const image of equipment.images) {
        if (image.public_id) {
          await deleteFromCloudinary(image.public_id);
        }
      }
    }

    payload.images = uploadedImages as any;
  }

  // Parse availableDates if string
  if (payload.availableDates && typeof payload.availableDates === "string") {
    payload.availableDates = JSON.parse(payload.availableDates);
  }

  // Only recalculate quantity if availableDates updated
  if (payload.availableDates && payload.availableDates.length > 0) {
    payload.availableDates = payload.availableDates.map((date) => ({
      startDate: new Date(date.startDate),
      endDate: new Date(date.endDate),
      quantity: Number(date.quantity) || 0,
    }));

    payload.quantity = payload.availableDates.reduce(
      (sum, date) => sum + date.quantity,
      0,
    );
  }

  const updatedEquipment = await Equipment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedEquipment as IEquipment;
};

const deleteEquipmentFromDB = async (id: string): Promise<void> => {
  if (!isValidObjectId(id)) {
    throw new AppError("Invalid equipment ID format", StatusCodes.BAD_REQUEST);
  }

  const equipment = await Equipment.findById(id);

  if (!equipment) {
    throw new AppError(`Equipment not found`, StatusCodes.NOT_FOUND);
  }

  // Delete images from Cloudinary
  if (equipment.images && equipment.images.length > 0) {
    for (const image of equipment.images) {
      if (image.public_id) {
        await deleteFromCloudinary(image.public_id);
      }
    }
  }

  await Equipment.findByIdAndDelete(id);
};

const toggleAvailabilityFromDB = async (id: string): Promise<IEquipment> => {
  if (!isValidObjectId(id)) {
    throw new AppError("Invalid equipment ID format", StatusCodes.BAD_REQUEST);
  }

  // 1. Fetch current state
  const equipment = await Equipment.findById(id).select("is_available");

  if (!equipment) {
    throw new AppError(
      `Equipment not found with id: ${id}`,
      StatusCodes.NOT_FOUND,
    );
  }

  // 2. Perform atomic update with the flipped value
  const updatedEquipment = await Equipment.findByIdAndUpdate(
    id,
    { $set: { status: !equipment.status } },
    { new: true, runValidators: true },
  );

  if (!updatedEquipment) {
    throw new AppError(
      "Failed to toggle status",
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  return updatedEquipment;
};

const equipmentService = {
  createEquipmentIntoDB,
  getAllEquipmentsFromDB,
  getSingleEquipmentFromDB,
  updateEquipmentIntoDB,
  deleteEquipmentFromDB,
  toggleAvailabilityFromDB,
};

export default equipmentService;
