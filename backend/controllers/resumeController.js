import { evaluateResume } from "../services/resumeEvaluationService.js";
import { applyBiasGuard } from "../services/biasGuardService.js";
import { parseResume } from "../services/resumeService.js";
import { buildResumeReport } from "../services/reportService.js";
import { getEmbedding, calculateSemanticSimilarity } from "../services/semanticMatchingService.js";
import { calculateSkillGap } from "../services/skillGapService.js";
import Role from "../models/role.js";

export const evaluateResumeController = async (req, res) => {
  try {
    const { role } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Resume file is required",
      });
    }

    if (!role) {
      return res.status(400).json({
        message: "Role is required",
      });
    }

    
    const parsed = await parseResume(req.file.buffer);
    const resumeText = parsed.text;
    console.log(`📝 Resume text extracted. Length: ${resumeText.length} characters.`);

    // --- FETCH ROLE FIRST TO GET SKILLS ---
    console.log("Fetching role skills...");
    const roleDoc = await Role.findOne({ title: role });
    const roleSkills = roleDoc ? roleDoc.skills : [];
    if (roleDoc) {
      const roleDescLength = roleDoc.description ? roleDoc.description.length : roleDoc.title.length;
      console.log(`Role found: ${roleDoc.title}. Required skills: ${roleSkills.join(", ")}. Description length: ${roleDescLength} chars. Embedding Length: ${roleDoc.embedding?.length || 0}`);
    } else {
      console.log(`⚠️ Warning: Role "${role}" not found in DB!`);
    }

    // ── STEP 1: ATS Evaluation (does NOT require embeddings) ─────────────
    let evaluation = await evaluateResume(resumeText, role, roleSkills);

    // DEBUG: Log what predict_resume.py returned BEFORE bias guard
    console.log("═══ ATS EVALUATION RAW OUTPUT ═══");
    console.log("  evaluation.matchedSkills:", JSON.stringify(evaluation.matchedSkills));
    console.log("  evaluation.missingSkills:", JSON.stringify(evaluation.missingSkills));
    console.log("  evaluation.skillsExtracted:", JSON.stringify(evaluation.skillsExtracted));
    console.log("  evaluation.scores:", JSON.stringify(evaluation.scores));
    console.log("  evaluation.decision:", evaluation.decision);

    // CRITICAL: Extract skill arrays IMMEDIATELY before bias guard could interfere
    const atsMatchedSkills = [...(evaluation.matchedSkills || [])];
    const atsMissingSkills = [...(evaluation.missingSkills || [])];
    console.log("  Preserved atsMatchedSkills:", JSON.stringify(atsMatchedSkills));
    console.log("  Preserved atsMissingSkills:", JSON.stringify(atsMissingSkills));

    evaluation = applyBiasGuard(evaluation, [resumeText]);

    // ── STEP 2: Skill Gap Analysis (does NOT require embeddings) ─────────
    // MOVED OUTSIDE the embedding block — skill gap only needs skill lists
    let skillGap = { matchedSkills: [], missingSkills: [], recommendations: [] };

    if (roleDoc && roleDoc.skills && roleDoc.skills.length > 0) {
      // Use calculateSkillGap for proper casing from Role model
      skillGap = calculateSkillGap(atsMatchedSkills, roleDoc.skills);
      console.log("═══ SKILL GAP (from calculateSkillGap) ═══");
      console.log("  Input candidateSkills:", JSON.stringify(atsMatchedSkills));
      console.log("  Input jdSkills:", JSON.stringify(roleDoc.skills));
      console.log("  Output matchedSkills:", JSON.stringify(skillGap.matchedSkills));
      console.log("  Output missingSkills:", JSON.stringify(skillGap.missingSkills));
      console.log("  Output recommendations:", JSON.stringify(skillGap.recommendations));
    } else if (atsMatchedSkills.length > 0 || atsMissingSkills.length > 0) {
      // Fallback: use direct ATS output when role has no skills in DB
      skillGap = {
        matchedSkills: atsMatchedSkills,
        missingSkills: atsMissingSkills,
        recommendations: atsMissingSkills.map(s => `Learn and practice ${s} in production environments`)
      };
      console.log("═══ SKILL GAP (fallback from ATS direct) ═══");
      console.log("  matchedSkills:", JSON.stringify(skillGap.matchedSkills));
      console.log("  missingSkills:", JSON.stringify(skillGap.missingSkills));
    } else {
      console.log("⚠️ SKILL GAP: No skills available from either Role DB or ATS extraction!");
    }

    // ── STEP 3: Semantic Similarity (DOES require embeddings) ────────────
    console.log("Generating resume embedding...");
    const resumeEmbedding = await getEmbedding(resumeText);
    console.log(`Resume embedding generated. Length: ${resumeEmbedding?.length || 0}`);
    
    let semanticScore = 0;

    if (roleDoc && roleDoc.embedding && roleDoc.embedding.length > 0 && resumeEmbedding && resumeEmbedding.length > 0) {
      console.log("Calculating semantic similarity...");
      const similarityResults = await calculateSemanticSimilarity(resumeEmbedding, [roleDoc.embedding]);
      console.log("Similarity result raw:", similarityResults);
      
      if (similarityResults && similarityResults.length > 0) {
        // Clamp score between 0 and 100
        semanticScore = Math.max(0, Math.min(100, Math.round(similarityResults[0].score)));
      }
      console.log("Final semantic score calculated:", semanticScore);
    } else {
      console.log("⚠️ Skipping semantic similarity: Missing role embedding or resume embedding.");
      console.log("  roleDoc exists:", !!roleDoc);
      console.log("  roleDoc.embedding length:", roleDoc?.embedding?.length || 0);
      console.log("  resumeEmbedding length:", resumeEmbedding?.length || 0);
    }

    // ── STEP 4: Attach all intelligence to evaluation for the report ─────
    evaluation.semanticScore = semanticScore;
    evaluation.skillGap = skillGap;
    evaluation.resumeText = resumeText;
    evaluation.resumeEmbedding = resumeEmbedding;
    evaluation.jobEmbedding = roleDoc?.embedding || [];

    const report = buildResumeReport(evaluation, role);

    // Final debug log
    console.log("═══ FINAL RESPONSE PAYLOAD ═══");
    console.log("  semanticScore:", semanticScore);
    console.log("  skillGap.matchedSkills:", JSON.stringify(skillGap.matchedSkills));
    console.log("  skillGap.missingSkills:", JSON.stringify(skillGap.missingSkills));
    console.log("  skillGap.recommendations count:", skillGap.recommendations?.length || 0);

    res.status(200).json({
      message: "Resume evaluation completed",
      report: {
        ...report,
        semanticScore,
        skillGap,
        resumeText: resumeText,
        resumeEmbedding: resumeEmbedding,
        jobEmbedding: roleDoc?.embedding || []
      }
    });

  } catch (error) {
    console.error("🔥 Resume Eval Error:", error);
    res.status(500).json({ error: error.message });
  }
};