import { groqService } from "./groqService.js";
import { extractJSON } from "../utils/parser.js";
import { ROLE_SKILLS } from "../utils/skills.js";

const DOMAIN_FALLBACKS = {
  "Frontend": [
    { skill: "React/UI", question: "How do you approach optimizing rendering performance in a complex React application?", difficulty: "Medium" },
    { skill: "State Management", question: "Explain how you handle complex global state across multiple components.", difficulty: "Medium" },
    { skill: "CSS/Styling", question: "How do you ensure CSS is maintainable and scalable in a large project?", difficulty: "Easy" },
    { skill: "Testing", question: "What is your approach to testing frontend components?", difficulty: "Medium" },
    { skill: "Architecture", question: "How would you structure a new large-scale frontend application?", difficulty: "Hard" }
  ],
  "Backend": [
    { skill: "API Design", question: "How do you design scalable and secure RESTful APIs?", difficulty: "Medium" },
    { skill: "Databases", question: "Explain your approach to database schema design for a high-traffic application.", difficulty: "Medium" },
    { skill: "Scalability", question: "How do you handle scaling backend services during traffic spikes?", difficulty: "Hard" },
    { skill: "Security", question: "What are the key security considerations you implement in backend services?", difficulty: "Medium" },
    { skill: "Architecture", question: "Describe a complex backend system you designed and the trade-offs you made.", difficulty: "Hard" }
  ],
  "AI/ML": [
    { skill: "Model Training", question: "How do you approach handling overfitting in deep learning models?", difficulty: "Medium" },
    { skill: "Data Pipelines", question: "Explain how you build and maintain data pipelines for ML models.", difficulty: "Medium" },
    { skill: "Deployment", question: "What are the challenges of deploying ML models to production and how do you solve them?", difficulty: "Hard" },
    { skill: "Evaluation", question: "How do you choose the right metrics for evaluating a model's performance?", difficulty: "Medium" },
    { skill: "NLP/CV", question: "Describe a specific complex ML architecture you have worked with and why it was chosen.", difficulty: "Hard" }
  ],
  "Sales": [
    { skill: "Communication", question: "How do you adapt your communication style when speaking with technical vs non-technical clients?", difficulty: "Medium" },
    { skill: "Negotiation", question: "Describe a time you successfully negotiated a difficult deal. What was your strategy?", difficulty: "Hard" },
    { skill: "Lead Generation", question: "What is your approach to identifying and qualifying high-value prospects?", difficulty: "Medium" },
    { skill: "Objection Handling", question: "How do you handle a prospect who tells you your product is too expensive?", difficulty: "Medium" },
    { skill: "Strategy", question: "How do you prioritize your time when managing a large pipeline of opportunities?", difficulty: "Medium" }
  ],
  "General": [
    { skill: "General", question: "Explain a real-world project you worked on and the challenges you faced.", difficulty: "Medium" },
    { skill: "Problem Solving", question: "How would you approach debugging a failing production system?", difficulty: "Hard" },
    { skill: "Design", question: "Design a scalable system for handling large amounts of data.", difficulty: "Hard" },
    { skill: "Optimization", question: "How do you improve performance in an existing application?", difficulty: "Medium" },
    { skill: "Best Practices", question: "What coding practices do you follow to ensure maintainability?", difficulty: "Medium" }
  ]
};

export const generateQuestions = async (roleDoc, candidateDoc) => {
  const roleTitle = roleDoc?.title || "General Role";
  const roleDesc = roleDoc?.description || "";
  const candidateSkills = candidateDoc?.skillGap?.matchedSkills?.join(", ") || "";
  const resumeTextSnippet = candidateDoc?.resumeText ? candidateDoc.resumeText.substring(0, 1500) : ""; // taking up to 1500 chars context

  const prompt = `
You are an expert technical interviewer hiring for the role of "${roleTitle}".

ROLE DETAILS:
${roleDesc}

CANDIDATE PROFILE SNIPPET:
Extracted Skills: ${candidateSkills}
Resume Context: ${resumeTextSnippet}

Based on the intersection of the role requirements and the candidate's background, generate 5 highly specific and challenging interview questions for this candidate. 
Never reuse hardcoded generic questions.
If it's a backend role, ask about APIs, databases, scalability. If frontend, React, UI optimization. If sales, communication and negotiation. 

STRICT RULES:
- Return ONLY valid JSON
- Do NOT add explanation text
- Do NOT add markdown
- Do NOT add comments

Return EXACTLY in this format:

{
  "questions": [
    {
      "skill": "string (e.g. API Design, Database Optimization, Communication)",
      "question": "string (The actual interview question)",
      "difficulty": "Easy | Medium | Hard"
    }
  ]
}
`;

  let raw;
  
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      raw = await groqService(prompt);
      const parsed = extractJSON(raw);
      
      if (
        parsed &&
        Array.isArray(parsed.questions) &&
        parsed.questions.length === 5
      ) {
        return parsed;
      }
    } catch (error) {
      console.warn(`⚠️ Question generation attempt ${attempt + 1} failed`, error.message);
    }
  }

  // Fallback to domain-specific templates if LLM fails
  const domain = roleDoc?.domain || "General";
  let fallbackQuestions = DOMAIN_FALLBACKS[domain];
  
  if (!fallbackQuestions) {
    // Try to guess domain from title
    const titleLower = roleTitle.toLowerCase();
    if (titleLower.includes("front") || titleLower.includes("react") || titleLower.includes("ui")) fallbackQuestions = DOMAIN_FALLBACKS["Frontend"];
    else if (titleLower.includes("back") || titleLower.includes("node") || titleLower.includes("java")) fallbackQuestions = DOMAIN_FALLBACKS["Backend"];
    else if (titleLower.includes("data") || titleLower.includes("ml") || titleLower.includes("ai")) fallbackQuestions = DOMAIN_FALLBACKS["AI/ML"];
    else if (titleLower.includes("sales") || titleLower.includes("account")) fallbackQuestions = DOMAIN_FALLBACKS["Sales"];
    else fallbackQuestions = DOMAIN_FALLBACKS["General"];
  }

  return { questions: fallbackQuestions };
};