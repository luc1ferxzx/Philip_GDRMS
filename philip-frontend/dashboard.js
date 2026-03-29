// 1. THE BOUNCER
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "index.html";
}

// 2. INITIALIZE MAP (Center on Liloan)
const map = L.map('map', {
    center: [10.4005, 124.0041],
    zoom: 13, // Default to a wider view if 3D fails
    zoomControl: false 
});

// 3. DARK MODE BASE LAYER (This always works)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO'
}).addTo(map);

// 4. PROJECT NOAH LAYERS
const floodLayer = L.tileLayer('https://noah-api.up.edu.ph/tiles/flood_100yr/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.6
});

const landslideLayer = L.tileLayer('https://noah-api.up.edu.ph/tiles/landslide_hazard/{z}/{x}/{y}.png', {
    maxZoom: 19,
    opacity: 0.6
});

// 5. 3D INITIALIZATION WITH SAFETY CHECK
// 5. 3D INITIALIZATION WITH POLLING (Improved Safety)
function init3D(attempts = 0) {
    const loader = document.getElementById('mapLoader');
    
    // Robust check for the library
    if (typeof OSMBuildings === 'undefined') {
        // Increase retries to 15 attempts (7.5 seconds total)
        if (attempts < 15) {
            console.warn(`Waiting for OSMBuildings... Attempt ${attempts + 1}`);
            setTimeout(() => init3D(attempts + 1), 500);
            return;
        }
        
        console.error("3D Library timed out. Falling back to 2D.");
        if (loader) {
            loader.innerHTML = "<span>2D View Active</span>";
            setTimeout(() => { loader.style.display = 'none'; }, 1000);
        }
        return;
    }

    try {
        const osmb = new OSMBuildings(map);
        // Correct method for the Leaflet-specific wrapper
        osmb.addGeoJSONTiles('https://{s}.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.json');
        
        // Success: Trigger the 3D perspective
        map.setZoom(17);
        if (map.setPitch) map.setPitch(45);
        if (map.setBearing) map.setBearing(15);
        
        console.log("3D Environment Ready.");
    } catch (e) {
        console.error("Error initializing 3D features:", e);
    }

    // Smoothly fade out the loader
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
}

init3D();

// 6. UI CONTROLS
document.getElementById('floodLayer').addEventListener('change', (e) => {
    e.target.checked ? floodLayer.addTo(map) : map.removeLayer(floodLayer);
});

document.getElementById('landslideLayer').addEventListener('change', (e) => {
    e.target.checked ? landslideLayer.addTo(map) : map.removeLayer(landslideLayer);
});

// 7. LOGOUT
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
});

