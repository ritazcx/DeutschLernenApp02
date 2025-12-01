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
  morph?: Record<string, string>;  // Morphological features
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
    // Calculate the correct path to spacy-service.py
    // In production (dist), __dirname is /path/to/dist/services/nlpEngine
    // We need to go up to the server root and find spacy-service.py
    // The file is at /server/spacy-service.py relative to the project
    const scriptPath = path.join(__dirname, '../../../../spacy-service.py');
    
    // Fallback: try to find it in common locations
    const fallbackPaths = [
      path.join(__dirname, '../../../../spacy-service.py'),  // From dist/services/nlpEngine
      path.join(__dirname, '../../../spacy-service.py'),      // From dist
      path.join(process.cwd(), 'spacy-service.py'),          // In current working directory
      '/opt/render/project/src/server/spacy-service.py',     // Render specific path
    ];

    console.log(`[spaCy Service] Initialization starting...`);
    console.log(`[spaCy Service] __dirname: ${__dirname}`);
    console.log(`[spaCy Service] process.cwd(): ${process.cwd()}`);
    console.log(`[spaCy Service] Primary script path: ${scriptPath}`);
    
    // Find the first path that exists
    let resolvedScriptPath = scriptPath;
    let found = false;
    
    const fs = require('fs');
    for (const p of fallbackPaths) {
      if (fs.existsSync(p)) {
        resolvedScriptPath = p;
        found = true;
        console.log(`[spaCy Service] ✓ Found script at: ${p}`);
        break;
      }
    }
    
    if (!found) {
      console.error(`[spaCy Service] ✗ Could not find spacy-service.py in any location:`);
      fallbackPaths.forEach(p => console.error(`  - ${p}`));
    }

    console.log(`[spaCy Service] Script exists: ${fs.existsSync(resolvedScriptPath)}`);
    console.log(`[spaCy Service] Node version: ${process.version}`);
    console.log(`[spaCy Service] Current working directory: ${process.cwd()}`);
    console.log(`[spaCy Service] Environment PATH: ${process.env.PATH}`);

    try {
      // Try python3 first, then python, then use which to find it
      let pythonCmd = 'python3';
      
      // For Render environment where python might be the only available command
      const { execSync } = require('child_process');
      try {
        execSync('which python3', { stdio: 'pipe' });
        console.log(`[spaCy Service] Found python3 in PATH`);
      } catch {
        console.warn(`[spaCy Service] python3 not found in PATH, trying python...`);
        try {
          execSync('which python', { stdio: 'pipe' });
          pythonCmd = 'python';
          console.log(`[spaCy Service] Found python in PATH`);
        } catch {
          console.error(`[spaCy Service] ERROR: Neither python3 nor python found in PATH`);
          console.error(`[spaCy Service] Attempting spawn anyway with: ${pythonCmd}`);
        }
      }

      console.log(`[spaCy Service] Spawning process with: ${pythonCmd} ${resolvedScriptPath}`);
      
      this.process = spawn(pythonCmd, [resolvedScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        cwd: path.dirname(resolvedScriptPath) // Set working directory to script directory
      });

      console.log(`[spaCy Service] Process spawned, PID: ${this.process?.pid}`);
      
      if (!this.process) {
        throw new Error('Failed to spawn process - process is null');
      }

      // Handle stdout (responses)
      this.process.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          console.log(`[spaCy Service] stdout: ${line}`);
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
        console.log(`[spaCy Service] stderr: ${message}`);
        if (message.includes('ready')) {
          this.ready = true;
          console.log('[spaCy Service] ✓ Service marked as READY');
        } else if (message.includes('ERROR')) {
          console.error('spaCy service error:', message);
        }
      });

      // Handle process exit
      this.process.on('exit', (code: number) => {
        console.error(`[spaCy Service] ✗ Process exited with code ${code}`);
        console.error(`[spaCy Service] This means spaCy Python service failed to start or crashed`);
        this.ready = false;
        // Attempt restart after delay
        setTimeout(() => {
          console.log(`[spaCy Service] Attempting to restart...`);
          this.initialize();
        }, 5000);
      });

      // Handle process error
      this.process.on('error', (error) => {
        console.error(`[spaCy Service] ✗ Process error:`, error);
        console.error(`[spaCy Service] This could mean: python not found, permission denied, or other OS error`);
        this.ready = false;
      });

      // Wait a bit for service to be ready
      setTimeout(() => {
        if (!this.ready) {
          console.warn('[spaCy Service] ⚠️ Service not marked as ready after 5s, assuming ready anyway');
          this.ready = true;
        } else {
          console.log('[spaCy Service] ✓ Service ready confirmed');
        }
      }, 5000);
    } catch (error) {
      console.error(`[spaCy Service] ✗ Fatal error during initialization:`, error);
      console.error(`[spaCy Service] Stack:`, (error as Error).stack);
      this.ready = false;
      // Try to restart after a delay
      setTimeout(() => {
        console.log(`[spaCy Service] Attempting to restart after fatal error...`);
        this.initialize();
      }, 5000);
    }
  }

  /**
   * Send request to spaCy service
   */
  private async sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ready) {
        console.error(`[spaCy Service] ✗ Cannot send request - service not ready (ready=${this.ready}, process=${this.process ? 'exists' : 'null'})`);
        reject(new Error('spaCy service not ready'));
        return;
      }

      if (!this.process) {
        console.error(`[spaCy Service] ✗ Cannot send request - process is null`);
        reject(new Error('spaCy service process is null'));
        return;
      }

      const requestId = Math.random().toString(36).substring(7);
      console.log(`[spaCy Service] → Sending request [${requestId}]: ${JSON.stringify(request).substring(0, 100)}...`);

      this.queue.push({
        request: JSON.stringify(request),
        resolve: (data: any) => {
          console.log(`[spaCy Service] ← Received response [${requestId}]: ${JSON.stringify(data).substring(0, 100)}...`);
          resolve(data);
        },
        reject: (error: any) => {
          console.error(`[spaCy Service] ✗ Error response [${requestId}]:`, error);
          reject(error);
        }
      });

      try {
        this.process.stdin?.write(JSON.stringify(request) + '\n');
      } catch (error) {
        console.error(`[spaCy Service] ✗ Error writing to stdin [${requestId}]:`, error);
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
