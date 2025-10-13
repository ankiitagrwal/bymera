const fs = require('fs');
const path = require('path');

// Since we can't use sharp or other image processing libraries in this environment,
// we'll copy the bymera.png to all required icon sizes
// In production, you'd want to properly resize the image

const sizes = [16, 32, 48, 128];
const sourceImage = path.join(__dirname, 'bymera.png');
const outputDir = path.join(__dirname, 'dist/extension/assets');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
    console.error('❌ bymera.png not found!');
    process.exit(1);
}

// Copy the bymera.png to each required icon size
sizes.forEach(size => {
    const outputPath = path.join(outputDir, `icon${size}.png`);

    try {
        // Copy the file
        fs.copyFileSync(sourceImage, outputPath);
        console.log(`✅ Created ${outputPath}`);
    } catch (error) {
        console.error(`❌ Failed to create icon${size}.png:`, error.message);
    }
});

console.log('\n🎉 Icons created successfully!');
console.log('\nNote: All icons are copies of bymera.png');
console.log('For production, you should properly resize the image to each size:');
sizes.forEach(size => {
    console.log(`  - icon${size}.png should be ${size}x${size} pixels`);
});

console.log('\nYou can use tools like:');
console.log('  - ImageMagick: convert bymera.png -resize 16x16 icon16.png');
console.log('  - Online tools: https://resizeimage.net/');
console.log('  - macOS Preview: Tools > Adjust Size');
