const fs = require('fs');
const path = require('path');

async function uploadFile(filePath, relativePath) {
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  
  formData.append('file', blob, path.basename(filePath));
  // Simulate the folder path extraction logic from the frontend
  // relativePath is like "WTG 1/Blade 1/LE/test_image.png"
  // folderPath should be "WTG 1/Blade 1/LE"
  const folderPath = path.dirname(relativePath).replace(/\\/g, '/');
  formData.append('folderPath', folderPath);

  console.log(`Uploading ${relativePath} to folder ${folderPath}...`);

  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log('✅ Upload success:', result.secure_url);
    } else {
      console.error('❌ Upload failed:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

async function main() {
  const rootDir = path.join(__dirname, 'test_data');
  
  if (!fs.existsSync(rootDir)) {
    console.error('Test data directory not found!');
    return;
  }

  // Recursive function to walk directories
  function walk(dir, root) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walk(filePath, root);
      } else {
        const relativePath = path.relative(root, filePath);
        uploadFile(filePath, relativePath);
      }
    }
  }

  walk(rootDir, rootDir);
}

main();
