
'use client';

import { HPTForm } from "@/components/HPTForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function NewHPTPage() {
  return (
    <div className="min-h-screen bg-muted/20 pb-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed animate-fade-in">
      <header className="bg-primary text-white backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-2">
            <Link href="/hpt">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-white">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="font-black text-sm md:text-lg uppercase tracking-tighter leading-tight">Nueva HPT</h1>
              <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none">Hoja de Planificación del Trabajo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl">
        <Suspense fallback={<div className="flex items-center justify-center p-20 font-black animate-pulse text-primary uppercase">Preparando Formulario...</div>}>
          <HPTForm />
        </Suspense>
      </main>
    </div>
  );
}
