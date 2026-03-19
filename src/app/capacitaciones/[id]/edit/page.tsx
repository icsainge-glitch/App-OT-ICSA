
'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CapacitacionForm } from "@/components/CapacitacionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { getCapacitacionById } from "@/actions/db-actions";

export default function EditCapacitacionPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (typeof id !== 'string') return;
      const result = await getCapacitacionById(id);
      setData(result);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase bg-muted/10">
        <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Cargando Datos...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-black text-destructive uppercase p-10 bg-muted/10">
        <p>Registro no encontrado</p>
        <Link href="/capacitaciones" className="mt-4">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed animate-fade-in">
      <header className="bg-primary text-white backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-2">
            <Link href="/capacitaciones">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-white">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex flex-col">
               <h1 className="font-black text-sm md:text-lg uppercase tracking-tighter leading-tight">Editar Charla</h1>
              <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none">Registro de Charla de Seguridad</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl">
        <CapacitacionForm initialData={data} />
      </main>
    </div>
  );
}
