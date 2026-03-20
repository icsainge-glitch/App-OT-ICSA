
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, MessageSquare, Calendar, MapPin, User, Search, Loader2, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { getCapacitaciones, getCapacitacionById, hideCapacitacion } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";
import { generateCharlaPDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

export default function CharlasListPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador';
  const isPrevencionista = userProfile?.rol_t?.toLowerCase() === 'prevencionista' || 
    userProfile?.rol_t?.toLowerCase() === 'prevenc';
  const { toast } = useToast();

  const { data: capacitaciones, isLoading: capLoading, refetch } = useActionData<any[]>(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    return getCapacitaciones(user.uid, isAdmin, isPrevencionista);
  }, [user?.uid, isAdmin, isPrevencionista, isProfileLoading]);

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading, router]);

  const filteredCaps = (capacitaciones || []).filter(cap => 
    cap.supervisorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cap.temario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cap.lugar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cap.folio?.toString().includes(searchTerm)
  );

  const handleDownloadPDF = async (id: string) => {
    try {
      const fullData = await getCapacitacionById(id);
      if (fullData) {
        await generateCharlaPDF(fullData);
      }
    } catch (e) {
      console.error("Error generating Capacitación PDF:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    if (!confirm("¿Está seguro que desea borrar esta charla? Solo dejará de verla usted, otros autorizados podrán seguir viéndola.")) return;

    try {
      const res = await hideCapacitacion(id, user.uid);
      if (res.success) {
        toast({ title: "Documento borrado", description: "La charla ha sido ocultada de su lista." });
        refetch();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudo borrar el documento", variant: "destructive" });
    }
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase tracking-tighter">Cargando Charlas...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <header className="bg-primary text-white backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-white">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="font-black text-lg uppercase tracking-tighter leading-tight">Charlas de Seguridad</h1>
          </div>
          <Link href="/capacitaciones/new">
            <Button className="bg-white text-primary hover:bg-white/90 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg">
              <Plus className="h-4 w-4 mr-1" /> Nueva
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-4xl space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar por supervisor, tema o lugar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-6 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        {capLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-black text-xs uppercase tracking-widest opacity-40">Buscando charlas...</p>
          </div>
        ) : filteredCaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCaps.map((cap) => (
              <Card key={cap.id} className="shadow-sm border-none bg-white rounded-3xl overflow-hidden hover:shadow-md transition-all group animate-fade-in">
                <CardContent className="p-0">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <MessageSquare className="h-6 w-6 text-primary group-hover:text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Folio #{String(cap.folio).padStart(5, '0')}</span>
                          <span className="font-black text-sm uppercase tracking-tighter mt-1">{cap.supervisorName || 'Sin Nombre'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                         <MapPin className="h-3.5 w-3.5" /> {cap.lugar || 'Ubicación no especificada'}
                       </p>
                       <p className="text-xs font-medium text-muted-foreground line-clamp-2">
                         {cap.temario || 'Sin temario detallado'}
                       </p>
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t border-black/5 text-[10px] font-bold text-muted-foreground">
                      <div className="flex items-center gap-1.5 uppercase tracking-widest">
                        <Calendar className="h-3 w-3 text-primary" />
                        {new Date(cap.fecha).toLocaleDateString('es-CL')}
                      </div>
                      <div className="flex items-center gap-1.5 uppercase tracking-widest">
                        <Clock className="h-3 w-3 text-primary" />
                        {cap.horaInicio} - {cap.horaTermino}
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-3 flex gap-2">
                    <Link href={`/capacitaciones/${cap.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white text-primary border-none shadow-sm">Editar</Button>
                    </Link>
                    <Button 
                      onClick={() => handleDownloadPDF(cap.id)}
                      className="flex-1 h-10 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                      Generar PDF
                    </Button>
                    <Button 
                      onClick={() => handleDelete(cap.id)}
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10"
                      title="Borrar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-primary/20 rounded-3xl p-20 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
              <MessageSquare className="h-10 w-10 text-primary/20" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-lg uppercase tracking-tighter">Sin registros</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">No se han registrado charlas de seguridad aún.</p>
            </div>
            <Link href="/capacitaciones/new" className="inline-block mt-4">
              <Button className="bg-primary text-white font-black rounded-2xl px-8 h-12 uppercase tracking-widest shadow-xl shadow-primary/30">
                Nueva Charla
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
