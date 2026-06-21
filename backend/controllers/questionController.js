import { generateQuestions } from "../services/questionService.js";
import Candidate from "../models/candidate.js";
import Role from "../models/role.js";

export const getQuestions = async (req, res) => {
  try {
    const { role, candidateId } = req.body;

    if (!role || typeof role !== "string" || role.trim() === "") {
      return res.status(400).json({
        message: "Role is required and must be a valid string",
      });
    }

    let candidateDoc = null;
    if (candidateId) {
      candidateDoc = await Candidate.findById(candidateId);
    }

    const roleDoc = await Role.findOne({ title: role.trim() });

    console.log(`🧠 Generating dynamic interview questions for Candidate: ${candidateDoc ? candidateDoc.name : 'Unknown'} | Role: ${role}`);
    
    // Pass both documents to the service for context-aware generation
    const result = await generateQuestions(roleDoc, candidateDoc);

    if (!result || !result.questions) {
      return res.status(500).json({
        message: "Failed to generate valid questions",
      });
    }

    const formattedQuestions = result.questions.map((q, i) => ({
      id: i + 1,
      question: typeof q === "string" ? q : q.question,
      skill: typeof q === "object" ? (q.skill || "General") : "General",
      difficulty: typeof q === "object" ? (q.difficulty || "Medium") : "Medium",
    }));

    // Save generated questions to the Candidate document so recruiters can see what was asked
    if (candidateDoc) {
      candidateDoc.questions = formattedQuestions.map(q => q.question);
      await candidateDoc.save();
      console.log(`✅ Saved ${formattedQuestions.length} interview questions to Candidate ${candidateDoc._id}`);
    }

    res.status(200).json({
      message: "Questions generated successfully",
      data: formattedQuestions
    });

  } catch (error) {
    console.error("🔥 ERROR generating questions:", error);
    res.status(500).json({
      message: "Error generating questions",
      error: error.message,
    });
  }
};