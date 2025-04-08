// Import scripts
function loadGeneratePDFScript(callback) {
  const script = document.createElement("script");
  script.src = "js/generate-pdf.js";
  script.onload = () => {
    console.log("generate-pdf.js loaded ✅");
    if (typeof callback === "function") {
      callback();
    }
  };
  script.onerror = () => {
    console.error("Failed to load generate-pdf.js ❌");
  };
  document.head.appendChild(script);
}

// Create and append the button to the map container
const pdfButton = document.createElement("button");
pdfButton.id = "generate-pdf-button";
pdfButton.textContent = "Exporta PDF";

// Style the button
pdfButton.style.position = "absolute";
pdfButton.style.bottom = "10px";
pdfButton.style.left = "10px";
pdfButton.style.zIndex = "1000";
pdfButton.style.padding = "10px 20px";
pdfButton.style.backgroundColor = "#007bff";
pdfButton.style.color = "white";
pdfButton.style.border = "none";
pdfButton.style.borderRadius = "5px";
pdfButton.style.cursor = "pointer";
pdfButton.style.fontSize = "14px";

// Disable the button initially
pdfButton.disabled = true;
pdfButton.style.opacity = "0.5"; // Make it visually appear disabled

// Add hover effect (only if enabled)
pdfButton.addEventListener("mouseover", () => {
  if (!pdfButton.disabled) {
    pdfButton.style.backgroundColor = "#0056b3";
  }
});
pdfButton.addEventListener("mouseout", () => {
  if (!pdfButton.disabled) {
    pdfButton.style.backgroundColor = "#007bff";
  }
});

document.body.appendChild(pdfButton);

map.on("draw:created", function (e) {
  pdfButton.disabled = false;
  pdfButton.style.opacity = "1";
});

map.on("draw:deleted", function (e) {
  pdfButton.disabled = true;
  pdfButton.style.opacity = "0.5";
});
// End of button export related logic

var isDrawingEnabled = false;
var drawControl = null;

// Initialize the drawn items layer
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var selectedFeatures = [];
// Handle the creation of a new shape
map.on(L.Draw.Event.CREATED, function (event) {
  var layer = event.layer;
  drawnItems.addLayer(layer);

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

function captureMapScreenshot() {
  const mapContainer = document.getElementById("map");

  document.querySelectorAll(".leaflet-tooltip").forEach((el) => {
    el.style.display = "none";
  });
  console.log(selectedFeatures, " aicii");
  if (selectedFeatures.length === 0) {
    alert("Nu ati selectat niciun element de pe harta.");
  }

  loadGeneratePDFScript(() => {
    html2canvas(mapContainer, {
      useCORS: true,
      backgroundColor: null,
      logging: true,
      scale: 2, // Higher resolution
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    })
      .then((canvas) => {
        const base64Image = canvas.toDataURL("image/png");

        generateArboriPDF(base64Image, selectedFeatures);
      })
      .catch((err) => {
        console.error("Screenshot error:", err);
      })
      .finally(() => {
        document.querySelectorAll(".leaflet-tooltip").forEach((el) => {
          el.style.display = "";
        });
      });
  });
}
document
  .getElementById("generate-pdf-button")
  .addEventListener("click", function () {
    captureMapScreenshot();
  });
