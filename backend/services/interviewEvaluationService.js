import { groqService } from "./groqService.js";
import InterviewEvaluation from "../models/InterviewEvaluation.js";

const DEFAULT_SCORES = {
  technicalScore: 5,
  communicationScore: 5,
  problemSolvingScore: 5,
  depth: 5,
  confidence: 5
};

const DEFAULT_FEEDBACK = {
  technical: "Evaluation unavailable.",
  communication: "Evaluation unavailable.",
  problemSolving: "Evaluation unavailable.",
  general: "Automated scoring was not available. Fallback scores applied."
};

// Helper for dynamic heuristic scores based on completeness and answer lengths
export const getHeuristicScores = (questions, answers) => {
  const total = questions.length;
  let answered = 0;
  let chars = 0;

  answers.forEach((a) => {
    const text = (a || "").trim();
    const isEmpty = !text || 
                    text.toLowerCase() === "no answer provided" || 
                    text.toLowerCase() === "no answer provided." || 
                    text.toLowerCase() === "undefined";
    if (!isEmpty) {
      answered++;
      chars += text.length;
    }
  });

  const rate = total > 0 ? answered / total : 0;

  if (answered === 0) {
    return {
      scores: {
        technicalScore: 0,
        communicationScore: 0,
        problemSolvingScore: 0,
        depth: 0,
        confidence: 0
      },
      feedback: {
        technical: "Zero questions were answered. No technical skills demonstrated.",
        communication: "No responses. Unable to assess communication.",
        problemSolving: "No responses. Zero problem-solving capacity demonstrated.",
        general: "All interview questions were left empty. Automatic reject."
      },
      overallRecommendation: "Reject"
    };
  }

  // Calculate dynamic baseline score out of 10
  let scoreBase = rate * 6; // e.g. 20% completion gives base score of 1.2
  if (chars < 30) {
    scoreBase *= 0.5; // one short answer gets penalized
  } else if (chars > 150) {
    scoreBase *= 1.4;
  }

  const tech = Number(Math.min(10, Math.max(0.5, scoreBase * 1.2)).toFixed(1));
  const comm = Number(Math.min(10, Math.max(0.5, scoreBase * 1.0)).toFixed(1));
  const prob = Number(Math.min(10, Math.max(0.5, scoreBase * 0.8)).toFixed(1));
  const depth = Number(Math.min(10, Math.max(0.5, scoreBase * 0.6)).toFixed(1));
  const conf = Number(Math.min(10, Math.max(0.5, scoreBase * 1.0)).toFixed(1));

  const recommendation = rate < 0.5 ? "Reject" : rate < 0.75 ? "Hold" : "Proceed";

  return {
    scores: {
      technicalScore: tech,
      communicationScore: comm,
      problemSolvingScore: prob,
      depth,
      confidence: conf
    },
    feedback: {
      technical: `Answered ${answered} / ${total} questions. Limited technical depth observed.`,
      communication: `Communication was minimal due to short answers.`,
      problemSolving: `Problem solving cannot be verified with brief submissions.`,
      general: `Candidate completed only ${Math.round(rate * 100)}% of the assessment.`
    },
    overallRecommendation: recommendation
  };
};

