
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmailSMTP } from '../services/email';
import { getHPTById, saveHPT } from '@/actions/db-actions';
import { formatFolio } from '@/lib/utils';

const SendHPTSignatureRequestInputSchema = z.object({
  id: z.string(),
  recipientEmail: z.string().email(),
  prevencionName: z.string(),
  folio: z.union([z.number(), z.string()]),
  baseUrl: z.string(),
});

export async function sendHPTSignatureRequest(input: z.infer<typeof SendHPTSignatureRequestInputSchema>) {
  return sendHPTSignatureRequestFlow(input);
}

const sendHPTSignatureRequestFlow = ai.defineFlow(
  {
    name: 'sendHPTSignatureRequestFlow',
    inputSchema: SendHPTSignatureRequestInputSchema,
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional() }),
  },
  async (input) => {
    try {
      const hpt = await getHPTById(input.id);
      if (!hpt) return { success: false, error: 'HPT no encontrada' };

      // 1. Generar token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      // 2. Guardar token en BD
      const saveResult = await saveHPT({
        ...hpt,
        signatureToken: token,
        tokenExpiry: expiry.toISOString(),
        status: 'Pendiente' 
      }, hpt.workers);

      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      // 3. Enviar Email
      const signatureLink = `${input.baseUrl}/firmar/hpt/${input.id}?token=${token}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #22577A; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">ICSA - Revisión de HPT</h1>
          </div>
          <div style="padding: 20px; line-height: 1.6; color: #333;">
            <p>Estimado/a <strong>${input.prevencionName}</strong>,</p>
            <p>Se ha generado un nuevo registro de HPT (Hoja de Planificación del Trabajo) para su revisión y firma: <strong>Folio ${formatFolio(input.folio)}</strong>.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
              <li><strong>Proyecto:</strong> ${hpt.projectName || 'General'}</li>
              <li><strong>Supervisor:</strong> ${hpt.supervisorName || 'N/A'}</li>
              <li><strong>Fecha:</strong> ${hpt.fecha || 'N/A'}</li>
            </ul>
            <div style="text-align: center; margin: 0px 0;">
              <a href="${signatureLink}" style="background-color: #38A3A5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Revisar y Firmar HPT</a>
            </div>
            <p style="font-size: 12px; color: #888;">Este enlace expirará en 7 días.</p>
          </div>
        </div>
      `;

      await sendEmailSMTP({
        to: input.recipientEmail,
        subject: `ICSA - Solicitud de Firma Prevención - HPT ${formatFolio(input.folio)}`,
        html: htmlContent
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error sending HPT signature request:', error);
      return { success: false, error: error.message };
    }
  }
);
