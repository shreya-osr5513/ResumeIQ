import mongoose from "mongoose";

const interviewEvaluationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    scores: {
      technicalScore: { type: Number, default: 0 },
      communicationScore: { type: Number, default: 0 },
      problemSolvingScore: { type: Number, default: 0 },
      depth: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
    },
    overallRecommendation: {
      type: String,
      enum: ["Proceed", "Hold", "Reject"],
      default: "Hold",
    },
    feedback: {
      technical: String,
      communication: String,
      problemSolving: String,
      general: String,
    },
    evaluationDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("InterviewEvaluation", interviewEvaluationSchema);
