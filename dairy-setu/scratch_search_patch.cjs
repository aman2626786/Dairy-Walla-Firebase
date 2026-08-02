const fs = require('fs');
const lines = fs.readFileSync('E:\\\\Dairy Walla\\\\dairy-setu\\\\server.ts', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('app.patch(\'/api/products/:id\'')) {
    console.log('Match at line:', i + 1);
  }
}
