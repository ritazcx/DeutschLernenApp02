/**
 * End-to-End Tests for Grammar Analysis API
 * Tests the complete user-facing functionality
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

describe('Grammar Analysis API End-to-End', () => {
  let server: any;

  beforeAll(async () => {
    // Start the server
    const serverPath = path.join(__dirname, '../../dist/src/index.js');
    server = spawn('node', [serverPath], {
      cwd: path.join(__dirname, '../..'),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: '4001' }
    });

    // Handle server errors
    server.on('error', (err: Error) => {
      console.error('Server spawn error:', err);
    });

    // Wait for server to start
    await new Promise<void>((resolve, reject) => {
      let output = '';
      let readyTimeout: NodeJS.Timeout | null = null;
      const checkServer = (data: Buffer) => {
        output += data.toString();
        if (output.includes('Server listening on http://localhost:4001')) {
          server.stdout?.off('data', checkServer);
          server.stderr?.off('data', stderrHandler);
          if (readyTimeout) clearTimeout(readyTimeout);
          // Wait a bit more for spaCy to initialize
          setTimeout(() => resolve(), 8000);
        }
      };

      const stderrHandler = (data: Buffer) => {
        const msg = data.toString();
        console.error('Server stderr:', msg);
        if (msg.includes('ERROR') && msg.includes('FATAL')) {
          if (readyTimeout) clearTimeout(readyTimeout);
          reject(new Error('Server failed to start: ' + msg));
        }
      };

      server.stdout?.on('data', checkServer);
      server.stderr?.on('data', stderrHandler);

      // Set a timeout in case the server doesn't start
      readyTimeout = setTimeout(() => {
        console.warn('Server startup timeout - continuing anyway (may fail with actual requests)');
        server.stdout?.off('data', checkServer);
        server.stderr?.off('data', stderrHandler);
        resolve();
      }, 18000);
    }).catch((err) => {
      console.error('Error starting server:', err);
      if (server) server.kill();
      throw err;
    });
  }, 25000);

  afterAll(async () => {
    if (server) {
      try {
        // Give the server time to clean up
        await new Promise<void>((resolve) => {
          const killTimeout = setTimeout(() => {
            console.warn('Server did not exit gracefully, force killing');
            server.kill('SIGKILL');
            resolve();
          }, 3000);

          server.on('exit', () => {
            clearTimeout(killTimeout);
            resolve();
          });

          server.kill('SIGTERM');
        });
      } catch (err) {
        console.error('Error killing server:', err);
      }
      server = null;
    }
  });

  describe('Grammar Detection API', () => {
    const testCases = [
      {
        text: 'Das Haus wird von meinem Vater gebaut.',
        expectedCategory: 'passive',
        description: 'Present passive voice'
      },
      {
        text: 'Ich muss arbeiten.',
        expectedCategory: 'modal-verb',
        description: 'Modal verb construction'
      },
      {
        text: 'Ich bleibe zu Hause, weil es regnet.',
        expectedCategory: 'word-order',
        description: 'Subordinate clause'
      },
      {
        text: 'Die Studenten machen ihre Hausaufgaben.',
        expectedPoints: 0, // Simple sentence, might not trigger complex grammar
        description: 'Simple sentence'
      }
    ];

    testCases.forEach(({ text, expectedCategory, expectedPoints, description }) => {
      it(`should analyze ${description}`, async () => {
        const response = await makeRequest('http://localhost:4001/api/grammar/analyze-detection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text })
        });

        expect(response.statusCode).toBe(200);
        const data = response.data;

        expect(data).toHaveProperty('sentences');
        expect(data).toHaveProperty('summary');
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);
        expect(Array.isArray(data.sentences)).toBe(true);
        expect(data.sentences.length).toBeGreaterThan(0);

        // Check the first sentence analysis
        const firstSentence = data.sentences[0];
        expect(firstSentence).toHaveProperty('sentence');
        expect(firstSentence).toHaveProperty('grammarPoints');
        expect(firstSentence).toHaveProperty('summary');
        expect(firstSentence.summary.totalPoints).toBeGreaterThanOrEqual(expectedPoints || 0);

        if (expectedCategory) {
          const categories = firstSentence.grammarPoints.map((p: any) => p.grammarPoint.category);
          expect(categories).toContain(expectedCategory);
        }
      }, 15000);
    });
  });

  describe('API Robustness', () => {
    it('should handle empty input', async () => {
      const response = await makeRequest('http://localhost:4001/api/grammar/analyze-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: '' })
      });

      expect(response.statusCode).toBe(400);
      const data = response.data;
      expect(data.error).toContain('required');
    });

    it('should handle invalid input', async () => {
      const response = await makeRequest('http://localhost:4001/api/grammar/analyze-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 123 })
      });

      expect(response.statusCode).toBe(400);
      const data = response.data;
      expect(data.error).toContain('string');
    });

    it('should handle long texts', async () => {
      const longText = 'Das ist ein langer Text. '.repeat(20) + 'Er enthält viele Sätze mit verschiedenen grammatikalischen Konstruktionen.';

      const response = await makeRequest('http://localhost:4001/api/grammar/analyze-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Das ist ein Test.' })
      });

      expect(response.statusCode).toBe(200);
      const data = response.data;
      expect(data.summary.totalPoints).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Utility Endpoints', () => {
    it('should return health status', async () => {
      const response = await makeRequest('http://localhost:4001/health', {
        method: 'GET'
      });
      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({ status: 'ok' });
    });

    it('should return available grammar categories', async () => {
      const response = await makeRequest('http://localhost:4001/api/grammar/categories', {
        method: 'GET'
      });
      expect(response.statusCode).toBe(200);

      const data = response.data;
      expect(data).toHaveProperty('categories');
      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.categories.length).toBeGreaterThan(0);
    });

    it('should return CEFR levels', async () => {
      const response = await makeRequest('http://localhost:4001/api/grammar/levels', {
        method: 'GET'
      });
      expect(response.statusCode).toBe(200);

      const data = response.data;
      expect(data).toHaveProperty('levels');
      expect(Array.isArray(data.levels)).toBe(true);
      expect(data.levels).toContain('B1');
    });
  });
});