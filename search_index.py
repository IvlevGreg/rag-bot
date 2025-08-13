import faiss
import pickle
from sentence_transformers import SentenceTransformer
import numpy as np

INDEX_FILE = "faiss.index"
META_FILE = "meta.pkl"
MODEL_NAME = "intfloat/e5-base-v2"

model = SentenceTransformer(MODEL_NAME)

def search(query, top_k=5):
    index = faiss.read_index(INDEX_FILE)
    with open(META_FILE, "rb") as f:
        meta = pickle.load(f)
    emb = model.encode(["query: " + query], normalize_embeddings=True)
    faiss.normalize_L2(emb)
    distances, ids = index.search(np.array(emb).astype('float32'), top_k)
    print("="*40)
    for i, idx in enumerate(ids[0]):
        ch = meta[idx]
        print(f"#{i+1} (score={distances[0][i]:.2f}): {ch['source']} (chunk_id={ch['chunk_id']})\n---\n{ch['text'][:400]}...\n")
    print("="*40)

if __name__ == "__main__":
    q = input("Введите запрос: ")
    search(q, top_k=5)
