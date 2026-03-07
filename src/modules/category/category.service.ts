import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary";
import { ICategory } from "./category.interface";
import { Category } from "./category.model";

const createCategory = async (payload: ICategory, file: any) => {
  if (!file) {
    throw new Error("Image is required");
  }

  const uploadResult = await uploadToCloudinary(file.path, "categories");
  payload.image = {
    public_id: uploadResult.public_id,
    url: uploadResult.secure_url,
  };
  const result = await Category.create(payload);
  return result;
};

//! there some thing add in future when product is added each category total product will be added,
const getAllCategories = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const data = await Category.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Category.countDocuments();

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

const getSingleCategory = async (id: string) => {
  const result = await Category.findById(id);
  return result;
};

const updateCategory = async (
  id: string,
  payload: Partial<ICategory>,
  file?: any,
) => {
  const isCategoryExist = await Category.findById(id);

  if (!isCategoryExist) {
    throw new Error("Category not found");
  }

  if (file) {
    // Upload new image
    const uploadResult = await uploadToCloudinary(file.path, "categories");

    payload.image = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };

    // Delete old image
    if (isCategoryExist.image?.public_id) {
      await deleteFromCloudinary(isCategoryExist.image.public_id);
    }
  }

  const result = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const categoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
};

export default categoryService;
