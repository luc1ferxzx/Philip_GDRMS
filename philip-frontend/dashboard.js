// 1. THE BOUNCER
const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

// 2. INITIALIZE CESIUM
// Replace with your actual Ion Token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwZjJhOGI3ZS04ZjZlLTQ5MzEtOGUxZi0xYzk3ZDA3MzIwNjkiLCJpZCI6NDE4MDkxLCJpYXQiOjE3NzYxNzI0MjR9.qLaB5PnmuwsGt2j_ubXM-fp7gX1vR04EdnvoAMtG1r0';

// ============================================
// MAP PROVIDERS - FREE & NOAH-COMPATIBLE
// ============================================
const mapProviders = {
    esriWorldImagery: {
        name: 'Esri World Imagery',
        provider: new Cesium.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            credit: '© Esri World Imagery',
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 19
        }),
        description: 'High-res satellite imagery, perfect for NOAH hazard overlays'
    },
    esriWorldStreet: {
        name: 'Esri World Street Map',
        provider: new Cesium.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            credit: '© Esri World Street Map',
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 19
        }),
        description: 'Detailed street map with labels, great for location identification'
    },
    esriTopo: {
        name: 'Esri World Topo',
        provider: new Cesium.UrlTemplateImageryProvider({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            credit: '© Esri World Topo',
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 19
        }),
        description: 'Topographic map with terrain features and labels'
    },
    openStreetMap: {
        name: 'OpenStreetMap',
        provider: new Cesium.UrlTemplateImageryProvider({
            url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            credit: '© OpenStreetMap contributors',
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 19
        }),
        description: 'Community-driven map, reliable fallback'
    }
};

// Start with Esri World Imagery (best for NOAH)
let currentMapProvider = 'esriWorldImagery';
const imageryProvider = mapProviders[currentMapProvider].provider;

// Add error handling with fallback
imageryProvider.errorEvent.addEventListener(function(error) {
    console.error(`${mapProviders[currentMapProvider].name} tile error:`, error);
    console.log('Falling back to OpenStreetMap...');
    const fallbackProvider = mapProviders.openStreetMap.provider;
    viewer.imageryLayers.addImageryProvider(fallbackProvider);
});

// Create the Cesium viewer
const viewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: imageryProvider,
    terrainProvider: Cesium.createWorldTerrain ? Cesium.createWorldTerrain() : new Cesium.EllipsoidTerrainProvider(),
    baseLayerPicker: false,
    animation: false,
    timeline: false,
    sceneMode: Cesium.SceneMode.SCENE3D,
    scene3DOnly: true,
    sceneModePicker: false
});
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.enableLighting = true;
viewer.scene.globe.terrainExaggeration = 2.0;
if (viewer.scene.globe.showGroundAtmosphere !== undefined) {
    viewer.scene.globe.showGroundAtmosphere = true;
}

// ============================================
// MAP SWITCHING FUNCTIONALITY
// ============================================
function switchMap(providerKey) {
    if (!mapProviders[providerKey]) {
        console.error('Unknown map provider:', providerKey);
        return;
    }

    // Remove current imagery layers
    viewer.imageryLayers.removeAll();

    // Add new provider
    const newProvider = mapProviders[providerKey].provider;
    viewer.imageryLayers.addImageryProvider(newProvider);

    currentMapProvider = providerKey;
    console.log(`✓ Switched to ${mapProviders[providerKey].name}`);

    // Update UI if it exists
    updateMapSelectorUI();
}

function updateMapSelectorUI() {
    const selector = document.getElementById('mapSelector');
    if (selector) {
        selector.value = currentMapProvider;
    }
}

if (window.location.protocol === 'file:') {
    console.warn('Cesium page is loaded from file://. Remote imagery may fail due to browser security policies. Use a local HTTP server instead.');
}

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
let osmBuildingsTileset = null;

// ============================================
// NOAH HAZARD LAYERS - LOCAL GEOJSON
// ============================================
const noahLayers = {
    flood: {
        name: 'NOAH Flood (5yr)',
        // Path to GeoJSON (you'll need to convert shapefiles first)
        geojsonUrl: './assets/cebu_flood_5yr.geojson',
        dataSource: null,
        toggle: 'floodToggle',
        color: Cesium.Color.BLUE,
        isEnabled: false
    },
    landslide: {
        name: 'NOAH Landslide Hazard',
        geojsonUrl: './assets/cebu_landslide.geojson',
        dataSource: null,
        toggle: 'landslideToggle',
        color: Cesium.Color.RED,
        isEnabled: false
    },
    stormSurge: {
        name: 'NOAH Storm Surge',
        geojsonUrl: './assets/cebu_storm_surge.geojson',
        dataSource: null,
        toggle: 'stormSurgeToggle',
        color: Cesium.Color.PURPLE,
        isEnabled: false
    }
};

function getGeoJsonPropertyNames(entity) {
    if (!entity || !entity.properties) return [];
    return entity.properties.propertyNames || [];
}

