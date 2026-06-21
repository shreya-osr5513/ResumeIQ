import Candidate from "../models/candidate.js";
import Evaluation from "../models/evaluation.js";
import Role from "../models/role.js";

import { evaluateAnswers } from "../services/evaluationService.js";
import { applyBiasGuard } from "../services/biasGuardService.js";
import { calculateScore } from "../services/scoringService.js";
import { createAuditLog } from "../services/auditService.js";
import { buildKnowledgeReport } from "../services/reportService.js";
import { compareCandidates } from "../services/candidateComparisonService.js";
import { evaluateInterview } from "../services/interviewEvaluationService.js";

// ─── Register Candidate (Step 3.5: Personal Info Form) ───────────────────────
export const registerCandidate = async (req, res) => {
  try {
    const { name, email, phone, linkedin, role, atsScore, atsDecision } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, error: "Name, email, and role are required." });
    }

    const anonId = "CAND-" + Date.now();

    const candidate = await Candidate.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      linkedin: linkedin?.trim() || "",
      role,
      anonId,
      atsScore: atsScore ?? null,
      atsDecision: atsDecision ?? null,
      resumeText: req.body.resumeText || "",
      resumeEmbedding: req.body.resumeEmbedding || [],
      jobEmbedding: req.body.jobEmbedding || [],
      semanticScore: req.body.semanticScore || 0,
      skillGap: req.body.skillGap || { matchedSkills: [], missingSkills: [], recommendations: [] },
      answers: [],
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Candidate registered successfully",
      candidateId: candidate._id,
      anonId: candidate.anonId,
    });
  } catch (error) {
    console.error("🔥 Register Candidate Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Submit Interview Answers ─────────────────────────────────────────────────
export const submitAnswer = async (req, res) => {
  try {
    const { role, qa, candidateId } = req.body;

    if (!role || !qa || !Array.isArray(qa) || qa.length === 0) {
      return res.status(400).json({
        message: "Invalid input: role and QA required",
      });
    }

    const hasEmptyAnswers = qa.some((item) => !item.answer || item.answer.trim() === "" || item.answer.trim().toLowerCase() === "no answer provided.");
    if (hasEmptyAnswers) {
      return res.status(400).json({
        message: "All interview questions must be answered before submission.",
      });
    }

    const answers = qa.map((item) => item.answer);

    // Reuse existing candidate record if candidateId provided (from registration step)
    let candidate;
    if (candidateId) {
      candidate = await Candidate.findByIdAndUpdate(
        candidateId,
        { answers, status: "Evaluated" },
        { new: true }
      );
    }
    if (!candidate) {
      const anonId = "CAND-" + Date.now();
      candidate = await Candidate.create({ role, answers, anonId });
    }

    const aiEvaluation = (await evaluateAnswers(role, qa)) || {};

    const unbiasedEval = applyBiasGuard(aiEvaluation, answers);

    const finalScore = calculateScore(unbiasedEval);

    const evaluation = await Evaluation.create({
      candidateId: candidate._id,
      ...unbiasedEval,
      finalScore,
      semanticScore: candidate.semanticScore || 0,
      matchedSkills: candidate.skillGap?.matchedSkills || [],
      missingSkills: candidate.skillGap?.missingSkills || [],
      recommendations: candidate.skillGap?.recommendations || [],
    });

    // Synchronize InterviewEvaluation for Dashboard Analytics
    try {
      const questionsList = qa.map((q) => q.question);
      const answersList = qa.map((q) => q.answer);
      await evaluateInterview(candidate._id, questionsList, answersList);
    } catch (ieError) {
      console.error("🔥 Sync InterviewEvaluation failed:", ieError.message);
    }

    await createAuditLog({
      candidateId: candidate._id,
      rawAnswers: qa,
      aiRaw: JSON.stringify(aiEvaluation),
      finalEvaluation: evaluation,
    });

    const report = buildKnowledgeReport(evaluation);

    res.status(200).json({
      message: "Knowledge evaluation complete",
      report,
    });

  } catch (error) {
    console.error("🔥 ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─── Get All Candidates ───────────────────────────────────────────────────────
export const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: candidates.length, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Compare Candidates ───────────────────────────────────────────────────────
export const compareCandidatesController = async (req, res) => {
  try {
    const { candidateIds, roleTitle } = req.body;
    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length < 2) {
      return res.status(400).json({ message: "Exactly two candidate IDs are required for comparison." });
    }

    const candidates = await Candidate.find({ _id: { $in: candidateIds.slice(0, 2) } });
    if (candidates.length < 2) {
      return res.status(404).json({ 
        message: `Could not find both candidates. Found ${candidates.length} of 2. Ensure both IDs are valid.`
      });
    }

    const roleDoc = await Role.findOne({ title: roleTitle });
    const roleDescription = roleDoc?.description || roleTitle || "General Software Engineer";

    const result = await compareCandidates(candidates[0], candidates[1], roleDescription);

    // Ensure lists are arrays (defensive)
    result.reasoning = Array.isArray(result.reasoning) ? result.reasoning : [result.reasoning || "N/A"];
    result.risks = Array.isArray(result.risks) ? result.risks : [result.risks || "N/A"];

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Evaluate Interview ───────────────────────────────────────────────────────
export const evaluateInterviewController = async (req, res) => {
  try {
    const { candidateId, questions, answers } = req.body;
    if (!candidateId || !questions || !answers) {
      return res.status(400).json({ message: "Candidate ID, questions, and answers are required" });
    }

    const evaluation = await evaluateInterview(candidateId, questions, answers);
    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};