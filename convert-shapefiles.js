/**
 * Shapefile to GeoJSON Converter
 * Auto-detects .shp files and converts them
 */

const fs = require('fs');
const path = require('path');

// Check if shapefile module is installed
let shapefile;
try {
    shapefile = require('shapefile');
} catch (e) {
    console.error('❌ shapefile module not installed');
    console.error('Run: npm install shapefile');
    process.exit(1);
}

// Find all .shp files in philip-frontend
function findShapefiles(dir) {
    const shapefiles = [];
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        if (file.endsWith('.shp')) {
            shapefiles.push(path.join(dir, file));
        }
    });
    
    return shapefiles;
}

const assetsDir = path.join(__dirname, 'philip-frontend', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Find shapefiles
const shapefiles = findShapefiles(assetsDir);

if (shapefiles.length === 0) {
    console.error('❌ No .shp files found in philip-frontend/assets/');
    process.exit(1);
}

console.log(`\n🔍 Found ${shapefiles.length} shapefile(s):\n`);
shapefiles.forEach(f => console.log(`   ${path.basename(f)}`));

// Convert all shapefiles
async function convertAll() {
    for (const shpFile of shapefiles) {
        const filename = path.basename(shpFile, '.shp');
        const outputFile = path.join(assetsDir, `${filename}.geojson`);

        try {
            console.log(`\n⏳ Converting: ${filename}.shp`);

            // Open shapefile
            const source = await shapefile.open(shpFile);
            const features = [];
            let result = await source.read();

            while (!result.done) {
                features.push(result.value);
                result = await source.read();
            }

            // Create GeoJSON
            const geojson = {
                type: 'FeatureCollection',
                features: features
            };

            // Save GeoJSON
            fs.writeFileSync(outputFile, JSON.stringify(geojson, null, 2));

            console.log(`✅ ${filename}.geojson`);
            console.log(`   Features: ${features.length}`);
            console.log(`   Size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);

        } catch (error) {
            console.error(`❌ ${filename}: ${error.message}`);
        }
    }

    console.log(`\n✨ Done! Reload your dashboard.\n`);
}

convertAll().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
