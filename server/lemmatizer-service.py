#!/usr/bin/env python3
"""
German Lemmatizer Service using Simplemma
Provides lemmatization for German words via stdin/stdout
"""

import json
import sys

try:
    import simplemma
except ImportError:
    print("ERROR: simplemma not installed. Run: pip install simplemma", file=sys.stderr)
    sys.exit(1)


def lemmatize(word: str, language: str = "de") -> dict:
    """
    Lemmatize a single German word
    """
    try:
        # simplemma returns a set of possible lemmas
        lemmas = simplemma.lemmatize(word, lang=language)
        
        if lemmas:
            # Return the first (most likely) lemma
            lemma = list(lemmas)[0]
            return {
                "word": word,
                "lemma": lemma,
                "confidence": 0.95 if lemma != word else 0.3,
                "method": "simplemma"
            }
        else:
            return {
                "word": word,
                "lemma": word,
                "confidence": 0.3,
                "method": "heuristic"
            }
    except Exception as e:
        return {
            "word": word,
            "lemma": word,
            "confidence": 0.0,
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
            word = request.get("word", "").lower()
            
            if not word:
                sys.stdout.write(json.dumps({"error": "Missing word field"}) + "\n")
                sys.stdout.flush()
                continue
            
            result = lemmatize(word)
            sys.stdout.write(json.dumps(result) + "\n")
            sys.stdout.flush()
            
        except json.JSONDecodeError:
            sys.stdout.write(json.dumps({"error": "Invalid JSON"}) + "\n")
            sys.stdout.flush()
        except Exception as e:
            sys.stdout.write(json.dumps({"error": str(e)}) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
