import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    // Personal Info (from Step 3.5 form)
    name: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    answers: {
      type: [String],
      default: [],
    },
    questions: {
      type: [String],
      default: [],
    },

    resumeText: {
      type: String,
      default: "",
    },

    anonId: {
      type: String,
      unique: true,
    },

    // ATS Screening results saved at registration
    atsScore: {
      type: Number,
      default: null,
    },
    atsDecision: {
      type: String,
      enum: ["Selected", "Borderline", "Rejected", null],
      default: null,
    },

    status: {
      type: String,
      enum: ["Pending", "Evaluated"],
      default: "Pending",
    },

    // New Intelligence Fields
    resumeEmbedding: {
      type: [Number],
      default: [],
    },
    jobEmbedding: {
      type: [Number],
      default: [],
    },
    semanticScore: {
      type: Number,
      default: 0,
    },
    skillGap: {
      matchedSkills: [String],
      missingSkills: [String],
      recommendations: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Candidate", candidateSchema);