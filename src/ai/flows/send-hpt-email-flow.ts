
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmailSMTP } from '../services/email';
import { generateServerHPTPDF } from '@/lib/pdf-generator';
import { getHPTById, getHPTQuestions } from '@/actions/db-actions';
import { formatFolio } from '@/lib/utils';

const SendHPTEmailInputSchema = z.object({
  hptId: z.string(),
});
export type SendHPTEmailInput = z.infer<typeof SendHPTEmailInputSchema>;

export async function sendHPTEmail(input: SendHPTEmailInput) {
  return sendHPTEmailFlow(input);
}

const sendHPTEmailFlow = ai.defineFlow(
  {
    name: 'sendHPTEmailFlow',
    inputSchema: SendHPTEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional() }),
  },
  async (input) => {
    try {
      const hpt = await getHPTById(input.hptId);
      if (!hpt) return { success: false, error: "HPT no encontrada." };

      const recipientEmail = hpt.prevencionEmail || hpt.prevencionemail;
      if (!recipientEmail) {
        return { success: false, error: "No se encontró el email de prevención en la HPT." };
      }

      console.log(`Iniciando generación de PDF para HPT: ${hpt.folio} (Recipient: ${recipientEmail})`);
      
      // Fetch questions for PDF generation
      const questions = await getHPTQuestions();
      
      // 1. Generate PDF Attachment on the server
      const pdfBuffer = await generateServerHPTPDF(hpt, questions);
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
          console.error("GENERACIÓN DE PDF HPT FALLIDA: El buffer está vacío.");
          throw new Error("El PDF de la HPT generado está vacío.");
      }
      
      console.log(`PDF HPT generado con éxito. Tamaño: ${pdfBuffer.length} bytes`);
      const filename = `HPT_${formatFolio(hpt.folio)}_${(hpt.projectName || 'Sin_Proyecto').replace(/\s+/g, '_')}.pdf`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #22577A; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">ICSA - Registro de HPT Completado</h1>
          </div>
          <div style="padding: 20px; line-height: 1.6; color: #333;">
            <p>Estimado/a <strong>${hpt.prevencionName || 'Prevención'}</strong>,</p>
            <p>Le informamos que el registro de HPT (Hoja de Planificación del Trabajo) con <strong>Folio ${formatFolio(hpt.folio)}</strong> ha sido firmado y completado.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Proyecto:</strong> ${hpt.projectName || 'General'}</p>
              <p style="margin: 10px 0 0 0;"><strong>Supervisor:</strong> ${hpt.supervisorName || 'N/A'}</p>
              <p style="margin: 10px 0 0 0;"><strong>Fecha:</strong> ${new Date(hpt.fecha || Date.now()).toLocaleDateString()}</p>
            </div>

            <p>Adjuntamos a este correo la copia oficial en formato PDF de la HPT para su respaldo.</p>

            <p>Gracias por confiar en ICSA Ingeniería Comunicaciones S.A.</p>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
            Este es un mensaje automático, por favor no responda a este correo.
          </div>
        </div>
      `;

      await sendEmailSMTP({
        to: recipientEmail,
        subject: `ICSA - HPT ${formatFolio(hpt.folio)} Completada`,
        html: htmlContent,
        attachments: [
          {
            filename: filename,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error in sendHPTEmailFlow:', error);
      return { success: false, error: error.message };
    }
  }
);
