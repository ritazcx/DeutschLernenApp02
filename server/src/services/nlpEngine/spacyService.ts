/**
 * spaCy German NLP Service Wrapper
 * Manages communication with Python spaCy service via child process
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface SpacyLemmatizerResult {
  word: string;
  lemma: string;
  pos?: string;          // Universal POS (NOUN, VERB, ADJ, ADP, etc.)
  tag?: string;          // Language-specific tag (NN, VV, ADJ, etc.)
  dep?: string;          // Dependency relation
  morph?: Record<string, string>;  // Morphological features
  confidence: number;
  method: string;
  error?: string;
}

export interface SpacyToken {
  text: string;
  lemma: string;
  pos: string;
  tag: string;
  dep: string;
  head: string;
  has_vector: boolean;
  vector_norm?: number;
}

export interface SpacyAnalysisResult {
  success: boolean;
  text: string;
  tokens?: SpacyToken[];
  entities?: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
  }>;
  error?: string;
  method: string;
}

export class SpacyService {
  private process: ChildProcess | null = null;
  private ready = false;
  private queue: Array<{
    request: string;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  private lruCache: Map<string, any> = new Map();
  private maxCacheSize = 10000;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the spaCy Python service
   */
  private initialize(): void {
    // Use relative path to spacy-service.py
    const scriptPath = path.join(__dirname, '../../../spacy-service.py');
    
    try {
      this.process = spawn('python3', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        cwd: path.dirname(scriptPath) // Set working directory to script directory
      });

      // Handle stdout (responses)
      this.process.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            const queued = this.queue.shift();
            if (queued) {
              queued.resolve(response);
            }
          } catch (e) {
            const queued = this.queue.shift();
            if (queued) {
              queued.reject(new Error(`Invalid JSON response: ${line}`));
            }
          }
        }
      });

      // Handle stderr (logs)
      this.process.stderr?.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        if (message.includes('ready')) {
          this.ready = true;
        } else if (message.includes('ERROR')) {
          console.error('spaCy service error:', message);
        }
      });

      // Handle process exit
      this.process.on('exit', (code: number) => {
        console.error(`spaCy service exited with code ${code}`);
        this.ready = false;
        // Attempt restart after delay
        setTimeout(() => this.initialize(), 5000);
      });

      // Handle process error
      this.process.on('error', (error) => {
        console.error('spaCy process error:', error);
        this.ready = false;
      });

      // Wait a bit for service to be ready
      setTimeout(() => {
        if (!this.ready) {
          this.ready = true;
        }
      }, 5000); // Increased from 2000 to 5000
    } catch (error) {
      console.error('Failed to start spaCy service:', error);
      this.ready = false;
    }
  }

  /**
   * Send request to spaCy service
   */
  private async sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ready || !this.process) {
        reject(new Error('spaCy service not ready'));
        return;
      }

      this.queue.push({
        request: JSON.stringify(request),
        resolve,
        reject
      });

      try {
        this.process.stdin?.write(JSON.stringify(request) + '\n');
      } catch (error) {
        this.queue.pop();
        reject(error);
      }
    });
  }

  /**
   * Lemmatize a single word
   */
  async lemmatize(word: string): Promise<SpacyLemmatizerResult> {
    const lowerWord = word.toLowerCase();
    
    // Check cache
    const cacheKey = `lemma:${lowerWord}`;
    if (this.lruCache.has(cacheKey)) {
      return this.lruCache.get(cacheKey);
    }

    try {
      const result = await this.sendRequest({
        action: 'lemmatize',
        word: lowerWord
      });

      const response: SpacyLemmatizerResult = {
        word,
        lemma: result.lemma || lowerWord,
        pos: result.pos,
        tag: result.tag,
        confidence: result.confidence ?? 0.95,
        method: result.method || 'spacy'
      };

      // Cache the result
      this.lruCache.set(cacheKey, response);
      if (this.lruCache.size > this.maxCacheSize) {
        const firstKey = this.lruCache.keys().next().value as string;
        if (firstKey) this.lruCache.delete(firstKey);
      }

      return response;
    } catch (error) {
      console.error('spaCy lemmatization error:', error);
      return {
        word,
        lemma: word,
        confidence: 0.0,
        method: 'error',
        error: String(error)
      };
    }
  }

  /**
   * Analyze a complete sentence
   */
  async analyzeSentence(text: string): Promise<SpacyAnalysisResult> {
    // Check cache
    const cacheKey = `analysis:${text.toLowerCase()}`;
    if (this.lruCache.has(cacheKey)) {
      return this.lruCache.get(cacheKey);
    }

    try {
      const result = await this.sendRequest({
        action: 'analyze',
        text
      });

      const response: SpacyAnalysisResult = {
        success: result.success ?? true,
        text,
        tokens: result.tokens,
        entities: result.entities,
        method: result.method || 'spacy',
        error: result.error
      };

      // Cache the result
      this.lruCache.set(cacheKey, response);
      if (this.lruCache.size > this.maxCacheSize) {
        const firstKey = this.lruCache.keys().next().value as string;
        if (firstKey) this.lruCache.delete(firstKey);
      }

      return response;
    } catch (error) {
      console.error('spaCy analysis error:', error);
      return {
        success: false,
        text,
        method: 'error',
        error: String(error)
      };
    }
  }

  /**
   * Close the service
   */
  close(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.ready = false;
  }
}

// Singleton instance
let instance: SpacyService | null = null;

export function getSpacyService(): SpacyService {
  if (!instance) {
    instance = new SpacyService();
  }
  return instance;
}
