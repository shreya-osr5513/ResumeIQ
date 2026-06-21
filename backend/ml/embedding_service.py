import sys
import json
import os

# Suppress all model/torch loading logs to keep stdout clean for JSON
os.environ["TOKENIZERS_PARALLELISM"] = "false"
import warnings
warnings.filterwarnings("ignore")

def get_embedding(text):
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embedding = model.encode(text, show_progress_bar=False)
    return embedding.tolist()

def main():
    try:
        # Read from stdin to avoid Windows argv truncation issues with long text
        input_text = sys.stdin.read().strip()
        if not input_text:
            print(json.dumps({"error": "No input text received"}))
            sys.exit(1)

        embedding = get_embedding(input_text)
        print(json.dumps({"embedding": embedding}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
