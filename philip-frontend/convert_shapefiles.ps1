# Shapefile to GeoJSON Converter

$ogr2ogr = "ogr2ogr"  # or full path: "C:\Program Files\OSGeo4W\bin\ogr2ogr.exe"

$conversions = @(
    @{ shp = "PH072200000_FH_100yr.shp"; geojson = "assets\cebu_flood_100yr.geojson" },
    @{ shp = "Cebu_LANDSLIDE.shp"; geojson = "assets\cebu_landslide.geojson" },
    @{ shp = "Cebu_STORM_SURGE_SSA1.shp"; geojson = "assets\cebu_storm_surge.geojson" }
)

foreach ($item in $conversions) {
    Write-Host "Converting: $($item.shp) → $($item.geojson)" -ForegroundColor Cyan
    & $ogr2ogr -f GeoJSON $item.geojson $item.shp
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Success!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed with code $LASTEXITCODE" -ForegroundColor Red
    }
}

Write-Host "`nDone! Check assets/ folder for GeoJSON files." -ForegroundColor Yellow