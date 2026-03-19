
'use server';
/**
 * @fileOverview Flow to close a project and generate a final summary Work Order.
 * Uses Firebase Admin SDK to bypass security rules on the server.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { closeProject as closeProjectSqlite } from '@/actions/db-actions';

const CloseProjectInputSchema = z.object({
  projectId: z.string(),
  closedByUid: z.string(),
});

export async function closeProject(input: z.infer<typeof CloseProjectInputSchema>) {
  return closeProjectFlow(input);
}

const closeProjectFlow = ai.defineFlow(
  {
    name: 'closeProjectFlow',
    inputSchema: CloseProjectInputSchema,
    outputSchema: z.object({ success: z.boolean(), error: z.string().optional(), orderId: z.string().optional() }),
  },
  async (input) => {
    try {
      const summaryOtId = `ACTA-${input.projectId}`;
      await closeProjectSqlite(input.projectId, input.closedByUid, "AI_FLOW", "AI_FLOW");
      return { success: true, orderId: summaryOtId };
    } catch (error: any) {
      console.error('Error closing project:', error);
      return { success: false, error: error.message };
    }
  }
);
