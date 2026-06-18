import fs from 'fs';
import readline from 'readline';

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\\\Users\\\\aman2\\\\.gemini\\\\antigravity\\\\brain\\\\b6eee13b-5848-42cc-9063-2207de0c818f\\\\.system_generated\\\\logs\\\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let matches = [];

  for await (const line of rl) {
    if (line.includes('prisma.$')) {
      if (line.includes('scratch_') || line.includes('RUN_COMMAND')) {
        matches.push(line.substring(0, 500));
      }
    }
  }

  fs.writeFileSync('E:\\\\Dairy Walla\\\\dairy-setu\\\\scratch_find_raw.txt', matches.join('\\n'));
  console.log(`Found ${matches.length} matches`);
}

processLineByLine();
