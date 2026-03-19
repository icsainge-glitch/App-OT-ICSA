
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmailSMTP } from '../services/email';

const SendProjectInvitationEmailInputSchema = z.object({
  projectName: z.string(),
  inviterName: z.string(),
  recipientEmail: z.string(),
  recipientName: z.string(),
});
export type SendProjectInvitationEmailInput = z.infer<typeof SendProjectInvitationEmailInputSchema>;

export async function sendProjectInvitationEmail(input: SendProjectInvitationEmailInput) {
  return sendProjectInvitationEmailFlow(input);
}

const sendProjectInvitationEmailFlow = ai.defineFlow(
  {
    name: 'sendProjectInvitationEmailFlow',
    inputSchema: SendProjectInvitationEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional() }),
  },
  async (input) => {
    const { projectName, inviterName, recipientEmail, recipientName } = input;

    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #38A3A5; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0;">ICSA - Invitación a Colaborar</h1>
          </div>
          <div style="padding: 20px; line-height: 1.6; color: #333;">
            <p>Estimado/a <strong>${recipientName}</strong>,</p>
            <p>Le informamos que <strong>${inviterName}</strong> le ha enviado una invitación para colaborar en el proyecto: <strong>${projectName}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Proyecto:</strong> ${projectName}</p>
              <p style="margin: 10px 0 0 0;"><strong>Invitado por:</strong> ${inviterName}</p>
            </div>

            <p>Ya puede acceder a este proyecto desde su panel de control para visualizar los detalles y gestionar órdenes de trabajo asociadas.</p>

            <p>Atentamente,<br/>Equipo ICSA Ingeniería Comunicaciones S.A.</p>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #888;">
            Este es un mensaje automático, por favor no responda a este correo.
          </div>
        </div>
      `;

      await sendEmailSMTP({
        to: recipientEmail,
        subject: `ICSA - Invitación a Colaborar en Proyecto: ${projectName}`,
        html: htmlContent,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error in sendProjectInvitationEmailFlow:', error);
      return { success: false, error: error.message };
    }
  }
);
