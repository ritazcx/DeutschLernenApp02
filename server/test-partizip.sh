#!/bin/bash

# Test Extended Participial Attributes Detector

BASE_URL="http://localhost:4000/api"

echo "=========================================="
echo "Testing Extended Participial Attributes"
echo "=========================================="
echo ""

# Test 1: Simple Partizip I
echo "Test 1: Simple Partizip I - 'Der lesende Student lernt Deutsch.'"
curl -s -X POST "$BASE_URL/grammar/analyze-detection" \
  -H "Content-Type: application/json" \
  -d '{"text": "Der lesende Student lernt Deutsch."}' | jq '.sentences[0].grammarPoints[] | select(.grammarPoint.category == "participial-attribute") | {name: .grammarPoint.name, text: .details.text, metadata: .details.metadata}'
echo ""

# Test 2: Simple Partizip II
echo "Test 2: Simple Partizip II - 'Das geschriebene Buch liegt auf dem Tisch.'"
curl -s -X POST "$BASE_URL/grammar/analyze-detection" \
  -H "Content-Type: application/json" \
  -d '{"text": "Das geschriebene Buch liegt auf dem Tisch."}' | jq '.sentences[0].grammarPoints[] | select(.grammarPoint.category == "participial-attribute") | {name: .grammarPoint.name, text: .details.text, metadata: .details.metadata}'
echo ""

# Test 3: Partizip II with preposition
echo "Test 3: With preposition - 'Das von ihm gemalte Bild ist schön.'"
curl -s -X POST "$BASE_URL/grammar/analyze-detection" \
  -H "Content-Type: application/json" \
  -d '{"text": "Das von ihm gemalte Bild ist schön."}' | jq '.sentences[0].grammarPoints[] | select(.grammarPoint.category == "participial-attribute") | {name: .grammarPoint.name, text: .details.text, metadata: .details.metadata}'
echo ""

# Test 4: Partizip II with adverb
echo "Test 4: With adverb - 'Das sehr gut geschriebene Buch ist beliebt.'"
curl -s -X POST "$BASE_URL/grammar/analyze-detection" \
  -H "Content-Type: application/json" \
  -d '{"text": "Das sehr gut geschriebene Buch ist beliebt."}' | jq '.sentences[0].grammarPoints[] | select(.grammarPoint.category == "participial-attribute") | {name: .grammarPoint.name, text: .details.text, metadata: .details.metadata}'
echo ""

# Test 5: Partizip I with reflexive pronoun
echo "Test 5: With reflexive - 'Die sich entwickelnde Wirtschaft ist stabil.'"
curl -s -X POST "$BASE_URL/grammar/analyze-detection" \
  -H "Content-Type: application/json" \
  -d '{"text": "Die sich entwickelnde Wirtschaft ist stabil."}' | jq '.sentences[0].grammarPoints[] | select(.grammarPoint.category == "participial-attribute") | {name: .grammarPoint.name, text: .details.text, metadata: .details.metadata}'
echo ""

# Test 6: Complex Partizip II
echo "Test 6: Complex - 'Der vor zwei Jahren erschienene Roman ist berühmt.'"
curl -s -X POST "$BASE_URL/grammar/analyze-detection" \
  -H "Content-Type: application/json" \
  -d '{"text": "Der vor zwei Jahren erschienene Roman ist berühmt."}' | jq '.sentences[0].grammarPoints[] | select(.grammarPoint.category == "participial-attribute") | {name: .grammarPoint.name, text: .details.text, metadata: .details.metadata}'
echo ""

# Test 7: Another Partizip I example
echo "Test 7: Partizip I - 'Die lachenden Kinder spielen im Park.'"
curl -s -X POST "$BASE_URL/grammar/analyze-detection" \
  -H "Content-Type: application/json" \
  -d '{"text": "Die lachenden Kinder spielen im Park."}' | jq '.sentences[0].grammarPoints[] | select(.grammarPoint.category == "participial-attribute") | {name: .grammarPoint.name, text: .details.text, metadata: .details.metadata}'
echo ""

# Test 8: Regular adjectives (should NOT be detected)
echo "Test 8: Regular adjectives (should NOT detect) - 'Der große blaue Ball rollt.'"
curl -s -X POST "$BASE_URL/grammar/analyze-detection" \
  -H "Content-Type: application/json" \
  -d '{"text": "Der große blaue Ball rollt."}' | jq '.sentences[0].grammarPoints[] | select(.grammarPoint.category == "participial-attribute") | {name: .grammarPoint.name, text: .details.text, metadata: .details.metadata}'
echo ""

echo "=========================================="
echo "Tests completed!"
echo "=========================================="
