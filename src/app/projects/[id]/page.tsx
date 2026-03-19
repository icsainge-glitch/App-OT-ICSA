
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Briefcase, Calendar, User, FileCheck, Plus, CheckCircle2, History as HistoryIcon, Clock, Eye, Pencil, AlertTriangle, Users, Mail, Trash2, Download, FileText, Phone } from "lucide-react";
import Link from "next/link";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { getProjectById, getProjectOrders, getProjectArchivedOrders, closeProject, getActaPreview, deleteRecord, hideWorkOrder } from "@/actions/db-actions";
import { updateUserSignature } from "@/actions/auth-actions";
import { useActionData } from "@/hooks/use-action-data";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatFolio } from "@/lib/utils";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getClients } from "@/actions/db-actions";
import { sendSignatureRequest } from "@/ai/flows/send-signature-request-flow";
import { SignaturePad } from "@/components/SignaturePad";

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const [closing, setClosing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [dialogStep, setDialogStep] = useState<"preview" | "email" | "signatures">("preview");
  const [actaPreview, setActaPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'ordenes' | 'historial' } | null>(null);

  // States for signatures
  const [techSignatureUrl, setTechSignatureUrl] = useState("");
  const [clientSignatureUrl, setClientSignatureUrl] = useState("");
  const [clientReceiverName, setClientReceiverName] = useState("");
  const [clientReceiverRut, setClientReceiverRut] = useState("");
  const [isRemote, setIsRemote] = useState(false);

  const { data: project, isLoading: isProjectLoading, error: projectError } = useActionData<any>(() => getProjectById(id), [id]);

  const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador' ||
    userProfile?.rol_t?.toLowerCase() === 'supervisor';

  const { data: activeOts, isLoading: isActiveLoading } = useActionData<any[]>(() => getProjectOrders(id, user?.uid, isAdmin), [id, user?.uid, isAdmin]);
  const { data: historyOts, isLoading: isHistoryLoading } = useActionData<any[]>(() => getProjectArchivedOrders(id, user?.uid, isAdmin), [id, user?.uid, isAdmin]);

  const handleOpenClosure = async () => {
    setIsDialogOpen(true);
    setDialogStep("preview");
    setLoadingPreview(true);
    
    // Reset signature states
    setTechSignatureUrl(userProfile?.signatureUrl || "");
    setClientSignatureUrl("");
    setClientReceiverName(project?.clientName || "");
    setClientReceiverRut("");
    setIsRemote(false);

    try {
      const preview = await getActaPreview(id);
      setActaPreview(preview);
      if (preview.clientEmail) setClientEmail(preview.clientEmail);
    } catch (e) {
      console.error("Error loading preview:", e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la vista previa." });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCloseProject = async () => {
    if (!user || !project) return;
    setClosing(true);

    try {
      const signatureData = isRemote ? undefined : {
        tech: techSignatureUrl,
        client: clientSignatureUrl,
        clientName: clientReceiverName,
        clientRut: clientReceiverRut
      };

      const result = await closeProject(
        id, 
        user.uid, 
        user.email || 'Admin', 
        userProfile?.name || 'Responsable', 
        clientEmail,
        signatureData
      );

      if (isRemote && result.success && result.id) {
        // Send remote signature request
        await sendSignatureRequest({
          orderId: result.id,
          recipientEmail: clientEmail,
          clientName: clientReceiverName || project?.clientName || "Cliente",
          folio: actaPreview?.folio || "---",
          baseUrl: window.location.origin
        });
        toast({ title: "Proyecto Cerrado", description: "Se ha enviado la solicitud de firma remota al cliente." });
      } else {
        toast({
          title: result.isCompleted ? "Proyecto Finalizado" : "Proyecto Cerrado",
          description: result.isCompleted ? "El acta final ha sido generada y firmada correctamente." : "Se ha generado el borrador del acta."
        });
      }

      setIsDialogOpen(false);

      if (result.success && result.id) {
        if (result.isCompleted) {
          router.push('/dashboard');
        } else {
          router.push(`/work-orders/${result.id}/edit`);
        }
      } else {
        router.refresh();
      }
    } catch (e: any) {
      console.error("Error closing project:", e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar el proyecto: " + e.message });
    } finally {
      setClosing(false);
    }
  };

  const isSignaturesValid = isRemote ? !!clientEmail : (!!techSignatureUrl && !!clientSignatureUrl && !!clientReceiverName && !!clientReceiverRut);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (!isAdmin && user) {
        await hideWorkOrder(deleteConfirm.id, deleteConfirm.type, user.uid);
        toast({ title: "Orden oculta", description: "Esta orden ya no será visible en su cuenta." });
      } else {
        await deleteRecord(deleteConfirm.type, deleteConfirm.id);
        toast({ title: "Registro eliminado", description: "La orden ha sido borrada permanentemente." });
      }
      setDeleteConfirm(null);
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setDeleteConfirm(null);
    }
  };

  useEffect(() => {
    if (project?.projectId || project?.clientId) {
      // We need to fetch the client email since it's not in the project object directly usually
      // But we can try to get it if we had a getClientByid, for now we will try to find it in the clients list
      const fetchClientEmail = async () => {
        const cls = await getClients();
        const cid = project.clientId;
        const c = cls.find((cl: any) => cl.id === cid) as any;
        if (c?.emailClientes) {
          setClientEmail(c.emailClientes);
        }
      };
      fetchClientEmail();
    }
  }, [project]);

  if (isProjectLoading || isProfileLoading) return <div className="min-h-screen flex items-center justify-center bg-background text-primary animate-pulse font-black uppercase tracking-tighter">Cargando Proyecto...</div>;

  if (projectError || !project) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center font-bold text-muted-foreground bg-background gap-6">
      <AlertTriangle className="h-20 w-20 text-destructive/20" />
      <div className="space-y-2">
        <h1 className="text-xl font-black text-primary uppercase">Proyecto no encontrado</h1>
        <p className="text-sm font-medium">No se pudo cargar la información del proyecto.</p>
      </div>
      <Link href="/dashboard">
        <Button variant="outline" className="font-black uppercase text-xs tracking-widest rounded-xl">Volver al Panel</Button>
      </Link>
    </div>
  );

  const isCompleted = project.status === 'Completed' || project.status === 'Completado';

  return (
    <div className="min-h-screen bg-muted/20 pb-12 animate-fade-in bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <header className="bg-primary text-white backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-white">
                <ArrowLeft />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-sm md:text-xl font-black uppercase tracking-tighter leading-none">{project.name}</h1>
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest mt-1 hidden sm:block">Control de Proyecto ICSA</p>
            </div>
          </div>
          {!isCompleted && (
            <Button onClick={handleOpenClosure} disabled={closing} className="bg-white text-primary hover:bg-white/90 font-black h-10 px-4 rounded-xl shadow-lg uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95 border-none">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Finalizar Obra e Informe</span>
              <span className="sm:hidden">Finalizar</span>
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-5xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-xl border-none rounded-3xl overflow-hidden h-fit">
            <CardHeader className="bg-primary/5 border-b p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Ficha del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-2xl">
                  <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest">Cliente</Label>
                  <p className="font-black text-primary text-base mt-1 flex items-center gap-2">
                    <User size={16} className="opacity-40" /> {project.clientName}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div>
                    <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest">Estado</Label>
                    <div className="mt-1">
                      <Badge className={cn(
                        "font-black text-xs px-3 py-1 rounded-full uppercase tracking-tighter border-none",
                        isCompleted ? 'bg-accent/20 text-primary' : 'bg-primary/10 text-primary'
                      )}>
                        {!isCompleted ? 'EN EJECUCIÓN' : 'PROYECTO CERRADO'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest">Fecha Inicio</Label>
                    <p className="font-bold flex items-center gap-2 text-xs text-primary mt-1">
                      <Calendar size={14} className="opacity-40" /> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {project.teamNames && project.teamNames.length > 0 && (
                  <div className="pt-4 border-t border-dashed">
                    <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
                      <Users size={12} /> Colaboradores
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.teamNames.map((name: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs font-bold uppercase py-0.5 px-2 border-primary/20 text-primary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.endDate && (
                  <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20">
                    <Label className="text-xs uppercase font-black text-primary tracking-widest">Fecha de Cierre</Label>
                    <p className="font-black flex items-center gap-2 text-xs text-primary mt-1">
                      <FileCheck size={14} /> {new Date(project.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-white p-6">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-primary tracking-widest">
                  <Clock className="h-5 w-5" /> Órdenes en Curso
                </CardTitle>
                {!isCompleted && (
                  <Link href={`/work-orders/new?projectId=${id}&clientId=${project.clientId}&clientName=${encodeURIComponent(project.clientName || '')}`}>
                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-primary/20 text-primary font-black uppercase text-xs tracking-widest hover:bg-primary/5 transition-all">
                      <Plus size={16} className="mr-2" /> Nueva OT
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <OTTable orders={activeOts || []} isLoading={isActiveLoading} setDeleteConfirm={setDeleteConfirm} />
              </CardContent>
            </Card>

            <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/10 border-b p-6">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-primary tracking-widest">
                  <HistoryIcon className="h-5 w-5" /> Histórico del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <OTTable orders={historyOts || []} isLoading={isHistoryLoading} setDeleteConfirm={setDeleteConfirm} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl w-full sm:w-[95vw] h-[100dvh] sm:h-[90vh] md:h-[85vh] p-0 flex flex-col overflow-hidden border-none sm:rounded-3xl shadow-2xl transition-all duration-500">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg md:text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <FileCheck className="h-6 w-6" /> Acta Final de Cierre
                </DialogTitle>
                <div className="flex gap-1.5">
                  <div className={cn("h-1.5 w-6 rounded-full transition-all duration-500", dialogStep === "preview" ? "bg-white" : "bg-white/30")} />
                  <div className={cn("h-1.5 w-6 rounded-full transition-all duration-500", dialogStep === "signatures" ? "bg-white" : "bg-white/30")} />
                </div>
              </div>
              <DialogDescription className="text-white/80 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
                {dialogStep === "preview" ? "Paso 1: Revisión de Datos Consolidados" : "Paso 2: Validación y Firmas"}
              </DialogDescription>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-4 md:px-6">
            <div className="py-6 space-y-6 pb-12">
              {loadingPreview ? (
                <div className="h-64 flex flex-col items-center justify-center gap-6 text-primary animate-pulse font-black uppercase tracking-tighter">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin opacity-20" />
                    <FileCheck className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-xs tracking-widest">Consolidando Datos...</span>
                </div>
              ) : dialogStep === "preview" ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-muted/30 p-4 rounded-2xl border border-dashed border-muted-foreground/20">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Trabajo (Consolidado)</Label>
                    <p className="mt-1 text-sm font-black text-primary uppercase">{actaPreview?.tipoTrabajo}</p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-2xl border border-dashed border-muted-foreground/20">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resumen de Trabajo</Label>
                    <div className="mt-2 p-3 bg-white/50 rounded-xl text-xs font-bold text-primary whitespace-pre-wrap leading-relaxed max-h-[150px] overflow-y-auto pr-2 border border-primary/5 shadow-inner">
                      {actaPreview?.summaryText}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Detalle Técnico Consolidado</Label>
                    <div className="rounded-2xl border border-primary/10 overflow-hidden shadow-sm bg-white/50">
                      <Table>
                        <TableHeader className="bg-primary/5">
                          <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="text-[9px] font-black uppercase py-2">Elemento</TableHead>
                            <TableHead className="text-[9px] font-black uppercase py-2 text-center w-16 md:w-20">Cant.</TableHead>
                            <TableHead className="text-[9px] font-black uppercase py-2">Estado/Obs.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {actaPreview?.detalleTecnico?.length > 0 ? (
                            actaPreview.detalleTecnico.map((item: any, i: number) => (
                              <TableRow key={i} className="border-b last:border-none border-muted/20 hover:bg-white/80 transition-colors">
                                <TableCell className="text-[10px] font-bold py-2.5">{item.elemento}</TableCell>
                                <TableCell className="text-[10px] font-black py-2.5 text-center text-primary">{item.cantidad}</TableCell>
                                <TableCell className="text-[10px] font-medium py-2.5 text-muted-foreground italic truncate max-w-[120px] md:max-w-[150px]">{item.observacion}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow><TableCell colSpan={3} className="text-center py-6 text-[10px] font-bold text-muted-foreground">Sin detalles registrados</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {actaPreview?.puntosRed?.length > 0 && (
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                        <Label className="text-[9px] font-black uppercase text-primary">Ptos. Red</Label>
                        <Badge className="bg-primary text-white font-black text-[10px]">{actaPreview.puntosRed.length}</Badge>
                      </div>
                    )}
                    {actaPreview?.photos?.length > 0 && (
                      <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                        <Label className="text-[9px] font-black uppercase text-primary">Evidencias</Label>
                        <Badge className="bg-accent text-primary font-black text-[10px]">{actaPreview.photos.length}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Technician Signature */}
                  <div className="space-y-4">
                    <SignaturePad
                      label="Validación Técnica (ICSA)"
                      initialValue={techSignatureUrl}
                      onSave={setTechSignatureUrl}
                      className="shadow-sm"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-dashed" /></div>
                    <div className="relative flex justify-center text-[9px] uppercase font-black"><span className="bg-white px-3 text-muted-foreground tracking-[0.3em]">Recepción Cliente</span></div>
                  </div>

                  {/* Remote Signature Toggle */}
                  <div 
                    className={cn(
                      "flex items-center space-x-4 p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer",
                      isRemote ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-transparent hover:bg-muted/30"
                    )}
                    onClick={() => setIsRemote(!isRemote)}
                  >
                    <Checkbox
                      id="remote-sig-mobile"
                      checked={isRemote}
                      onCheckedChange={(checked) => setIsRemote(!!checked)}
                      className="h-7 w-7 border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-lg"
                    />
                    <div className="grid gap-1">
                      <label htmlFor="remote-sig-mobile" className="text-xs font-black uppercase text-primary cursor-pointer tracking-tight">Solicitar Firma Remota (Email)</label>
                      <p className="text-[9px] text-muted-foreground font-bold italic leading-tight">Activar si el cliente firmará desde su propio dispositivo más tarde.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground ml-1">Email del Receptor (Acta PDF)</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-50 group-focus-within:opacity-100 transition-opacity" />
                        <Input
                          placeholder="ejemplo@cliente.cl"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="h-14 pl-12 rounded-2xl border-none bg-muted/40 font-bold focus-visible:ring-primary shadow-inner text-sm"
                        />
                      </div>
                    </div>

                    {!isRemote && (
                      <div className="space-y-6 animate-in zoom-in-95 fade-in duration-500 origin-top">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Receptor</Label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-50" />
                              <Input
                                placeholder="Ej: Juan Pérez"
                                value={clientReceiverName}
                                onChange={(e) => setClientReceiverName(e.target.value)}
                                className="h-14 pl-12 rounded-2xl border-none bg-muted/40 font-bold text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">RUT Receptor</Label>
                            <div className="relative">
                              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-50" />
                              <Input
                                placeholder="12.345.678-k"
                                value={clientReceiverRut}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  import('@/lib/rut-utils').then(m => setClientReceiverRut(m.formatRut(val)));
                                }}
                                className="h-14 pl-12 rounded-2xl border-none bg-muted/40 font-bold text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <SignaturePad
                            label="Firma de Recepción Conforme"
                            initialValue={clientSignatureUrl}
                            onSave={setClientSignatureUrl}
                            className="shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-4 md:p-6 gap-3 bg-white border-t shrink-0 sm:flex-row flex-col">
            {dialogStep === "preview" ? (
              <>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-black uppercase text-xs tracking-widest rounded-2xl h-14 w-full sm:flex-1 order-2 sm:order-1">
                  Cancelar
                </Button>
                <Button onClick={() => setDialogStep("signatures")} disabled={loadingPreview} className="bg-primary hover:bg-primary/90 text-white font-black h-14 px-8 rounded-2xl shadow-xl uppercase text-xs tracking-widest transition-all w-full sm:flex-[1.5] order-1 sm:order-2 group">
                  Validar y Firmar <ArrowLeft className="h-4 w-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setDialogStep("preview")} disabled={closing} className="font-black uppercase text-xs tracking-widest rounded-2xl h-14 w-full sm:flex-1 order-2 sm:order-1">
                  Atrás
                </Button>
                <Button
                  onClick={handleCloseProject}
                  disabled={closing || !isSignaturesValid}
                  className={cn(
                    "font-black h-14 px-8 rounded-2xl shadow-xl uppercase text-xs tracking-widest transition-all w-full sm:flex-[1.5] order-1 sm:order-2",
                    isSignaturesValid ? "bg-accent text-primary hover:bg-accent/90" : "bg-muted text-muted-foreground"
                  )}
                >
                  {closing ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <CheckCircle2 className="h-5 w-5 mr-3" />}
                  {closing ? "Procesando..." : (isRemote ? "Enviar y Solicitar" : "Finalizar Obra")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-primary">¿Confirmar Eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              {isAdmin
                ? "Esta acción borrará permanentemente la orden de los servidores de ICSA."
                : "Se ocultará esta orden de su cuenta. Los administradores aún podrán verla en el sistema central del proyecto."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white rounded-xl font-bold">
              {isAdmin ? "Eliminar permanentemente" : "Ocultar de mi vista"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OTTable({ orders, isLoading, setDeleteConfirm }: { orders: any[], isLoading: boolean, setDeleteConfirm: (val: any) => void }) {
  if (isLoading) return <div className="p-16 text-center animate-pulse text-primary font-black uppercase text-xs tracking-widest">Sincronizando...</div>;
  if (orders.length === 0) return <div className="p-16 text-center text-muted-foreground italic text-xs font-medium flex flex-col items-center gap-3">
    <Clock className="h-10 w-10 opacity-10" />
    Sin registros asociados.
  </div>;

  return (
    <>
      {/* Table for Tablet/Desktop */}
      <div className="hidden md:block min-w-[450px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
              <TableHead className="font-black text-xs uppercase tracking-widest py-4 pl-6 text-primary">Folio</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-widest py-4 text-primary">Descripción</TableHead>
              <TableHead className="text-right font-black text-xs uppercase tracking-widest py-4 pr-6 text-primary">Gestión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((ot) => {
              const isCompleted = ot.status === 'Completed' || ot.status === 'Completado';
              return (
                <TableRow key={ot.id} className="hover:bg-primary/5 transition-colors border-b border-muted/20">
                  <TableCell className="font-black text-primary text-xs pl-6 py-4">
                    {formatFolio(ot.folio)} {ot.isProjectSummary && <Badge className="bg-primary text-white text-[7px] ml-2 px-1.5 uppercase font-black">ACTA</Badge>}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-muted-foreground">
                    <p className="line-clamp-1 max-w-[200px]">{ot.description || "N/A"}</p>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4">
                    <div className="flex justify-end gap-1">
                      {!isCompleted ? (
                        <Link href={`/work-orders/${ot.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary hover:text-white rounded-xl"><Pencil className="h-5 w-5" /></Button>
                        </Link>
                      ) : (
                        <Link href={`/work-orders/${ot.id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary hover:text-white rounded-xl"><Eye className="h-5 w-5" /></Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Descargar PDF"
                        className="h-10 w-10 text-muted-foreground hover:bg-accent hover:text-primary rounded-xl"
                        onClick={() => generateWorkOrderPDF(ot)}
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Eliminar"
                        className="h-10 w-10 text-destructive hover:bg-destructive hover:text-white rounded-xl"
                        onClick={() => setDeleteConfirm({ id: ot.id, type: (ot.status === 'Completed' || ot.status === 'Completado') ? 'historial' : 'ordenes' })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Cards for Mobile */}
      <div className="md:hidden p-4 space-y-3">
        {orders.map((ot, index) => {
          const isCompleted = ot.status === 'Completed' || ot.status === 'Completado';
          return (
            <div key={ot.id} className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-primary/5 rounded-3xl p-5 flex items-center justify-between group active:scale-95 transition-all duration-200 animate-slide-up" style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-primary text-sm uppercase">{formatFolio(ot.folio)}</span>
                  {ot.isProjectSummary && <Badge className="bg-primary text-white text-xs px-2 py-0.5 uppercase font-black">ACTA FINAL</Badge>}
                </div>
                <p className="text-xs font-bold text-muted-foreground line-clamp-1 max-w-[180px]">
                  {ot.description || "Sin descripción"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn("text-[7px] font-black uppercase border-none px-2 py-0", !isCompleted ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')}>
                    {!isCompleted ? 'Pendiente' : 'Finalizada'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setDeleteConfirm({ id: ot.id, type: (ot.status === 'Completed' || ot.status === 'Completado') ? 'historial' : 'ordenes' })}
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => generateWorkOrderPDF(ot)}
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-xl bg-muted/50 text-muted-foreground"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Link href={!isCompleted ? `/work-orders/${ot.id}/edit` : `/work-orders/${ot.id}`}>
                  <Button size="icon" className="h-10 w-10 rounded-xl bg-primary shadow-lg shadow-primary/20">
                    {!isCompleted ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
