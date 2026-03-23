
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowLeft, Pencil, Trash2, User, Mail, ShieldCheck, Loader2, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/lib/auth-provider";
import { getPersonnel, deleteRecord } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

export default function TechniciansListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador';

  // Route Protection
  const { isProfileLoading } = useUserProfile();
  if (!isProfileLoading && userProfile && !isAdmin) {
    router.replace('/dashboard');
    return null;
  }

  const { data: staff, isLoading, refetch } = useActionData<any[]>(() => getPersonnel(), []);

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    return staff.filter((s: any) =>
      s.nombre_t?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || s.email_t)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rol_t?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRecord("personnel", deleteId, userProfile?.id, isAdmin);
      toast({ title: "Perfil eliminado", description: "El colaborador ha sido removido del sistema." });
      refetch();
    } catch (e: any) {
      console.error("Error al eliminar personal:", e);
      toast({ 
        title: "Error", 
        description: "No se pudo eliminar el registro. Verifique permisos.", 
        variant: "destructive" 
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-12 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed animate-fade-in">
      <header className="bg-white/80 backdrop-blur-2xl border-b border-primary/10 sticky top-0 z-40 shadow-[0_10px_30px_rgba(0,0,0,0.03)] h-16 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-muted/50">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-black text-lg text-primary uppercase tracking-tighter">Control de Personal</h1>
          </div>
          {isAdmin && (
            <Link href="/technicians/new">
              <Button className="bg-primary hover:bg-primary/90 font-black rounded-xl h-10 shadow-[0_6px_15px_rgba(var(--primary),0.2)] transition-all hover:-translate-y-0.5 px-6">
                <Plus size={18} className="mr-2" /> Registrar Personal
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 space-y-6">
        <Card className="shadow-[0_15px_50px_rgba(0,0,0,0.04)] border-none bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden animate-slide-up">
          <CardHeader className="bg-transparent border-b border-black/5 p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o rol..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 h-14 bg-muted/30 border-none rounded-2xl font-bold shadow-inner focus-visible:ring-primary/20 transition-all"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-black text-xs uppercase py-4 pl-6">Nombre del Colaborador</TableHead>
                    <TableHead className="font-black text-xs uppercase">Email / Contacto</TableHead>
                    <TableHead className="font-black text-xs uppercase">Rol</TableHead>
                    <TableHead className="font-black text-xs uppercase">Estado</TableHead>
                    <TableHead className="text-right font-black text-xs uppercase pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex justify-center flex-col items-center gap-4">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="font-bold text-primary uppercase tracking-widest text-xs">Sincronizando nómina...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                        No hay personal registrado en el sistema.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((person) => (
                      <TableRow key={person.id} className="hover:bg-muted/10 group">
                        <TableCell className="py-4 pl-6 flex flex-row items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                            {person.nombre_t?.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-primary uppercase text-xs">{person.nombre_t}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium flex items-center gap-1"><Mail size={10} className="text-muted-foreground" /> {person.email || person.email_t}</span>
                            {(person.telefono_t || person.cel_t) && <span className="text-xs text-muted-foreground">{person.telefono_t || person.cel_t}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-black uppercase bg-primary/5 text-primary border-none">
                            {person.rol_t}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs font-bold border-none", person.estado_t === 'Inactivo' ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-primary")}>
                            {person.estado_t?.toUpperCase() || 'ACTIVO'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {isAdmin && (
                              <>
                                <Link href={`/technicians/${person.id}/edit`}>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary hover:text-white rounded-xl" title="Editar Perfil">
                                    <Pencil size={16} />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-destructive hover:bg-destructive hover:text-white rounded-xl"
                                  onClick={() => setDeleteId(person.id)}
                                  title="Eliminar Perfil"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-primary uppercase">¿Eliminar Perfil de Personal?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción revocará el acceso de este usuario al sistema ICSA de forma inmediata. Se recomienda desactivar en lugar de eliminar si tiene registros históricos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white rounded-xl font-bold">Confirmar Eliminación</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
