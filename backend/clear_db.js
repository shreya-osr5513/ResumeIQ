import mongoose from "mongoose";
import dotenv from "dotenv";
import Candidate from "./models/candidate.js";
import Role from "./models/role.js";
import Evaluation from "./models/evaluation.js";
import InterviewEvaluation from "./models/InterviewEvaluation.js";
import Logs from "./models/logsModel.js";

dotenv.config();

const clearDb = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not specified in backend/.env");
    }

    console.log("🔌 Connecting to MongoDB (dbName: fairhire)...");
    await mongoose.connect(mongoUri, {
      dbName: "fairhire"
    });
    console.log("✅ MongoDB connected. Starting database reset...");

    // 1. Clear Candidates
    const candResult = await Candidate.deleteMany({});
    console.log(`Candidates cleared (${candResult.deletedCount} documents deleted)`);

    // 2. Clear Roles
    const roleResult = await Role.deleteMany({});
    console.log(`Roles cleared (${roleResult.deletedCount} documents deleted)`);

    // 3. Clear Evaluations
    const evalResult = await Evaluation.deleteMany({});
    console.log(`Evaluations cleared (${evalResult.deletedCount} documents deleted)`);

    // 4. Clear Interview Evaluations
    const interviewResult = await InterviewEvaluation.deleteMany({});
    console.log(`Interview evaluations cleared (${interviewResult.deletedCount} documents deleted)`);

    // 5. Clear Logs
    const logResult = await Logs.deleteMany({});
    console.log(`Logs cleared (${logResult.deletedCount} documents deleted)`);

    // 6. Verify counts are 0
    const candCount = await Candidate.countDocuments({});
    const roleCount = await Role.countDocuments({});
    const evalCount = await Evaluation.countDocuments({});
    const interviewCount = await InterviewEvaluation.countDocuments({});
    const logCount = await Logs.countDocuments({});

    console.log("\n📊 Verification Check:");
    console.log(`- Candidates: ${candCount}`);
    console.log(`- Roles: ${roleCount}`);
    console.log(`- Evaluations: ${evalCount}`);
    console.log(`- Interview Evaluations: ${interviewCount}`);
    console.log(`- Logs: ${logCount}`);

    if (candCount === 0 && roleCount === 0 && evalCount === 0 && interviewCount === 0 && logCount === 0) {
      console.log("\n✨ Database reset complete successfully!");
    } else {
      console.log("\n⚠️ Database reset incomplete: some documents remain!");
    }
  } catch (error) {
    console.error("🔥 Error resetting database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  }
};

clearDb();
