import sys
import json
import numpy as np
import faiss


def interpolate_cosine_to_percentage(cosine_score):
    """
    Deterministic piecewise linear interpolation mapping (softer curve for all-MiniLM-L6-v2):
    raw cosine <= 0.10 -> 0-20
    0.10 - 0.20 -> 20-50
    0.20 - 0.30 -> 50-75
    0.30 - 0.40 -> 75-90
    > 0.40      -> 90-100
    """
    cs = float(cosine_score)
    cs = max(0.0, min(1.0, cs))  # clamp to [0, 1]

    if cs <= 0.10:
        # 0.0->0, 0.10->20
        return (cs / 0.10) * 20.0
    elif cs <= 0.20:
        # 0.10->20, 0.20->50
        t = (cs - 0.10) / 0.10
        return 20.0 + t * 30.0
    elif cs <= 0.30:
        # 0.20->50, 0.30->75
        t = (cs - 0.20) / 0.10
        return 50.0 + t * 25.0
    elif cs <= 0.40:
        # 0.30->75, 0.40->90
        t = (cs - 0.30) / 0.10
        return 75.0 + t * 15.0
    else:
        # 0.40->90, 1.0->100
        t = (cs - 0.40) / 0.60
        return 90.0 + t * 10.0


def calculate_similarity(query_embedding, collection_embeddings):
    """
    Uses FAISS IndexFlatIP with L2 normalization to compute cosine similarity.
    Returns raw cosine scores (0..1 range).
    """
    # Convert to float32 as required by FAISS
    query_embedding = np.array([query_embedding]).astype('float32')
    collection_embeddings = np.array(collection_embeddings).astype('float32')

    # Dimension of embeddings
    d = query_embedding.shape[1]

    # Create the index — Inner Product with normalized vectors = Cosine Similarity
    index = faiss.IndexFlatIP(d)

    # L2-normalize both query and collection before adding to index
    faiss.normalize_L2(query_embedding)
    faiss.normalize_L2(collection_embeddings)

    index.add(collection_embeddings)

    # Search for top k matches (all of them to get scores for every candidate)
    k = collection_embeddings.shape[0]
    distances, indices = index.search(query_embedding, k)

    # distances here are cosine similarity in [0, 1] range (after L2 normalization)
    return distances[0], indices[0]


def main():
    try:
        # Read from stdin to avoid CLI argument limits / encoding issues
        input_data = sys.stdin.read().strip()
        if not input_data:
            print(json.dumps({"error": "Missing input data"}))
            sys.exit(1)

        data = json.loads(input_data)
        query_embedding = data['query_embedding']
        collection_embeddings = data['collection_embeddings']

        cosine_scores, original_indices = calculate_similarity(query_embedding, collection_embeddings)

        # Format output — apply deterministic interpolation mapping
        results = []
        for cosine_score, idx in zip(cosine_scores, original_indices):
            percentage = interpolate_cosine_to_percentage(cosine_score)
            results.append({
                "index": int(idx),
                "score": round(percentage, 2),   # percentage in [0, 100]
                "cosine": round(float(cosine_score), 4)  # raw cosine for debugging
            })

        print(json.dumps({"results": results}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
