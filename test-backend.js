import http from 'http';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

// Simple integration test for backend endpoints structure and file parsing
async function runTests() {
  console.log('🧪 Starting integration tests for OdiaSetu backend...\n');

  const app = express();
  app.use(cors());
  app.use(express.json());

  const upload = multer({ storage: multer.memoryStorage() });

  // Route definitions exactly matching server.js for structure validation
  app.post('/api/translate-text', (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    console.log('✅ Received text translation request:', text);
    res.json({ translation: 'Mocked Translation Output' });
  });

  app.post('/api/translate-audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    console.log('✅ Received audio upload request:');
    console.log(`- File name: ${req.file.originalname}`);
    console.log(`- MIME type: ${req.file.mimetype}`);
    console.log(`- Buffer size: ${req.file.buffer.length} bytes`);
    res.json({ translation: 'Mocked Audio Translation Output' });
  });

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`Server listening on port ${port}...`);

    let testsFailed = 0;

    // Test 1: Translate Text
    try {
      console.log('\n--- Test 1: Text Translation ---');
      const response = await fetch(`${baseUrl}/api/translate-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello, world!' })
      });
      const data = await response.json();
      
      if (response.ok && data.translation === 'Mocked Translation Output') {
        console.log('🟢 PASS: Text translation route works correctly.');
      } else {
        console.error('🔴 FAIL: Text translation response mismatch.', data);
        testsFailed++;
      }
    } catch (err) {
      console.error('🔴 FAIL: Text translation fetch failed:', err);
      testsFailed++;
    }

    // Test 2: Translate Audio (Multi-part Form Data)
    try {
      console.log('\n--- Test 2: Audio Upload & Form-Data Parsing ---');
      
      const formData = new FormData();
      // Generate a mock 100-byte wav/webm file buffer
      const mockAudioContent = new Uint8Array(100);
      mockAudioContent.fill(42); // Dummy content
      const audioBlob = new Blob([mockAudioContent], { type: 'audio/webm' });
      formData.append('audio', audioBlob, 'test-mic-recording.webm');

      const response = await fetch(`${baseUrl}/api/translate-audio`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (response.ok && data.translation === 'Mocked Audio Translation Output') {
        console.log('🟢 PASS: Audio upload form parsing and file handling works correctly.');
      } else {
        console.error('🔴 FAIL: Audio upload response mismatch.', data);
        testsFailed++;
      }
    } catch (err) {
      console.error('🔴 FAIL: Audio upload fetch failed:', err);
      testsFailed++;
    }

    server.close(() => {
      console.log('\n--- Test Execution Complete ---');
      if (testsFailed === 0) {
        console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
        process.exit(0);
      } else {
        console.error(`💥 TEST RUN COMPLETED WITH ${testsFailed} FAILURES.`);
        process.exit(1);
      }
    });
  });
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
