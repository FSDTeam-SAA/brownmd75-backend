import { model, Schema } from "mongoose";
import { ICategory } from "./category.interface";

const categoryModel = new Schema<ICategory>(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export const Category = model<ICategory>("Category", categoryModel);
