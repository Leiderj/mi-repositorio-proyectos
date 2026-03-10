import { z } from 'zod';

export const teamMemberSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  cedula: z.string().regex(/^\d{7,8}$/, { message: 'Formato de cédula inválido.' }),
  phone: z.string().regex(/^\d{10,11}$/, { message: 'Número de teléfono inválido.' }),
  email: z.string().email({ message: 'Correo electrónico inválido.' }),
});

export const projectSchema = z.object({
  title: z.string().min(5, { message: 'El título debe tener al menos 5 caracteres.' }),
  description: z.string().min(20, { message: 'La descripción debe tener al menos 20 caracteres.' }),
  trayecto: z.enum(['I', 'II', 'III', 'IV'], { required_error: 'Debe seleccionar un trayecto.' }),
  startDate: z.string({ required_error: 'La fecha de inicio es requerida.' }).min(1, 'La fecha de inicio es requerida.'),
  endDate: z.string({ required_error: 'La fecha de fin es requerida.' }).min(1, 'La fecha de fin es requerida.'),
  locality: z.string().min(3, { message: 'La localidad es requerida.' }),
  contactPersonName: z.string().min(3, { message: 'El nombre del contacto es requerido.' }),
  contactPersonPhone: z.string().regex(/^\d{10,11}$/, { message: 'Teléfono de contacto inválido.' }),
  contactPersonEmail: z.string().email({ message: 'Email de contacto inválido.' }),
  generalObjective: z.string().min(10, { message: 'El objetivo general es requerido.' }),
  specificObjectives: z.array(z.object({ value: z.string().min(10, { message: 'El objetivo específico debe tener al menos 10 caracteres.' }) })).min(1, 'Debe haber al menos un objetivo específico.'),
  developmentMethod: z.string().min(10, { message: 'El método de desarrollo es requerido.' }),
  team: z.array(teamMemberSchema).min(1, 'Debe haber al menos un integrante en el equipo.'),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
