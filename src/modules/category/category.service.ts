import { uploadToCloudinary } from "../../utils/cloudinary";
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

const categoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
};

export default categoryService;
