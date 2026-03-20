
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatFolio } from "./utils";

const LOGO_URL = "/icsa-logo.png";

// Helper for browser-side DataURL conversion
const toDataURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      const reader = new FileReader();
      reader.onloadend = function () {
        resolve(reader.result as string);
      }
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = reject;
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  });
}

// Internal function to build the PDF content (shared between client and server)
const buildPDF = async (doc: jsPDF, data: any, logoBase64?: string) => {
  const primaryColor: [number, number, number] = [56, 163, 165]; // #38A3A5
  const darkGray: [number, number, number] = [40, 40, 40];
  const lightGray: [number, number, number] = [150, 150, 150];
  let currentY = 0;
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // PREMIUM HEADER REDESIGN
  // Clean white background with a subtle bottom border
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 40, "F");

  // Add ICSA Logo cleanly on the left
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, 6, 45, 18, undefined, 'FAST');
    } catch (e) { }
  } else {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("ICSA", margin, 18);
  }

  // Company Address under Logo
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text("Abel González 324 - La Cisterna", margin, 27);
  doc.text("Fono: 56-2 29582414", margin, 31);

  // Right Side Header Content
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const headerTitle = data.isProjectSummary ? "ACTA FINAL DE CIERRE" : "ORDEN DE TRABAJO TÉCNICA";
  doc.text(headerTitle, 195, 18, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  // Prefix folio with D- to signify Digital, and pad strictly if it's a number
  const formattedFolio = formatFolio(data.folio);
  doc.text(`Folio: ${formattedFolio}`, 195, 25, { align: "right" });

  const formattedDate = data.startDate ? new Date(data.startDate).toLocaleString('es-ES') : new Date().toLocaleDateString();
  doc.setFontSize(8);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text(`Generada: ${formattedDate}`, 195, 30, { align: "right" });

  // Sleek subtle separator
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, 195, 35);

  currentY = 45;

  // Status Badge Block (Premium look)
  const isCompleted = data.status === 'Completed' || data.status === 'Completado';
  const estadoTexto = data.estadoTrabajo ? data.estadoTrabajo.toUpperCase() : (isCompleted ? 'FINALIZADA' : 'PENDIENTE');

  if (isCompleted || data.estadoTrabajo) {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, currentY, 4, 12, "F"); // Accent bar

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("ESTADO ACTUAL:", margin + 8, currentY + 4);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(estadoTexto, margin + 8, currentY + 10);
    currentY += 18;
  }

  // Client Info Section - Elegant Grouping
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE", margin, currentY);

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY + 2, 85, currentY + 2);

  currentY += 7;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Empresa:`, margin, currentY);
  doc.setFont("helvetica", "normal");
  let empresaText = `${data.clientName || "N/A"}`;
  if (data.clientRut) empresaText += ` (RUT: ${data.clientRut})`;
  doc.text(empresaText, margin + 18, currentY);

  doc.setFont("helvetica", "bold");
  doc.text(`Sucursal:`, 110, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.branch || "Casa Matriz"}`, 128, currentY);

  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`Dir. Central:`, margin, currentY);
  doc.setFont("helvetica", "normal");
  const parsedAddress = doc.splitTextToSize(data.address || "N/A", 80);
  doc.text(parsedAddress, margin + 22, currentY);

  doc.setFont("helvetica", "bold");
  doc.text(`Teléfono:`, 110, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.clientPhone || "N/A"}`, 128, currentY);

  currentY += Math.max(5, parsedAddress.length * 3.5);
  doc.setFont("helvetica", "bold");
  doc.text(`Dir. Sucursal:`, margin, currentY);
  doc.setFont("helvetica", "normal");
  const parsedIntAddress = doc.splitTextToSize(data.interventionAddress || "N/A", 80);
  doc.text(parsedIntAddress, margin + 22, currentY);

  doc.setFont("helvetica", "bold");
  doc.text(`Email:`, 110, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.clientEmail || "N/A"}`, 128, currentY);

  // Technical Specs Section
  currentY += 12;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DE EJECUCIÓN", margin, currentY);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(margin, currentY + 2, 85, currentY + 2);

  currentY += 7;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const b = data.building ? `Edificio: ${data.building}` : '';
  const f = data.floor ? `Piso: ${data.floor}` : '';
  const locStr = [b, f].filter(Boolean).join("  |  ");

  let tipoFinal = data.tipoTrabajo || "N/A";
  if (tipoFinal.includes("Otro")) {
    tipoFinal = tipoFinal.replace("Otro", data.tipoTrabajoOtro || "Otro");
  }

  let descLine = `Tipo: ${tipoFinal}`;
  if (locStr) {
    descLine += `  |  ${locStr}`;
  }
  doc.text(descLine, margin, currentY);

  currentY += 5;
  const splitDesc = doc.splitTextToSize(`Descripción: ${data.description || "N/A"}`, 180);
  doc.text(splitDesc, margin, currentY);
  currentY += (splitDesc.length * 4);

  // AutoTables!
  if (Array.isArray(data.detalleTecnico) && data.detalleTecnico.length > 0) {
    const validDetalle = data.detalleTecnico.filter((d: any) => d.cantidad || d.observacion);
    if (validDetalle.length > 0) {
      if (currentY > pageHeight - 60) { doc.addPage(); currentY = 20; }
      currentY += 4;
      autoTable(doc, {
        startY: currentY,
        head: [['Elemento', 'Cantidad', 'Observación']],
        body: validDetalle.map((d: any) => [d.elemento, d.cantidad || "-", d.observacion || "-"]),
        theme: 'grid',
        headStyles: { fillColor: [248, 248, 248], textColor: darkGray, fontSize: 8, fontStyle: 'bold', halign: 'left', lineColor: [230, 230, 230] },
        bodyStyles: { fontSize: 7, textColor: [70, 70, 70], lineColor: [230, 230, 230] },
        columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' }, 1: { cellWidth: 20, halign: 'center', textColor: primaryColor, fontStyle: 'bold' }, 2: { cellWidth: 100 } },
        margin: { left: margin, right: margin },
        alternateRowStyles: { fillColor: [252, 252, 252] }
      });
      currentY = (doc as any).lastAutoTable.finalY + 5;
    }
  }

  if (Array.isArray(data.puntosRed) && data.puntosRed.length > 0) {
    if (currentY > pageHeight - 60) { doc.addPage(); currentY = 20; }
    currentY += 2;
    autoTable(doc, {
      startY: currentY,
      head: [['PTO', 'Ubicación Física', 'Puerto / Panel', 'Prueba']],
      body: data.puntosRed.map((p: any) => [p.id || "-", p.ubicacion || "-", p.puerto || "-", p.resultado || "-"]),
      theme: 'grid',
      headStyles: { fillColor: [248, 248, 248], textColor: darkGray, fontSize: 8, fontStyle: 'bold', halign: 'center', lineColor: [230, 230, 230] },
      bodyStyles: { fontSize: 7, textColor: [70, 70, 70], lineColor: [230, 230, 230] },
      columnStyles: { 0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 80 }, 2: { cellWidth: 40, fontStyle: 'bold' }, 3: { cellWidth: 40, halign: 'center' } },
      margin: { left: margin, right: margin },
      alternateRowStyles: { fillColor: [252, 252, 252] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Commercial Checkboxes
  if (Array.isArray(data.condicionesCobro) && data.condicionesCobro.length > 0) {
    if (currentY > pageHeight - 50) { doc.addPage(); currentY = 20; }
    currentY += 2;
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Condiciones Comerciales:", margin, currentY);

    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    let startX = margin;
    data.condicionesCobro.forEach((condicion: string) => {
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFillColor(245, 245, 245);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      const textWidth = doc.getTextWidth(`[X] ${condicion}`) + 4;

      if (startX + textWidth > 200) {
        currentY += 6;
        startX = margin;
      }

      doc.rect(startX, currentY - 3, textWidth, 5, 'FD');
      doc.text(`[X] ${condicion}`, startX + 2, currentY);
      startX += textWidth + 3;
    });
    currentY += 5;
  }
  if (data.observacionesGenerales) {
    if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }
    currentY += 2;
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Observaciones Adicionales:", margin, currentY);
    currentY += 4;
    doc.setFont("helvetica", "normal");
    const splitObs = doc.splitTextToSize(data.observacionesGenerales, 180);
    doc.text(splitObs, margin, currentY);
    currentY += (splitObs.length * 4);
  }

  // --- PHOTOS SECTION ---
  let photos = data.photos;
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch (e) { photos = []; }
  }

  if (Array.isArray(photos) && photos.length > 0) {
    // Check if there's enough space for the title AND at least one row of photos
    if (currentY > pageHeight - 110) {
      doc.addPage();
      currentY = 20;
    }
    currentY += 10;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("REGISTRO FOTOGRÁFICO / EVIDENCIA", margin, currentY);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(margin, currentY + 2, 85, currentY + 2);
    currentY += 10;

    const photoWidth = 85;
    const photoHeight = 60;
    const spacing = 10;
    let col = 0;

    for (const photo of photos) {
      if (currentY + photoHeight > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
      }

      try {
        const xPos = margin + col * (photoWidth + spacing);
        doc.addImage(photo, "JPEG", xPos, currentY, photoWidth, photoHeight, undefined, 'FAST');

        col++;
        if (col > 1) {
          col = 0;
          currentY += photoHeight + spacing;
        }
      } catch (e) {
        console.error("Error adding photo to PDF:", e);
      }
    }

    if (col !== 0) {
      currentY += photoHeight + spacing;
    }
  }

  // Signatures Section - Anchored to the bottom of the last page
  if (currentY > pageHeight - 75) {
    doc.addPage();
  }
  const sigY = pageHeight - 75; // Anchor to bottom

  doc.setFontSize(8);
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);

  // Tech Signature Block
  doc.text("TÉCNICO RESPONSABLE ICSA", margin, sigY);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, sigY + 2, margin + 60, sigY + 2); // subtle underline
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`${data.techName || "N/A"}`, margin, sigY + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`RUT: ${data.techRut || "N/A"}`, margin, sigY + 11);
  if (data.techSignatureUrl) {
    try { doc.addImage(data.techSignatureUrl, "PNG", margin, sigY + 13, 35, 14); } catch (e) { }
  }

  // Client Signature Block
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text("CONFORMIDAD DEL CLIENTE", 130, sigY);
  doc.line(130, sigY + 2, 190, sigY + 2); // subtle underline
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`${data.clientReceiverName || "N/A"}`, 130, sigY + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`RUT: ${data.clientReceiverRut || "N/A"}`, 130, sigY + 11);

  if (data.clientSignatureUrl) {
    try { doc.addImage(data.clientSignatureUrl, "PNG", 130, sigY + 13, 35, 14); } catch (e) { }
  }

  // Helper to add footer to all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100); // Darker gray for better visibility
    const footerText = "Documento electrónico generado por el Portal Operativo ICSA.";
    doc.text(footerText, 105, pageHeight - 12, { align: "center" });

    // Page numbering
    doc.setFontSize(6);
    doc.text(`Página ${i} de ${totalPages}`, 195, pageHeight - 12, { align: "right" });
  }

  // Legal text only on the last page above footer
  doc.setPage(totalPages);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const legalText = "La presente Orden de Trabajo y su firma electrónica se encuentran reguladas bajo la Ley 19.799, siendo plenamente válidas como Firma Electrónica Simple para todos los efectos legales.";
  const splitLegal = doc.splitTextToSize(legalText, 180);
  doc.text(splitLegal, 105, pageHeight - 20, { align: "center" });

  return doc;
};

