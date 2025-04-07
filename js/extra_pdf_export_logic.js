// Use the correct tileLayer in easyPrint config
const printPlugin = L.easyPrint({
  tileLayer: osmTileLayer, // ✅ use the OSM layer instead
  sizeModes: ["CurrentSize"],
  filename: "map-screenshot",
  exportOnly: true,
  hideControlContainer: true
}).addTo(map);

var isDrawingEnabled = false;
var drawControl = null;

// Initialize the drawn items layer
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Handle the creation of a new shape
map.on(L.Draw.Event.CREATED, function (event) {
  var layer = event.layer;
  drawnItems.addLayer(layer);

  var selectedFeatures = [];
  var polygon = L.geoJSON(layer.toGeoJSON());

  // Iterate through layers and check if they intersect with the drawn polygon
  map.eachLayer(function (lyr) {
    if (lyr instanceof L.GeoJSON && lyr.options.dataVar) {
      var features = window[lyr.options.dataVar].features;
      features.forEach(function (feature) {
        if (isFeatureInsidePolygon(feature, polygon)) {
          selectedFeatures.push(feature);
        }
      });
    }
  });

  console.log("Selected Features:", selectedFeatures);
  alert(selectedFeatures.length + " features selected!");
});

// Function to check if a feature is inside the drawn polygon
function isFeatureInsidePolygon(feature, polygon) {
  var featureLayer = L.geoJSON(feature);
  var featureBounds = featureLayer.getBounds();
  var featureCenter = featureBounds.getCenter();

  // Check if the feature's center point is inside the polygon
  return (
    leafletPip.pointInLayer([featureCenter.lng, featureCenter.lat], polygon)
      .length > 0
  );
}

// Remove the "My Location" control
map.eachLayer(function (layer) {
  if (layer instanceof L.Control.Locate) {
    map.removeControl(layer);
  }
});

// Add the polygon drawing control to the top-left corner
var drawControl = new L.Control.Draw({
  position: "topleft",
  edit: {
    featureGroup: drawnItems,
  },
  draw: {
    polygon: true,
    rectangle: true,
    circle: false,
    marker: false,
    polyline: false,
  },
});
map.addControl(drawControl);

// Logic for creating the pdf

// Export to PDF functionality
document
  .getElementById("generate-pdf-button")
  .addEventListener("click", function () {
    printPlugin.printMap("CurrentSize", "map-screenshot");
  });
