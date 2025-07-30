const fs = require('fs');
const path = require('path');

// Config
const ROOT_DIR = path.resolve(__dirname, './'); // Change if needed
const EXTENSIONS = ['.css', '.scss', '.less', '.html', '.ts'];  // Add more if needed
const PX_TO_REM_BASE = 10;

// Recursively walk directory
function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

// Convert px to rem
function convertPxToRem(content) {
  return content.replace(/(\d+(\.\d+)?)px/g, (_, n) => {
    const rem = parseFloat(n) / PX_TO_REM_BASE;
    return `${rem}rem`;
  });
}

// Process files
walk(ROOT_DIR, filePath => {
  if (!EXTENSIONS.includes(path.extname(filePath))) return;

  const original = fs.readFileSync(filePath, 'utf8');
  const converted = convertPxToRem(original);

  if (original !== converted) {
    fs.writeFileSync(filePath, converted, 'utf8');
    console.log(`✔ Converted: ${filePath}`);
  }
});
