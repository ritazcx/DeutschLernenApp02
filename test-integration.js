import { spawn } from 'child_process';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test sentences from A1 to C1 levels
const testSentences = [
  { text: "Ich bin Student.", level: "A1", expected: "Basic present tense" },
  { text: "Das ist der Mann, der gestern gekommen ist.", level: "B1", expected: "Relative clause" },
  { text: "Das Haus wird von meinem Vater gebaut.", level: "B2", expected: "Passive voice with agent" },
  { text: "Ich wünschte, ich wäre reich.", level: "B2", expected: "Subjunctive II (Konjunktiv II)" },
  { text: "Hätte ich mehr Zeit gehabt, wäre ich gekommen.", level: "C1", expected: "Mixed conditional" },
  { text: "Er hat mir gesagt, dass er kommen würde.", level: "B2", expected: "Indirect speech subjunctive" },
  { text: "Ich lasse das Auto reparieren.", level: "B2", expected: "Causative construction" },
  { text: "Sich die Zähne putzen ist wichtig.", level: "A2", expected: "Reflexive verb" }
];

async function testGrammarDetection() {
  console.log('🚀 Starting comprehensive grammar detection test...\n');

  // Start server
  const serverPath = path.join(__dirname, 'server', 'dist', 'index.js');
  console.log('📡 Starting server:', serverPath);

  const server = spawn('node', [serverPath], {
    cwd: path.join(__dirname, 'server'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Wait for server to start
  await new Promise((resolve) => {
    let output = '';
    const checkServer = (data) => {
      output += data.toString();
      if (output.includes('Server listening on http://localhost:4000')) {
        console.log('✅ Server started successfully\n');
        server.stdout.off('data', checkServer);
        // Wait a bit more for spaCy to initialize
        setTimeout(resolve, 2000);
      }
    };

    server.stdout.on('data', checkServer);
    server.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });
  });

  // Test each sentence
  for (let i = 0; i < testSentences.length; i++) {
    const { text, level, expected } = testSentences[i];
    console.log(`🧪 Test ${i + 1}/${testSentences.length}: ${level} - ${expected}`);
    console.log(`   Text: "${text}"`);

    try {
      const response = await fetch('http://localhost:4000/api/grammar/analyze-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        console.error(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
      } else {
        const data = await response.json();
        const points = data.summary.totalPoints;
        const detectedLevels = Object.entries(data.summary.levels)
          .filter(([_, count]) => count > 0)
          .map(([level, count]) => `${level}:${count}`)
          .join(', ');

        console.log(`   ✅ Found ${points} grammar points`);
        console.log(`   📊 Levels: ${detectedLevels || 'none'}`);

        // Show top grammar points
        if (data.grammarPoints && data.grammarPoints.length > 0) {
          const topPoints = data.grammarPoints.slice(0, 2).map(point =>
            `${point.grammarPoint.category} (${point.grammarPoint.level}): ${point.grammarPoint.name}`
          );
          console.log(`   🎯 Top detections: ${topPoints.join(' | ')}`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Test failed: ${error.message}`);
    }

    console.log(''); // Empty line between tests
  }

  // Clean up
  console.log('🛑 Stopping server...');
  server.kill();
  console.log('✅ All tests completed');
}

testGrammarDetection().catch(console.error);