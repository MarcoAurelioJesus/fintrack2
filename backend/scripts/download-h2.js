import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const version = '2.2.224';
const targetDir = path.resolve('lib');
const targetFile = path.join(targetDir, `h2-${version}.jar`);
const url = `https://repo1.maven.org/maven2/com/h2database/h2/${version}/h2-${version}.jar`;

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(targetFile)) {
  console.log(`H2 jar already present: ${targetFile}`);
  process.exit(0);
}

console.log(`Downloading H2 ${version}...`);
const file = fs.createWriteStream(targetFile);

https
  .get(url, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download H2 jar. Status ${response.statusCode}`);
      process.exit(1);
    }

    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded: ${targetFile}`);
    });
  })
  .on('error', (err) => {
    console.error('Download failed:', err.message);
    process.exit(1);
  });
