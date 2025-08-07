import os
import json
from pathlib import Path

import numpy as np
from tqdm import tqdm
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import faiss
import pickle

# Настройки
KB_DIR = "knowledge_base/processed_files"
CHUNK_SIZE = 1000  # символы
CHUNK_OVERLAP = 200
MODEL_NAME = "intfloat/e5-base-v2"
INDEX_FILE = "faiss.index"
META_FILE = "meta.pkl"
SEED = 42

# Инициализация моделей
print("Загрузка модели эмбеддингов...")
model = SentenceTransformer(MODEL_NAME)

def get_documents():
    docs = []
    for fname in Path(KB_DIR).glob("*.md"):
        with open(fname, "r", encoding="utf-8") as f:
            text = f.read()
        docs.append({
            "source": str(fname),
            "text": text
        })
    return docs

def chunk_documents(docs):
    # Recursive splitter — best practice для RAG
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP
    )
    chunks = []
    for doc in tqdm(docs, desc="Chunking"):
        chunks_ = splitter.split_text(doc["text"])
        for i, chunk in enumerate(chunks_):
            chunks.append({
                "text": chunk,
                "source": doc["source"],
                "chunk_id": i
            })
    return chunks

def embed_chunks(chunks):
    texts = ["passage: " + ch['text'] for ch in chunks]
    emb = []
    batch_size = 32
    for i in tqdm(range(0, len(texts), batch_size), desc="Embeddings"):
        batch = texts[i:i+batch_size]
        embs = model.encode(batch, show_progress_bar=False, normalize_embeddings=True)
        emb.append(embs)
    emb = np.vstack(emb)
    return emb

def main():
    docs = get_documents()
    print(f"Всего документов: {len(docs)}")
    chunks = chunk_documents(docs)
    print(f"Чанков получилось: {len(chunks)}")
    embeddings = embed_chunks(chunks)
    print("Cоздаём и сохраняем FAISS-index...")
    faiss.normalize_L2(embeddings)
    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings.astype('float32'))
    faiss.write_index(index, INDEX_FILE)
    with open(META_FILE, "wb") as f:
        pickle.dump(chunks, f)
    print(f"Сохранено: {INDEX_FILE}, {META_FILE}")

if __name__ == "__main__":
    main()