function getEntityPropertyValue(entity, propertyName) {
    if (!entity || !entity.properties || !propertyName) return undefined;
    const values = entity.properties.getValue(Cesium.JulianDate.now());
    return values ? values[propertyName] : undefined;
}

function normalizeHazardValue(rawValue) {
    if (rawValue === undefined || rawValue === null) return undefined;
    if (typeof rawValue === 'number') return rawValue;
    const trimmed = String(rawValue).trim();
    if (trimmed === '') return undefined;
    if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
    return trimmed.toLowerCase();
}

function getHazardFieldForEntity(entity) {
    const names = getGeoJsonPropertyNames(entity);
    const preferred = ['Var', 'var', 'VAR', 'Level', 'LEVEL', 'level', 'Hazard', 'HAZARD', 'hazard', 'Severity', 'SEVERITY', 'severity', 'Risk', 'RISK', 'risk'];
    for (const name of preferred) {
        if (names.includes(name)) return name;
    }
    return names.length ? names[0] : null;
}

function getHazardColor(layerKey, rawValue, fallbackColor) {
    const value = normalizeHazardValue(rawValue);
    if (value === undefined) {
        return fallbackColor.withAlpha(0.5);
    }

    if (typeof value === 'number') {
        if (value <= 1) return Cesium.Color.YELLOW.withAlpha(0.55);
        if (value <= 2) return Cesium.Color.ORANGE.withAlpha(0.55);
        return Cesium.Color.RED.withAlpha(0.55);
    }

    const text = String(value).toLowerCase();
    if (text.includes('low') || text === 'l' || text === '1') return Cesium.Color.YELLOW.withAlpha(0.55);
    if (text.includes('med') || text.includes('medium') || text === '2' || text === 'm') return Cesium.Color.ORANGE.withAlpha(0.55);
    if (text.includes('high') || text === '3' || text === 'h') return Cesium.Color.RED.withAlpha(0.55);
    if (text.includes('ssa')) return Cesium.Color.PURPLE.withAlpha(0.55);
    if (text.includes('flood')) return Cesium.Color.CYAN.withAlpha(0.35);
    return fallbackColor.withAlpha(0.5);
}

// Initialize NOAH layers from local GeoJSON
async function initializeNOAHLayers() {
    for (const [key, config] of Object.entries(noahLayers)) {
        try {
            const response = await fetch(config.geojsonUrl);
            if (!response.ok) {
                console.warn(`✗ GeoJSON file not found: ${config.geojsonUrl}`);
                continue;
            }
            
            const geojsen = await response.json();
            
            // 1. Load as 3D hazard polygons; we will extrude them from terrain
            const dataSource = await Cesium.GeoJsonDataSource.load(geojsen, {
                clampToGround: false
            });
            
            viewer.dataSources.add(dataSource);
            config.dataSource = dataSource;
            dataSource.show = false; // Hidden by default

            const firstEntity = dataSource.entities.values[0];
            const hazardField = getHazardFieldForEntity(firstEntity);
            console.log(`✓ NOAH ${key} layer loaded in 3D! field=${hazardField || 'none'}`);
            
            // 2. Loop through entities to apply extruded hazard styling
            dataSource.entities.values.forEach(entity => {
                if (!entity.polygon) return;
                const rawHazardValue = getEntityPropertyValue(entity, hazardField);
                const hazardLevel = normalizeHazardValue(rawHazardValue);
                let extrusionHeight = 10;
                if (key === 'flood') extrusionHeight = 8;
                if (key === 'landslide') extrusionHeight = 18;
                if (key === 'stormSurge') extrusionHeight = 12;

                if (hazardLevel === 2 || String(hazardLevel).toLowerCase().includes('med')) {
                    extrusionHeight *= 1.25;
                }
                if (hazardLevel === 3 || String(hazardLevel).toLowerCase().includes('high')) {
                    extrusionHeight *= 1.5;
                }

                entity.polygon.material = getHazardColor(key, rawHazardValue, config.color);
                entity.polygon.outline = true;
                entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.75);
                entity.polygon.outlineWidth = 1.5;
                entity.polygon.heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
                entity.polygon.height = 0;
                entity.polygon.extrudedHeight = extrusionHeight;
                entity.polygon.perPositionHeight = false;
            });
        } catch (error) {
            console.error(`✗ Error loading NOAH ${key}:`, error.message);
        }
    }
}

// Toggle NOAH layer visibility
function toggleNOAHLayer(layerKey, isVisible) {
    const config = noahLayers[layerKey];
    if (!config || !config.dataSource) {
        console.warn(`NOAH layer "${layerKey}" not loaded`);
        return;
    }
    
    config.dataSource.show = isVisible;
    config.isEnabled = isVisible;
    console.log(`NOAH ${layerKey}: ${isVisible ? 'ON ✓' : 'OFF'}`);
}

// Initialize layers on startup
initializeNOAHLayers();

