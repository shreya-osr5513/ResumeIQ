import express from "express";
import { 
  submitAnswer, 
  registerCandidate, 
  getCandidates, 
  compareCandidatesController, 
  evaluateInterviewController 
} from "../controllers/candidateController.js";

const router = express.Router();

router.get("/candidates", getCandidates);
router.post("/candidates/register", registerCandidate);
router.post("/candidates/compare", compareCandidatesController);
router.post("/candidates/evaluate-interview", evaluateInterviewController);
router.post("/submitAnswer", submitAnswer);

export default router;