import sys
import json
import re

def extract_skills(text):
    SKILLS_DATABASE = [
        "python", "java", "react", "node.js", "nodejs", "c++", "kubernetes", "system design", "algorithms",
        "mongodb", "postgresql", "redis", "docker", "aws", "gcp", "azure", "kafka", "microservices",
        "typescript", "javascript", "next.js", "tailwind", "express", "express.js", "sql", "nosql",
        "git", "ci/cd", "rest api", "rest apis", "graphql", "nginx", "linux", "devops",
        "machine learning", "deep learning", "tensorflow", "pytorch", "pandas", "numpy",
        "spring", "django", "flask", "fastapi", "vue.js", "angular", "svelte"
    ]

    found_skills = []
    text_lower = text.lower()
    for skill in SKILLS_DATABASE:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            found_skills.append(skill)
    return found_skills

def estimate_difficulty(text):
    text_lower = text.lower()
    if any(word in text_lower for word in ["senior", "lead", "architect", "principal", "staff", "7+", "10+"]):
        return "High"
    if any(word in text_lower for word in ["mid", "intermediate", "3+", "4+", "5+"]):
        return "Medium"
    return "Low"

def extract_experience(text):
    match = re.search(r'(\d+)\+?\s*(years?|yrs?)', text, re.IGNORECASE)
    if match:
        return match.group(0)
    return "Not specified"

def classify_domain(text):
    text_lower = text.lower()
    if any(word in text_lower for word in ["frontend", "ui", "ux", "react", "css", "html", "vue", "angular"]):
        return "Frontend"
    if any(word in text_lower for word in ["backend", "server", "api", "database", "node", "express", "django", "flask"]):
        return "Backend"
    if any(word in text_lower for word in ["fullstack", "full-stack", "full stack"]):
        return "Fullstack"
    if any(word in text_lower for word in ["data science", "machine learning", "ml", "ai", "deep learning", "nlp"]):
        return "Data Science/AI"
    if any(word in text_lower for word in ["devops", "cloud", "kubernetes", "docker", "aws", "gcp", "azure"]):
        return "DevOps/Cloud"
    return "General Engineering"

def generate_rubric(domain, skills):
    rubric = {
        "Technical Skills": 45,
        "Problem Solving": 20,
        "Communication": 15,
        "System Design": 20
    }
    if domain == "Frontend":
        rubric = {"UI/UX Design": 25, "Technical Skills": 35, "Problem Solving": 20, "Communication": 20}
    elif domain == "Data Science/AI":
        rubric = {"ML Knowledge": 40, "Statistical Reasoning": 25, "Technical Skills": 20, "Communication": 15}
    elif domain == "DevOps/Cloud":
        rubric = {"Infrastructure Knowledge": 35, "Automation": 25, "Technical Skills": 25, "Communication": 15}
    return rubric

def main():
    try:
        # Read input from stdin to avoid Windows CLI arg length issues
        jd_text = sys.stdin.read().strip()
        if not jd_text:
            print(json.dumps({"error": "No JD text received"}))
            sys.exit(1)

        skills = extract_skills(jd_text)
        difficulty = estimate_difficulty(jd_text)
        experience = extract_experience(jd_text)
        domain = classify_domain(jd_text)
        rubric = generate_rubric(domain, skills)

        print(json.dumps({
            "skills": skills,
            "experience": experience,
            "domain": domain,
            "difficulty": difficulty,
            "rubric": rubric
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
