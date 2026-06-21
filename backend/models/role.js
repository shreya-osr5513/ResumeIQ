import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // JD Intelligence Metadata
    skills: [String],
    experience: String,
    domain: String,
    difficulty: String,
    embedding: [Number],
    rubric: {
      type: Map,
      of: Number
    },
    blueprint: {
      technicalQuestions: [String],
      behavioralQuestions: [String],
      systemDesignQuestions: [String]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
