const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generate() {
  const publicDir = path.join(__dirname, 'public');
  const svgPath = path.join(publicDir, 'favicon.svg');
  
  // Check if we have the source SVG
  if (!fs.existsSync(svgPath)) {
    console.error('favicon.svg not found');
    process.exit(1);
  }

  console.log('Generating logo192.png and logo512.png from favicon.svg...');
  
  // Generate logo192.png
  await sharp(svgPath)
    .resize(192, 192, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'logo192.png'));
  console.log('✓ Created logo192.png');

  // Generate logo512.png
  await sharp(svgPath)
    .resize(512, 512, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'logo512.png'));
  console.log('✓ Created logo512.png');

  console.log('\nAll done! Files created:');
  console.log('  - public/logo192.png (192x192)');
  console.log('  - public/logo512.png (512x512)');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run build');
  console.log('  2. Run: npm start (or deploy)');
  console.log('  3. Test in incognito/private window to avoid cache');
}

generate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
