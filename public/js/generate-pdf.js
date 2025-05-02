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
    const imgWidth = pageWidth / 1.5;
    const imgHeight = pageWidth / 3;
    const imgX = (pageWidth - imgWidth) / 2;
    const imgY = currentY + 5;

    doc.rect(imgX, imgY, imgWidth, imgHeight); // 👈 black border
    doc.addImage(base64Image, "PNG", imgX, imgY, imgWidth, imgHeight);

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

function addPdfFooter(doc, currentY, index) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftX = 15;
  const spacing = 5;
  const sectionWidth = (pageWidth - 2 * 15) / 3; // 3 columns between 15mm margins
  const centerX = leftX + sectionWidth;
  const rightX = centerX + sectionWidth + 10;

  currentY += spacing + 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    index +
      ". DOCUMENTE EMISE CU PRIVIRE LA TERENUL SPATIU VERDE SI CONSTRUCTIILE EXISTENTE:",
    leftX,
    currentY
  );

  currentY += spacing + 5;
  const imgHeight = 40;

  doc.setFontSize(8);
  doc.text(
      `Data realizarii: ${new Date().toLocaleDateString("ro-RO")}`,
    leftX,
    currentY + imgHeight / 3
  );

  doc.text(
      `Data actualizarii: ${new Date().toLocaleDateString("ro-RO")}`,
    centerX,
    currentY + imgHeight / 3
  );

  // Add stamp image on the right side
  const imgWidth = 50;
  const imgY = currentY - spacing; // align with signature line

  doc.addImage("images/stampila.png", "PNG", rightX, imgY, imgWidth, imgHeight);

  // Return the updated Y position
  currentY += imgHeight + spacing;
  return currentY;
}

function addArbori(doc, features, currentY, index) {
  currentY += spacing;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(index + ". DATE DESPRE ARBORI", leftX, currentY);

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

function addImobile(doc, features, currentY, index) {
  currentY += spacing;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(index + ". DATE DESPRE IMOBILE", leftX, currentY);

  currentY += spacing;

  const imobile = features.filter(
    (feature) => feature.properties["Id_ imobil"] && feature.properties.Judetul// note the space in key name
  );

  const imobileTableData = imobile.map((feature) => {
    const p = feature.properties;
    return [
      p["Id_ imobil"] || "",
      p.Judetul || "",
      p.Localitate || "",
      p.Adresa || "",
      p.Suprafata?.toFixed(2) || "",
    ];
  });

  doc.autoTable({
    startY: currentY,
    head: [["Id. imobil", "Judetul", "Localitate", "Adresa", "Suprafata [mp]"]],
    body: imobileTableData,
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

function addIntravilan(doc, features, currentY, index) {
  const spacing = 5;
  const leftX = 15;

  currentY += spacing;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(index + ". DATE DESPRE INTRAVILAN", leftX, currentY);

  currentY += spacing;

  const intravilan = features.filter((feature) => feature.properties.LABEL);

  const intravilanTableData = intravilan.map((feature) => {
    return [feature.properties.LABEL || ""];
  });

  doc.autoTable({
    startY: currentY,
    head: [["Nume Strada"]],
    body: intravilanTableData,
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

function addParcele(doc, features, currentY, index) {
  currentY += spacing;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(index + ". DATE DESPRE PARCELE", leftX, currentY);

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

function addGardViu(doc, features, currentY, index) {
  const spacing = 5;
  const leftX = 15;

  currentY += spacing;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(index + ". DATE DESPRE GARD VIU", leftX, currentY);

  currentY += spacing;

  const gardViu = features.filter(
    (feature) => feature.properties.Id_gard && feature.properties.Lungime
  );

  const gardViuTableData = gardViu.map((feature) => {
    const p = feature.properties;
    return [p.Id_gard || "", `${p.Lungime?.toFixed(2) || ""} m`];
  });

  doc.autoTable({
    startY: currentY,
    head: [["Nr. gard viu", "Lungime [m]"]],
    body: gardViuTableData,
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

function addConstructii(doc, features, currentY, index) {
  const spacing = 5;
  const leftX = 15;

  currentY += spacing;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(index + ". DATE DESPRE CONSTRUCTII", leftX, currentY);

  currentY += spacing;

  const constructii = features.filter(
    (feature) => feature.properties.Id_constr
  );

  const constructiiTableData = constructii.map((feature) => {
    const p = feature.properties;
    return [
      p.Id_constr || "",
      p["Id_ imobil"] || "",
      p.Prop_detin || "",
      p.Tip_prop || "",
      p.Mod_adm || "",
      p.Nr_corp || "",
      p.Cod_dest || "",
      p.Supr_const?.toFixed(2) || "",
    ];
  });

  doc.autoTable({
    startY: currentY,
    head: [
      [
        "Nr. constructie",
        "ID Imobil",
        "Proprietar/Detinator",
        "Tip proprietate",
        "Mod administrare",
        "Corp",
        "Destinatie",
        "Suprafata [mp]",
      ],
    ],
    body: constructiiTableData,
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
function generateArboriPDF(base64Image, selectedFeatures, imobil) {
  console.log('Imobil', imobil)
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

      currentY = addArbori(doc, selectedFeatures, currentY, 3);

      currentY = addParcele(doc, selectedFeatures, currentY, 4);

      currentY = addImobile(doc, selectedFeatures, currentY, 5);

      currentY = addConstructii(doc, selectedFeatures, currentY, 6);

      currentY = addGardViu(doc, selectedFeatures, currentY, 7);

      currentY = addIntravilan(doc, selectedFeatures, currentY, 8);

      currentY = addPdfFooter(doc, currentY, 9);

      doc.save("export_topo_pdf.pdf");
    });
  });
}
