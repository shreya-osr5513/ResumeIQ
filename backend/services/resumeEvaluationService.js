import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const evaluateResume = async (resumeText, role, skills = []) => {
  return new Promise((resolve, reject) => {
    // Generate a unique temp file to hold the resume text
    const tempFileName = `resume_${crypto.randomUUID()}.txt`;
    const tempFilePath = path.join(__dirname, "../ml", tempFileName);
    
    // Write text synchronously (or async, but we await completion)
    try {
      fs.writeFileSync(tempFilePath, resumeText, 'utf8');
    } catch (fsErr) {
      console.error("Failed to write temp resume file:", fsErr);
      return reject(fsErr);
    }

    const pythonScript = path.join(__dirname, "../ml/predict_resume.py");
    const skillsString = (skills || []).join(",");
    
    execFile(
      "python",
      [pythonScript, tempFilePath, role, skillsString], // Passing file path and skills list!
      { maxBuffer: 1024 * 1024 * 10 },
      (error, stdout, stderr) => {
        // ALWAYS clean up the temp file after execution
        try { fs.unlinkSync(tempFilePath); } catch(e) {}
        
        if (error) {
          console.error("Python script ML error:", error);
          console.error("stderr:", stderr);
          return reject(error);
        }
        
        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.error) {
            reject(new Error(parsed.error));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          console.error("Failed to parse ML JSON output:", stdout);
          reject(e);
        }
      }
    );
  });
};