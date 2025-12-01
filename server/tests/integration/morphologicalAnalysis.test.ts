/**
 * Integration Tests for Morphological Analysis
 * Tests the actual grammar detection API endpoint
 */

import * as http from 'http';

const TEST_PORT = 4003; // Use different port for tests

describe('Morphological Analysis Integration', () => {
  let serverProcess: any;

  beforeAll(async () => {
    // Start test server
    const { spawn } = require('child_process');
    const path = require('path');

    serverProcess = spawn('node', [path.join(__dirname, '../../dist/src/index.js')], {
      cwd: path.join(__dirname, '../..'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: TEST_PORT.toString() }
    });

    // Wait for server to start
    await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      const checkServer = (data: Buffer) => {
        output += data.toString();
        if (output.includes('Server listening')) {
          serverProcess.stdout.off('data', checkServer);
          clearTimeout(timeout);
          // Wait a bit more for spaCy to initialize
          setTimeout(resolve, 3000);
        }
      };

      serverProcess.stdout.on('data', checkServer);
      serverProcess.stderr.on('data', (data: Buffer) => {
        console.error('Server error:', data.toString());
      });
    });
  }, 15000);

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  });

  describe('B2 Article Sentence Analysis', () => {
    const testSentence = "Auf dieser Basis erklärte das Executive Board des IOC am 4. Juni 2008 die Städte Chicago, Tokio, Rio de Janeiro und Madrid zu offiziellen Kandidaten.";

    it('should detect grammar points in complex sentence', async () => {
      const response = await makeApiRequest(`/api/grammar/analyze-detection`, {
        text: testSentence
      });

      console.log('Full API response:', JSON.stringify(response, null, 2));

      expect(response.statusCode).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.sentences).toHaveLength(1);

      const sentenceResult = response.data.sentences[0];
      console.log('=== API RESPONSE ANALYSIS ===');
      console.log('Sentence:', sentenceResult.sentence);
      console.log('Grammar points found:', sentenceResult.grammarPoints.length);

      // Log detected grammar points by category
      const pointsByCategory = sentenceResult.grammarPoints.reduce((acc: any, point: any) => {
        const category = point.grammarPoint?.category || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      console.log('Grammar points by category:', pointsByCategory);

      // Should find some grammar points
      expect(sentenceResult.grammarPoints.length).toBeGreaterThan(0);

      // Should detect agreement (known to work)
      const agreementPoints = sentenceResult.grammarPoints.filter((p: any) => p.grammarPoint.category === 'agreement');
      console.log('Agreement points found:', agreementPoints.length);
      expect(agreementPoints.length).toBeGreaterThan(0);

      // Check what categories are actually detected
      const detectedCategories = Object.keys(pointsByCategory);
      console.log('Detected categories:', detectedCategories);

      // Log individual grammar points for analysis
      console.log('\n=== GRAMMAR POINTS DETAILS ===');
      sentenceResult.grammarPoints.forEach((point: any, i: number) => {
        const highlightedText = sentenceResult.sentence.substring(point.position.start, point.position.end);
        console.log(`${i}: ${point.grammarPoint.category} - "${highlightedText}" (${point.grammarPoint.level})`);
      });

    }, 15000);
  });
});

/**
 * Make HTTP request to test API
 */
function makeApiRequest(path: string, body: any): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ statusCode: res.statusCode || 0, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode || 0, data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Analyze completeness of morphological features across tokens
 */
function analyzeMorphologicalCompleteness(tokens: any[]): {
  totalTokens: number;
  tokensWithMorph: number;
  completenessPercentage: number;
  missingFeatures: string[];
} {
  const totalTokens = tokens.length;
  let tokensWithMorph = 0;
  const allFeatures = new Set<string>();
  const presentFeatures = new Set<string>();

  tokens.forEach(token => {
    if (token.morph && Object.keys(token.morph).length > 0) {
      tokensWithMorph++;
      Object.keys(token.morph).forEach(feature => presentFeatures.add(feature));
    }

    // Track what features we expect for this POS
    const expectedFeatures = getExpectedFeaturesForPOS(token.pos);
    expectedFeatures.forEach(feature => allFeatures.add(feature));
  });

  const completenessPercentage = totalTokens > 0 ? (tokensWithMorph / totalTokens) * 100 : 0;
  const missingFeatures = Array.from(allFeatures).filter(f => !presentFeatures.has(f));

  return {
    totalTokens,
    tokensWithMorph,
    completenessPercentage,
    missingFeatures
  };
}

/**
 * Get expected morphological features for a POS tag
 */
function getExpectedFeaturesForPOS(pos: string): string[] {
  const featureMap: Record<string, string[]> = {
    'VERB': ['Tense', 'Mood', 'Person', 'Number', 'VerbForm'],
    'AUX': ['Tense', 'Mood', 'Person', 'Number', 'VerbForm'],
    'NOUN': ['Case', 'Gender', 'Number'],
    'ADJ': ['Case', 'Gender', 'Number', 'Degree'],
    'DET': ['Case', 'Gender', 'Number', 'PronType'],
    'PRON': ['Case', 'Gender', 'Number', 'PronType'],
    'ADP': [], // Prepositions typically have no morphological features
    'ADV': ['Degree'],
    'PART': [],
    'CCONJ': [],
    'SCONJ': [],
    'PUNCT': []
  };

  return featureMap[pos] || [];
}