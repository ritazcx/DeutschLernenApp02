import { spawn } from 'child_process';
import http from 'http';

console.log('Starting server...');
const server = spawn('node', ['server/dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  cwd: process.cwd()
});

let serverStarted = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('Server output:', output.trim());
  if (output.includes('Server listening on http://localhost:4000') && !serverStarted) {
    serverStarted = true;
    console.log('Server started, waiting for spaCy initialization...');
    
    // Wait a bit for spaCy to initialize
    setTimeout(() => {
      console.log('Testing passive voice...');

      // Test the passive voice
      const testText = process.argv[2] || 'Das Haus wird von meinem Vater gebaut.';
      console.log('Testing passive voice with:', testText);
      const data = JSON.stringify({ text: testText });
      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/grammar/analyze-detection',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log('API Response status:', res.statusCode);
          try {
            const result = JSON.parse(body);
            console.log('Grammar points found:', result.grammarPoints?.length || 0);
            if (result.grammarPoints && result.grammarPoints.length > 0) {
              console.log('First grammar point:', result.grammarPoints[0].grammarPoint.name);
            }
          } catch (e) {
            console.log('Response body:', body);
          }
          server.kill();
        });
      });

      req.on('error', (e) => {
        console.error('Request error:', e);
        server.kill();
      });

      req.write(data);
      req.end();
    }, 5000); // Wait 5 seconds for spaCy initialization
  }
});

server.on('exit', () => {
  console.log('Server exited');
});

setTimeout(() => {
  console.log('Timeout - killing server');
  server.kill();
}, 20000);