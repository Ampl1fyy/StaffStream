#!/usr/bin/env node
/**
 * Generate placeholder asset PNG files for Expo.
 * Run: node scripts/generate-assets.js
 * 
 * This creates minimal 1x1 transparent PNG files as placeholders.
 * Replace with actual branded assets in production.
 */

const fs = require('fs');
const path = require('path');

// Minimal 1x1 transparent PNG (base64 encoded)
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const assetsDir = path.join(__dirname, '../mobile/assets');

// Ensure directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`✓ Created ${assetsDir}`);
}

// Files to create
const files = [
  'icon.png',
  'splash.png',
  'adaptive-icon.png',
  'notification-icon.png'
];

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, TRANSPARENT_PNG);
    console.log(`✓ Created ${file}`);
  } else {
    console.log(`⊘ ${file} already exists (skipped)`);
  }
});

console.log('\n✓ Placeholder assets created successfully!');
console.log('⚠️  Replace these with your branded assets before release.');
