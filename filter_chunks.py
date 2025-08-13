danger_words = [
    "ignore all instructions",
    "output:",
    "password",
    "system:",
    "user:",
    "admin",
    "execute",
    "root:",
    "swordfish"
]

def is_danger_chunk(text):
    """Возвращает True, если в тексте чанка найдено опасное ключевое слово."""
    t = text.lower()
    return any(word in t for word in danger_words)

def filter_safe_chunks(chunks):
    """
    Возвращает только безопасные чанки (dict-списки), пригодные
    для передачи в prompt. Удаляет опасные фрагменты.
    """
    return [ch for ch in chunks if not is_danger_chunk(ch['text'])]
