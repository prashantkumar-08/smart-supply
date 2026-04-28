const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src');

const replacements = [
  // Backgrounds
  { regex: /\bbg-slate-900\b/g, replace: 'bg-slate-100 dark:bg-slate-900' },
  { regex: /\bbg-slate-800\b/g, replace: 'bg-white dark:bg-slate-800' },
  { regex: /\bbg-slate-700\b/g, replace: 'bg-slate-200 dark:bg-slate-700' },
  { regex: /\bbg-slate-600\b/g, replace: 'bg-slate-300 dark:bg-slate-600' },
  
  // Surfaces
  { regex: /\bbg-surface\b/g, replace: 'bg-white dark:bg-surface' },
  { regex: /\bbg-background\b/g, replace: 'bg-slate-50 dark:bg-background' },
  
  // Text
  { regex: /\btext-slate-100\b/g, replace: 'text-slate-900 dark:text-slate-100' },
  { regex: /\btext-slate-200\b/g, replace: 'text-slate-800 dark:text-slate-200' },
  { regex: /\btext-slate-300\b/g, replace: 'text-slate-700 dark:text-slate-300' },
  { regex: /\btext-slate-400\b/g, replace: 'text-slate-600 dark:text-slate-400' },
  { regex: /\btext-slate-500\b/g, replace: 'text-slate-500 dark:text-slate-500' },
  { regex: /\btext-white\b/g, replace: 'text-slate-900 dark:text-white' },
  
  // Borders
  { regex: /\bborder-slate-700\b/g, replace: 'border-slate-200 dark:border-slate-700' },
  { regex: /\bborder-slate-600\b/g, replace: 'border-slate-300 dark:border-slate-600' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Done!');
