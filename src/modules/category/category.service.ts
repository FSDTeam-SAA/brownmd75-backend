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

const categoryService = {
  createCategory,
};

export default categoryService;
