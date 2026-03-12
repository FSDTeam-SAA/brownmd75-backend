import { Router } from "express";
import auth from "../../middleware/auth";
import { upload } from "../../middleware/multer.middleware";
import parseFormData from "../../middleware/parseFormData";
import validateRequest from "../../middleware/validateRequest";
import { USER_ROLE } from "../user/user.constant";
import equipmentController from "./equipment.controller";
import { updateEquipmentSchema } from "./equipment.validation";

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

router.get("/all", equipmentController.getAllEquipments);
router.get("/:equipmentId", equipmentController.getSingleEquipment);

// ─── Admin Routes (Protected) ─────────────────────────────────────────────────

router.post(
  "/create",
  upload.array("images", 5),
  //   auth(USER_ROLE.ADMIN),
  //   parseFormData,
  //   validateRequest(createEquipmentSchema),
  equipmentController.createEquipment,
);

router.patch(
  "/:equipmentId",
  upload.single("image"),
  auth(USER_ROLE.ADMIN),
  parseFormData,
  validateRequest(updateEquipmentSchema),
  equipmentController.updateEquipment,
);

router.delete(
  "/:equipmentId",
  auth(USER_ROLE.ADMIN),
  equipmentController.deleteEquipment,
);

router.patch(
  "/:equipmentId/toggle-availability",
  auth(USER_ROLE.ADMIN),
  equipmentController.toggleAvailability,
);

const equipmentRouter = router;
export default equipmentRouter;
