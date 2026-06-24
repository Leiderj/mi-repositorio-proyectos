'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function FormularioIdea() {
  const [titulo, setTitulo] = useState('');
  const [problema, setProblema] = useState('');
  const [tecnologias, setTecnologias] = useState('');
  const [cargando, setCargando] = useState(false); // 1. Nuevo estado para el botón

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true); // 2. Bloqueamos al iniciar
    
    try {
      await addDoc(collection(db, 'banco_ideas'), {
        titulo,
        problema,
        tecnologias,
        createdAt: new Date()
      });
      alert("¡Idea registrada con éxito!");
      setTitulo(''); setProblema(''); setTecnologias('');
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setCargando(false); // 3. Desbloqueamos al terminar (sea éxito o error)
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold">Nueva Sugerencia de Proyecto</h2>
      <Input placeholder="Título del proyecto" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      <Textarea placeholder="Problema a resolver..." value={problema} onChange={(e) => setProblema(e.target.value)} required />
      <Input placeholder="Tecnologías sugeridas (ej: React, MariaDB)" value={tecnologias} onChange={(e) => setTecnologias(e.target.value)} />
      
      {/* 4. Aquí aplicamos el estado al botón */}
      <Button type="submit" disabled={cargando}>
        {cargando ? "Publicando..." : "Publicar Idea"}
      </Button>
    </form>
  );
}