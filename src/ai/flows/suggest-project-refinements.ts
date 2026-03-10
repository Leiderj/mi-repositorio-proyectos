'use server';
/**
 * @fileOverview An AI agent for suggesting improvements to project objectives and recommending research methodologies.
 *
 * - suggestProjectRefinements - A function that handles the project refinement process.
 * - ProjectRefinementInput - The input type for the suggestProjectRefinements function.
 * - ProjectRefinementOutput - The return type for the suggestProjectRefinements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectRefinementInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('A detailed description of the project.'),
  generalObjective: z.string().describe('The general objective of the project.'),
  specificObjectives: z
    .array(z.string())
    .describe('A list of specific objectives for the project.'),
});
export type ProjectRefinementInput = z.infer<
  typeof ProjectRefinementInputSchema
>;

const ProjectRefinementOutputSchema = z.object({
  suggestedGeneralObjective: z
    .string()
    .describe('An improved version of the general objective.'),
  suggestedSpecificObjectives: z
    .array(z.string())
    .describe('Improved versions of the specific objectives.'),
  recommendedMethodologies: z
    .array(z.string())
    .describe('A list of suitable research methodologies for the project.'),
});
export type ProjectRefinementOutput = z.infer<
  typeof ProjectRefinementOutputSchema
>;

export async function suggestProjectRefinements(
  input: ProjectRefinementInput
): Promise<ProjectRefinementOutput> {
  return suggestProjectRefinementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'projectRefinementPrompt',
  input: {schema: ProjectRefinementInputSchema},
  output: {schema: ProjectRefinementOutputSchema},
  prompt: `You are an expert in project proposal development, specializing in the PNF-I (Programa Nacional de Formación en Informática) context at UNEXCA. Your task is to provide constructive feedback to refine project objectives and suggest appropriate research methodologies.

Analyze the provided project description, general objective, and specific objectives. Based on this analysis, propose an improved general objective, refined specific objectives, and recommend suitable research methodologies. Ensure that the suggestions are clear, concise, and academically sound.

Project Description: {{{projectDescription}}}

General Objective: {{{generalObjective}}}

Specific Objectives:
{{#each specificObjectives}}
- {{{this}}}
{{/each}}

Provide your suggestions in the specified JSON format.`,
});

const suggestProjectRefinementsFlow = ai.defineFlow(
  {
    name: 'suggestProjectRefinementsFlow',
    inputSchema: ProjectRefinementInputSchema,
    outputSchema: ProjectRefinementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
