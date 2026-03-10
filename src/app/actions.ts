'use server';

import type { ProjectFormValues } from '@/lib/schemas';
import { projectSchema } from '@/lib/schemas';

export async function createProject(data: ProjectFormValues) {
  const validatedFields = projectSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación.',
    };
  }

  // Here you would typically save the data to a database.
  // For this example, we'll just log it.
  console.log('Project created successfully:');
  console.log(JSON.stringify(validatedFields.data, null, 2));

  return {
    message: 'Proyecto creado exitosamente.',
    data: validatedFields.data,
  };
}
