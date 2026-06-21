import express from "express";
import {
  getDashboardStats,
  getAllCandidates,
  getCandidateById,
  deleteCandidateById,
  deleteAllCandidates,
  getRecruiterIntelligence,
  getCandidatesByRole
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", getDashboardStats);
router.get("/recruiter-intelligence", getRecruiterIntelligence);
router.get("/candidates", getAllCandidates);
router.get("/candidates/by-role", getCandidatesByRole);
router.get("/candidate/:id", getCandidateById);

// Deletion routes
router.delete("/candidates", deleteAllCandidates);
router.delete("/candidate/:id", deleteCandidateById);

export default router;