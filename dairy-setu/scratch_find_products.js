import fs from 'fs';
import readline from 'readline';

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\\\Users\\\\aman2\\\\.gemini\\\\antigravity\\\\brain\\\\b6eee13b-5848-42cc-9063-2207de0c818f\\\\.system_generated\\\\logs\\\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let productMatches = [];

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      const stringifiedObj = JSON.stringify(obj);

      if (stringifiedObj.includes('deleteMany') || stringifiedObj.includes('deletedCount') || stringifiedObj.includes('PrismaClient')) {
         if (stringifiedObj.includes('RUN_COMMAND') || stringifiedObj.includes('write_to_file')) {
           productMatches.push(stringifiedObj);
         }
      }
    } catch (e) {
      // ignore JSON parse errors if any
    }
  }

  fs.writeFileSync('E:\\\\Dairy Walla\\\\dairy-setu\\\\scratch_search_results2.txt', productMatches.join('\\n'));
  console.log("Wrote matches to scratch_search_results2.txt");
}

processLineByLine();
