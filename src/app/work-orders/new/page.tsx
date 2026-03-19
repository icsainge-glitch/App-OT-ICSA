
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SignaturePad } from "@/components/SignaturePad";
import { PhotoUpload } from "@/components/PhotoUpload";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, User, MapPin, Building2, Hash, PlusCircle, CheckCircle2, Circle, X, Users, Briefcase, Phone, Mail, Loader2, Save, Archive, Send, Trash2, Camera } from "lucide-react";
import Link from "next/link";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { getClients, getPersonnel, getActiveProjects, saveWorkOrderAndStatus, getNextFolio } from "@/actions/db-actions";
import { updateUserSignature } from "@/actions/auth-actions";
import { useActionData } from "@/hooks/use-action-data";
import { v4 as uuidv4 } from "uuid";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { sendWorkOrderEmail } from "@/ai/flows/send-work-order-email-flow";
import { sendSignatureRequest } from "@/ai/flows/send-signature-request-flow";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Eye } from "lucide-react";

function NewWorkOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();

  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState<number | string>(0);
  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [openTeamSearch, setOpenTeamSearch] = useState(false);
  const [showClientPreview, setShowClientPreview] = useState(false);
  const [saveSignatureChecked, setSaveSignatureChecked] = useState(true);

  const { data: clients } = useActionData<any[]>(() => getClients(), []);
  const { data: allPersonnel } = useActionData<any[]>(() => getPersonnel(), []);

  const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador';

  const { data: allProjects } = useActionData<any[]>(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    return getActiveProjects(user.uid, isAdmin);
  }, [user?.uid, isAdmin, isProfileLoading]);

  const [formData, setFormData] = useState({
    clientName: searchParams.get('clientName') || "",
    clientRut: "",
    clientPhone: "",
    clientEmail: "",
    clientId: searchParams.get('clientId') || "",
    projectId: searchParams.get('projectId') || "",
    branch: "Casa Matriz",
    address: "",
    interventionAddress: "",
    building: "",
    floor: "",
    tipoTrabajo: "",
    tipoTrabajoOtro: "",
    detalleTecnico: [
      { elemento: "Puntos de red instalados", cantidad: "", observacion: "" },
      { elemento: "Puntos certificados", cantidad: "", observacion: "" },
      { elemento: "User cord", cantidad: "", observacion: "" },
      { elemento: "Patch cord instalados", cantidad: "", observacion: "" },
      { elemento: "Equipos configurados", cantidad: "", observacion: "" },
      { elemento: "Otros trabajos realizados", cantidad: "", observacion: "" }
    ],
    puntosRed: [] as any[],
    observacionesGenerales: "",
    estadoTrabajo: "Trabajo finalizado correctamente",
    description: "",
    techName: "",
    techRut: "",
    techSignatureUrl: "",
    clientReceiverName: "",
    clientReceiverRut: "",
    clientReceiverEmail: "",
    clientSignatureUrl: "",
    sketchImageUrl: "",
    status: "Pendiente",
    team: [] as string[],
    teamIds: [] as string[],
    condicionesCobro: [] as string[],
    photos: [] as string[]
  });

  useEffect(() => {
    const fetchFolio = async () => {
      try {
        const nextFolioNum = await getNextFolio();
        setFolio(nextFolioNum);
      } catch (e) {
        setFolio(Math.floor(100000 + Math.random() * 900000));
      }
    };
    fetchFolio();
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (userProfile?.nombre_t && user && formData.teamIds.length === 0) {
      setFormData(prev => ({
        ...prev,
        team: [userProfile.nombre_t!],
        teamIds: [user.uid],
        techName: prev.techName || userProfile.nombre_t || "",
        techRut: prev.techRut || (userProfile as any).rut_t || "",
        techSignatureUrl: prev.techSignatureUrl || userProfile.signatureUrl || ""
      }));
    }
  }, [userProfile, user, formData.teamIds.length]);

  const handleSelectClient = (client: any) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.nombreCliente,
      clientRut: client.rutCliente || "",
      clientPhone: client.telefonoCliente || "",
      clientEmail: client.emailClientes || "",
      clientId: client.id,
      address: client.direccionCliente || ""
    }));
    setOpenClientSearch(false);
  };

  const handleTeamSelect = (person: any) => {
    if (!formData.teamIds.includes(person.id)) {
      setFormData(prev => ({
        ...prev,
        team: [...prev.team, person.nombre_t],
        teamIds: [...prev.teamIds, person.id]
      }));
    }
    setOpenTeamSearch(false);
  };

  const handleTeamRemove = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      team: prev.team.filter((_: any, i: number) => prev.teamIds[i] !== memberId),
      teamIds: prev.teamIds.filter((id: string) => id !== memberId)
    }));
  };

  const onSaveAsPending = async () => {
    if (!user) return;
    setLoading(true);
    const orderId = uuidv4();
    const workOrderData = {
      ...formData,
      id: orderId,
      folio: folio,
      status: "Pendiente",
      createdBy: user.uid,
      startDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const saveResult = await saveWorkOrderAndStatus(workOrderData, false);
      if (!saveResult.success) {
        toast({ variant: "destructive", title: "Error al guardar", description: saveResult.error });
        setLoading(false);
        return;
      }
      toast({ title: "Orden Guardada", description: "La orden se encuentra como pendiente en el dashboard." });
      const redirectPath = formData.projectId ? `/projects/${formData.projectId}` : "/dashboard";
      router.push(redirectPath);
    } catch (e: any) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error al guardar", description: e.message || "Error inesperado." });
    }
  };

  const [isSendingSignature, setIsSendingSignature] = useState(false);

  const handleSendRemoteSignature = async () => {
    if (!user) return;
    if (!formData.clientReceiverEmail) {
      toast({ variant: "destructive", title: "Falta Email", description: "Ingrese el email del receptor para enviar la firma." });
      return;
    }

    setIsSendingSignature(true);
    try {
      const id = uuidv4(); // Generate a new ID for the work order
      // 1. Save as pending first using the local ID
      const workOrderData = {
        ...formData,
        id,
        folio,
        status: "Pendiente",
        updatedAt: new Date().toISOString(),
        createdBy: user.uid,
        startDate: new Date().toISOString(),
      };
      
      const saveResult = await saveWorkOrderAndStatus(workOrderData, false);
      if (!saveResult.success) {
        toast({ variant: "destructive", title: "Error al guardar", description: saveResult.error });
        setIsSendingSignature(false);
        return;
      }

      // 2. Send the request
      const result = await sendSignatureRequest({
        orderId: id,
        recipientEmail: formData.clientReceiverEmail,
        clientName: formData.clientReceiverName || formData.clientName,
        folio: Number(folio),
        baseUrl: window.location.origin,
      });

      if (result.success) {
        toast({ title: "Solicitud Enviada", description: "Se ha enviado el enlace de firma remota al cliente." });
        const redirectPath = formData.projectId ? `/projects/${formData.projectId}` : "/dashboard";
        router.push(redirectPath);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error: any) {
      console.error('Error sending signature request:', error);
      toast({ variant: "destructive", title: "Error de Sistema", description: error.message || "No se pudo enviar la solicitud." });
    } finally {
      setIsSendingSignature(false);
    }
  };

  const onArchiveAndFinish = async () => {
    if (!user) return;
    setLoading(true);
    const orderId = uuidv4();
    const workOrderData = {
      ...formData,
      id: orderId,
      folio: folio,
      status: "Completado",
      createdBy: user.uid,
      startDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const saveResult = await saveWorkOrderAndStatus(workOrderData, true);
      if (!saveResult.success) {
        toast({ variant: "destructive", title: "Error Finalizar", description: saveResult.error });
        setLoading(false);
        return;
      }

      if (formData.clientReceiverEmail) {
        sendWorkOrderEmail({ order: workOrderData }).catch(err => console.error("Email error:", err));
      }

      toast({ title: "Orden Finalizada", description: "La orden ha sido archivada con éxito." });
      const redirectPath = formData.projectId ? `/projects/${formData.projectId}` : "/dashboard";
      router.push(redirectPath);
    } catch (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Error al archivar" });
    }
  };

  if (isUserLoading || isProfileLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase tracking-tighter">Preparando Formulario...</div>;

  return (
    <div className="min-h-screen bg-muted/20 pb-40 md:pb-24 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed animate-fade-in">
      <header className="bg-primary text-white backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-white">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="font-black text-sm md:text-lg uppercase tracking-tighter leading-tight">Nueva Orden</h1>
              <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{folio ? (isNaN(Number(folio)) ? `Folio: ${folio}` : `Folio: ${String(folio).padStart(5, '0')}`) : 'Generando...'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onSaveAsPending}
              disabled={loading}
              className="hidden md:flex text-white hover:bg-white/10 font-bold text-xs uppercase"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Borrador
            </Button>
          </div>
        </div>
      </header>

      {/* Sticky Bottom Actions for Mobile */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="glassmorphism p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex gap-2 items-center">
          <Button
            type="button"
            onClick={onSaveAsPending}
            disabled={loading}
            variant="ghost"
            className="flex-1 h-12 rounded-full font-black uppercase text-[10px] tracking-widest text-primary hover:bg-primary/10"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "G. Borrador"}
          </Button>
          <Button
            type="button"
            onClick={onArchiveAndFinish}
            disabled={loading}
            className="flex-[1.5] h-12 rounded-full font-black uppercase text-[10px] tracking-widest bg-primary text-white shadow-lg shadow-primary/30"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Finalizar
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <form className="space-y-6">
          <Card className="shadow-[0_15px_50px_rgba(0,0,0,0.04)] border-none bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden relative animate-slide-up">
            <CardHeader className="bg-transparent border-b border-black/5 p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-primary text-xs flex items-center gap-2 uppercase font-black tracking-widest">
                  <Briefcase className="h-5 w-5" /> Proyecto de Referencia
                </CardTitle>
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-widest bg-muted/50 px-2 py-1 rounded-md">
                  <span className="text-destructive">*</span> Campos obligatorios
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Vincular a un proyecto activo</Label>
                <Select
                  value={formData.projectId || "none"}
                  onValueChange={v => {
                    const selectedProjectId = v === "none" ? "" : v;
                    let updateObj: any = { projectId: selectedProjectId };

                    if (selectedProjectId && allProjects) {
                      const project = allProjects.find(p => p.id === selectedProjectId);
                      if (project && project.clientId && clients) {
                        const client = clients.find(c => c.id === project.clientId);
                        if (client) {
                          updateObj = {
                            ...updateObj,
                            clientName: client.nombreCliente,
                            clientRut: client.rutCliente || "",
                            clientPhone: client.telefonoCliente || "",
                            clientEmail: client.emailClientes || "",
                            clientId: client.id,
                            address: client.direccionCliente || ""
                          };
                        } else if (project.clientName) {
                          // Fallback if client record not found but name is in project
                          updateObj.clientName = project.clientName;
                          updateObj.clientId = project.clientId;
                        }
                      }
                    }

                    setFormData(prev => ({ ...prev, ...updateObj }));
                  }}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-none bg-muted/30 font-bold">
                    <SelectValue placeholder="Sin proyecto específico" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="none" className="rounded-xl font-bold">Ninguno (Independiente)</SelectItem>
                    {allProjects?.map(p => (
                      <SelectItem key={p.id} value={p.id} className="rounded-xl font-bold">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b">
              <CardTitle className="text-primary text-sm flex items-center gap-3 uppercase font-black tracking-widest">
                <User className="h-5 w-5" /> Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">
                    Mandante / Empresa (Manual o Búsqueda) <span className="text-destructive text-sm">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <Input
                        placeholder="Nombre de la empresa"
                        value={formData.clientName}
                        onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value, clientId: "" }))}
                        className="h-14 font-black text-lg bg-muted/30 border-none rounded-2xl px-6 shadow-inner focus-visible:ring-primary"
                      />
                      {formData.clientId && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Badge className="bg-primary text-white text-[8px] uppercase font-black">Vinculado</Badge>
                        </div>
                      )}
                    </div>
                    <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg shrink-0"><Search className="h-6 w-6" /></Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] md:w-[400px] p-0 shadow-2xl rounded-3xl border-none overflow-hidden" align="end">
                        <Command>
                          <CommandInput placeholder="Filtrar clientes registrados..." className="h-14 font-bold border-none focus:ring-0" />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty className="p-6 text-center text-sm font-bold opacity-40">Sin resultados.</CommandEmpty>
                            <CommandGroup heading="Clientes ICSA" className="p-2">
                              {clients?.map((client) => (
                                <CommandItem key={client.id} onSelect={() => handleSelectClient(client)} className="p-4 cursor-pointer rounded-2xl aria-selected:bg-primary aria-selected:text-white transition-all">
                                  <User className="h-5 w-5 mr-3" />
                                  <div className="flex flex-col">
                                    <span className="font-black text-xs uppercase">{client.nombreCliente}</span>
                                    <span className="text-[10px] opacity-60 font-bold">{client.rutCliente}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">RUT del Cliente / Empresa</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                    <Input placeholder="Ej: 12345678-9" value={formData.clientRut || ""} onChange={e => setFormData(prev => ({ ...prev, clientRut: e.target.value }))} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold shadow-inner" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Teléfono de Contacto</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                      <Input placeholder="Ej: +56 9 1234 5678" value={formData.clientPhone} onChange={e => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold shadow-inner" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                      <Input placeholder="Ej: contacto@empresa.cl" value={formData.clientEmail} onChange={e => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold shadow-inner" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">
                      Sucursal / Instalación <span className="text-primary text-sm">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                      <Input placeholder="Ej: Casa Matriz, Sucursal Norte..." value={formData.branch} onChange={e => setFormData(prev => ({ ...prev, branch: e.target.value }))} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold shadow-inner" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">
                      Dirección Central <span className="text-destructive text-sm">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                      <Input placeholder="Ej: Av. Principal 123, Central" value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold shadow-inner" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Dirección de la Sucursal</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                    <Input placeholder="Ej: Mall Plaza Vespucio, Local 42" value={formData.interventionAddress} onChange={e => setFormData(prev => ({ ...prev, interventionAddress: e.target.value }))} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold focus-visible:ring-primary shadow-inner" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-6 border-b bg-muted/5">
              <CardTitle className="text-lg flex items-center gap-3 uppercase font-black tracking-tighter">
                <Users className="h-6 w-6 text-primary" /> Equipo de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                {formData.team.map((name, index) => (
                  <Badge key={index} className="text-xs py-2 px-5 rounded-xl bg-primary/10 text-primary gap-3 font-black border-none transition-all hover:bg-primary/20">
                    {name}
                    {formData.teamIds[index] !== user?.uid && (
                      <button type="button" onClick={() => handleTeamRemove(formData.teamIds[index])} className="rounded-full bg-primary/20 hover:bg-primary/40 p-1">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Técnico Responsable ICSA</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input readOnly value={formData.techName} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold font-mono opacity-80" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">RUT del Técnico <span className="opacity-60 lowercase font-medium ml-1 tracking-normal">(ej: 12345678-9)</span></Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input readOnly value={formData.techRut} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold font-mono opacity-80" />
                  </div>
                </div>
              </div>
              <Popover open={openTeamSearch} onOpenChange={setOpenTeamSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-16 text-sm font-black border-dashed border-2 rounded-2xl uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5 transition-all">
                    <PlusCircle className="h-5 w-5 mr-3" /> Añadir Colaboradores
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] md:w-[500px] p-0 shadow-2xl rounded-3xl border-none overflow-hidden" align="center">
                  <Command>
                    <CommandInput placeholder="Filtrar por nombre..." className="h-16 border-none focus:ring-0 font-bold" />
                    <CommandList className="max-h-[350px]">
                      <CommandEmpty className="p-8 text-center text-muted-foreground font-bold">Sin resultados.</CommandEmpty>
                      <CommandGroup heading="Personal Autorizado" className="p-2">
                        {(allPersonnel || []).map(person => (
                          <CommandItem key={person.id} onSelect={() => handleTeamSelect(person)} className="p-4 cursor-pointer rounded-2xl aria-selected:bg-primary aria-selected:text-white transition-all">
                            <User className="mr-4 h-6 w-6" />
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-xs">{person.nombre_t}</span>
                              <span className="text-[10px] font-bold opacity-60">{person.rol_t}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-6 bg-primary/5 border-b">
              <CardTitle className="text-xl uppercase font-black text-primary tracking-tighter">Detalle de los Trabajos</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">

              <div className="space-y-4">
                <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">1. Tipo de Trabajo</Label>
                <div className="flex flex-wrap gap-2">
                  {['Instalación', 'Mantención', 'Reparación', 'Certificación', 'Configuración', 'Ampliación de red', 'Otro'].map((tipo) => {
                    const isSelected = formData.tipoTrabajo.includes(tipo);
                    return (
                      <Button
                        key={tipo}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          let newTipos = formData.tipoTrabajo ? formData.tipoTrabajo.split(', ') : [];
                          if (isSelected) {
                            newTipos = newTipos.filter(t => t !== tipo);
                          } else {
                            newTipos.push(tipo);
                          }
                          setFormData(prev => ({ ...prev, tipoTrabajo: newTipos.join(', ') }));
                        }}
                        className={`h-12 px-5 rounded-2xl font-bold text-xs border-2 shadow-sm ${isSelected ? 'bg-primary border-primary text-white' : 'bg-muted/10 border-primary/10 text-muted-foreground hover:bg-muted/20'}`}
                      >
                        {tipo}
                      </Button>
                    );
                  })}
                </div>
                {formData.tipoTrabajo === 'Otro' && (
                  <Input placeholder="Especifique otro tipo de trabajo..." value={formData.tipoTrabajoOtro} onChange={e => setFormData(prev => ({ ...prev, tipoTrabajoOtro: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner mt-2 w-full md:w-1/2" />
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">2. Descripción del Trabajo <span className="text-[9px] lowercase opacity-60 font-medium">(Explicación simple para el cliente)</span></Label>
                <Textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="min-h-[140px] rounded-3xl bg-muted/30 border-none p-6 font-medium text-sm shadow-inner resize-none" placeholder="Ej: Se realizó la instalación y certificación de puntos de red estructurados categoría Cat6. Se verificó la continuidad del cableado..." />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">3. Detalle Técnico del Trabajo</Label>
                  <Button type="button" onClick={() => setFormData(prev => ({ ...prev, detalleTecnico: [...prev.detalleTecnico, { elemento: "", cantidad: "", observacion: "" }] }))} variant="outline" size="sm" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                    <PlusCircle className="h-4 w-4 mr-2" /> Añadir Fila
                  </Button>
                </div>
                {formData.detalleTecnico.length > 0 ? (
                  <div className="space-y-4">
                    {/* Desktop Table View */}
                    <div className="hidden md:block border border-primary/10 rounded-3xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-[10px] uppercase font-black text-muted-foreground border-b border-primary/5">
                          <tr>
                            <th className="px-6 py-4">Elemento / Trabajo</th>
                            <th className="px-6 py-4 w-32 text-center">Cantidad</th>
                            <th className="px-6 py-4">Observación</th>
                            <th className="px-4 py-4 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                          {formData.detalleTecnico.map((item, idx) => (
                            <tr key={idx} className="bg-white hover:bg-muted/5 transition-colors">
                              <td className="px-4 py-3">
                                <Input placeholder="Ej: Material o tarea..." value={item.elemento} onChange={e => {
                                  const newDetalle = [...formData.detalleTecnico];
                                  newDetalle[idx].elemento = e.target.value;
                                  setFormData(prev => ({ ...prev, detalleTecnico: newDetalle }));
                                }} className="h-10 bg-muted/30 border-none rounded-xl text-xs font-bold text-primary shadow-inner" />
                              </td>
                              <td className="px-4 py-3">
                                <Input placeholder="0" value={item.cantidad} onChange={e => {
                                  const newDetalle = [...formData.detalleTecnico];
                                  newDetalle[idx].cantidad = e.target.value;
                                  setFormData(prev => ({ ...prev, detalleTecnico: newDetalle }));
                                }} className="h-10 bg-muted/30 border-none rounded-xl text-xs font-black text-center shadow-inner" />
                              </td>
                              <td className="px-4 py-3">
                                <Input placeholder="Opcional..." value={item.observacion} onChange={e => {
                                  const newDetalle = [...formData.detalleTecnico];
                                  newDetalle[idx].observacion = e.target.value;
                                  setFormData(prev => ({ ...prev, detalleTecnico: newDetalle }));
                                }} className="h-10 bg-muted/30 border-none rounded-xl text-xs font-medium shadow-inner" />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button type="button" variant="ghost" size="icon" onClick={() => {
                                  const newDetalle = formData.detalleTecnico.filter((_, i) => i !== idx);
                                  setFormData(prev => ({ ...prev, detalleTecnico: newDetalle }));
                                }} className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl">
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {formData.detalleTecnico.map((item, idx) => (
                        <div key={idx} className="bg-muted/10 p-5 rounded-3xl border border-primary/5 space-y-4 relative group animate-in fade-in slide-in-from-right-4 duration-300">
                          <Button type="button" variant="ghost" size="icon" onClick={() => {
                            const newDetalle = formData.detalleTecnico.filter((_, i) => i !== idx);
                            setFormData(prev => ({ ...prev, detalleTecnico: newDetalle }));
                          }} className="absolute top-2 right-2 h-10 w-10 text-destructive bg-white/50 backdrop-blur-md rounded-2xl shadow-sm">
                            <Trash2 className="h-5 w-5" />
                          </Button>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Elemento o Tarea</Label>
                              <Input placeholder="Ej: Puntos de red..." value={item.elemento} onChange={e => {
                                const newDetalle = [...formData.detalleTecnico];
                                newDetalle[idx].elemento = e.target.value;
                                setFormData(prev => ({ ...prev, detalleTecnico: newDetalle }));
                              }} className="h-12 bg-white border-none rounded-2xl text-sm font-bold shadow-sm" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1 col-span-1">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Cant.</Label>
                                <Input placeholder="0" value={item.cantidad} onChange={e => {
                                  const newDetalle = [...formData.detalleTecnico];
                                  newDetalle[idx].cantidad = e.target.value;
                                  setFormData(prev => ({ ...prev, detalleTecnico: newDetalle }));
                                }} className="h-12 bg-white border-none rounded-2xl font-black text-center shadow-sm" />
                              </div>
                              <div className="space-y-1 col-span-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Obs / Detalle</Label>
                                <Input placeholder="Opcional..." value={item.observacion} onChange={e => {
                                  const newDetalle = [...formData.detalleTecnico];
                                  newDetalle[idx].observacion = e.target.value;
                                  setFormData(prev => ({ ...prev, detalleTecnico: newDetalle }));
                                }} className="h-12 bg-white border-none rounded-2xl text-xs font-medium shadow-sm" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/10 border border-dashed rounded-3xl p-8 text-center text-xs font-bold text-muted-foreground flex flex-col items-center gap-2">
                    <PlusCircle className="h-8 w-8 opacity-20" />
                    No hay detalle técnico. Agregue una fila.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">4. Identificación de Puntos de Red (Si Aplica)</Label>
                  <Button type="button" onClick={() => setFormData(prev => ({ ...prev, puntosRed: [...prev.puntosRed, { id: "", ubicacion: "", puerto: "", resultado: "Certificado" }] }))} variant="outline" size="sm" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                    <PlusCircle className="h-4 w-4 mr-2" /> Añadir Punto
                  </Button>
                </div>
                {formData.puntosRed.length > 0 ? (
                  <div className="space-y-4">
                    {/* Desktop Table View */}
                    <div className="hidden md:block border border-primary/10 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/50 text-[10px] uppercase font-black text-muted-foreground border-b border-primary/5">
                            <tr>
                              <th className="px-4 py-4 w-24">Punto</th>
                              <th className="px-4 py-4 min-w-[120px]">Ubicación</th>
                              <th className="px-4 py-4 min-w-[120px]">Puerto</th>
                              <th className="px-4 py-4 w-44">Resultado</th>
                              <th className="px-4 py-4 w-12 text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-primary/5">
                            {formData.puntosRed.map((punto, idx) => (
                              <tr key={idx} className="bg-white hover:bg-muted/5 transition-colors">
                                <td className="px-4 py-3">
                                  <Input placeholder="01" value={punto.id} onChange={e => {
                                    const newPuntos = [...formData.puntosRed];
                                    newPuntos[idx].id = e.target.value;
                                    setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                                  }} className="h-10 bg-muted/30 border-none rounded-xl text-xs font-black text-center uppercase" />
                                </td>
                                <td className="px-4 py-3">
                                  <Input placeholder="Oficina..." value={punto.ubicacion} onChange={e => {
                                    const newPuntos = [...formData.puntosRed];
                                    newPuntos[idx].ubicacion = e.target.value;
                                    setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                                  }} className="h-10 bg-muted/30 border-none rounded-xl text-xs font-medium" />
                                </td>
                                <td className="px-4 py-3">
                                  <Input placeholder="Panel..." value={punto.puerto} onChange={e => {
                                    const newPuntos = [...formData.puntosRed];
                                    newPuntos[idx].puerto = e.target.value;
                                    setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                                  }} className="h-10 bg-muted/30 border-none rounded-xl text-xs font-medium uppercase" />
                                </td>
                                <td className="px-4 py-3">
                                  <Select value={punto.resultado} onValueChange={v => {
                                    const newPuntos = [...formData.puntosRed];
                                    newPuntos[idx].resultado = v;
                                    setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                                  }}>
                                    <SelectTrigger className="h-10 bg-muted/30 border-none rounded-xl text-xs font-bold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-none shadow-xl rounded-xl">
                                      <SelectItem value="Certificado" className="font-bold text-emerald-600">Certificado</SelectItem>
                                      <SelectItem value="Certificado y Rotulado" className="font-bold text-blue-600">Certificado y Rotulado</SelectItem>
                                      <SelectItem value="Problema" className="font-bold text-destructive">Problema</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => {
                                    const newPuntos = formData.puntosRed.filter((_, i) => i !== idx);
                                    setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                                  }} className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl">
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {formData.puntosRed.map((punto, idx) => (
                        <div key={idx} className="bg-muted/10 p-5 rounded-3xl border border-primary/5 space-y-4 relative group animate-in fade-in slide-in-from-right-4 duration-300">
                          <Button type="button" variant="ghost" size="icon" onClick={() => {
                            const newPuntos = formData.puntosRed.filter((_, i) => i !== idx);
                            setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                          }} className="absolute top-2 right-2 h-10 w-10 text-destructive bg-white/50 backdrop-blur-md rounded-2xl shadow-sm">
                            <Trash2 className="h-5 w-5" />
                          </Button>

                          <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-1 space-y-1">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Punto</Label>
                              <Input placeholder="01" value={punto.id} onChange={e => {
                                const newPuntos = [...formData.puntosRed];
                                newPuntos[idx].id = e.target.value;
                                setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                              }} className="h-12 bg-white border-none rounded-2xl text-sm font-black text-center shadow-sm uppercase" />
                            </div>
                            <div className="col-span-3 space-y-1">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Ubicación física</Label>
                              <Input placeholder="Oficina, Rack..." value={punto.ubicacion} onChange={e => {
                                const newPuntos = [...formData.puntosRed];
                                newPuntos[idx].ubicacion = e.target.value;
                                setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                              }} className="h-12 bg-white border-none rounded-2xl text-sm font-bold shadow-sm" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Puerto / Pach Panel</Label>
                              <Input placeholder="Panel 01..." value={punto.puerto} onChange={e => {
                                const newPuntos = [...formData.puntosRed];
                                newPuntos[idx].puerto = e.target.value;
                                setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                              }} className="h-12 bg-white border-none rounded-2xl text-xs font-bold shadow-sm uppercase" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Estado</Label>
                              <Select value={punto.resultado} onValueChange={v => {
                                const newPuntos = [...formData.puntosRed];
                                newPuntos[idx].resultado = v;
                                setFormData(prev => ({ ...prev, puntosRed: newPuntos }));
                              }}>
                                <SelectTrigger className="h-12 bg-white border-none rounded-2xl text-[10px] font-black shadow-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-none shadow-xl rounded-2xl">
                                  <SelectItem value="Certificado" className="font-bold text-emerald-600">Certificado</SelectItem>
                                  <SelectItem value="Certificado y Rotulado" className="font-bold text-blue-600">Certificado y Rotulado</SelectItem>
                                  <SelectItem value="Problema" className="font-bold text-destructive">Problema</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/10 border border-dashed rounded-3xl p-8 text-center text-xs font-bold text-muted-foreground flex flex-col items-center gap-2">
                    <PlusCircle className="h-8 w-8 opacity-20" />
                    No se han registrado puntos de red.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">5. Observaciones Finales</Label>
                <Textarea value={formData.observacionesGenerales} onChange={e => setFormData(prev => ({ ...prev, observacionesGenerales: e.target.value }))} className="min-h-[120px] rounded-3xl bg-muted/30 border-none p-6 font-medium text-sm shadow-inner resize-none" placeholder="Cualquier contingencia o detalle adicional relevante..." />
              </div>

              <div className="space-y-4 pt-4 border-t border-dashed">
                <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">6. Estado del Trabajo</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {[
                    { label: 'Finalizado Correctamente', value: 'Trabajo finalizado correctamente', color: 'bg-emerald-500 text-white border-emerald-500' },
                    { label: 'Finalizado con Observs.', value: 'Trabajo finalizado con observaciones', color: 'bg-amber-500 text-white border-amber-500' },
                    { label: 'Trabajo Pendiente', value: 'Trabajo pendiente', color: 'bg-rose-500 text-white border-rose-500' }
                  ].map((estado) => (
                    <Button
                      key={estado.value}
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, estadoTrabajo: estado.value }))}
                      className={`flex-1 h-16 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest shadow-sm transition-all ${formData.estadoTrabajo === estado.value ? estado.color : 'bg-transparent border-primary/10 hover:bg-muted/20 text-muted-foreground'}`}
                    >
                      {estado.label}
                    </Button>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 p-6 border-b">
              <CardTitle className="text-xs font-black uppercase text-primary tracking-widest">Condiciones Comerciales</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-6">
                {['Garantía', 'Facturar', 'Visita Emergencia', 'Presupuesto', 'Solicitado en Terreno'].map((condicion) => {
                  const isSelected = formData.condicionesCobro?.includes(condicion);
                  return (
                    <div key={condicion} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cond-${condicion.replace(/\s+/g, '-')}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          let newCondiciones = [...(formData.condicionesCobro || [])];
                          if (!checked) {
                            newCondiciones = newCondiciones.filter(c => c !== condicion);
                          } else {
                            if (!newCondiciones.includes(condicion)) {
                              newCondiciones.push(condicion);
                            }
                          }
                          setFormData(prev => ({ ...prev, condicionesCobro: newCondiciones }));
                        }}
                      />
                      <label
                        htmlFor={`cond-${condicion.replace(/\s+/g, '-')}`}
                        className="text-xs font-bold uppercase text-muted-foreground cursor-pointer select-none"
                      >
                        {condicion}
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-accent/10 p-6 border-b">
              <CardTitle className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-3">
                <Camera className="h-4 w-4" /> Registro Fotográfico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <PhotoUpload
                photos={formData.photos}
                onChange={(urls) => setFormData(prev => ({ ...prev, photos: urls }))}
              />
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 p-6 border-b">
              <CardTitle className="text-xs font-black uppercase text-primary tracking-widest">Protocolo de Cierre (Firmas)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                  <SignaturePad
                    label="Validación Técnica (ICSA)"
                    initialValue={userProfile?.signatureUrl || undefined}
                    onSave={async (url) => {
                      setFormData(prev => ({ ...prev, techSignatureUrl: url }));
                      if (url && user?.uid && saveSignatureChecked && !userProfile?.signatureUrl) {
                        try {
                          await updateUserSignature(user.uid, url);
                        } catch (e) {
                          console.error("Error saving signature:", e);
                        }
                      }
                    }}
                  />
                  {!userProfile?.signatureUrl && (
                    <div className="flex items-center space-x-2 px-1 animate-in fade-in slide-in-from-top-1">
                      <Checkbox 
                        id="save-sig" 
                        checked={saveSignatureChecked} 
                        onCheckedChange={(checked) => setSaveSignatureChecked(!!checked)} 
                      />
                      <label htmlFor="save-sig" className="text-[10px] font-bold uppercase text-muted-foreground cursor-pointer select-none">
                        Guardar firma en mi perfil para futuros trabajos
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-dashed">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email del Cliente (Para Firma Remota)</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                      <Input
                        type="email"
                        placeholder="ejemplo@cliente.com"
                        value={formData.clientReceiverEmail}
                        onChange={e => setFormData(prev => ({ ...prev, clientReceiverEmail: e.target.value }))}
                        className="h-12 pl-12 bg-muted/30 border-none rounded-xl font-bold pr-4 shadow-inner"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground font-medium ml-1">
                      Si el cliente no está presente, ingrese su correo para enviar un enlace de firma remota.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold">
                    <span className="bg-white px-2 text-muted-foreground">O FIRMAR EN DISPOSITIVO</span>
                  </div>
                </div>

                <div className="w-full flex flex-col items-center gap-4 bg-muted/5 p-6 rounded-2xl border border-dashed">
                  <div className="text-center">
                    <h3 className="text-sm font-black uppercase text-primary">Firma del Cliente</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">
                      Para mayor transparencia, el cliente puede revisar el resumen de la orden antes de firmar.
                    </p>
                  </div>

                  <Dialog open={showClientPreview} onOpenChange={setShowClientPreview}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" className="h-14 bg-white border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary text-xs font-black uppercase tracking-widest gap-2 rounded-2xl shadow-sm w-full md:w-auto px-8 transition-all">
                        <Eye className="h-5 w-5" /> Revisar y Firmar (Cliente)
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95vw] h-[90vh] md:h-[85vh] p-0 gap-0 overflow-hidden bg-white/95 backdrop-blur-xl border-none shadow-2xl rounded-3xl flex flex-col">
                      <DialogHeader className="p-6 border-b bg-primary text-white shrink-0">
                        <DialogTitle className="text-lg font-black uppercase tracking-tighter flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6" /> Resumen de Orden
                          </div>
                          <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1 font-black uppercase">
                            OT {folio ? String(folio).padStart(5, '0') : '---'}
                          </Badge>
                        </DialogTitle>
                      </DialogHeader>

                      <ScrollArea className="flex-1 p-6">
                        <div className="space-y-8 pb-8">
                          {/* WORK ORDER SUMMARY */}
                          <div className="space-y-6">
                            {/* General Info Header */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="bg-primary hover:bg-primary text-white border-none font-bold text-[9px] uppercase tracking-widest px-3">
                                Fecha: {new Date().toLocaleDateString('es-CL')}
                              </Badge>
                              {formData.techName && (
                                <Badge className="bg-muted text-muted-foreground hover:bg-muted border-none font-bold text-[9px] uppercase px-3">
                                  Técnico ICSA: {formData.techName}
                                </Badge>
                              )}
                              {formData.team && formData.team.length > 0 && (
                                <Badge className="bg-muted text-muted-foreground hover:bg-muted border-none font-bold text-[9px] uppercase px-3 line-clamp-1">
                                  Equipo: {formData.team.join(", ")}
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-muted/20 rounded-xl border border-primary/5 shadow-sm">
                                <p className="text-[9px] uppercase font-black text-muted-foreground mb-1">Tipo de Trabajo</p>
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none font-bold uppercase text-[10px]">
                                  {formData.tipoTrabajo?.includes('Otro') ? formData.tipoTrabajo.replace('Otro', formData.tipoTrabajoOtro || 'Otro') : formData.tipoTrabajo || "N/A"}
                                </Badge>
                              </div>
                              <div className="p-3 bg-muted/20 rounded-xl border border-primary/5 shadow-sm">
                                <p className="text-[9px] uppercase font-black text-muted-foreground mb-1">Estado del Trabajo</p>
                                <Badge className={`border-none font-bold uppercase text-[10px] ${formData.estadoTrabajo?.includes('Trabajo finalizado correctamente') ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                                  formData.estadoTrabajo?.includes('Trabajo finalizado con observaciones') ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                    'bg-rose-100 text-rose-700 hover:bg-rose-100'
                                  }`}>
                                  {formData.estadoTrabajo || "N/A"}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div className="flex flex-col col-span-2 md:col-span-1">
                                <p className="text-[9px] uppercase font-black text-muted-foreground">Mandante / Empresa</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <User className="h-4 w-4 text-primary" />
                                  <p className="text-sm font-bold flex-1">{formData.clientName || '---'}</p>
                                </div>
                                {formData.clientRut && <p className="text-[10px] font-black text-muted-foreground ml-6">RUT: {formData.clientRut}</p>}
                                {(formData.clientPhone || formData.clientEmail) && (
                                  <div className="mt-2 ml-6 space-y-1">
                                    {formData.clientPhone && <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {formData.clientPhone}</p>}
                                    {formData.clientEmail && <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {formData.clientEmail}</p>}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                                  <div>
                                    <p className="text-[9px] uppercase font-black text-muted-foreground">Dirección Central</p>
                                    <p className="text-sm font-bold">{formData.address || '---'}</p>
                                  </div>
                                </div>
                                {(formData.branch || formData.interventionAddress) && (
                                  <div className="flex items-start gap-3">
                                    <Building2 className="h-4 w-4 text-primary mt-0.5 opacity-60" />
                                    <div>
                                      <p className="text-[9px] uppercase font-black text-muted-foreground">Sucursal de Atención</p>
                                      <p className="text-sm font-bold">{formData.branch || '---'}</p>
                                      {formData.interventionAddress && <p className="text-[10px] font-bold text-muted-foreground leading-tight mt-0.5">{formData.interventionAddress}</p>}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {formData.condicionesCobro && formData.condicionesCobro.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-[9px] uppercase font-black text-primary tracking-widest pl-1">Condiciones Comerciales</p>
                                <div className="flex flex-wrap gap-2">
                                  {formData.condicionesCobro.map(c => (
                                    <Badge key={c} className="bg-primary/5 text-primary hover:bg-primary/5 border border-primary/20 text-[9px] uppercase font-bold py-1">
                                      {c}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {formData.description && (
                              <div className="space-y-2">
                                <p className="text-[9px] uppercase font-black text-muted-foreground pl-1">Descripción del Trabajo</p>
                                <div className="p-4 bg-muted/10 rounded-xl text-sm leading-relaxed border border-dashed font-medium text-muted-foreground italic">
                                  {formData.description}
                                </div>
                              </div>
                            )}

                            {formData.detalleTecnico.some(d => d.cantidad || d.observacion) && (
                              <div className="space-y-2">
                                <p className="text-[9px] uppercase font-black text-primary tracking-widest pl-1">Detalle Técnico</p>
                                <div className="border border-primary/10 rounded-xl overflow-hidden text-sm">
                                  <table className="w-full text-left border-collapse">
                                    <thead className="bg-primary/5 text-[9px] uppercase font-black text-muted-foreground">
                                      <tr>
                                        <th className="px-3 py-2">Elemento / Tarea</th>
                                        <th className="px-3 py-2 text-center w-16">Cant.</th>
                                        <th className="px-3 py-2">Observación</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary/5">
                                      {formData.detalleTecnico.map((item, idx) => {
                                        if (!item.cantidad && !item.observacion) return null;
                                        return (
                                          <tr key={idx} className="bg-white">
                                            <td className="px-3 py-2 font-bold text-[10px] sm:text-xs whitespace-normal leading-tight break-words max-w-[120px]">{item.elemento}</td>
                                            <td className="px-3 py-2 font-black text-center text-primary text-[10px] sm:text-xs uppercase">{item.cantidad || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground text-[10px] whitespace-normal leading-tight break-words">{item.observacion || "-"}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {formData.puntosRed.length > 0 && formData.puntosRed.some(p => p.id || p.ubicacion) && (
                              <div className="space-y-2">
                                <p className="text-[9px] uppercase font-black text-primary tracking-widest pl-1">Puntos de Red</p>
                                <div className="border border-primary/10 rounded-xl overflow-hidden text-sm overflow-x-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead className="bg-primary/5 text-[9px] uppercase font-black text-muted-foreground">
                                      <tr>
                                        <th className="px-2 py-2 text-center w-10">Pt.</th>
                                        <th className="px-2 py-2">Ubicación</th>
                                        <th className="px-2 py-2">Panel</th>
                                        <th className="px-2 py-2 text-right">Res.</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-primary/5">
                                      {formData.puntosRed.map((punto, idx) => {
                                        if (!punto.id && !punto.ubicacion) return null;
                                        return (
                                          <tr key={idx} className="bg-white">
                                            <td className="px-2 py-2 font-black text-[10px] text-center uppercase">{punto.id || "-"}</td>
                                            <td className="px-2 py-2 font-medium text-[10px] sm:text-xs whitespace-normal leading-tight break-words">{punto.ubicacion || "-"}</td>
                                            <td className="px-2 py-2 font-medium text-[10px] uppercase whitespace-normal leading-tight break-words">{punto.puerto || "-"}</td>
                                            <td className="px-2 py-2 text-right">
                                              <span className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${punto.resultado?.includes('Certificado') ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {punto.resultado?.includes('Certificado y Rotulado') ? 'C&R' : punto.resultado?.substring(0, 4) || "-"}
                                              </span>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {formData.observacionesGenerales && (
                              <div className="space-y-2">
                                <p className="text-[9px] uppercase font-black text-muted-foreground pl-1">Observaciones Finales</p>
                                <div className="p-4 bg-muted/10 rounded-xl text-sm leading-relaxed border border-dashed font-medium text-muted-foreground italic">
                                  {formData.observacionesGenerales}
                                </div>
                              </div>
                            )}

                            {formData.photos && formData.photos.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-[9px] uppercase font-black text-primary tracking-widest pl-1">Registro Fotográfico Adjunto</p>
                                <p className="text-[10px] text-muted-foreground font-bold pl-1 mb-2">{formData.photos.length} fotografía(s) adjuntas a la orden.</p>
                                <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                                  {formData.photos.map((photo, i) => (
                                    <div key={i} className="shrink-0 snap-center">
                                      <img src={photo} alt={`Foto ${i + 1}`} className="h-24 w-24 object-cover rounded-xl border-2 border-primary/10 shadow-sm" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <hr className="border-dashed my-8" />

                          {/* RECEPTOR DE LA ORDEN Y FIRMA */}
                          <div className="space-y-6">
                            <div className="text-center">
                              <h3 className="text-sm font-black uppercase text-primary tracking-widest mb-1">Recepción Conforme</h3>
                              <p className="text-[10px] text-muted-foreground font-medium">Complete sus datos y firme para confirmar la recepción.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nombre del Receptor <span className="text-destructive">*</span></Label>
                                  <Input
                                    value={formData.clientReceiverName}
                                    onChange={e => setFormData(prev => ({ ...prev, clientReceiverName: e.target.value }))}
                                    className="h-12 bg-muted/30 border-none rounded-xl font-bold px-4 shadow-inner"
                                    placeholder="Ej: Juan Pérez"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">RUT del Receptor <span className="text-destructive">*</span></Label>
                                  <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                                    <Input
                                      value={formData.clientReceiverRut || ""}
                                      onChange={e => {
                                        const val = e.target.value;
                                        import('@/lib/rut-utils').then(m => setFormData(prev => ({ ...prev, clientReceiverRut: m.formatRut(val) })))
                                      }}
                                      className="h-12 pl-12 bg-muted/30 border-none rounded-xl font-bold px-4 shadow-inner"
                                      placeholder="12345678-9"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email del Receptor (Para envío PDF)</Label>
                                <Input
                                  type="email"
                                  placeholder="ejemplo@cliente.com"
                                  value={formData.clientReceiverEmail}
                                  onChange={e => setFormData(prev => ({ ...prev, clientReceiverEmail: e.target.value }))}
                                  className="h-12 bg-muted/30 border-none rounded-xl font-bold px-4 shadow-inner"
                                />
                              </div>
                            </div>

                            <div className="mt-8">
                              <SignaturePad
                                label="Firma del Cliente"
                                initialValue={formData.clientSignatureUrl || undefined}
                                onSave={(url) => setFormData(prev => ({ ...prev, clientSignatureUrl: url }))}
                              />
                            </div>

                            <Button
                              type="button"
                              onClick={() => setShowClientPreview(false)}
                              disabled={!formData.clientSignatureUrl || !formData.clientReceiverName || !formData.clientReceiverRut}
                              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle2 className="h-5 w-5 mr-2" /> Confirmar Firma
                            </Button>
                            {(!formData.clientSignatureUrl || !formData.clientReceiverName || !formData.clientReceiverRut) && (
                              <p className="text-[10px] text-center text-amber-600 font-bold mt-2">
                                * Debe ingresar Nombre, RUT y firmar para confirmar.
                              </p>
                            )}
                          </div>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>

                  {formData.clientSignatureUrl && formData.clientReceiverName && formData.clientReceiverRut && (
                    <div className="flex flex-col items-center mt-2 animate-fade-in">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-4 py-1.5 gap-2 font-black uppercase text-[10px]">
                        <CheckCircle2 className="h-4 w-4" /> Firma Capturada Correctamente
                      </Badge>
                      <p className="text-[10px] font-bold text-muted-foreground mt-2">{formData.clientReceiverName} - {formData.clientReceiverRut}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t md:relative md:bg-transparent md:border-none md:p-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                onClick={onSaveAsPending}
                disabled={loading || isSendingSignature}
                variant="secondary"
                className="flex-1 h-16 text-lg font-black gap-3 shadow-lg rounded-2xl uppercase tracking-tighter transition-all active:scale-95"
              >
                <Save size={24} /> Guardar
              </Button>
              <Button
                type="button"
                onClick={handleSendRemoteSignature}
                disabled={loading || isSendingSignature}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white h-16 text-lg font-black gap-3 shadow-xl rounded-2xl uppercase tracking-tighter transition-all active:scale-95"
              >
                {isSendingSignature ? <Loader2 className="animate-spin" /> : <Send size={24} />} Firma Remota
              </Button>
              <Button
                type="button"
                onClick={onArchiveAndFinish}
                disabled={loading || isSendingSignature}
                className="flex-[1.5] bg-primary hover:bg-primary/90 h-16 text-lg font-black gap-3 shadow-2xl rounded-2xl uppercase tracking-tighter transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Archive size={24} />} Finalizar
              </Button>
            </div>
          </div>
        </form>
      </main>

      <footer className="mt-12 text-center pb-20 md:pb-12 px-6">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-[9px] text-muted-foreground leading-relaxed italic">
            La presente Orden de Trabajo y su firma electrónica se encuentran reguladas bajo la Ley 19.799, siendo plenamente válidas como Firma Electrónica Simple para todos los efectos legales.
          </p>
          <div className="flex flex-col items-center opacity-30">
            <span className="font-black text-xl tracking-tighter text-primary">ICSA</span>
            <span className="text-[8px] font-bold uppercase tracking-[0.4em] mt-1">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function NewWorkOrder() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black animate-pulse text-primary uppercase tracking-tighter">Cargando aplicación...</div>}>
      <NewWorkOrderContent />
    </Suspense>
  );
}
