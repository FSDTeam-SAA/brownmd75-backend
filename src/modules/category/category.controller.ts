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

const getSingleCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await categoryService.getSingleCategory(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category retrieved successfully.",
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  const result = await categoryService.updateCategory(id, req.body, file);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category updated successfully.",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await categoryService.deleteCategory(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category deleted successfully.",
    data: result,
  });
});

const categoryController = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,   
};

export default categoryController;
