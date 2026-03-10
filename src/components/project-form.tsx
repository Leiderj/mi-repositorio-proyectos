'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import type { ProjectFormValues } from '@/lib/schemas';
import { projectSchema } from '@/lib/schemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { createProject } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { RefinementTool } from './refinement-tool';

export function ProjectForm() {
  const { toast } = useToast();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      locality: '',
      contactPersonName: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      generalObjective: '',
      specificObjectives: [{ value: '' }],
      developmentMethod: '',
      team: [{ name: '', cedula: '', phone: '', email: '' }],
    },
  });

  const { fields: specObjectivesFields, append: appendSpecObjective, remove: removeSpecObjective } = useFieldArray({
    control: form.control,
    name: "specificObjectives",
  });

  const { fields: teamFields, append: appendTeamMember, remove: removeTeamMember } = useFieldArray({
    control: form.control,
    name: "team",
  });

  async function onSubmit(data: ProjectFormValues) {
    const result = await createProject(data);
    if (result.errors) {
      toast({
        title: 'Error de Validación',
        description: result.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Éxito',
        description: result.message,
      });
      form.reset();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica del Proyecto</CardTitle>
            <CardDescription>
              Detalles principales para identificar el proyecto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Proyecto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Sistema de Gestión Académica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Proyecto</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describa brevemente el proyecto..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid md:grid-cols-3 gap-4">
               <FormField
                  control={form.control}
                  name="trayecto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trayecto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un trayecto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="I">Trayecto I</SelectItem>
                          <SelectItem value="II">Trayecto II</SelectItem>
                          <SelectItem value="III">Trayecto III</SelectItem>
                          <SelectItem value="IV">Trayecto IV</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                     <FormItem className="flex flex-col pt-2">
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value ? (
                                format(new Date(field.value), "PPP")
                                ) : (
                                <span>Seleccione una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString())}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                            <FormLabel>Fecha de Fin</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(new Date(field.value), "PPP")
                                    ) : (
                                    <span>Seleccione una fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date?.toISOString())}
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Localidad y Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField
                control={form.control}
                name="locality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parroquia</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Altagracia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="font-medium text-sm">Persona de Contacto en la Comunidad</p>
              <div className="grid md:grid-cols-3 gap-4">
                 <FormField control={form.control} name="contactPersonName" render={({ field }) => ( <FormItem> <FormLabel>Nombre</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                 <FormField control={form.control} name="contactPersonPhone" render={({ field }) => ( <FormItem> <FormLabel>Teléfono</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                 <FormField control={form.control} name="contactPersonEmail" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Objetivos y Metodología</CardTitle>
                    <CardDescription>Define el alcance y el enfoque de la investigación.</CardDescription>
                </div>
                <RefinementTool />
            </CardHeader>
            <CardContent className="space-y-4">
                 <FormField
                    control={form.control}
                    name="generalObjective"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Objetivo General</FormLabel>
                        <FormControl>
                            <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                
                <div>
                    <FormLabel>Objetivos Específicos</FormLabel>
                    {specObjectivesFields.map((field, index) => (
                        <FormField
                            key={field.id}
                            control={form.control}
                            name={`specificObjectives.${index}.value`}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2 pt-2">
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecObjective(index)} disabled={specObjectivesFields.length <= 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendSpecObjective({ value: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Objetivo
                    </Button>
                </div>

                 <FormField
                    control={form.control}
                    name="developmentMethod"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Método de Desarrollo de Investigación</FormLabel>
                        <FormControl>
                            <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Equipo del Proyecto</CardTitle>
                <CardDescription>Información de los integrantes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 {teamFields.map((field, index) => (
                     <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                        <h4 className="font-semibold">Integrante {index + 1}</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                           <FormField control={form.control} name={`team.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name={`team.${index}.cedula`} render={({ field }) => (<FormItem><FormLabel>Cédula</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name={`team.${index}.phone`} render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name={`team.${index}.email`} render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeTeamMember(index)} disabled={teamFields.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                 ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendTeamMember({ name: '', cedula: '', phone: '', email: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Integrante
                 </Button>
            </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Proyecto'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
