import { Router } from "express";
import auth from "../../middleware/auth";
import { upload } from "../../middleware/multer.middleware";
import { USER_ROLE } from "../user/user.constant";
import equipmentController from "./equipment.controller";

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

router.get("/all", equipmentController.getAllEquipments);
router.get("/:equipmentId", equipmentController.getSingleEquipment);

// ─── Admin Routes (Protected) ─────────────────────────────────────────────────

router.post(
  "/create",
  upload.array("images", 5),
  auth(USER_ROLE.ADMIN),
  equipmentController.createEquipment,
);

router.put(
  "/:equipmentId",
  upload.array("images", 5),
  auth(USER_ROLE.ADMIN),
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
