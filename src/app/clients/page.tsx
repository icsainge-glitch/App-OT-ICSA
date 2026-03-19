
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowLeft, Pencil, Trash2, Building2, User, Phone, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionData } from "@/hooks/use-action-data";
import { getClients, deleteRecord } from "@/actions/db-actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/lib/auth-provider";
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

export default function ClientsListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, isProfileLoading } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: clients, isLoading } = useActionData<any[]>(() => getClients(), []);

  // Route Protection
  if (!isProfileLoading && userProfile) {
    const role = userProfile.rol_t?.toLowerCase();
    if (role !== 'admin' && role !== 'administrador') {
      router.replace('/dashboard');
      return null;
    }
  }

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c: any) =>
      c.nombreCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.rutCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRecord("clients", deleteId);
    toast({ title: "Cliente eliminado con éxito", description: "Refresque la página para ver los cambios." });
    setDeleteId(null);
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
            <h1 className="font-black text-lg text-primary uppercase tracking-tighter">Gestión de Clientes</h1>
          </div>
          <Link href="/clients/new">
            <Button className="bg-primary hover:bg-primary/90 font-black rounded-xl h-10 shadow-[0_6px_15px_rgba(var(--primary),0.2)] transition-all hover:-translate-y-0.5 px-6">
              <Plus size={18} className="mr-2" /> Registrar Cliente
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 space-y-6">
        <Card className="shadow-[0_15px_50px_rgba(0,0,0,0.04)] border-none bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden animate-slide-up">
          <CardHeader className="bg-transparent border-b border-black/5 p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RUT o razón social..."
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
                    <TableHead className="font-black text-xs uppercase py-4 pl-6">Cliente / Empresa</TableHead>
                    <TableHead className="font-black text-xs uppercase">RUT</TableHead>
                    <TableHead className="font-black text-xs uppercase">Contacto</TableHead>
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
                          <p className="font-bold text-primary uppercase tracking-widest text-xs">Cargando base de datos...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                        No se encontraron clientes registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/10 group">
                        <TableCell className="py-4 pl-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-primary uppercase">{client.nombreCliente}</span>
                            <span className="text-xs text-muted-foreground font-medium">{client.razonSocial || "Sin razón social"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-xs">{client.rutCliente}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {client.telefonoCliente && <span className="text-xs flex items-center gap-1 font-medium"><Phone size={10} className="text-primary" /> {client.telefonoCliente}</span>}
                            {client.emailClientes && <span className="text-xs flex items-center gap-1 font-medium"><Mail size={10} className="text-primary" /> {client.emailClientes}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs font-bold border-none", client.estadoCliente === 'Inactivo' ? "bg-destructive/10 text-destructive" : "bg-accent/20 text-primary")}>
                            {client.estadoCliente?.toUpperCase() || 'ACTIVO'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Link href={`/clients/${client.id}/edit`}>
                              <Button variant="ghost" size="icon" title="Editar Cliente" className="h-9 w-9 text-primary hover:bg-primary hover:text-white rounded-xl">
                                <Pencil size={16} />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Eliminar Cliente"
                              className="h-9 w-9 text-destructive hover:bg-destructive hover:text-white rounded-xl"
                              onClick={() => setDeleteId(client.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
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
            <AlertDialogTitle className="font-black text-primary uppercase">¿Eliminar Cliente?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente y eliminará todos los datos asociados a este cliente en el sistema ICSA.</AlertDialogDescription>
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
