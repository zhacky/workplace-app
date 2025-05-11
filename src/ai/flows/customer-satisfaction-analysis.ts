'use server';
/**
 * @fileOverview An AI-powered tool to analyze customer feedback and identify key satisfaction trends.
 *
 * - analyzeCustomerFeedback - A function that handles the customer feedback analysis process.
 * - AnalyzeCustomerFeedbackInput - The input type for the analyzeCustomerFeedback function.
 * - AnalyzeCustomerFeedbackOutput - The return type for the analyzeCustomerFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCustomerFeedbackInputSchema = z.object({
  feedback: z.string().describe('The customer feedback to analyze.'),
});
export type AnalyzeCustomerFeedbackInput = z.infer<typeof AnalyzeCustomerFeedbackInputSchema>;

const AnalyzeCustomerFeedbackOutputSchema = z.object({
  overallSentiment: z
    .string()
    .describe('The overall sentiment of the feedback (positive, negative, or neutral).'),
  keyTrends: z.array(z.string()).describe('Key trends and topics identified in the feedback.'),
  suggestedImprovements: z
    .array(z.string())
    .describe('Suggested improvements based on the feedback analysis.'),
});
export type AnalyzeCustomerFeedbackOutput = z.infer<typeof AnalyzeCustomerFeedbackOutputSchema>;

export async function analyzeCustomerFeedback(input: AnalyzeCustomerFeedbackInput): Promise<AnalyzeCustomerFeedbackOutput> {
  return analyzeCustomerFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCustomerFeedbackPrompt',
  input: {schema: AnalyzeCustomerFeedbackInputSchema},
  output: {schema: AnalyzeCustomerFeedbackOutputSchema},
  prompt: `You are an AI-powered customer satisfaction analysis tool for "The Workplace" co-working space. Analyze the following customer feedback to identify the overall sentiment, key trends, and suggested improvements.\n\nFeedback: {{{feedback}}}\n\nProvide the output in a structured JSON format, including overallSentiment, keyTrends (an array of strings), and suggestedImprovements (an array of strings).  Ensure the \"keyTrends\" and \"suggestedImprovements\" are concise, actionable insights.\n\nConsider aspects like workspace comfort, amenities, staff interaction, and overall environment. Focus on extracting specific, recurring themes and actionable suggestions that can directly improve the co-working space experience.  Provide a balanced perspective, highlighting both positive and negative aspects where present.
`,
});

const analyzeCustomerFeedbackFlow = ai.defineFlow(
  {
    name: 'analyzeCustomerFeedbackFlow',
    inputSchema: AnalyzeCustomerFeedbackInputSchema,
    outputSchema: AnalyzeCustomerFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
