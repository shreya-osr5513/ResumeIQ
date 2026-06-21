import sys
import json
import joblib
import os
import re

# FAANG-level ATS NLP Dictionaries
ACTION_VERBS = [
    "architected", "engineered", "scaled", "optimized", "spearheaded", 
    "deployed", "mentored", "orchestrated", "refactored", "migrated", "redesigned"
]

IMPACT_METRICS = [
    r"%", r"\$", r"ms\b", r"latency", r"million", r"billion", r"users\b", r"qps", r"tps"
]

ADVANCED_SYSTEM_CONCEPTS = [
    "distributed systems", "microservices", "large-scale", "system design",
    "high availability", "fault tolerance", "concurrency", "load balancing", 
    "ci/cd", "kubernetes", "docker", "gcp", "aws", "azure", "kafka", "redis"
]

GENERIC_WORDS = {
    "leadership", "teamwork", "projects", "management", "problem solving", 
    "communication", "organization", "strategy", "collaboration", "adaptability",
    "critical thinking", "creativity"
}

def extract_advanced_features(text_lower):
    # Regex counting
    verb_count = sum(1 for verb in ACTION_VERBS if re.search(r'\b' + verb + r'\b', text_lower))
    metric_count = sum(1 for metric in IMPACT_METRICS if re.search(metric, text_lower))
    system_concepts = [concept for concept in ADVANCED_SYSTEM_CONCEPTS if concept in text_lower]
    return verb_count, metric_count, system_concepts