async function loadOSMBuildings() {
    if (!Cesium.createOsmBuildings) {
        console.warn('Cesium.createOsmBuildings() is unavailable in this Cesium build. Skipping 3D building load.');
        return;
    }

    try {
        osmBuildingsTileset = viewer.scene.primitives.add(Cesium.createOsmBuildings());
        await osmBuildingsTileset.readyPromise;
        osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
            color: {
                conditions: [
                    ["${height} >= 50", "color('rgb(210, 210, 240)', 0.95)"],
                    ["${height} >= 20", "color('rgb(220, 200, 180)', 0.9)"],
                    ["true", "color('rgb(245, 245, 245)', 0.85)"]
                ]
            }
        });
    } catch (error) {
        console.warn('Unable to load 3D building tileset:', error.message || error);
    }
}

async function init() {
    await loadOSMBuildings();
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

init().catch((error) => {
    console.error('Cesium initialization failed:', error);
});

// 4. CENTER ON LILOAN
const liloanCenter = { lat: 10.4005, lng: 124.0041 };
viewer.scene.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(liloanCenter.lng, liloanCenter.lat, 500),
    orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-25),
    },
});

// 5. STYLING FUNCTIONS

// Your Thesis "Secret Sauce": Height-based Risk
function styleBuildingsByHeight() {
    if (!osmBuildingsTileset) return;

    osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
        color: {
            conditions: [
                ["Number(${height}) >= 20", "color('purple', 0.8)"],
                ["Number(${height}) >= 10", "color('red', 0.8)"],
                ["true", "color('white', 0.7)"]
            ]
        }
    });
}

function highlightResidential() {
    if (!osmBuildingsTileset) return;

    osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
        color: {
            conditions: [
                ["${building} === 'apartments' || ${building} === 'residential'", "color('cyan', 0.9)"],
                ["true", "color('white')"],
            ],
        },
    });
}

// Distance Styling: Useful for "Epicenter" or "Risk Node" analysis
function colorByDistanceToCoordinate(pickedLatitude, pickedLongitude) {
    if (!osmBuildingsTileset) return;

    osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
        defines: {
            distance: "distance(vec2(Number(${feature['cesium#longitude']}), Number(${feature['cesium#latitude']})), vec2(" + pickedLongitude + ", " + pickedLatitude + "))",
        },
        color: {
            conditions: [
                ["Number(${distance}) > 0.014", "color('blue')"],
                ["Number(${distance}) > 0.010", "color('green')"],
                ["Number(${distance}) > 0.006", "color('yellow')"],
                ["Number(${distance}) > 0.0001", "color('red')"],
                ["true", "color('white')"],
            ],
        },
    });
}

function removeCoordinatePicking() {
    const infoPanel = document.querySelector(".infoPanel");
    if (infoPanel) infoPanel.style.visibility = "hidden";
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 6. UI EVENT LISTENERS
const menu = document.getElementById("dropdown");

if (menu) {
    menu.onchange = function () {
        const val = menu.value;
        removeCoordinatePicking();

        if (val === "0") styleBuildingsByHeight();
        if (val === "2") highlightResidential();
        
        if (val === "1") {
            // Distance logic
            colorByDistanceToCoordinate(liloanCenter.lat, liloanCenter.lng);
            const infoPanel = document.querySelector(".infoPanel");
            if (infoPanel) infoPanel.style.visibility = "visible";

            handler.setInputAction(function (movement) {
                const pickedBuilding = viewer.scene.pick(movement.position);
                if (pickedBuilding) {
                    const lat = pickedBuilding.getProperty("cesium#latitude");
                    const lng = pickedBuilding.getProperty("cesium#longitude");
                    colorByDistanceToCoordinate(lat, lng);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
    };
}

// Toggle NOAH Layer
document.getElementById('floodToggle')?.addEventListener('change', (e) => {
    toggleNOAHLayer('flood', e.target.checked);
});

document.getElementById('landslideToggle')?.addEventListener('change', (e) => {
    toggleNOAHLayer('landslide', e.target.checked);
});

// Add storm surge if it exists in HTML
document.getElementById('stormSurgeToggle')?.addEventListener('change', (e) => {
    toggleNOAHLayer('stormSurge', e.target.checked);
});

// ============================================
// MAP & VIEW CONTROLS
// ============================================

// Map selector
document.getElementById('mapSelector')?.addEventListener('change', (e) => {
    switchMap(e.target.value);
});

// 2D/3D View toggle
let is3DMode = true;
document.getElementById('viewModeToggle')?.addEventListener('click', () => {
    if (is3DMode) {
        // Switch to 2D
        viewer.scene.morphTo2D(2.0);
        document.getElementById('viewModeToggle').textContent = '🔄 Switch to 3D';
        console.log('✓ Switched to 2D view');
    } else {
        // Switch to 3D
        viewer.scene.morphTo3D(2.0);
        document.getElementById('viewModeToggle').textContent = '🔄 Switch to 2D';
        console.log('✓ Switched to 3D view');
    }
    is3DMode = !is3DMode;
});

// 6. LOGOUT
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}); // <--- Make sure this brace and parenthesis are here