// Client-side PDF generation & download
export const generateWorkOrderPDF = async (data: any) => {
  const doc = new jsPDF();
  let logoBase64 = "";
  try {
    logoBase64 = await toDataURL(LOGO_URL);
  } catch (e) { }

  await buildPDF(doc, data, logoBase64);
  doc.save(`OT-${data.folio}-${data.clientName?.replace(/\s+/g, '_')}.pdf`);
};

// Server-side PDF generation (returns Buffer)
export const generateServerWorkOrderPDF = async (data: any): Promise<Buffer> => {
  const doc = new jsPDF();
  let logoBase64 = "";

  try {
    // Use eval('require') to hide Node.js modules from the client-side bundler
    if (typeof window === 'undefined') {
      const fs = eval('require("fs")');
      const path = eval('require("path")');
      const logoPath = path.join(process.cwd(), 'public', 'icsa-logo.png');
      
      if (fs.existsSync(logoPath)) {
        const buffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
      }
    }
  } catch (e) {
    console.error("Error loading logo for server PDF:", e);
  }

  await buildPDF(doc, data, logoBase64);
  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer);
};

// Tool Inventory PDF Report
export const generateToolReportPDF = async (tools: any[], movements: any[] = [], period: string = "all") => {
  // Use landscape orientation for more columns
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [56, 163, 165]; // #38A3A5
  const darkGray: [number, number, number] = [40, 40, 40];
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  let logoBase64 = "";

  try {
    logoBase64 = await toDataURL(LOGO_URL);
  } catch (e) { }

  // Header
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 40, "F");

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, 6, 45, 18, undefined, 'FAST');
    } catch (e) { }
  }

  const periodLabel = period === 'daily' ? 'DIARIO (HOY)' : period === 'weekly' ? 'SEMANAL' : period === 'monthly' ? 'MENSUAL' : 'COMPLETO';
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`REPORTE ${periodLabel} DE HERRAMIENTAS`, pageWidth - margin, 18, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, pageWidth - margin, 25, { align: "right" });

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);

  let currentY = 45;

  // Inventory Summary
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN DE ESTADO ACTUAL", margin, currentY);
  currentY += 5;

  const stats = [
    { label: "Total Equipos", value: tools.length },
    { label: "Disponibles", value: tools.filter((t: any) => t.estado === 'Disponible').length },
    { label: "En Terreno", value: tools.filter((t: any) => t.estado === 'En Terreno').length },
    { label: "Fuera de Uso", value: tools.filter((t: any) => t.estado === 'Mantenimiento' || t.estado === 'De Baja').length }
  ];

  autoTable(doc, {
    startY: currentY,
    head: [stats.map(s => s.label)],
    body: [stats.map(s => s.value.toString())],
    theme: 'grid',
    styles: { halign: 'center' },
    headStyles: { fillColor: [248, 248, 248], textColor: darkGray, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10, textColor: primaryColor, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
    tableWidth: 150 // Keep summary table smaller even in landscape
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Movements Section (if applicable)
  if (period !== 'all' && movements.length > 0) {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`MOVIMIENTOS DEL PERIODO (${movements.length})`, margin, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Fecha / Hora', 'Herramienta', 'Acción', 'Responsable', 'Observación / Comentario']],
      body: movements.map((m: any) => [
        new Date(m.timestamp).toLocaleString('es-ES'),
        m.toolName,
        m.action,
        m.responsible,
        m.comment || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [56, 163, 165], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: [60, 60, 60] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 },
        4: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Detailed Table (Inventory Snapshot)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INVENTARIO CONSOLIDADO (SNAPSHOT)", margin, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Herramienta / Marca / Modelo', 'Ingreso', 'Devolución', 'Estado', 'Responsable', 'Historial de Notas']],
    body: tools.map((t: any) => [
      t.codigoInterno || 'N/A',
      `${t.nombre}\n${t.marca} ${t.modelo}`,
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A',
      t.lastReturnDate ? new Date(t.lastReturnDate).toLocaleDateString() : '-',
      t.estado,
      t.asignadoA || '-',
      t.notas || '-'
    ]),
    theme: 'striped',
    headStyles: { fillColor: [150, 150, 150], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: [60, 60, 60], cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 25 },
      5: { cellWidth: 30 },
      6: { cellWidth: 'auto' } // Notes take the rest
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer on each page
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("Documento de inventario generado por el Portal Operativo ICSA.", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    }
  });

  const fileName = period === 'all'
    ? `Reporte_Inventario_ICSA_${new Date().toISOString().split('T')[0]}.pdf`
    : `Reporte_${period.toUpperCase()}_Herramientas_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(fileName);
};

// Unified Batch Return Act PDF
export const generateBatchReturnActPDF = async (movements: any[]) => {
  if (!movements || movements.length === 0) return;

  const doc = new jsPDF();
  const primaryColor: [number, number, number] = [56, 163, 165]; // #38A3A5
  const darkGray: [number, number, number] = [40, 40, 40];
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  let logoBase64 = "";

  try {
    logoBase64 = await toDataURL(LOGO_URL);
  } catch (e) { }

  // Header
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 40, "F");

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, 6, 45, 18, undefined, 'FAST');
    } catch (e) { }
  }

  const responsible = movements[0].responsible || "N/A";
  const dateStr = new Date(movements[0].timestamp).toLocaleString('es-ES');

  const isAssignment = movements[0].action === 'Asignación';
  const title = isAssignment ? "ACTA DE SALIDA DE EQUIPOS" : "ACTA DE DEVOLUCIÓN DE EQUIPOS";

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth - margin, 18, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Técnico: ${responsible}`, pageWidth - margin, 25, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Fecha Entrega: ${dateStr}`, pageWidth - margin, 30, { align: "right" });

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);

  let currentY = 50;

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(isAssignment ? "DETALLE DE HERRAMIENTAS ASIGNADAS" : "DETALLE DE HERRAMIENTAS ENTREGADAS", margin, currentY);
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    head: [['Herramienta', 'Marca / Modelo', 'Código / Serie', isAssignment ? 'Fecha Asig.' : 'Fecha Retiro', isAssignment ? 'Categoría' : 'Fecha Devol.']],
    body: movements.map((m: any) => [
      m.toolName,
      `${m.marca || ''} ${m.modelo || ''}`.trim() || 'N/A',
      `${m.codigoInterno || ''} ${m.serie ? '/ ' + m.serie : ''}`.trim() || 'N/A',
      new Date(m.timestamp).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      isAssignment ? (m.categoria || m.category || 'Equipo') : (m.assignmentDate ? new Date(m.assignmentDate).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A')
    ]),
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [60, 60, 60], cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 35 },
      4: { cellWidth: 'auto' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  const generalComment = movements[0]?.comment || 'Sin observaciones particulares.';

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DECLARACIÓN DE ESTADO / OBSERVACIONES GENERALES", margin, currentY);
  currentY += 6;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const splitComment = doc.splitTextToSize(generalComment, pageWidth - margin * 2);
  doc.text(splitComment, margin, currentY);

  currentY += (splitComment.length * 4) + 15;

  // Signature Area
  if (currentY > 230) {
    doc.addPage();
    currentY = 40;
  }

  const sigUrl = movements.find(m => m.signatureUrl)?.signatureUrl;
  if (sigUrl) {
    try {
      doc.addImage(sigUrl, "PNG", (pageWidth / 2) - 25, currentY - 20, 50, 20);
    } catch (e) {
      console.error("Error adding signature to movement PDF:", e);
    }
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(60, currentY, 150, currentY);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FIRMA TÉCNICO RESPONSABLE", pageWidth / 2, currentY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(responsible, pageWidth / 2, currentY + 10, { align: "center" });

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("Documento electrónico generado por el Portal Operativo ICSA.", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
  }

  const batchIdShort = movements[0].batchId ? movements[0].batchId.substring(0, 8) : 'ACTA';
  const filePrefix = isAssignment ? 'Acta_Salida' : 'Acta_Devolucion';
  doc.save(`${filePrefix}_${responsible.replace(/\s+/g, '_')}_${batchIdShort}.pdf`);
};

// --- HPT PDF GENERATOR ---
export const generateHPTPDF = async (data: any, questions: any[] = []) => {
  const doc = new jsPDF();
  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let logoBase64 = "";

  try { logoBase64 = await toDataURL(LOGO_URL); } catch (e) { }

  // Group questions by category for lookup
  const qMap: Record<string, any[]> = { recursos: [], riesgos: [], medidas: [], epp: [] };
  if (questions && questions.length > 0) {
    questions.forEach(q => {
      if (qMap[q.category]) qMap[q.category].push(q);
    });
  }

  const drawHeader = (page: number) => {
    if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 10, 40, 15);
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.rect(margin, 10, pageWidth - margin * 2, 15);
    doc.line(55, 10, 55, 25);
    doc.line(pageWidth - 50, 10, pageWidth - 50, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("HOJA DE PLANIFICACIÓN DEL TRABAJO (HPT)", 125, 18, { align: "center" });
    
    doc.setFontSize(7);
    doc.text("ICSA-SSOC-002 HPT", pageWidth - 12, 13, { align: "right" });
    doc.text("Ver 1.0 2026", pageWidth - 12, 18, { align: "right" });
    doc.text(`Página ${page} de 2`, pageWidth - 12, 23, { align: "right" });
  };

  // --- PAGE 1 ---
  drawHeader(1);
  let currentY = 25;

  // General Info Table
  autoTable(doc, {
    startY: currentY,
    body: [
      ['Proyecto', data.projectName || data.projectname || 'General / Sin Proyecto'],
      ['Supervisor a cargo:', data.supervisorName || data.supervisorname || 'N/A', 'FIRMA', ''],
      ['Rut', data.supervisorRut || data.supervisorrut || 'N/A', '', ''],
      ['Fecha:', data.fecha ? new Date(data.fecha).toLocaleDateString('es-CL') : 'N/A', '', '']
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 
      0: { cellWidth: 35, fontStyle: 'bold', fillColor: [240, 240, 240] },
      1: { cellWidth: 80 },
      2: { cellWidth: 25, fontStyle: 'bold', halign: 'center', fillColor: [240, 240, 240] },
      3: { cellWidth: 50 }
    },
    didDrawCell: (cellData) => {
       if (cellData.section === 'body' && cellData.column.index === 3 && cellData.row.index === 1) {
         const sig = data.firmaSupervisor || data.firmasupervisor;
         if (sig) {
           try { doc.addImage(sig, 'PNG', cellData.cell.x + 5, cellData.cell.y + 1, 40, 10); } catch(e){}
         }
       }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY;

  // Team Table
  autoTable(doc, {
    startY: currentY,
    head: [['EQUIPO DE TRABAJO', { content: 'FIRMAS', colSpan: 1 }]],
    headStyles: { fillColor: [80, 80, 80], halign: 'center', fontSize: 8 },
    theme: 'grid'
  });
  
  const workerRows = [];
  for(let i=0; i<10; i++) {
    const w = data.workers?.[i];
    workerRows.push([
      `Nombre Trabajador: ${w?.nombre || ''}`,
      `RUT: ${w?.rut || ''}`,
      `Cargo: ${w?.cargo || ''}`,
      ''
    ]);
  }

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY,
    body: workerRows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1, minCellHeight: 8 },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 40 }, 2: { cellWidth: 40 }, 3: { cellWidth: 60 } },
    didDrawCell: (cellData) => {
      if (cellData.section === 'body' && cellData.column.index === 3) {
        const w = data.workers?.[cellData.row.index];
        if (w?.firma) {
          try { doc.addImage(w.firma, 'PNG', cellData.cell.x + 10, cellData.cell.y + 1, 40, 6); } catch(e){}
        }
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY;

  // Resources Table
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(80, 80, 80);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'F');
  doc.text("RECURSOS / COORDINACIÓN / PERMISOS - (SI es NO, Corregir antes de iniciar)", margin + 2, currentY + 4);
  currentY += 6;

  // Filter items: active OR already in data
  const resItems = qMap.recursos.length > 0 
    ? qMap.recursos.filter(q => q.active || data.recursos?.[q.item_key])
    : [
        { item_key: 'personal', label: '1. ¿Se cuenta con el personal necesario y entrenado?' },
        { item_key: 'equipos', label: '2. ¿Se cuenta con los Equipos y Herramientas necesarias?' },
        { item_key: 'materiales', label: '3. ¿Se dispone de los materiales e insumos necesarios?' },
        { item_key: 'coordinacionC', label: '4. ¿Se realizó coordinaciones con cliente?' },
        { item_key: 'bloqueo', label: '5. ¿Se coordinó bloqueo de seguridad?' },
        { item_key: 'permisoC', label: '6. ¿Se solicitó el permiso de ingreso?' }
      ];

  const resRows = [];
  const resHalf = Math.ceil(resItems.length / 2);
  for(let i=0; i < resHalf; i++) {
    const left = resItems[i];
    const right = resItems[i + resHalf];
    const getSNN = (obj: any, key: string) => {
      const val = obj?.[key];
      return [val === 'SI' ? 'X' : '', val === 'NO' ? 'X' : '', val === 'N/A' ? 'X' : ''];
    };
    resRows.push([
      (i+1).toString(), left.label, ...getSNN(data.recursos, left.item_key),
      right ? (i + resHalf + 1).toString() : '', right ? right.label : '', ...(right ? getSNN(data.recursos, right.item_key) : ['', '', ''])
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'ITEM', 'SI', 'NO', 'N/A', 'N°', 'ITEM', 'SI', 'NO', 'N/A']],
    body: resRows,
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 1 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, halign: 'center' },
    columnStyles: { 
      0: { cellWidth: 5 }, 1: { cellWidth: 60 }, 2: { cellWidth: 10, halign: 'center' }, 3: { cellWidth: 10, halign: 'center' }, 4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 5 }, 6: { cellWidth: 60 }, 7: { cellWidth: 10, halign: 'center' }, 8: { cellWidth: 10, halign: 'center' }, 9: { cellWidth: 10, halign: 'center' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 2;

  // Work Description
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(80, 80, 80);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'F');
  doc.text("TRABAJO A REALIZAR ¿Cómo Ejecutaré Mi trabajo?", margin + 2, currentY + 4);
  currentY += 6;

  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  const splitJob = doc.splitTextToSize(data.trabajoRealizar || data.trabajorealizar || '', pageWidth - margin * 2 - 4);
  doc.rect(margin, currentY, pageWidth - margin * 2, 35);
  doc.text(splitJob, margin + 2, currentY + 5);

  // --- PAGE 2 ---
  doc.addPage();
  drawHeader(2);
  currentY = 25;

  // Risks Table
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(80, 80, 80);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'F');
  doc.text("IDENTIFICACIÓN DE RIESGOS ¿Qué me puede ocurrir?", margin + 2, currentY + 4);
  currentY += 6;

  const riskItems = qMap.riesgos.length > 0 
    ? qMap.riesgos.filter(q => q.active || data.riesgos?.[q.item_key])
    : [
        { item_key: 'atrapamiento', label: 'Atrapamiento' },
        { item_key: 'caidaMismo', label: 'Caída al mismo nivel' },
        { item_key: 'caidaDistinto', label: 'Caída a distinto nivel' },
        { item_key: 'energiaE', label: 'Energía Eléctrica' }
      ];

  const riskRows = [];
  const riskHalf = Math.ceil(riskItems.length / 2);
  for(let i=0; i < riskHalf; i++) {
    const left = riskItems[i];
    const right = riskItems[i + riskHalf];
    const getSNN = (obj: any, key: string) => {
      const val = obj?.[key];
      return [val === 'SI' ? 'X' : '', val === 'NO' ? 'X' : '', val === 'N/A' ? 'X' : ''];
    };
    riskRows.push([
      (i+1).toString(), left.label, ...getSNN(data.riesgos, left.item_key),
      right ? (i + riskHalf + 1).toString() : '', right ? right.label : '', ...(right ? getSNN(data.riesgos, right.item_key) : ['', '', ''])
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'RIESGO', 'SI', 'NO', 'N/A', 'N°', 'RIESGO', 'SI', 'NO', 'N/A']],
    body: riskRows,
    theme: 'grid',
    styles: { fontSize: 5.5, cellPadding: 0.8 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, halign: 'center' },
    columnStyles: { 
      0: { cellWidth: 5 }, 1: { cellWidth: 60 }, 2: { cellWidth: 8, halign: 'center' }, 3: { cellWidth: 8, halign: 'center' }, 4: { cellWidth: 8, halign: 'center' },
      5: { cellWidth: 5 }, 6: { cellWidth: 60 }, 7: { cellWidth: 8, halign: 'center' }, 8: { cellWidth: 8, halign: 'center' }, 9: { cellWidth: 8, halign: 'center' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 2;
  if (data.riesgos?.otros) {
    doc.setFontSize(6);
    doc.text(`Otros Riesgos: ${data.riesgos.otros}`, margin, currentY + 3);
    currentY += 5;
  }

  // Measures Table
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(80, 80, 80);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'F');
  doc.text("MEDIDAS DE SEGURIDAD", margin + 2, currentY + 4);
  currentY += 6;

  const measureItems = qMap.medidas.length > 0 
    ? qMap.medidas.filter(q => q.active || data.medidas?.[q.item_key])
    : [];
  const measureRows = [];
  const measureHalf = Math.ceil(measureItems.length / 2);
  for(let i=0; i < measureHalf; i++) {
    const left = measureItems[i];
    const right = measureItems[i + measureHalf];
    const getSNN = (obj: any, key: string) => {
      const val = obj?.[key];
      return [val === 'SI' ? 'X' : '', val === 'NO' ? 'X' : '', val === 'N/A' ? 'X' : ''];
    };
    measureRows.push([
      (i+1).toString(), left.label, ...getSNN(data.medidas, left.item_key),
      right ? (i + measureHalf + 1).toString() : '', right ? right.label : '', ...(right ? getSNN(data.medidas, right.item_key) : ['', '', ''])
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['N°', 'MEDIDA', 'SI', 'NO', 'N/A', 'N°', 'MEDIDA', 'SI', 'NO', 'N/A']],
    body: measureRows,
    theme: 'grid',
    styles: { fontSize: 5.5, cellPadding: 0.8 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0, halign: 'center' },
    columnStyles: { 
      0: { cellWidth: 5 }, 1: { cellWidth: 60 }, 2: { cellWidth: 8, halign: 'center' }, 3: { cellWidth: 8, halign: 'center' }, 4: { cellWidth: 8, halign: 'center' },
      5: { cellWidth: 5 }, 6: { cellWidth: 60 }, 7: { cellWidth: 8, halign: 'center' }, 8: { cellWidth: 8, halign: 'center' }, 9: { cellWidth: 8, halign: 'center' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 2;

  // EPP Table
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(80, 80, 80);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'F');
  doc.text("EPP Y ELEMENTOS DE SEGURIDAD REQUERIDOS", margin + 2, currentY + 4);
  currentY += 6;

  const eppItems = qMap.epp.length > 0 
    ? qMap.epp.filter(q => q.active || data.epp?.[q.item_key])
    : [];
  const eppRows = [];
  const eppThird = Math.ceil(eppItems.length / 3);
  for(let i=0; i < eppThird; i++) {
    const c1 = eppItems[i];
    const c2 = eppItems[i + eppThird];
    const c3 = eppItems[i + eppThird * 2];
    const getX = (key: string) => data.epp?.[key] ? '[X]' : '[ ]';
    eppRows.push([
      c1 ? `${getX(c1.item_key)} ${c1.label}` : '',
      c2 ? `${getX(c2.item_key)} ${c2.label}` : '',
      c3 ? `${getX(c3.item_key)} ${c3.label}` : ''
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    body: eppRows,
    theme: 'plain',
    styles: { fontSize: 6, cellPadding: 0.5 },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 60 }, 2: { cellWidth: 60 } }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  // Final Signature
  const sigX = pageWidth / 2;
  doc.line(sigX - 30, currentY + 15, sigX + 30, currentY + 15);
  doc.setFontSize(8);
  doc.text("FIRMA FINAL SUPERVISOR", sigX, currentY + 20, { align: "center" });
  doc.text(data.supervisorName || "", sigX, currentY + 24, { align: "center" });
  
  const fsig = data.firmaSupervisor || data.firmasupervisor;
  if(fsig) {
    try { doc.addImage(fsig, 'PNG', sigX - 25, currentY - 5, 50, 18); } catch(e){}
  }

  doc.save(`HPT-${data.folio || '000'}-${new Date(data.fecha || Date.now()).toISOString().split('T')[0]}.pdf`);
};

// --- CHARLA PDF GENERATOR ---
export const generateCharlaPDF = async (data: any) => {
  const doc = new jsPDF();
  const primaryColor: [number, number, number] = [56, 163, 165];
  const darkGray: [number, number, number] = [40, 40, 40];
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let logoBase64 = "";

  try { logoBase64 = await toDataURL(LOGO_URL); } catch (e) { }

  // Header
  if (logoBase64) doc.addImage(logoBase64, "PNG", margin, 10, 45, 18);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("REGISTRO DE CHARLA DE SEGURIDAD", pageWidth - margin, 20, { align: "right" });
  
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Folio: ${formatFolio(data.folio)}`, pageWidth - margin, 28, { align: "right" });

  let currentY = 45;

  autoTable(doc, {
    startY: currentY,
    head: [['DATOS DE LA CHARLA']],
    body: [
      [`Relator: ${data.supervisorName || 'N/A'} | Cargo: ${data.cargo || 'N/A'}`],
      [`Lugar: ${data.lugar || 'N/A'} | Fecha: ${new Date(data.fecha).toLocaleDateString('es-CL')}`],
      [`Hora Inicio: ${data.horaInicio || 'N/A'} | Hora Término: ${data.horaTermino || 'N/A'}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.text("TEMARIO / CONTENIDO", margin, currentY);
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const splitTemario = doc.splitTextToSize(data.temario || '', pageWidth - margin * 2);
  doc.text(splitTemario, margin, currentY);
  currentY += (splitTemario.length * 5) + 8;

  // Assistants Table
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("LISTA DE ASISTENTES", margin, currentY);
  currentY += 4;

  if (data.assistants && data.assistants.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['Nombre Asistente', 'RUT', 'Cargo / Empresa', 'Firma']],
      body: data.assistants.map((a: any) => [a.nombre, a.rut, a.cargo, '']),
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
      bodyStyles: { minCellHeight: 18, valign: 'middle', fontSize: 8 },
      didDrawCell: (cellData) => {
        if (cellData.section === 'body' && cellData.column.index === 3) {
          const assistant = data.assistants[cellData.row.index];
          if (assistant.firma) {
            try { doc.addImage(assistant.firma, 'PNG', cellData.cell.x + 2, cellData.cell.y + 2, 25, 12); } catch (e) { }
          }
        }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // Final Signatures
  if (currentY > pageHeight - 60) { doc.addPage(); currentY = 40; }
  doc.setDrawColor(200, 200, 200);
  
  // Left: Supervisor/Relator
  doc.line(margin, currentY, margin + 60, currentY);
  doc.text("FIRMA RESPONSABLE", margin, currentY + 5);
  doc.text(data.supervisorName || '', margin, currentY + 10);
  if (data.firmaSupervisor) {
    try { doc.addImage(data.firmaSupervisor, 'PNG', margin, currentY - 20, 40, 18); } catch (e) { }
  }

  // Right: Prevención (if signed)
  if (data.prevencion_signature_url) {
    const rightX = pageWidth - margin - 60;
    doc.line(rightX, currentY, pageWidth - margin, currentY);
    doc.text("FIRMA PREVENCIÓN", rightX, currentY + 5);
    doc.text(data.prevencionName || 'Departamento de Prevención', rightX, currentY + 10);
    try { doc.addImage(data.prevencion_signature_url, 'PNG', rightX, currentY - 20, 40, 18); } catch (e) { }
  }


  doc.save(`Capacitacion-${formatFolio(data.folio)}-${new Date().toISOString().split('T')[0]}.pdf`);
};
