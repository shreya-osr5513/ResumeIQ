import express from "express";
import { getRoles, createRole, deleteRole, deleteRoleById, deleteAllRoles } from "../controllers/roleController.js";

const router = express.Router();

router.route("/")
  .get(getRoles)
  .post(createRole)
  .delete(deleteAllRoles);

// Delete by MongoDB _id (used by frontend)
router.route("/id/:id")
  .delete(deleteRoleById);

// Delete by title (legacy)
router.route("/:title")
  .delete(deleteRole);

export default router;
