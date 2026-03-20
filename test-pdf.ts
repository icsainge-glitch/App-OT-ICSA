
import { generateServerHPTPDF } from './src/lib/pdf-generator';
import * as fs from 'fs';
import * as path from 'path';

async function test() {
  const mockData = {
    folio: 123,
    projectName: 'Proyecto de Prueba',
    supervisorName: 'Juan Perez',
    supervisorRut: '12.345.678-9',
    fecha: new Date().toISOString(),
    trabajoRealizar: 'Prueba de generación de logo',
    recursos: { personal: 'SI', equipos: 'SI' },
    riesgos: { atrapamiento: 'SI' },
    medidas: { equipo: 'SI' },
    epp: { casco: true }
  };

  const questions: any[] = [];
  
  console.log("Generando PDF de prueba...");
  const pdfBuffer = await generateServerHPTPDF(mockData, questions);
  
  const outputPath = path.join(process.cwd(), 'test-hpt.pdf');
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`PDF generado en: ${outputPath}`);
  console.log(`Tamaño del PDF: ${pdfBuffer.length} bytes`);
}

test().catch(console.error);
