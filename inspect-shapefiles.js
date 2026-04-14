const shapefile = require('shapefile');
const files = [
  'philip-frontend/assets/PH072200000_FH_5yr.shp',
  'philip-frontend/assets/PH072200000_FH_100yr.shp',
  'philip-frontend/assets/Cebu_LandslideHazards.shp'
];

(async () => {
  for (const file of files) {
    try {
      console.log('\n--- ' + file + ' ---');
      const source = await shapefile.open(file);
      const result = await source.read();
      if (result.done) {
        console.log('empty file');
        continue;
      }
      const props = result.value.properties;
      console.log('fields: ' + Object.keys(props).join(', '));
      console.log('sample values:');
      for (const [k, v] of Object.entries(props)) {
        console.log('  ' + k + ': ' + v);
      }
    } catch (e) {
      console.error('ERROR', file, e && e.message);
    }
  }
})();