export const evaluateInterview = async (candidateId, questions, answers) => {
  const totalQuestions = questions.length;
  let answeredCount = 0;

  answers.forEach((a) => {
    const text = (a || "").trim();
    const isEmpty = !text || 
                    text.toLowerCase() === "no answer provided" || 
                    text.toLowerCase() === "no answer provided." || 
                    text.toLowerCase() === "undefined";
    if (!isEmpty) {
      answeredCount++;
    }
  });

  const completionRate = totalQuestions > 0 ? answeredCount / totalQuestions : 0;
  
  const interviewData = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || "No answer provided."}`).join("\n\n");
  
  const prompt = `
    Evaluate the following interview performance:
    ${interviewData}

    Rate from 0-10 for each:
    - Technical Accuracy
    - Communication
    - Problem Solving
    - Depth of Answer
    - Confidence

    If candidate answers are short or empty, penalize these parameters heavily.
    Provide feedback for each and an overall recommendation (Proceed, Hold, Reject).
    Respond ONLY with a valid JSON object, no markdown, no explanation:
    {
      "scores": {
        "technicalScore": 7.5,
        "communicationScore": 8,
        "problemSolvingScore": 7,
        "depth": 6.5,
        "confidence": 8
      },
      "feedback": {
        "technical": "text",
        "communication": "text",
        "problemSolving": "text",
        "general": "text"
      },
      "overallRecommendation": "Proceed"
    }
  `;

  // Start with dynamic heuristic as the default base
  const heuristics = getHeuristicScores(questions, answers);
  let scores = heuristics.scores;
  let feedback = heuristics.feedback;
  let overallRecommendation = heuristics.overallRecommendation;

  try {
    const response = await groqService(prompt);
    const cleanJson = response.match(/\{[\s\S]*\}/);
    if (cleanJson) {
      const parsed = JSON.parse(cleanJson[0]);
      
      // Calculate strict programmatic penalization factor
      let penaltyMultiplier = 1.0;
      if (completionRate < 0.5) {
        penaltyMultiplier = completionRate < 0.2 ? 0.15 : 0.4;
      }

      if (parsed.scores) {
        scores = {
          technicalScore: Number((Math.min(parsed.scores.technicalScore ?? DEFAULT_SCORES.technicalScore, 10) * penaltyMultiplier).toFixed(1)),
          communicationScore: Number((Math.min(parsed.scores.communicationScore ?? DEFAULT_SCORES.communicationScore, 10) * penaltyMultiplier).toFixed(1)),
          problemSolvingScore: Number((Math.min(parsed.scores.problemSolvingScore ?? DEFAULT_SCORES.problemSolvingScore, 10) * penaltyMultiplier).toFixed(1)),
          depth: Number((Math.min(parsed.scores.depth ?? DEFAULT_SCORES.depth, 10) * penaltyMultiplier).toFixed(1)),
          confidence: Number((Math.min(parsed.scores.confidence ?? DEFAULT_SCORES.confidence, 10) * penaltyMultiplier).toFixed(1)),
        };
      }
      
      if (completionRate < 0.5) {
        overallRecommendation = "Reject";
      } else if (parsed.overallRecommendation && ["Proceed", "Hold", "Reject"].includes(parsed.overallRecommendation)) {
        overallRecommendation = parsed.overallRecommendation;
      }

      // --- DYNAMIC FEEDBACK GENERATION BASED ON SCORES ---
      // This ensures we never have contradictory statements like Tech Accuracy: 10/10 but feedback says "Limited technical depth".
      feedback.technical = scores.technicalScore >= 8 
        ? "Demonstrated strong technical depth and accuracy." 
        : scores.technicalScore >= 6 
        ? "Adequate technical knowledge observed, but with room for improvement." 
        : scores.technicalScore >= 4 
        ? "Limited technical depth demonstrated." 
        : "Poor technical skills observed.";

      feedback.communication = scores.communicationScore >= 7 
        ? "Clear and effective communication." 
        : scores.communicationScore >= 5 
        ? "Communication was acceptable but could be more articulate." 
        : "Communication was minimal or unclear.";

      feedback.problemSolving = scores.problemSolvingScore >= 7 
        ? "Strong problem-solving approach." 
        : scores.problemSolvingScore >= 5 
        ? "Basic problem-solving skills shown." 
        : "Problem-solving capabilities could not be verified or were weak.";

      if (overallRecommendation === "Proceed") {
        feedback.general = "Candidate performed well and meets the baseline requirements. Recommended to proceed.";
      } else if (overallRecommendation === "Hold") {
        feedback.general = "Candidate shows potential but has some gaps. Keep on hold.";
      } else {
        feedback.general = "Candidate did not meet the required threshold. Reject.";
      }

    }
  } catch (error) {
    console.error("Interview Evaluation LLM Error (using dynamic heuristic):", error.message);
    // Keep the heuristic scores calculated above
  }

  try {
    const evaluation = new InterviewEvaluation({
      candidateId,
      scores,
      feedback,
      overallRecommendation
    });
    await evaluation.save();
    return evaluation;
  } catch (dbError) {
    console.error("Interview Evaluation DB Save Error:", dbError.message);
    throw dbError;
  }
};
