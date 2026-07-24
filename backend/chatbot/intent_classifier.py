"""
Lightweight keyword-overlap based intent classifier.

Ei module-e kono external ML/NLP library (Rasa, spaCy, OpenAI) lage na —
2-week MVP-er jonno fast, offline, ar dependency-free rakhar jonno eivabe likha।
Pore full production-e eta easily replace kora jabe Rasa/OpenAI diye,
karon interface-ta shei-i thakbe: classify(query) -> (best_faq, confidence)
"""
import re

CONFIDENCE_THRESHOLD = 0.4  # ei threshold-er nichey gele staff queue-te escalate hobe

# Common filler words — egulo query-te thakle keyword-match-er score
# unnecessarily dilute kore, tai age-i shore felbo
STOPWORDS = {
    'how', 'can', 'for', 'the', 'a', 'an', 'is', 'are', 'do', 'does', 'to',
    'my', 'me', 'i', 'you', 'your', 'what', 'when', 'where', 'about', 'and',
    'of', 'in', 'on', 'with', 'this', 'that', 'it', 'be', 'was', 'were',
}


def normalize(text: str) -> set:
    """Text ke lowercase kore, punctuation shore, stopword-mukto word set banay"""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    words = set(w for w in text.split() if len(w) > 2 and w not in STOPWORDS)
    return words


def classify(query: str, faq_queryset):
    """
    Query-r shathe protyek FAQEntry-r keywords compare kore
    best match ar confidence score return kore।

    Score = ki proportion-e query-r meaningful words FAQ-keyword list-e paoya gelo
    (query-centric recall — chhoto, direct query-r jonno best fit).

    Return: (best_faq_or_None, confidence_float)
    """
    query_words = normalize(query)
    if not query_words:
        return None, 0.0

    best_faq = None
    best_score = 0.0

    for faq in faq_queryset:
        faq_keywords = set(k.strip().lower() for k in faq.keywords.split(','))
        if not faq_keywords:
            continue
        overlap = query_words & faq_keywords
        if not overlap:
            continue
        score = len(overlap) / len(query_words)
        if score > best_score:
            best_score = score
            best_faq = faq

    return best_faq, round(best_score, 2)