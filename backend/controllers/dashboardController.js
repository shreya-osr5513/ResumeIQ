import Evaluation from "../models/evaluation.js";
import Candidate from "../models/candidate.js";
import InterviewEvaluation from "../models/InterviewEvaluation.js";
import Role from "../models/role.js";

export const getDashboardStats = async (req, res) => {
  try {
    const total = await Candidate.countDocuments();
    const evaluated = await Candidate.countDocuments({ status: "Evaluated" });
    
    const semanticStats = await Candidate.aggregate([
      { $group: { _id: null, avgSemantic: { $avg: "$semanticScore" } } }
    ]);

    const topSkills = await Candidate.aggregate([
      { $unwind: "$skillGap.matchedSkills" },
      { $group: { _id: "$skillGap.matchedSkills", count: { $count: {} } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const missingSkills = await Candidate.aggregate([
      { $unwind: "$skillGap.missingSkills" },
      { $group: { _id: "$skillGap.missingSkills", count: { $count: {} } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      totalCandidates: total,
      evaluatedCandidates: evaluated,
      avgSemanticScore: semanticStats[0]?.avgSemantic || 0,
      topSkills,
      missingSkills,
    });
  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
};

export const getRecruiterIntelligence = async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    
    // 1. Applications over time: support both daily and monthly grouping automatically
    const oldestCandidate = await Candidate.findOne().sort({ createdAt: 1 }).select("createdAt").lean();
    const newestCandidate = await Candidate.findOne().sort({ createdAt: -1 }).select("createdAt").lean();
    
    let groupByFormat = "%Y-%m-%d"; // default is daily
    if (oldestCandidate && newestCandidate) {
      const diffTime = Math.abs(newestCandidate.createdAt - oldestCandidate.createdAt);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        groupByFormat = "%Y-%m"; // group monthly
      }
    }

    const applicationsOverTime = await Candidate.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } }
    ]);

    // Fetch related evaluation maps to perform cross-document evaluation for leaderboard & decisions
    const candidates = await Candidate.find().lean();
    const evaluations = await Evaluation.find().lean();
    const interviewEvaluations = await InterviewEvaluation.find().lean();

    const evaluationMap = {};
    evaluations.forEach(ev => {
      evaluationMap[ev.candidateId.toString()] = ev;
    });

    const interviewEvaluationMap = {};
    interviewEvaluations.forEach(ie => {
      interviewEvaluationMap[ie.candidateId.toString()] = ie;
    });

    // 2. Candidate pipeline funnel
    const atsCleared = await Candidate.countDocuments({ atsScore: { $gte: 70 } });
    const interviewed = evaluations.length;

    // 7. Hiring recommendations (defined first to compute "selectedCount" for the funnel)
    let strongHire = 0, hire = 0, borderline = 0, reject = 0;
    candidates.forEach(cand => {
      const ats = cand.atsScore ?? 0;
      const semantic = cand.semanticScore ?? 0;
      const ie = interviewEvaluationMap[cand._id.toString()];
      const interviewRec = ie?.overallRecommendation || null;

      if (ats < 60 || interviewRec === "Reject") {
        reject++;
      } else if (ats >= 85 && semantic >= 75 && interviewRec === "Proceed") {
        strongHire++;
      } else if (ats >= 75 && interviewRec === "Proceed") {
        hire++;
      } else if ((ats >= 60 && ats <= 74) || interviewRec === "Borderline" || interviewRec === "Hold") {
        borderline++;
      } else {
        if (ie) {
          borderline++;
        }
      }
    });

    const selectedCount = strongHire + hire;

    const funnel = [
      { step: "Applied", count: totalCandidates },
      { step: "ATS Cleared", count: atsCleared },
      { step: "Interviewed", count: interviewed },
      { step: "Selected", count: selectedCount }
    ];

    const hiringRecommendations = [
      { name: "Strong Hire", value: strongHire },
      { name: "Hire", value: hire },
      { name: "Borderline", value: borderline },
      { name: "Reject", value: reject }
    ];

    // 3 & 4. Role-wise distribution & average ATS
    const roleStats = await Candidate.aggregate([
      {
        $group: {
          _id: "$role",
          applicants: { $sum: 1 },
          avgAtsScore: { $avg: "$atsScore" }
        }
      },
      { $project: { role: "$_id", applicants: 1, avgAtsScore: { $round: ["$avgAtsScore", 1] }, _id: 0 } },
      { $sort: { applicants: -1 } }
    ]);

    // 5 & 6. Top skills
    const topMatchedSkills = await Candidate.aggregate([
      { $unwind: "$skillGap.matchedSkills" },
      { $group: { _id: "$skillGap.matchedSkills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { skill: "$_id", count: 1, _id: 0 } }
    ]);

    const topMissingSkills = await Candidate.aggregate([
      { $unwind: "$skillGap.missingSkills" },
      { $group: { _id: "$skillGap.missingSkills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { skill: "$_id", count: 1, _id: 0 } }
    ]);

    // 8. Diversity/Fairness metrics
    const evalStats = await Evaluation.aggregate([
      {
        $group: {
          _id: null,
          avgFairness: { $avg: "$fairnessScore" },
          totalEvals: { $sum: 1 },
          genderBias: { $sum: { $cond: ["$biasFlags.gender", 1, 0] } },
          collegeBias: { $sum: { $cond: ["$biasFlags.college", 1, 0] } },
          nameBias: { $sum: { $cond: ["$biasFlags.name", 1, 0] } }
        }
      }
    ]);

    const totalEvals = evalStats[0]?.totalEvals || 0;
    const biasFreeEvals = await Evaluation.countDocuments({
      "biasFlags.gender": false,
      "biasFlags.college": false,
      "biasFlags.name": false
    });
    const percentageBiasFree = totalEvals > 0 ? Number(((biasFreeEvals / totalEvals) * 100).toFixed(1)) : 100.0;

    const diversityMetrics = {
      avgFairnessScore: evalStats[0] ? Number((evalStats[0].avgFairness * 100).toFixed(1)) : 100.0,
      totalBiasFlagsTriggered: evalStats[0] ? (evalStats[0].genderBias + evalStats[0].collegeBias + evalStats[0].nameBias) : 0,
      percentageBiasFree: percentageBiasFree
    };

    // 9. Top Candidates Leaderboard
    const leaderboard = candidates.map(cand => {
      const ats = cand.atsScore ?? 0;
      const semantic = cand.semanticScore ?? 0;
      const ie = interviewEvaluationMap[cand._id.toString()];
      const interviewAccuracy = ie?.scores?.technicalScore ? (ie.scores.technicalScore * 10) : 0;
      const finalScore = Number(((0.5 * ats) + (0.3 * semantic) + (0.2 * interviewAccuracy)).toFixed(1));
      return {
        _id: cand._id,
        name: cand.name,
        role: cand.role,
        atsScore: ats,
        semanticScore: semantic,
        finalScore: finalScore
      };
    });

    leaderboard.sort((a, b) => b.finalScore - a.finalScore);
    const topCandidates = leaderboard.slice(0, 5);

    // 10. Recent Activity Feed
    const recentActivity = await Candidate.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name role createdAt atsDecision")
      .lean();

    res.status(200).json({
      applicationsOverTime,
      funnel,
      roleStats,
      topMatchedSkills,
      topMissingSkills,
      hiringRecommendations,
      diversityMetrics,
      topCandidates,
      recentActivity
    });
  } catch (error) {
    console.error("Dashboard Intelligence Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .sort({ createdAt: -1 })
      .lean();

    const candidateIds = candidates.map(c => c._id);
    const evaluations = await Evaluation.find({ candidateId: { $in: candidateIds } }).lean();

    const evalMap = {};
    evaluations.forEach(ev => {
      evalMap[ev.candidateId.toString()] = ev;
    });

    const enrichedCandidates = candidates.map(c => ({
      ...c,
      evaluation: evalMap[c._id.toString()] || null,
      fairnessScore: evalMap[c._id.toString()]?.fairnessScore ?? null
    }));

    res.status(200).json({
      count: enrichedCandidates.length,
      data: enrichedCandidates,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch candidates", error: error.message });
  }
};

// GET /dashboard/candidates/by-role?role=<title>
export const getCandidatesByRole = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) {
      return res.status(400).json({ message: "role query parameter is required" });
    }

    const candidates = await Candidate.find({ role: { $regex: new RegExp(`^${role.trim()}$`, 'i') } })
      .sort({ semanticScore: -1, createdAt: -1 })
      .lean();

    const candidateIds = candidates.map(c => c._id);
    const evaluations = await Evaluation.find({ candidateId: { $in: candidateIds } }).lean();

    const evalMap = {};
    evaluations.forEach(ev => {
      evalMap[ev.candidateId.toString()] = ev;
    });

    const enriched = candidates.map(c => ({
      ...c,
      evaluation: evalMap[c._id.toString()] || null,
      fairnessScore: evalMap[c._id.toString()]?.fairnessScore ?? null
    }));

    res.status(200).json({ count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch candidates by role", error: error.message });
  }
};

export const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findById(id);
    const evaluation = await Evaluation.findOne({ candidateId: id });
    const interview = await InterviewEvaluation.findOne({ candidateId: id });

    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    res.status(200).json({
      data: {
        ...candidate.toObject(),
        evaluation,
        interview
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch candidate", error: error.message });
  }
};

export const deleteCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    await Candidate.findByIdAndDelete(id);
    await Evaluation.deleteMany({ candidateId: id });
    await InterviewEvaluation.deleteMany({ candidateId: id });
    res.status(200).json({ success: true, message: "Candidate deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAllCandidates = async (req, res) => {
  try {
    await Candidate.deleteMany({});
    await Evaluation.deleteMany({});
    await InterviewEvaluation.deleteMany({});
    res.status(200).json({ success: true, message: "All candidates and evaluations cleared" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};