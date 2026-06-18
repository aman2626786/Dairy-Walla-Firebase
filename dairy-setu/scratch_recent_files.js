import fs from 'fs';
import path from 'path';

function findRecentFiles(dir, maxAgeMs) {
  const now = Date.now();
  let recentFiles = [];

  const traverse = (currentDir) => {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git') continue;
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        if (now - stat.mtimeMs < maxAgeMs) {
          recentFiles.push({ path: fullPath, mtime: stat.mtime });
        }
      }
    }
  };

  traverse(dir);
  return recentFiles;
}

const recent = findRecentFiles('E:\\\\Dairy Walla\\\\dairy-setu', 24 * 60 * 60 * 1000);
recent.sort((a, b) => b.mtime - a.mtime);
for (const f of recent.slice(0, 50)) {
  console.log(`${f.mtime.toISOString()} - ${f.path}`);
}
