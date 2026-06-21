import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { groqService } from "./groqService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSER_TIMEOUT_MS = 30000; // 30s timeout

function runPythonParser(scriptPath, inputText, timeoutMs = PARSER_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const proc = spawn("python", [scriptPath], {
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`JD Parser timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      clearTimeout(timer);
      try {
        const trimmed = stdout.trim();
        if (!trimmed) {
          return reject(new Error(`JD Parser produced no output. stderr: ${stderr.slice(0, 500)}`));
        }
        const parsed = JSON.parse(trimmed);
        if (parsed.error) return reject(new Error(parsed.error));
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Failed to parse JD Parser output: ${e.message}. stdout: ${stdout.slice(0, 300)}`));
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start Python process for JD Parser: ${err.message}`));
    });

    proc.stdin.write(inputText, "utf8");
    proc.stdin.end();
  });
}

export const parseJDIntelligence = async (jdText) => {
  const pythonScript = path.join(__dirname, "../ml/jd_parser.py");
  
  // 1. Run Python JD Parser with stdin to avoid CLI truncation
  const parsed = await runPythonParser(pythonScript, jdText);

  // 2. Generate Blueprint using LLM
  const blueprintPrompt = `
    Based on this job description: "${jdText}"
    Generate a hiring blueprint in JSON format:
    {
      "technicalQuestions": ["3 focus areas"],
      "behavioralQuestions": ["2 key traits"],
      "systemDesignQuestions": ["1 relevant topic"]
    }
  `;
  
  let blueprint = {
    technicalQuestions: ["Algorithms", "Language Specifics", "Frameworks"],
    behavioralQuestions: ["Teamwork", "Problem Solving"],
    systemDesignQuestions: ["Scalability"]
  };

  try {
    const llmResponse = await groqService(blueprintPrompt);
    const cleanJson = llmResponse.match(/\{[\s\S]*\}/);
    if (cleanJson) {
      blueprint = JSON.parse(cleanJson[0]);
    }
  } catch (llmErr) {
    console.error("⚠️  LLM Blueprint error (using fallback):", llmErr.message);
  }

  return { ...parsed, blueprint };
};
