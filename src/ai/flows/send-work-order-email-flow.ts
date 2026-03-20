
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmailSMTP } from '../services/email';
import { generateServerWorkOrderPDF } from '@/lib/pdf-generator';
import { formatFolio } from '@/lib/utils';

const SendWorkOrderEmailInputSchema = z.object({
  order: z.any(), // Allowing the full order object for PDF generation
});
export type SendWorkOrderEmailInput = z.infer<typeof SendWorkOrderEmailInputSchema>;

export async function sendWorkOrderEmail(input: SendWorkOrderEmailInput) {
  return sendWorkOrderEmailFlow(input);
}

const sendWorkOrderEmailFlow = ai.defineFlow(
  {
    name: 'sendWorkOrderEmailFlow',
    inputSchema: SendWorkOrderEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional() }),
  },
  async (input) => {
    const { order } = input;
    const recipientEmail = order.clientReceiverEmail;

    if (!recipientEmail) {
      return { success: false, error: "No recipient email provided in order." };
    }

    try {
      console.log(`Iniciando generación de PDF para OT: ${order.folio} (Recipient: ${recipientEmail})`);
      
      // 1. Generate PDF Attachment on the server
      const pdfBuffer = await generateServerWorkOrderPDF(order);
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
          console.error("GENERACIÓN DE PDF FALLIDA: El buffer está vacío.");
          throw new Error("El PDF generado está vacío.");
      }
      
      console.log(`PDF generado con éxito. Tamaño: ${pdfBuffer.length} bytes`);
      const filename = `OT_${formatFolio(order.folio)}_${(order.clientName || 'ICSA').replace(/\s+/g, '_')}.pdf`;

      const fullDescription = order.description || 'N/A';
      const shortDescription = fullDescription.length > 150
        ? fullDescription.substring(0, 150) + '...'
        : fullDescription;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #38A3A5; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">ICSA - Orden de Trabajo Finalizada</h1>
          </div>
          <div style="padding: 20px; line-height: 1.6; color: #333;">
            <p>Estimado/a <strong>${order.clientReceiverName || order.clientName || 'Cliente'}</strong>,</p>
            <p>Le informamos que la Orden de Trabajo <strong>${formatFolio(order.folio)}</strong> ha sido finalizada con éxito.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Fecha:</strong> ${new Date(order.updatedAt || Date.now()).toLocaleDateString()}</p>
              <p style="margin: 10px 0 0 0;"><strong>Resumen de Actividades:</strong></p>
              <p style="margin: 5px 0 0 0; font-style: italic;">${shortDescription}</p>
            </div>

            <p>Adjuntamos a este correo la copia oficial en formato PDF de su Orden de Trabajo para su respaldo.</p>

            <p>Gracias por confiar en ICSA Ingeniería Comunicaciones S.A.</p>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
            Este es un mensaje automático, por favor no responda a este correo.
          </div>
        </div>
      `;
      
      await sendEmailSMTP({
        to: recipientEmail,
        subject: `ICSA - Orden de Trabajo ${formatFolio(order.folio)} Finalizada`,
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
      console.error('Error in sendWorkOrderEmailFlow:', error);
      return { success: false, error: error.message };
    }
  }
);
