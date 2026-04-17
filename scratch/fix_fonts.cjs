const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = [
  {
    name: 'Regular',
    url: 'https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf'
  },
  {
    name: 'Bold',
    url: 'https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf'
  }
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log('Starting font download...');
    const results = await Promise.all(fonts.map(f => download(f.url)));
    
    const regBase64 = results[0].toString('base64');
    const boldBase64 = results[1].toString('base64');
    
    console.log(`Downloaded fonts. Regular: ${results[0].length} bytes, Bold: ${results[1].length} bytes`);
    
    const outputContent = `// Roboto hinted (Standard TTF)
export const RobotoRegular = "${regBase64}";
export const RobotoBold = "${boldBase64}";
`;
    
    const outputDir = path.resolve(__dirname, '../src/assets/fonts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'roboto-base64.ts');
    fs.writeFileSync(outputPath, outputContent);
    console.log(`Successfully wrote ${outputPath}`);
  } catch (err) {
    console.error('Error in font fix script:', err);
    process.exit(1);
  }
}

run();
