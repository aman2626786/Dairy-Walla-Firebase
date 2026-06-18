import fs from 'fs';
import readline from 'readline';

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\\\Users\\\\aman2\\\\.gemini\\\\antigravity\\\\brain\\\\b6eee13b-5848-42cc-9063-2207de0c818f\\\\.system_generated\\\\logs\\\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inScript = false;
  let matches = [];

  for await (const line of rl) {
    if (line.includes('=== Starting Database Migration/Restoration ===') || line.includes('Migration script')) {
      matches.push(line.substring(0, 1000));
    }
    if (line.includes('write_to_file') && line.includes('6a042d45d5dbce46985514a9')) {
      matches.push(line.substring(0, 1000));
    }
  }

  fs.writeFileSync('E:\\\\Dairy Walla\\\\dairy-setu\\\\scratch_find_migration.txt', matches.join('\\n'));
  console.log(`Found matches`);
}

processLineByLine();
