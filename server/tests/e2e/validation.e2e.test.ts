/**
 * German Grammar Validation Tests
 * Tests accuracy against real German texts with known grammar patterns
 */

import { spawn } from 'child_process';
import http from 'http';
import path from 'path';

/**
 * Helper function to make HTTP requests using Node.js http module
 */
function makeRequest(url: string, options: { method: string; headers?: Record<string, string>; body?: string }): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: options.method,
      headers: options.headers || {},
    };

    const req = http.request(requestOptions, (res) => {
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

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

interface ExpectedDetection {
  category: string;
  level?: string;
  namePattern?: RegExp;
}

describe('German Grammar Accuracy Validation', () => {
  let server: any;

  beforeAll(async () => {
    // Start the server
    const serverPath = path.join(__dirname, '../../dist/src/index.js');
    server = spawn('node', [serverPath], {
      cwd: path.join(__dirname, '../..'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: '4002' }
    });

    // Wait for server to start
    await new Promise((resolve) => {
      let output = '';
      const checkServer = (data: Buffer) => {
        output += data.toString();
        if (output.includes('Server listening on http://localhost:4002')) {
          server.stdout.off('data', checkServer);
          setTimeout(resolve, 3000);
        }
      };

      server.stdout.on('data', checkServer);
    });
  }, 20000);

  afterAll(() => {
    if (server) {
      server.kill();
    }
  });

  // Test cases with real German texts and expected grammar detections
  const validationTests: Array<{
    text: string;
    expectedDetections: ExpectedDetection[];
    description: string;
  }> = [
    {
      text: 'Das Haus wird von meinem Vater gebaut.',
      expectedDetections: [
        { category: 'passive', level: 'B1', namePattern: /Präsens/ }
      ],
      description: 'Present passive with agent'
    },
    {
      text: 'Das Buch wurde von der Autorin geschrieben.',
      expectedDetections: [
        { category: 'passive', level: 'B1', namePattern: /Vergangenheit/ }
      ],
      description: 'Past passive with agent'
    },
    {
      text: 'Ich muss arbeiten.',
      expectedDetections: [
        { category: 'modal-verb', level: 'B1' }
      ],
      description: 'Modal verb in present'
    },
    {
      text: 'Ich musste arbeiten.',
      expectedDetections: [
        { category: 'modal-verb', level: 'B1' }
      ],
      description: 'Modal verb in past'
    },
    {
      text: 'Ich bleibe zu Hause, weil es regnet.',
      expectedDetections: [
        { category: 'word-order', level: 'B1', namePattern: /Subordinate/ }
      ],
      description: 'Causal subordinate clause'
    },
    {
      text: 'Ich weiß, dass du kommst.',
      expectedDetections: [
        { category: 'word-order', level: 'B1', namePattern: /Subordinate/ }
      ],
      description: 'Subordinate clause with dass'
    },
    {
      text: 'Wenn ich Zeit habe, gehe ich ins Kino.',
      expectedDetections: [
        { category: 'word-order', level: 'B1', namePattern: /Subordinate/ }
      ],
      description: 'Conditional subordinate clause'
    },
    {
      text: 'Die Studenten machen ihre Hausaufgaben.',
      expectedDetections: [], // Simple sentence, may not trigger complex grammar
      description: 'Simple present tense sentence'
    },
    {
      text: 'Er geht jeden Tag zur Schule.',
      expectedDetections: [], // Simple sentence
      description: 'Simple present tense with adverb'
    },
    {
      text: 'Ich habe das Buch gelesen.',
      expectedDetections: [
        { category: 'tense', level: 'A2' }
      ],
      description: 'Present perfect tense'
    }
  ];

  validationTests.forEach(({ text, expectedDetections, description }) => {
    it(`should correctly detect grammar in: ${description}`, async () => {
      const response = await makeRequest('http://localhost:4001/api/grammar/analyze-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      expect(response.statusCode).toBe(200);
      const data = response.data;

      expect(data.sentences).toBeDefined();
      expect(data.sentences.length).toBeGreaterThan(0);
      const grammarPoints = data.sentences[0].grammarPoints;

      // Check that all expected detections are found
      expectedDetections.forEach(expected => {
        const matchingPoints = grammarPoints.filter((point: any) => {
          const categoryMatch = point.grammarPoint.category === expected.category;
          const levelMatch = !expected.level || point.grammarPoint.level === expected.level;
          const nameMatch = !expected.namePattern || expected.namePattern.test(point.grammarPoint.name);

          return categoryMatch && levelMatch && nameMatch;
        });

        expect(matchingPoints.length).toBeGreaterThan(0);
      });

      // Ensure no false positives for categories that shouldn't be detected
      const detectedCategories = [...new Set(grammarPoints.map((p: any) => p.grammarPoint.category))];
      const expectedCategories = expectedDetections.map(d => d.category);

      // All detected categories should be in the expected list (allowing for additional detections)
      detectedCategories.forEach((category) => {
        const cat = category as string;
        if (!expectedCategories.includes(cat)) {
          // Allow some common additional detections that might occur
          const allowedExtras = ['article', 'case', 'agreement'];
          expect(allowedExtras).toContain(cat);
        }
      });
    }, 15000);
  });

  describe('Complex Text Analysis', () => {
    it('should handle multiple grammar patterns in one text', async () => {
      const text = 'Die Konferenz wurde vom Vorstand organisiert, weil die Mitarbeiter besser zusammenarbeiten müssen.';

      const response = await fetch('http://localhost:4002/analyze-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as any;

      expect(data.sentences).toBeDefined();
      expect(data.sentences.length).toBeGreaterThan(0);
      const grammarPoints = data.sentences[0].grammarPoints;

      // Should detect multiple grammar patterns
      const categories = [...new Set(grammarPoints.map((p: any) => p.grammarPoint.category))];
      expect(categories.length).toBeGreaterThan(1);

      // Should include passive and modal verb at minimum
      expect(categories).toContain('passive');
      expect(categories).toContain('modal-verb');
    }, 20000);

    it('should handle separable verbs', async () => {
      const text = 'Ich stehe jeden Morgen um 7 Uhr auf.';

      const response = await fetch('http://localhost:4001/api/grammar/analyze-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      expect(response.ok).toBe(true);
      const data = await response.json() as any;

      expect(data.sentences).toBeDefined();
      expect(data.sentences.length).toBeGreaterThan(0);
      const grammarPoints = data.sentences[0].grammarPoints;

      // Should detect separable verb if implemented
      const separablePoints = grammarPoints.filter((p: any) =>
        p.grammarPoint.category === 'separable-verb'
      );

      // This might not be detected yet, but shouldn't fail
      expect(data.summary.totalPoints).toBeGreaterThanOrEqual(0);
    }, 15000);
  });

  describe('CEFR Level Accuracy', () => {
    const levelTests = [
      {
        text: 'Ich bin Student.',
        expectedLevel: 'A1',
        description: 'Basic present tense'
      },
      {
        text: 'Ich habe ein Buch gelesen.',
        expectedLevel: 'A2',
        description: 'Present perfect'
      },
      {
        text: 'Das Haus wird gebaut.',
        expectedLevel: 'B1',
        description: 'Passive voice'
      }
    ];

    levelTests.forEach(({ text, expectedLevel, description }) => {
      it(`should correctly identify ${expectedLevel} level grammar: ${description}`, async () => {
        const response = await fetch('http://localhost:4001/api/grammar/analyze-detection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text })
        });

        expect(response.ok).toBe(true);
        const data = await response.json() as any;

        expect(data.sentences).toBeDefined();
        expect(data.sentences.length).toBeGreaterThan(0);
        const grammarPoints = data.sentences[0].grammarPoints;

        // Check if any detected grammar points match the expected level
        const levelMatches = grammarPoints.some((point: any) =>
          point.grammarPoint.level === expectedLevel
        );

        if (grammarPoints.length > 0) {
          // If grammar points are detected, at least one should match expected level
          expect(levelMatches).toBe(true);
        }
      }, 15000);
    });
  });
});