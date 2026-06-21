import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    
    clarity: {
      type: Number,
      min: 0,
      max: 10,
    },
    relevance: {
      type: Number,
      min: 0,
      max: 10,
    },
    reasoning: {
      type: Number,
      min: 0,
      max: 10,
    },
    finalScore: {
      type: Number,
      index: true, 
    },

    
    explanation: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },

    
    decision: {
      type: String,
      enum: ["Selected", "Rejected", "Borderline"],
      index: true,
    },
    reason: String,
    improvements: [String],

    
    biasAdjusted: {
      type: Boolean,
      default: false,
      index: true,
    },

    fairnessScore: {
      type: Number,
      default: 1,
      min: 0,
      max: 1,
    },

    
    biasFlags: {
      gender: { type: Boolean, default: false },
      college: { type: Boolean, default: false },
      name: { type: Boolean, default: false },
    },

    // Immutable snapshots generated at submission time
    semanticScore: {
      type: Number,
      default: 0,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Evaluation", evaluationSchema);