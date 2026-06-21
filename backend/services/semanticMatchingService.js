import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMBEDDING_TIMEOUT_MS = 60000; // 60s — model loading can be slow on first call

/**
 * Run a Python script, piping `inputText` to stdin.
 * Returns parsed JSON output.
 */
function runPythonScript(scriptPath, inputText, timeoutMs = EMBEDDING_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const proc = spawn("python", [scriptPath], {
      env: { ...process.env, TOKENIZERS_PARALLELISM: "false" },
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`Python script timed out after ${timeoutMs / 1000}s: ${path.basename(scriptPath)}`));
    }, timeoutMs);

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      clearTimeout(timer);
      try {
        const trimmed = stdout.trim();
        if (!trimmed) {
          return reject(new Error(`Python script produced no output. stderr: ${stderr.slice(0, 500)}`));
        }
        const parsed = JSON.parse(trimmed);
        if (parsed.error) return reject(new Error(parsed.error));
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${e.message}. stdout: ${stdout.slice(0, 300)}`));
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });

    // Write input to stdin and close it
    proc.stdin.write(inputText, "utf8");
    proc.stdin.end();
  });
}

/**
 * Generate a 384-dim embedding vector for text.
 * Falls back to [] on error.
 */
export const getEmbedding = async (text) => {
  const scriptPath = path.join(__dirname, "../ml/embedding_service.py");
  try {
    const result = await runPythonScript(scriptPath, text);
    return result.embedding || [];
  } catch (error) {
    console.error("⚠️  getEmbedding failed (returning empty vector):", error.message);
    return []; // Non-fatal: role still saves without embedding
  }
};

/**
 * Calculate cosine similarity between a query embedding and a set of collection embeddings.
 */
export const calculateSemanticSimilarity = async (queryEmbedding, collectionEmbeddings) => {
  const scriptPath = path.join(__dirname, "../ml/faiss_index.py");
  const inputData = JSON.stringify({
    query_embedding: queryEmbedding,
    collection_embeddings: collectionEmbeddings,
  });
  try {
    const result = await runPythonScript(scriptPath, inputData, 30000);
    return result.results || [];
  } catch (error) {
    console.error("⚠️  calculateSemanticSimilarity failed:", error.message);
    return collectionEmbeddings.map((_, i) => ({ index: i, score: 0 }));
  }
};
