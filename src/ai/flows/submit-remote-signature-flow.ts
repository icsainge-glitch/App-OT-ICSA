
'use server';
/**
 * @fileOverview Flow to validate and submit a remote signature for a Work Order.
 * Uses Firebase Admin SDK to ensure the move between collections is atomic and authorized.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { submitRemoteSignature as submitSignatureLocal } from '@/actions/db-actions';

const SubmitRemoteSignatureInputSchema = z.object({
  orderId: z.string(),
  token: z.string(),
  receiverName: z.string(),
  receiverRut: z.string(),
  receiverEmail: z.string().email().optional(),
  signatureUrl: z.string(), // base64
});
export type SubmitRemoteSignatureInput = z.infer<typeof SubmitRemoteSignatureInputSchema>;

const SubmitRemoteSignatureOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
export type SubmitRemoteSignatureOutput = z.infer<typeof SubmitRemoteSignatureOutputSchema>;

export async function submitRemoteSignature(input: SubmitRemoteSignatureInput): Promise<SubmitRemoteSignatureOutput> {
  return submitRemoteSignatureFlow(input);
}

const submitRemoteSignatureFlow = ai.defineFlow(
  {
    name: 'submitRemoteSignatureFlow',
    inputSchema: SubmitRemoteSignatureInputSchema,
    outputSchema: SubmitRemoteSignatureOutputSchema,
  },
  async (input) => {
    try {
      const result = await submitSignatureLocal({
        orderId: input.orderId,
        token: input.token,
        receiverName: input.receiverName,
        receiverRut: input.receiverRut,
        receiverEmail: input.receiverEmail || "",
        signatureUrl: input.signatureUrl
      });
      return result;
    } catch (error: any) {
      console.error('Error in submitRemoteSignatureFlow:', error);
      return { success: false, error: error.message };
    }
  }
);
