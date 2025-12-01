#!/usr/bin/env python3
"""
German spaCy NLP Service
Provides lemmatization, POS tagging, and more for German text
Communication via JSON over stdin/stdout
"""

import json
import sys

try:
    import spacy
except ImportError:
    print("ERROR: spacy not installed. Run: pip install spacy", file=sys.stderr)
    sys.exit(1)

# Load German model once at startup
try:
    nlp = spacy.load("de_core_news_sm")
except OSError:
    print("ERROR: German model not installed. Run: python -m spacy download de_core_news_sm", file=sys.stderr)
    sys.exit(1)


def lemmatize_word(word: str) -> dict:
    """
    Lemmatize and tag a single word using spaCy
    Returns: lemma, POS tag, dependency tag, and detailed morphology
    """
    try:
        doc = nlp(word)
        if len(doc) > 0:
            token = doc[0]
            
            # Convert morphological features to dictionary
            morph_dict = {}
            if token.morph:
                for feature in str(token.morph).split('|'):
                    if '=' in feature:
                        key, val = feature.split('=', 1)
                        morph_dict[key] = val
            
            return {
                "word": word,
                "lemma": token.lemma_,
                "pos": token.pos_,          # Universal POS (NOUN, VERB, ADJ, etc.)
                "tag": token.tag_,          # Language-specific tag (NN, VV, ADJ, etc.)
                "dep": token.dep_,          # Dependency relation
                "morph": morph_dict,  # Morphological features (case, tense, etc.)
                "confidence": 0.95,
                "method": "spacy"
            }
        else:
            return {
                "word": word,
                "lemma": word,
                "confidence": 0.0,
                "error": "Empty document",
                "method": "error"
            }
    except Exception as e:
        return {
            "word": word,
            "lemma": word,
            "confidence": 0.0,
            "error": str(e),
            "method": "error"
        }


def analyze_sentence(text: str) -> dict:
    """
    Full sentence analysis: lemmatization, POS, dependencies
    """
    try:
        doc = nlp(text)
        tokens = []
        
        for token in doc:
            # Convert vector_norm to float to avoid JSON serialization issues
            vector_norm = float(token.vector_norm) if token.has_vector else None
            
            # Convert morphological features to dictionary
            morph_dict = {}
            if token.morph:
                for feature in str(token.morph).split('|'):
                    if '=' in feature:
                        key, val = feature.split('=', 1)
                        morph_dict[key] = val
            
            tokens.append({
                "text": token.text,
                "lemma": token.lemma_,
                "pos": token.pos_,
                "tag": token.tag_,
                "dep": token.dep_,
                "head": token.head.text,
                "has_vector": token.has_vector,
                "vector_norm": vector_norm,
                "morph": morph_dict  # Morphological features (case, tense, etc.)
            })
        
        # Extract named entities
        entities = [
            {
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            }
            for ent in doc.ents
        ]
        
        return {
            "success": True,
            "text": text,
            "tokens": tokens,
            "entities": entities,
            "method": "spacy"
        }
    except Exception as e:
        return {
            "success": False,
            "text": text,
            "error": str(e),
            "method": "error"
        }


def main():
    """
    Main loop: read JSON from stdin, return JSON to stdout
    """
    for line in sys.stdin:
        try:
            line = line.strip()
            if not line:
                continue
            
            request = json.loads(line)
            action = request.get("action", "lemmatize")
            
            if action == "lemmatize":
                word = request.get("word", "").lower()
                if not word:
                    sys.stdout.write(json.dumps({"error": "Missing word field"}) + "\n")
                    sys.stdout.flush()
                    continue
                result = lemmatize_word(word)
                
            elif action == "analyze":
                text = request.get("text", "")
                if not text:
                    sys.stdout.write(json.dumps({"error": "Missing text field"}) + "\n")
                    sys.stdout.flush()
                    continue
                result = analyze_sentence(text)
                
            else:
                sys.stdout.write(json.dumps({"error": f"Unknown action: {action}"}) + "\n")
                sys.stdout.flush()
                continue
            
            sys.stdout.write(json.dumps(result) + "\n")
            sys.stdout.flush()
            
        except json.JSONDecodeError as e:
            sys.stdout.write(json.dumps({"error": f"Invalid JSON: {str(e)}"}) + "\n")
            sys.stdout.flush()
        except Exception as e:
            sys.stdout.write(json.dumps({"error": f"Unexpected error: {str(e)}"}) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    print("spaCy German NLP Service ready", file=sys.stderr)
    main()
