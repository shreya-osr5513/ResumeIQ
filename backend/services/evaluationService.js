import { groqService } from "./groqService.js";

// Helper to compute strict heuristic scores based on completion and content depth
export const computeHeuristicScores = (qa) => {
  const totalQuestions = qa.length;
  let answeredCount = 0;
  let claritySum = 0;
  let relevanceSum = 0;
  let reasoningSum = 0;
  const detailedFeedback = [];

  qa.forEach((item, idx) => {
    const ans = (item.answer || "").trim();
    const isEmpty = !ans || 
                    ans.toLowerCase() === "no answer provided" || 
                    ans.toLowerCase() === "no answer provided." || 
                    ans.toLowerCase() === "undefined";

    let qScore = 0;
    let feedback = "";
    let clarity = 0;
    let relevance = 0;
    let reasoning = 0;

    if (isEmpty) {
      qScore = 0;
      feedback = "No answer provided. Zero score awarded.";
      clarity = 0;
      relevance = 0;
      reasoning = 0;
    } else {
      answeredCount++;
      // Check for extremely short answers like "I worked on ResumeIQ"
      if (ans.length < 30) {
        // Capped score between 1 and 2
        qScore = Math.min(2, Math.max(1, Math.round(ans.length / 10)));
        feedback = "Answer is too short and lacks technical depth.";
        clarity = 2;
        relevance = 2;
        reasoning = 1;
      } else {
        // Normal answer: give a reasonable baseline before LLM adjustment (or if LLM fails)
        qScore = Math.min(8, 3 + Math.round(ans.length / 50));
        feedback = "Answer provided with moderate detail. Requires review.";
        clarity = 6;
        relevance = 6;
        reasoning = 5;
      }
    }

    claritySum += clarity;
    relevanceSum += relevance;
    reasoningSum += reasoning;

    detailedFeedback.push({
      question: item.question,
      feedback,
      score: qScore,
    });
  });

  const percentAnswered = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  let clarity = totalQuestions > 0 ? Number((claritySum / totalQuestions).toFixed(1)) : 0;
  let relevance = totalQuestions > 0 ? Number((relevanceSum / totalQuestions).toFixed(1)) : 0;
  let reasoning = totalQuestions > 0 ? Number((reasoningSum / totalQuestions).toFixed(1)) : 0;

  // Apply heavy penalties if they answered less than 50% of the questions
  let penaltyMultiplier = 1.0;
  if (percentAnswered < 50) {
    // If only answering 20% (e.g. 1 out of 5), penalize down to 20% of the value.
    penaltyMultiplier = percentAnswered < 20 ? 0.15 : 0.4;
  }

  clarity = Number((clarity * penaltyMultiplier).toFixed(1));
  relevance = Number((relevance * penaltyMultiplier).toFixed(1));
  reasoning = Number((reasoning * penaltyMultiplier).toFixed(1));

  return {
    clarity,
    relevance,
    reasoning,
    percentAnswered,
    answeredCount,
    detailedFeedback,
  };
};

export const evaluateAnswers = async (role, qa) => {
  try {
    if (!qa || qa.length === 0) {
      throw new Error("No QA provided");
    }

    const formattedQA = qa
      .map(
        (item, i) => `
Q${i + 1}: ${item.question}
A${i + 1}: ${item.answer}
`
      )
      .join("\n");

    const prompt = `
You are an expert technical interviewer. Evaluate the candidate for role: ${role}

Here is the Q&A log:
${formattedQA}

Rate from 0-10 based ONLY on the quality of provided answers. 
If an answer is empty or says "No answer provided.", it MUST be scored 0.
Short or generic answers like "I worked on ResumeIQ" must be scored very low (1-2).

Provide STRICT JSON output:
{
  "clarity": number (0-10),
  "relevance": number (0-10),
  "reasoning": number (0-10),
  "strengths": [list],
  "weaknesses": [list],
  "improvements": [list],
  "detailedFeedback": [
    {
      "question": "...",
      "feedback": "...",
      "score": number (0-10)
    }
  ]
}
`;

    const aiResponse = await groqService(prompt);
    
    let parsed;
    try {
      const cleanJson = aiResponse.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(cleanJson ? cleanJson[0] : aiResponse);
    } catch (err) {
      console.log("AI parse failed, fallback used");
      return fallbackEvaluation(qa);
    }

    // --- Strict Programmatic Post-Processing & Validation Guard ---
    parsed.detailedFeedback = parsed.detailedFeedback || [];
    let answeredCount = 0;
    const totalQuestions = qa.length;

    qa.forEach((item, idx) => {
      const ans = (item.answer || "").trim();
      const isEmpty = !ans || 
                      ans.toLowerCase() === "no answer provided" || 
                      ans.toLowerCase() === "no answer provided." || 
                      ans.toLowerCase() === "undefined";
      
      let fbItem = parsed.detailedFeedback.find((f) => f.question === item.question) || parsed.detailedFeedback[idx];
      if (!fbItem) {
        fbItem = { question: item.question, feedback: "", score: 0 };
        parsed.detailedFeedback.push(fbItem);
      }

      if (isEmpty) {
        fbItem.score = 0;
        fbItem.feedback = "No answer provided. Zero score awarded.";
      } else {
        answeredCount++;
        // Short answers like "I worked on ResumeIQ" should score very low (1-2)
        if (ans.length < 30) {
          fbItem.score = Math.min(fbItem.score || 0, 2);
          fbItem.feedback = fbItem.feedback || "Answer is too short and lacks technical depth.";
        }
      }
    });

    const percentAnswered = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    // Apply strict penalty multiplier if less than 50% answered
    let penaltyMultiplier = 1.0;
    if (percentAnswered < 50) {
      penaltyMultiplier = percentAnswered < 20 ? 0.15 : 0.4;
    }

    parsed.clarity = Number(((parsed.clarity ?? 5) * penaltyMultiplier).toFixed(1));
    parsed.relevance = Number(((parsed.relevance ?? 5) * penaltyMultiplier).toFixed(1));
    parsed.reasoning = Number(((parsed.reasoning ?? 5) * penaltyMultiplier).toFixed(1));

    parsed.strengths = parsed.strengths || [];
    parsed.weaknesses = parsed.weaknesses || [];
    parsed.improvements = parsed.improvements || [];

    if (percentAnswered < 50) {
      parsed.weaknesses.unshift("Candidate left the majority of the interview questions unanswered.");
    }

    return parsed;

  } catch (err) {
    console.error("Evaluation error:", err);
    return fallbackEvaluation(qa);
  }
};

const fallbackEvaluation = (qa) => {
  const heuristics = computeHeuristicScores(qa);
  
  return {
    clarity: heuristics.clarity,
    relevance: heuristics.relevance,
    reasoning: heuristics.reasoning,
    strengths: heuristics.answeredCount > 0 
      ? ["Provided basic responses for some questions."] 
      : ["No strengths identified due to lack of responses."],
    weaknesses: heuristics.answeredCount < qa.length 
      ? ["Failed to answer all questions.", "Lack of technical depth."] 
      : ["Lack of depth in answers."],
    improvements: ["Provide more details and examples.", "Focus on structure and metrics."],
    detailedFeedback: heuristics.detailedFeedback
  };
};