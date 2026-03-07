import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import categoryService from "./category.service";

const createCategory = catchAsync(async (req, res) => {
  const file = req.file;
  const result = await categoryService.createCategory(req.body, file);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await categoryService.getAllCategories(
    Number(page),
    Number(limit),
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Categories retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

const categoryController = {
  createCategory,
  getAllCategories,
};

export default categoryController;
