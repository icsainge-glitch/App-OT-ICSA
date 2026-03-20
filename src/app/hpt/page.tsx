
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, FileText, Calendar, User, Search, Loader2, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { getHPTs, getHPTById, getHPTQuestions, hideHPT } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";
import { generateHPTPDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HPTListPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador';
  const isPrevencionista = userProfile?.rol_t?.toLowerCase() === 'prevencionista' || 
    userProfile?.rol_t?.toLowerCase() === 'prevenc';
  const { toast } = useToast();

  const { data: hpts, isLoading: hptLoading, refetch } = useActionData<any[]>(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    return getHPTs(user.uid, isAdmin, isPrevencionista);
  }, [user?.uid, isAdmin, isPrevencionista, isProfileLoading]);

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading, router]);

  const filteredHPTs = (hpts || []).filter(hpt => 
    hpt.supervisorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hpt.trabajoRealizar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hpt.folio?.toString().includes(searchTerm)
  );

  const canEditHPT = (hpt: any) => {
    if (isAdmin || isPrevencionista) return true;
    if (hpt.status === 'Borrador' && hpt.supervisorId === user?.uid) return true;
    return false;
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const fullData = await getHPTById(id);
      const questions = await getHPTQuestions();
      if (fullData) {
        await generateHPTPDF(fullData, questions);
      }
    } catch (e) {
      console.error("Error generating HPT PDF:", e);
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!user?.uid || !itemToDelete) return;

    try {
      const res = await hideHPT(itemToDelete, user.uid);
      if (res.success) {
        toast({ title: "Documento borrado", description: "El HPT ha sido ocultado de su lista." });
        refetch();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudo borrar el documento", variant: "destructive" });
    } finally {
      setItemToDelete(null);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase tracking-tighter">Cargando HPTs...</div>;
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
            <h1 className="font-black text-lg uppercase tracking-tighter leading-tight">HPT - Planificación</h1>
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin || isPrevencionista) && (
              <Link href="/hpt/settings">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-white" title="Configuración de HPT">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link href="/hpt/new">
              <Button className="bg-white text-primary hover:bg-white/90 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg">
                <Plus className="h-4 w-4 mr-1" /> Nuevo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-4xl space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar por supervisor, folio o trabajo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-6 bg-white border-none rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        {hptLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-black text-xs uppercase tracking-widest opacity-40">Buscando documentos...</p>
          </div>
        ) : filteredHPTs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHPTs.map((hpt) => (
              <Card key={hpt.id} className="shadow-sm border-none bg-white rounded-3xl overflow-hidden hover:shadow-md transition-all group animate-fade-in">
                <CardContent className="p-0">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <FileText className="h-6 w-6 text-primary group-hover:text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Folio #{String(hpt.folio).padStart(5, '0')}</span>
                          <span className="font-black text-sm uppercase tracking-tighter mt-1">{hpt.supervisorName || 'Sin Nombre'}</span>
                        </div>
                      </div>
                      <Badge className={`rounded-xl px-3 py-1 text-[8px] font-black uppercase tracking-widest ${hpt.status === 'Completado' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {hpt.status}
                      </Badge>
                    </div>

                    <p className="text-xs font-medium text-muted-foreground line-clamp-2 italic">
                      "{hpt.trabajoRealizar || 'Sin descripción de trabajo'}"
                    </p>

                    <div className="flex items-center gap-4 pt-2 border-t border-black/5 text-[10px] font-bold text-muted-foreground">
                      <div className="flex items-center gap-1.5 uppercase tracking-widest">
                        <Calendar className="h-3 w-3 text-primary" />
                        {new Date(hpt.fecha).toLocaleDateString('es-CL')}
                      </div>
                      <div className="flex items-center gap-1.5 uppercase tracking-widest">
                        <User className="h-3 w-3 text-primary" />
                        {hpt.supervisorRut}
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-3 flex gap-2">
                    {canEditHPT(hpt) && (
                      <Link href={`/hpt/${hpt.id}/edit`} className="flex-1">
                        <Button variant="outline" className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white text-primary border-none shadow-sm">Editar</Button>
                      </Link>
                    )}
                    <Button 
                      onClick={() => handleDownloadPDF(hpt.id)}
                      className="flex-1 h-10 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                      Ver PDF
                    </Button>
                    <Button 
                      onClick={() => handleDelete(hpt.id)}
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
              <FileText className="h-10 w-10 text-primary/20" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-lg uppercase tracking-tighter">No hay documentos</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Empieza creando tu primer HPT para este proyecto.</p>
            </div>
            <Link href="/hpt/new" className="inline-block mt-4">
              <Button className="bg-primary text-white font-black rounded-2xl px-8 h-12 uppercase tracking-widest shadow-xl shadow-primary/30">
                Crear HPT
              </Button>
            </Link>
          </div>
        )}
      </main>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-tighter">¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground italic">
              Esta acción no será reversible. El documento se ocultará de su lista de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-2xl font-black uppercase tracking-widest text-[10px] border-none bg-muted/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="rounded-2xl font-black uppercase tracking-widest text-[10px] bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20"
            >
              Confirmar Borrado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
