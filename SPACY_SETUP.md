# spaCy Setup for Deutsche Lernen App

This app uses spaCy for German NLP lemmatization. Follow these steps:

## Installation

### 1. Install Python spaCy library
```bash
pip install spacy
```

### 2. Download German language model
```bash
python -m spacy download de_core_news_sm
```

The model is about 38MB and includes:
- Lemmatization
- POS tagging
- Dependency parsing
- Named entity recognition
- Word vectors

### 3. Build and run the app
```bash
cd server
npm run build
npm start
```

The Node.js app will automatically spawn the Python spaCy service when it starts.

## How It Works

1. **Frontend**: Makes HTTP requests to Node.js server
2. **Node.js**: Sends JSON requests to Python spaCy service via stdin
3. **Python**: Uses spaCy to lemmatize words and analyze sentences
4. **Results**: Cached and returned to frontend

## Troubleshooting

### "spaCy service not ready"
- Make sure Python 3 is installed: `python3 --version`
- Make sure spaCy is installed: `python3 -m spacy info`
- Check German model: `python3 -c "import spacy; nlp = spacy.load('de_core_news_sm')"`

### "Cannot find module"
- Make sure you're in the `server` directory when running npm commands
- Run `npm install` to install Node dependencies

### Performance Issues
- The service caches results (10,000 most recent), so repeated words are fast
- First load of model takes ~2-3 seconds
- Subsequent calls are <100ms per word

## Architecture Benefits

1. **Reliable Lemmatization**: spaCy's German models have 94-97% accuracy
2. **Multi-purpose**: Can be extended for NER, POS tagging, dependency parsing
3. **Production-ready**: Used by thousands of production apps
4. **Fast**: LRU caching prevents redundant processing
5. **Maintainable**: Clear separation of Python NLP and Node.js API
