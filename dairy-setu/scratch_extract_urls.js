import fs from 'fs';
import readline from 'readline';

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\\\Users\\\\aman2\\\\.gemini\\\\antigravity\\\\brain\\\\b6eee13b-5848-42cc-9063-2207de0c818f\\\\.system_generated\\\\logs\\\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const urlRegex = /https:\/\/res\.cloudinary\.com\/drmcpl540\/image\/upload\/[^"'\s\\]+/g;
  let matches = new Set();

  for await (const line of rl) {
    let m;
    while ((m = urlRegex.exec(line)) !== null) {
      matches.add(m[0]);
    }
  }

  fs.writeFileSync('E:\\\\Dairy Walla\\\\dairy-setu\\\\scratch_cloudinary.txt', Array.from(matches).join('\\n'));
  console.log(`Found ${matches.size} unique Cloudinary URLs`);
}

processLineByLine();
