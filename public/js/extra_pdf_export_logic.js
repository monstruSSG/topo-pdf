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

var selectedImobilPDF = null;
var activePopupLayer = null;

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

// Start of imobile select logic
// Load the imobile_4.js GeoJSON layer
var drawnItems = new L.FeatureGroup();

map.addLayer(drawnItems);
var imobileLayer = L.geoJSON(json_Imobile_4, {
  style: {
    color: "#3388ff",
    weight: 2,
    fillOpacity: 0.2,
  },
  onEachFeature: function (feature, layer) {
    // Add a popup with metadata about the "imobil"
    if (feature.properties) {
      var popupContent = "<b>Imobil Metadata:</b><br>";
      for (var key in feature.properties) {
        popupContent += `${key}: ${feature.properties[key]}<br>`;
      }
      layer.bindPopup(popupContent);
    }

    // Add a click event to each "imobil"
    layer.on("click", function () {
      // Clear previous selection
      drawnItems.clearLayers();

      // Highlight the selected "imobil"
      var selectedImobil = L.geoJSON(feature, {
        style: {
          color: "red",
          weight: 3,
          fillOpacity: 0.4,
        },
      }).addTo(drawnItems);

      // Close the previously active popup, if any
      if (activePopupLayer) {
        activePopupLayer.closePopup();
      }

      // Open the popup for the selected "imobil"
      layer.openPopup();
      activePopupLayer = layer;

      // Retrieve elements inside the selected "imobil"
      selectedFeatures = [];
      map.eachLayer(function (lyr) {
        if (lyr instanceof L.GeoJSON && lyr.options.dataVar) {
          var features = window[lyr.options.dataVar].features;
          features.forEach(function (feature) {
            if (isFeatureInsidePolygon(feature, selectedImobil)) {
              selectedFeatures.push(feature);
            }
          });
        }
      });

      selectedImobilPDF = feature;

      // Enable the "Exporta PDF" button
      pdfButton.disabled = false;
      pdfButton.style.opacity = "1";
      if (feature && feature.properties && feature.properties["Id_ imobil"]) {
        // Add the selected "imobil" to the selectedFeatures array
        pdfButton.textContent = `Exporta PDF (Id imobil: ${feature.properties["Id_ imobil"]})`;
      }
    });
  },
}).addTo(map);

// Function to check if a feature is inside the selected "imobil"
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

// Disable the "Exporta PDF" button if no "imobil" is selected
map.on("click", function (e) {
  if (selectedFeatures.length === 0) {
    pdfButton.disabled = true;
    pdfButton.style.opacity = "0.5";
  }
});
// End of imobile select logic

// Remove the "My Location" control
map.eachLayer(function (layer) {
  if (layer instanceof L.Control.Locate) {
    map.removeControl(layer);
  }
});

function captureMapScreenshot() {
  const mapContainer = document.getElementById("map");

  document.querySelectorAll(".leaflet-tooltip").forEach((el) => {
    el.style.display = "none";
  });

  if (
    selectedFeatures.length === 0 ||
    selectedImobilPDF === null ||
    !selectedImobilPDF.properties
  ) {
    alert("Nu ati selectat niciun element de pe harta.");
  }
  
  if (activePopupLayer) {
    activePopupLayer.closePopup();
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

        generateArboriPDF(
          base64Image,
          selectedFeatures,
          selectedImobilPDF.properties
        );
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
