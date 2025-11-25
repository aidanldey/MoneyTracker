/**
 * Icon Generator for Daily Budget Tracker PWA
 *
 * This script generates placeholder icons for the PWA.
 * Run with: node scripts/generate-icons.js
 *
 * Requires: No dependencies - uses Node.js built-in canvas or generates SVG
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

/**
 * Generate SVG icon
 */
function generateSVGIcon(size, isMaskable = false) {
  const padding = isMaskable ? size * 0.2 : 0;
  const innerSize = size - (padding * 2);
  const radius = isMaskable ? 0 : size * 0.1;

  // Budget tracker icon: Dollar sign in a circle
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${radius}" fill="#2563eb"/>

  <!-- Inner content area (for maskable) -->
  <g transform="translate(${padding}, ${padding})">
    <!-- Dollar sign -->
    <text
      x="${innerSize / 2}"
      y="${innerSize / 2 + innerSize * 0.15}"
      font-family="Arial, sans-serif"
      font-size="${innerSize * 0.6}"
      font-weight="bold"
      fill="white"
      text-anchor="middle">$</text>

    <!-- Small chart bars at bottom -->
    <rect x="${innerSize * 0.25}" y="${innerSize * 0.75}" width="${innerSize * 0.08}" height="${innerSize * 0.15}" fill="white" opacity="0.7" rx="2"/>
    <rect x="${innerSize * 0.38}" y="${innerSize * 0.68}" width="${innerSize * 0.08}" height="${innerSize * 0.22}" fill="white" opacity="0.7" rx="2"/>
    <rect x="${innerSize * 0.51}" y="${innerSize * 0.72}" width="${innerSize * 0.08}" height="${innerSize * 0.18}" fill="white" opacity="0.7" rx="2"/>
    <rect x="${innerSize * 0.64}" y="${innerSize * 0.65}" width="${innerSize * 0.08}" height="${innerSize * 0.25}" fill="white" opacity="0.7" rx="2"/>
  </g>
</svg>`;

  return svg;
}

/**
 * Convert SVG to PNG (placeholder - returns SVG)
 * In a real implementation, you'd use a library like sharp or canvas
 */
function generatePNGIcon(size, isMaskable = false) {
  const svg = generateSVGIcon(size, isMaskable);
  const filename = isMaskable
    ? `icon-${size}x${size}-maskable.png`
    : `icon-${size}x${size}.png`;

  // For now, save as SVG with PNG extension as placeholder
  // In production, use proper PNG conversion
  const svgFilename = filename.replace('.png', '.svg');
  const filepath = path.join(iconsDir, svgFilename);

  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${svgFilename}`);

  return filename;
}

/**
 * Generate favicon.ico
 */
function generateFavicon() {
  const svg = generateSVGIcon(32);
  const filepath = path.join(iconsDir, 'favicon.svg');
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated favicon.svg`);
}

/**
 * Generate Apple Touch Icon
 */
function generateAppleTouchIcon() {
  const svg = generateSVGIcon(180);
  const filepath = path.join(iconsDir, 'apple-touch-icon.svg');
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated apple-touch-icon.svg`);
}

/**
 * Generate README for icons
 */
function generateReadme() {
  const readme = `# PWA Icons

These are placeholder icons for the Daily Budget Tracker PWA.

## Generated Icons

${ICON_SIZES.map(size => `- icon-${size}x${size}.svg`).join('\n')}
- icon-192x192-maskable.svg
- icon-512x512-maskable.svg
- apple-touch-icon.svg
- favicon.svg

## Note

These are SVG placeholders. For production:
1. Create proper PNG icons at each size
2. Use tools like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - Adobe Illustrator / Figma / Sketch
3. Ensure maskable icons have safe zone (20% padding)
4. Test on multiple devices

## Regenerating Icons

Run: \`node scripts/generate-icons.js\`
`;

  fs.writeFileSync(path.join(iconsDir, 'README.md'), readme);
  console.log(`✓ Generated README.md`);
}

/**
 * Main execution
 */
function main() {
  console.log('🎨 Generating PWA icons...\n');

  // Generate standard icons
  ICON_SIZES.forEach(size => {
    generatePNGIcon(size, false);
  });

  // Generate maskable icons
  generatePNGIcon(192, true);
  generatePNGIcon(512, true);

  // Generate special icons
  generateFavicon();
  generateAppleTouchIcon();

  // Generate readme
  generateReadme();

  console.log('\n✅ All icons generated successfully!');
  console.log('\n⚠️  Note: These are SVG placeholders.');
  console.log('For production, convert to PNG using:');
  console.log('  - Online tools (realfavicongenerator.net, pwabuilder.com)');
  console.log('  - Node packages (sharp, canvas)');
  console.log('  - Design tools (Figma, Illustrator)');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSVGIcon, generatePNGIcon };
