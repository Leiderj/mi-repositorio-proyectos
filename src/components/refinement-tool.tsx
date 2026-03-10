'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2 } from 'lucide-react';
import type { ProjectFormValues } from '@/lib/schemas';
import { suggestProjectRefinements } from '@/ai/flows/suggest-project-refinements';
import type { ProjectRefinementOutput } from '@/ai/flows/suggest-project-refinements';
import { useToast } from '@/hooks/use-toast';

export function RefinementTool() {
  const { toast } = useToast();
  const form = useFormContext<ProjectFormValues>();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ProjectRefinementOutput | null>(null);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setSuggestions(null);

    const { description, generalObjective, specificObjectives } = form.getValues();

    if (!description || !generalObjective || specificObjectives.some(o => !o.value)) {
        toast({
            title: "Campos incompletos",
            description: "Por favor, complete la descripción y los objetivos antes de solicitar sugerencias.",
            variant: "destructive",
        });
        setIsLoading(false);
        setIsOpen(false);
        return;
    }

    try {
        const result = await suggestProjectRefinements({
            projectDescription: description,
            generalObjective,
            specificObjectives: specificObjectives.map((o) => o.value),
        });
        setSuggestions(result);
    } catch (error) {
        console.error("AI refinement error:", error);
        toast({
            title: "Error de IA",
            description: "No se pudieron generar las sugerencias. Inténtelo de nuevo.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleOpen = () => {
      setIsOpen(true);
      handleGetSuggestions();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button type="button" variant="outline" onClick={handleOpen}>
        <Wand2 className="mr-2 h-4 w-4" />
        Refinar con IA
      </Button>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sugerencias de Refinamiento del Proyecto</DialogTitle>
          <DialogDescription>
            La IA ha analizado la información de tu proyecto y propone las siguientes mejoras.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-4">
            {isLoading && (
                 <div className="space-y-6">
                    <div>
                        <Skeleton className="h-6 w-1/4 mb-2" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-8 w-full mb-2" />
                        <Skeleton className="h-8 w-full mb-2" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-1/2 mb-2" />
                        <Skeleton className="h-8 w-full mb-2" />
                         <Skeleton className="h-8 w-full" />
                    </div>
                </div>
            )}
            {suggestions && (
                <div className="space-y-6 text-sm">
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-primary">Objetivo General Sugerido</h3>
                        <p className="bg-primary/5 p-4 rounded-md border border-primary/20">{suggestions.suggestedGeneralObjective}</p>
                    </div>
                    <Separator />
                     <div>
                        <h3 className="font-semibold text-lg mb-2 text-primary">Objetivos Específicos Sugeridos</h3>
                        <ul className="space-y-2 list-disc list-inside bg-primary/5 p-4 rounded-md border border-primary/20">
                           {suggestions.suggestedSpecificObjectives.map((obj, i) => (
                               <li key={i}>{obj}</li>
                           ))} 
                        </ul>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-primary">Metodologías de Investigación Recomendadas</h3>
                        <ul className="space-y-2 list-disc list-inside bg-primary/5 p-4 rounded-md border border-primary/20">
                           {suggestions.recommendedMethodologies.map((method, i) => (
                               <li key={i}>{method}</li>
                           ))} 
                        </ul>
                    </div>
                </div>
            )}
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