def generate_faang_feedback(final_score, decision, matchedSkills, missingSkills, verb_count, metric_count, system_concepts, role):
    strengths = []
    weaknesses = []
    improvements = []
    
    # Strengths Formatting
    if metric_count >= 2:
        strengths.append(f"Demonstrates strong systemic impact through {metric_count} quantifiable metrics, aligning with data-driven engineering cultures.")
    if verb_count >= 2:
        strengths.append("Utilizes strong action-oriented terminology (e.g., 'architected', 'scaled'), indicating clear technical ownership and leadership.")
    if len(system_concepts) > 0:
        strengths.append(f"Exhibits proficiency in scalable architecture by highlighting experience with: {', '.join(system_concepts[:3])}.")
    
    if final_score >= 80:
        strengths.append("Overall technical profile strongly aligns with expectations for problem-solving and domain expertise.")
    
    if not strengths:
        strengths.append("Possesses foundational skills for the specified role.")
    
    # Weaknesses Formatting
    if metric_count == 0:
        weaknesses.append("Lacks quantifiable impact metrics. High-tier evaluations require concrete numbers on performance improvements or user scale.")
    if len(system_concepts) == 0 and "Engineer" in role:
        weaknesses.append("Missing evidence of working with complex, distributed systems or modern cloud-native architectures.")
    if len(missingSkills) > 0:
        weaknesses.append(f"Noticeable gaps in strict role requirements, specifically regarding: {', '.join(missingSkills[:3])}.")
        
    if not weaknesses:
        if final_score < 100:
            weaknesses.append("Could further elaborate on the cross-functional impact and systemic trade-offs made during system design.")

    # Improvements Formatting
    if metric_count < 2:
        improvements.append("Quantify your project outcomes using STAR methodology. State the exact scale (QPS, data volume, savings).")
    if verb_count < 2:
        improvements.append("Avoid passive language. Use authoritative action verbs to describe your direct contributions.")
    for skill in missingSkills[:2]:
        improvements.append(f"Prioritize acquiring experience with {skill} to meet the structural requirements of this role.")
    
    return strengths, weaknesses, improvements

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments. Requires resume_file_path and role"}))
        sys.exit(1)
        
    resume_file_path = sys.argv[1]
    role = sys.argv[2]
    skills_string = sys.argv[3] if len(sys.argv) > 3 else ""
    
    # Read resume text from the temp file safely!
    try:
        with open(resume_file_path, 'r', encoding='utf8') as f:
            resume_text = f.read()
    except Exception as e:
        print(json.dumps({"error": f"Failed to read resume temp file: {str(e)}"}))
        sys.exit(1)
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    vectorizer_path = os.path.join(BASE_DIR, 'tfidf_vectorizer.pkl')
    score_model_path = os.path.join(BASE_DIR, 'score_model.pkl')
    decision_model_path = os.path.join(BASE_DIR, 'decision_model.pkl')
    
    try:
        vectorizer = joblib.load(vectorizer_path)
        score_model = joblib.load(score_model_path)
        decision_model = joblib.load(decision_model_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load models: {str(e)}"}))
        sys.exit(1)
        
    X_input = [resume_text + " " + role]
    try:
        X_vec = vectorizer.transform(X_input)
    except Exception as e:
        print(json.dumps({"error": f"Failed to vectorize input: {str(e)}"}))
        sys.exit(1)
        
    base_score = float(score_model.predict(X_vec)[0])
    
    # NLP Parsing & Keyword Extraction
    text_lower = resume_text.lower()
    
    SKILLS_MAP = {
        "Software Engineer": ["python", "java", "react", "node.js", "c++", "kubernetes", "system design", "algorithms"],
        "Backend Developer": ["node.js", "python", "golang", "microservices", "mongodb", "postgresql", "redis", "docker"],
        "Frontend Developer": ["javascript", "typescript", "react", "next.js", "web performance", "css architecture"],
        "Data Scientist": ["python", "pytorch", "tensorflow", "nlp", "machine learning", "sql", "data pipelines"],
        "Sales Executive": ["sales", "negotiation", "cold calling", "leads", "crm", "communication", "pitching", "business development"],
        "HR Manager": ["recruitment", "onboarding", "employee relations", "talent acquisition", "performance management", "hr policies"],
    }
    
    # Extract expected skills from parameters or falls back to SKILLS_MAP
    expected_skills = []
    if skills_string:
        expected_skills = [s.strip().lower() for s in skills_string.split(",") if s.strip()]
        
    if not expected_skills:
        matched_key = None
        for key in SKILLS_MAP:
            if key.lower() in role.lower():
                matched_key = key
                break
        if matched_key:
            expected_skills = SKILLS_MAP[matched_key]
        else:
            expected_skills = SKILLS_MAP.get(role, ["javascript", "python", "sql", "html", "react", "system design", "docker"])
            
    # Filter expected skills to count only core, non-generic ones for the score calculations
    core_expected_skills = [s for s in expected_skills if s not in GENERIC_WORDS]
    if not core_expected_skills:
        core_expected_skills = expected_skills

    matchedSkills = []
    missingSkills = []
    for skill in expected_skills:
        pattern = r'(?i)\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower) or skill in text_lower:
            matchedSkills.append(skill)
        else:
            missingSkills.append(skill)
            
    core_matched = [s for s in matchedSkills if s not in GENERIC_WORDS]
    core_missing = [s for s in missingSkills if s not in GENERIC_WORDS]
    
    overlap_ratio = len(core_matched) / max(1, len(core_expected_skills))
    overlap_percentage = overlap_ratio * 100
            
    # FAANG Feature Extraction
    verb_count, metric_count, system_concepts = extract_advanced_features(text_lower)
    
    # Calculate score with high dependency on overlap, keeping base ML model score as secondary
    ml_part = max(0, min(100, base_score))
    raw_score = (overlap_percentage * 0.75) + (ml_part * 0.25)
    
    # Verb/metric bonuses
    bonus = min(8, (verb_count * 1) + (metric_count * 1.5))
    
    # Heavy penalty for missing core skills
    penalty = len(core_missing) * 6
    
    final_score = raw_score + bonus - penalty
    
    # Capping rules: If less than 40% of required skills are matched, ATS score should be capped below 50.
    if overlap_percentage < 40:
        final_score = min(final_score, 49)
        if overlap_percentage == 0:
            final_score = min(final_score, 20)
        elif overlap_percentage < 20:
            final_score = min(final_score, 35)
            
    final_score = max(0, min(100, int(final_score)))
    
    # Decision thresholds: >=80: Selected, 60-79: Borderline, <60: Rejected
    if final_score >= 80:
        decision = "Selected"
    elif final_score >= 60:
        decision = "Borderline"
    else:
        decision = "Rejected"

    strengths, weaknesses, improvements = generate_faang_feedback(
        final_score, decision, matchedSkills, missingSkills, verb_count, metric_count, system_concepts, role
    )
    
    exp_level = "Beginner"
    if final_score > 60:
        exp_level = "Intermediate"
    if final_score > 80:
        exp_level = "Advanced"

    reason = f"Candidate scored {final_score}/100. Evaluation utilized a strict ATS NLP model measuring semantic skill alignment ({len(core_matched)}/{len(core_expected_skills)} core skills), leadership vocabulary ({verb_count} verbs), and impact metrics ({metric_count} metrics). Profile is {decision.upper()} for high-velocity {role} environments."

    output = {
        "skillsExtracted": matchedSkills + system_concepts[:3],
        "matchedSkills": matchedSkills,
        "missingSkills": missingSkills,
        "experienceLevel": exp_level,
        "scores": {
            "skillMatch": int(min(100, overlap_percentage)),
            "experience": int(min(100, final_score + 5)),
            "projects": int(min(100, final_score - 5 + (metric_count * 5))),
            "finalScore": final_score
        },
        "decision": decision,
        "reason": reason,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "improvements": improvements
    }
    
    print(json.dumps(output))

if __name__ == "__main__":
    main()
