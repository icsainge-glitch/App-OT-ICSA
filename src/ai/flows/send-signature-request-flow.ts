
'use server';
/**
 * @fileOverview Flow to send a remote signature request link.
 * Uses Firebase Admin to update tokens securely.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmailSMTP } from '../services/email';
import { getOrderById, saveWorkOrderAndStatus } from '@/actions/db-actions';
import { formatFolio } from '@/lib/utils';

const SendSignatureRequestInputSchema = z.object({
  orderId: z.string(),
  recipientEmail: z.string().email(),
  clientName: z.string(),
  folio: z.union([z.number(), z.string()]),
  baseUrl: z.string(),
});

export async function sendSignatureRequest(input: z.infer<typeof SendSignatureRequestInputSchema>) {
  return sendSignatureRequestFlow(input);
}

const sendSignatureRequestFlow = ai.defineFlow(
  {
    name: 'sendSignatureRequestFlow',
    inputSchema: SendSignatureRequestInputSchema,
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional() }),
  },
  async (input) => {
    try {
      const order = await getOrderById(input.orderId);
      // 1. Generar token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      const saveResult = await saveWorkOrderAndStatus({
        ...order,
        signatureToken: token,
        tokenExpiry: expiry.toISOString(),
      }, false);

      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      // 3. Enviar Email
      const signatureLink = `${input.baseUrl}/firmar/${input.orderId}?token=${token}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #38A3A5; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">ICSA - Solicitud de Firma Digital</h1>
          </div>
          <div style="padding: 20px; line-height: 1.6; color: #333;">
            <p>Estimado/a <strong>${input.clientName}</strong>,</p>
            <p>Se ha generado una solicitud de firma remota para la Orden de Trabajo <strong>${formatFolio(input.folio)}</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signatureLink}" style="background-color: #22577A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Revisar y Firmar OT</a>
            </div>
            <p style="font-size: 12px; color: #888;">Este enlace expirará en 7 días.</p>
          </div>
        </div>
      `;

      await sendEmailSMTP({
        to: input.recipientEmail,
        subject: `ICSA - Solicitud de Firma Digital OT ${formatFolio(input.folio)}`,
        html: htmlContent
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error sending signature request:', error);
      return { success: false, error: error.message };
    }
  }
);
