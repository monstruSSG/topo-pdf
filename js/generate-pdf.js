// Import external libraries
function loadJsPDF(callback) {
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  script.onload = callback;
  document.head.appendChild(script);
}
function loadAutoTableScript(callback) {
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";
  script.onload = () => {
    console.log("jsPDF-AutoTable loaded ✅");
    if (callback) callback();
  };
  document.head.appendChild(script);
}

const spacing = 5;
const leftX = 15;
const startY = 15;

// Auxilliary functions
function addPdfHeaderWithImage(doc, metadata = {}, base64Image) {
  const {
    judet = "Bihor",
    localitate = "Oradea",
    siruta = "26573",
    identificatorImobil = "664",
    nrCadastral = "",
    nrCarteFunciara = "",
    suprafataImobil = "",
    codZonaValorica = "",
    codZonaProtejata = "",
    codPostal = "",
  } = metadata;

  const pageWidth = doc.internal.pageSize.getWidth();

  const sectionWidth = (pageWidth - 2 * 15) / 3; // 3 columns between 15mm margins
  const centerX = leftX + sectionWidth;
  const rightX = centerX + sectionWidth + 10;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  // Create each column's content
  const leftLines = [
    `Judetul: ${judet}`,
    `Localitatea: ${localitate}`,
    `SIRUTA: ${siruta}`,
    `Identificator imobil: ${identificatorImobil}`,
  ];

  const centerLines = [
    `Nr. cadastral imobil: ${nrCadastral}`,
    `Nr. carte funciara: ${nrCarteFunciara}`,
    `Suprafata imobil: ${suprafataImobil}`,
  ];

  const rightLines = [
    `Cod zona valorica: ${codZonaValorica}`,
    `Cod zona protejata: ${codZonaProtejata}`,
    `Cod postal: ${codPostal}`,
  ];

  // Print each column
  leftLines.forEach((text, i) => {
    doc.text(text, leftX, startY + i * spacing);
  });

  centerLines.forEach((text, i) => {
    doc.text(text, centerX, startY + i * spacing);
  });

  rightLines.forEach((text, i) => {
    doc.text(text, rightX, startY + i * spacing);
  });

  // Determine the Y to continue after the longest column
  const totalLines = Math.max(
    leftLines.length,
    centerLines.length,
    rightLines.length
  );
  let currentY = startY + totalLines * spacing + 15;

  // Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FISA SPATIULUI VERDE", pageWidth / 2, currentY, {
    align: "center",
  });

  // Subtitle
  currentY += spacing + 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "1. SCHITA AMPLASAMENTULUI TERENULUI SPATIU VERDE:",
    leftX,
    currentY
  );

  // Map image
  if (base64Image) {
    const imgX = leftX;
    const imgY = currentY + 5;
    const imgWidth = pageWidth - 2 * leftX;
    const imgHeight = 100;

    doc.rect(imgX, imgY, imgWidth, imgHeight); // 👈 black border
    doc.addImage(base64Image, "PNG", imgX, imgY + 1, imgWidth, imgHeight - 2);

    currentY += imgHeight;
  }

  currentY += spacing + 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "2. DENUMIRE OBIECTIV: Spatiu bl. T14, F11-F12,S1-S13,X1X5, ZP1- ZP11, Cartier ROGERIUS",
    leftX,
    currentY
  );

  currentY += spacing + 5;

  return currentY;
}

function addArbori(doc, features, currentY) {
  console.log(currentY);
  currentY += spacing;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("3. DATE DESPRE ARBORI", leftX, currentY);

  currentY += spacing;
  // 1. Arbori table
  const arbori = features.filter((feature) => feature.properties.Id_arbore);

  const arboriTableData = arbori.map((feature) => {
    const p = feature.properties;
    return [
      p.Id_arbore,
      p.Specia,
      p.Diametru,
      p.Inaltime,
      p.Coronament,
      p.Varsta,
      p.Stare_viab,
      p.Ocrotit,
    ];
  });

  // AutoTable plugin
  doc.autoTable({
    startY: currentY,
    head: [
      [
        "Nr. identif.",
        "Specia",
        "Diametru [cm]",
        "Inaltime [m]",
        "Coronament [m]",
        "Varsta",
        "Viabilitate",
        "Ocrotit",
      ],
    ],
    body: arboriTableData,
    styles: {
      fontSize: 8,
      cellPadding: 0.5,
      halign: "left",
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [0, 0, 0], // black border lines
      fillColor: false, // remove any cell background
      textColor: [0, 0, 0], // black text
    },
    headStyles: {
      fillColor: false, // remove head background color
      textColor: [0, 0, 0], // black text
      halign: "left",
      fontStyle: "normal",
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.1,
    tableWidth: "auto",
    theme: "grid",
  });
  return doc.lastAutoTable.finalY + spacing;
}

function addParcele(doc, features, currentY) {
  console.log(currentY);
  currentY += spacing;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("4. DATE DESPRE PARCELE", leftX, currentY);

  currentY += spacing;

  const parcele = features.filter((feature) => feature.properties.Id_parcela);

  const parceleTableData = parcele.map((feature) => {
    const p = feature.properties;
    return [
      p.Id_parcela || "",
      p.Prop_detin || "",
      p.Tip_prop || "",
      p.Mod_adm || "",
      p.Categ || "",
      p.Suprafata?.toFixed(2) || "",
    ];
  });

  doc.autoTable({
    startY: currentY,
    head: [
      [
        "Nr. parcela",
        "Proprietar/Detinator",
        "Tip proprietate",
        "Mod administrare",
        "Categorie",
        "Suprafata [mp]",
      ],
    ],
    body: parceleTableData,
    styles: {
      fontSize: 8,
      cellPadding: 0.5,
      halign: "left",
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      fillColor: false,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: false,
      textColor: [0, 0, 0],
      halign: "left",
      fontStyle: "normal",
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.1,
    tableWidth: "auto",
    theme: "grid",
  });

  return doc.lastAutoTable.finalY + spacing;
}

// generate-pdf.js
function generateArboriPDF(base64Image, selectedFeatures) {
  loadJsPDF(() => {
    loadAutoTableScript(() => {
      const doc = new jspdf.jsPDF("p", "mm", "a4");

      let currentY = addPdfHeaderWithImage(
        doc,
        {
          judet: "Bihor",
          localitate: "Oreadea",
          siruta: "12345",
          identificatorImobil: "999",
          suprafataImobil: "42083 mp",
        },
        base64Image
      );

      currentY = addArbori(doc, selectedFeatures, currentY);

      currentY = addParcele(doc, selectedFeatures, currentY);

      doc.save("fisa_spatiu_verde_arbori.pdf");
    });
  });
}
