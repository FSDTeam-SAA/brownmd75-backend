import { Router } from "express";
import auth from "../../middleware/auth";
import { upload } from "../../middleware/multer.middleware";
import { USER_ROLE } from "../user/user.constant";
import categoryController from "./category.controller";

const router = Router();

router.post(
  "/create",
  upload.single("image"),
//   auth(USER_ROLE.ADMIN),
  categoryController.createCategory,
);

router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getSingleCategory);
router.put(
  "/update/:id",
  upload.single("image"),
//   auth(USER_ROLE.ADMIN),
  categoryController.updateCategory,
);

const categoryRouter = router;
export default categoryRouter;
