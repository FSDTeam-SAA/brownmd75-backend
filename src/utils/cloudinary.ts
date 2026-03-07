// src/utils/cloudinary.ts
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs/promises";
import config from "../config";
import logger from "../logger";

interface ICloudinaryResponse {
  public_id: string;
  secure_url: string;
}

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

const silentUnlink = async (path: string): Promise<void> => {
  try {
    await fs.unlink(path);
  } catch (err) {
    logger.warn(`Cleanup skipped: File ${path} not found or already removed.`);
  }
};

export const deleteFromCloudinary = async (public_id: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(public_id);
    logger.info(`Deleted image with public_id: ${public_id} from Cloudinary`);
  } catch (error: any) {
    logger.error(
      {
        msg: error.message,
        http_code: error.http_code,
        name: error.name,
      },
      "Cloudinary Deletion Error"
    );
    throw new Error(`Cloudinary Deletion Failed: ${error.message || "Unknown Error"}`);
  }
};

export const uploadToCloudinary = async (
  filePath: string,
  folder: string
): Promise<ICloudinaryResponse> => {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    await silentUnlink(filePath);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };
  } catch (error: any) {
    // FIX: Swapped arguments. Pino syntax: logger.error(object, message)
    logger.error(
      {
        msg: error.message,
        http_code: error.http_code,
        name: error.name,
      },
      "Cloudinary SDK Error"
    );

    await silentUnlink(filePath);

    throw new Error(`Cloudinary Upload Failed: ${error.message || "Unknown Error"}`);
  }
};