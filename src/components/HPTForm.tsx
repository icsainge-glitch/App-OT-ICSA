
'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ArrowRight, Save, User, Briefcase, 
  CheckCircle2, Plus, Trash2, Shield, ShieldCheck, AlertTriangle, 
  Wrench, Users, Camera, X, Loader2, Search, Check
} from "lucide-react";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { getActiveProjects, saveHPT, getNextFolioHPT, getPersonnel, getHPTQuestions } from "@/actions/db-actions";
import { sendHPTSignatureRequest } from "@/ai/flows/send-hpt-signature-request-flow";
import { useActionData } from "@/hooks/use-action-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const STEPS = [
  { id: 'general', title: 'Información General', icon: Briefcase },
  { id: 'team', title: 'Equipo de Trabajo', icon: Users },
  { id: 'resources', title: 'Recursos y Permisos', icon: Wrench },
  { id: 'risks', title: 'Riesgos Potenciales', icon: AlertTriangle },
  { id: 'medidas', title: 'Medidas Seguridad', icon: CheckCircle2 },
  { id: 'epp', title: 'EPP Requerido', icon: Shield },
  { id: 'review', title: 'Firma Supervisor', icon: Save },
  { id: 'prevencion', title: 'Firma Prevención', icon: ShieldCheck }
];

export function HPTForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { userProfile, isProfileLoading } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    id?: string;
    projectId: string;
    projectName: string;
    supervisorName: string;
    supervisorRut: string;
    fecha: string;
    trabajoRealizar: string;
    firmaSupervisor: string;
    prevencionName: string;
    prevencionEmail: string;
    status: string;
  }>({
    id: initialData?.id || undefined,
    projectId: initialData?.projectId || initialData?.projectid || "",
    projectName: initialData?.projectName || initialData?.projectname || "",
    supervisorName: initialData?.supervisorName || initialData?.supervisorname || "",
    supervisorRut: initialData?.supervisorRut || initialData?.supervisorrut || "",
    fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
    trabajoRealizar: initialData?.trabajoRealizar || initialData?.trabajorealizar || "",
    firmaSupervisor: initialData?.firmaSupervisor || initialData?.firmasupervisor || "",
    prevencionName: initialData?.prevencionName || initialData?.prevencionname || "José Mellado",
    prevencionEmail: initialData?.prevencionEmail || initialData?.prevencionemail || "icsaprevencion@gmail.com",
    status: initialData?.status || "Borrador"
  });

  const [questions, setQuestions] = useState<any[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);

  const [recursos, setRecursos] = useState(initialData?.recursos || {});
  const [riesgos, setRiesgos] = useState(initialData?.riesgos || {});
  const [medidas, setMedidas] = useState(initialData?.medidas || {});
  const [epp, setEpp] = useState(initialData?.epp || {});

  const [workers, setWorkers] = useState<any[]>(initialData?.workers || []);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await getHPTQuestions();
        setQuestions(data);
        
        // Populate initial values if new HPT
        if (!initialData?.id) {
          const initialRecursos: any = {};
          const initialRiesgos: any = {};
          const initialMedidas: any = {};
          const initialEpp: any = {};

          data.forEach((q: any) => {
            if (q.category === 'recursos') initialRecursos[q.item_key] = 'N/A';
            if (q.category === 'riesgos') initialRiesgos[q.item_key] = q.item_key === 'otros' ? '' : 'N/A';
            if (q.category === 'medidas') initialMedidas[q.item_key] = 'N/A';
            if (q.category === 'epp') initialEpp[q.item_key] = false;
          });

          setRecursos((prev: any) => Object.keys(prev).length === 0 ? initialRecursos : prev);
          setRiesgos((prev: any) => Object.keys(prev).length === 0 ? initialRiesgos : prev);
          setMedidas((prev: any) => Object.keys(prev).length === 0 ? initialMedidas : prev);
          setEpp((prev: any) => Object.keys(prev).length === 0 ? initialEpp : prev);
        }
      } catch (e) {
        console.error("Error loading HPT questions:", e);
      } finally {
        setIsQuestionsLoading(false);
      }
    };
    fetchQuestions();
  }, [initialData]);

  const dynamicQuestions = useMemo(() => {
    return {
      recursos: questions.filter(q => q.category === 'recursos' && (q.active || initialData?.recursos?.[q.item_key])),
      riesgos: questions.filter(q => q.category === 'riesgos' && (q.active || initialData?.riesgos?.[q.item_key])),
      medidas: questions.filter(q => q.category === 'medidas' && (q.active || initialData?.medidas?.[q.item_key])),
      epp: questions.filter(q => q.category === 'epp' && (q.active || initialData?.epp?.[q.item_key]))
    };
  }, [questions, initialData]);
  const [folio, setFolio] = useState<number | string>(initialData?.folio || 0);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [openProjectSearch, setOpenProjectSearch] = useState(false);
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);

  const isAdmin = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador';
  
  const isPrevencionista = userProfile?.rol_t?.toLowerCase() === 'prevencionista' || 
    userProfile?.rol_t?.toLowerCase() === 'prevenc';

  const isCompletedEdit = initialData?.status === 'Completado';

  useEffect(() => {
    const fetchPersonnel = async () => {
      const data = await getPersonnel();
      setPersonnel(data);
    };
    fetchPersonnel();
  }, []);

  const { data: projects } = useActionData<any[]>(() => {
    if (!user?.uid || isProfileLoading) return Promise.resolve([]);
    return getActiveProjects(user.uid, isAdmin);
  }, [user?.uid, isAdmin, isProfileLoading]);

  useEffect(() => {
    if (initialData?.folio) return;
    const fetchFolio = async () => {
      const next = await getNextFolioHPT();
      setFolio(next);
    };
    fetchFolio();
  }, [initialData]);

  useEffect(() => {
    if (userProfile && !formData.supervisorName) {
      setFormData(prev => ({
        ...prev,
        supervisorName: userProfile.nombre_t || "",
        supervisorRut: (userProfile as any).rut_t || ""
      }));
    }
  }, [userProfile]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const addWorker = () => {
    setWorkers(prev => [...prev, { nombre: "", rut: "", cargo: "", firma: "" }]);
  };

  const addWorkersFromPersonnel = (selected: any[]) => {
    const existingRuts = new Set(workers.map(w => w.rut));
    const newWorkers = selected
      .filter(p => !existingRuts.has(p.rut_t || p.rut))
      .map(p => ({
        nombre: p.nombre_t || "",
        rut: p.rut_t || p.rut || "",
        cargo: p.cargo_t || p.cargo || "",
        firma: ""
      }));
    
    setWorkers(prev => [...prev, ...newWorkers].slice(0, 10)); // Increased to 10 based on photo
    setIsSelectModalOpen(false);
    setSelectedPersonnelIds([]);
    if (newWorkers.length > 0) {
      toast({ title: "Personal agregado", description: `Se han añadido ${newWorkers.length} personas al equipo.` });
    } else {
      toast({ title: "Sin cambios", description: "El personal seleccionado ya estaba en la lista." });
    }
  };

  const togglePersonnelSelection = (id: string) => {
    setSelectedPersonnelIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const confirmSelection = () => {
    const selected = personnel.filter(p => selectedPersonnelIds.includes(p.id));
    addWorkersFromPersonnel(selected);
  };

  const removeWorker = (index: number) => {
    setWorkers(prev => prev.filter((_, i) => i !== index));
  };

  const updateWorker = (index: number, field: string, value: string) => {
    setWorkers(prevWorkers => {
      const newWorkers = [...prevWorkers];
      newWorkers[index] = { ...newWorkers[index], [field]: value };
      return newWorkers;
    });
  };

  const onSubmit = async (isFinal: boolean = false) => {
    if (!user) return;
    
    // Validate worker signatures if finalizing
    if (isFinal) {
      const unsignedWorkers = workers.filter(w => !w.firma && w.nombre);
      if (unsignedWorkers.length > 0) {
        toast({ 
          variant: "destructive", 
          title: "Firmas Faltantes en Equipo", 
          description: `Faltan las firmas de: ${unsignedWorkers.map(w => w.nombre).join(", ")}` 
        });
        return;
      }
    }

    setLoading(true);

    const hptPayload = {
      ...formData,
      folio: folio,
      recursos,
      riesgos,
      medidas,
      epp,
      status: isFinal ? "Completado" : "Borrador",
      createdBy: user.uid,
    };

    const result = await saveHPT(hptPayload, workers);
    setLoading(false);

    if (result.success) {
      toast({ title: isFinal ? "HPT Finalizado" : "Borrador Guardado", description: "El documento ha sido registrado exitosamente." });
      if (isFinal) {
        router.push("/hpt");
      } else {
        setFormData(prev => ({ ...prev, id: result.id }));
      }
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const sendSignatureRequest = async () => {
    if (!formData.prevencionEmail) {
      toast({ variant: "destructive", title: "Email Requerido", description: "Ingrese el email de prevención." });
      return;
    }

    setLoading(true);
    try {
      // 1. Save current state first
      const hptPayload = {
        ...formData,
        folio: folio,
        recursos,
        riesgos,
        medidas,
        epp,
        status: "Pendiente",
        createdBy: user?.uid,
      };

      const saveRes = await saveHPT(hptPayload, workers);
      if (!saveRes.success) throw new Error(saveRes.error);

      const hptId = saveRes.id;

      // 2. Trigger flow
      const flowRes = await sendHPTSignatureRequest({
        id: hptId!,
        recipientEmail: formData.prevencionEmail,
        prevencionName: formData.prevencionName || "Prevencionista",
        folio: folio,
        baseUrl: window.location.origin
      });

      if (flowRes.success) {
        toast({ title: "Solicitud Enviada", description: `Se ha enviado un correo a ${formData.prevencionEmail}` });
        router.push("/hpt");
      } else {
        throw new Error(flowRes.error);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex justify-between px-2 overflow-x-auto pb-4 gap-4 no-scrollbar">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isPast = idx < currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 min-w-[60px]">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                isActive ? 'bg-primary text-white scale-110 shadow-lg' : 
                isPast ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {isPast ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest text-center ${isActive ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden animate-slide-up">
        <CardHeader className="bg-primary/5 p-8 border-b border-black/5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-3 uppercase font-black tracking-tighter text-primary">
              <StepIcon className="h-7 w-7" /> {STEPS[currentStep].title}
            </CardTitle>
            <Badge variant="outline" className="font-black text-[10px] uppercase border-primary/20 text-primary px-3 py-1">
              Paso {currentStep + 1} de {STEPS.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden">
          {/* Status Indicator / Banner */}
          {isCompletedEdit && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black uppercase text-[10px] tracking-widest text-amber-700 leading-none mb-1">Modo Edición Prevención</h4>
                  <p className="text-[10px] font-bold text-amber-600/70 uppercase">Usted está modificando un documento ya finalizado.</p>
                </div>
              </div>
              <Badge className="bg-amber-500 text-white font-black uppercase text-[8px] tracking-widest rounded-lg px-2 py-1">Revisión</Badge>
            </div>
          )}

          <form className="p-8 space-y-8" onSubmit={(e) => e.preventDefault()}>
            
            {/* Step 0: General and Team */}
            {currentStep === 0 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Vincular a Proyecto</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="Nombre del proyecto (manual)" 
                          value={formData.projectName} 
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            projectName: e.target.value,
                            projectId: "manual" 
                          }))}
                          className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner focus-visible:ring-primary"
                        />
                      </div>
                      <Popover open={openProjectSearch} onOpenChange={setOpenProjectSearch}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg shrink-0">
                            <Search className="h-6 w-6" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] md:w-[400px] p-0 shadow-2xl rounded-3xl border-none overflow-hidden" align="end">
                          <Command>
                            <CommandInput placeholder="Buscar proyecto..." className="h-14 font-bold border-none" />
                            <CommandList className="max-h-[300px]">
                              <CommandEmpty className="p-6 text-center text-sm font-bold opacity-40">No se encontraron proyectos.</CommandEmpty>
                              <CommandGroup heading="Proyectos Activos" className="p-2">
                                <CommandItem 
                                  onSelect={() => {
                                    setFormData(prev => ({ ...prev, projectId: "", projectName: "General / Sin Proyecto" }));
                                    setOpenProjectSearch(false);
                                  }} 
                                  className="p-4 cursor-pointer rounded-2xl aria-selected:bg-primary aria-selected:text-white"
                                >
                                  <Briefcase className="h-5 w-5 mr-3" />
                                  <span className="font-black text-xs uppercase">General / Sin Proyecto</span>
                                </CommandItem>
                                {projects?.map((p) => (
                                  <CommandItem 
                                    key={p.id} 
                                    onSelect={() => {
                                      setFormData(prev => ({ ...prev, projectId: p.id, projectName: p.name }));
                                      setOpenProjectSearch(false);
                                    }} 
                                    className="p-4 cursor-pointer rounded-2xl aria-selected:bg-primary aria-selected:text-white"
                                  >
                                    <Briefcase className="h-5 w-5 mr-3" />
                                    <div className="flex flex-col">
                                      <span className="font-black text-xs uppercase">{p.name}</span>
                                      {p.clientName && <span className="text-[10px] opacity-60 font-bold">{p.clientName}</span>}
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
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Fecha</Label>
                    <Input type="date" value={formData.fecha} onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Supervisor a Cargo</Label>
                    <Input placeholder="Nombre completo" value={formData.supervisorName} onChange={(e) => setFormData(prev => ({ ...prev, supervisorName: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">RUT Supervisor</Label>
                    <Input placeholder="Ej: 12.345.678-9" value={formData.supervisorRut} onChange={(e) => setFormData(prev => ({ ...prev, supervisorRut: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Trabajo a Realizar ¿Cómo Ejecutaré Mi trabajo?</Label>
                  <Textarea placeholder="Describa el trabajo detalladamente..." value={formData.trabajoRealizar} onChange={(e) => setFormData(prev => ({ ...prev, trabajoRealizar: e.target.value }))} className="min-h-[150px] bg-muted/30 border-none rounded-3xl p-6 font-medium text-sm shadow-inner resize-none" />
                </div>
              </div>
            )}

            {/* Step 1: Team Selection */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1 tracking-[0.2em]">Equipo de Trabajo (Máx 10)</Label>
                    <div className="flex gap-2">
                      <Dialog open={isSelectModalOpen} onOpenChange={(val) => {
                        setIsSelectModalOpen(val);
                        if (!val) setSelectedPersonnelIds([]);
                      }}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-primary bg-primary/5 text-primary">
                            <Search className="h-4 w-4 mr-2" /> Seleccionar de Nómina
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                          <DialogHeader className="p-8 bg-primary/5 border-b border-black/5">
                            <DialogTitle className="text-xl font-black text-primary uppercase tracking-tighter">Seleccionar Equipo</DialogTitle>
                          </DialogHeader>
                          <Command className="border-none">
                            <CommandInput placeholder="Buscar por nombre o RUT..." className="h-14 font-bold border-none" />
                            <CommandList className="max-h-[350px] p-2">
                              <CommandEmpty className="py-10 text-center font-bold text-muted-foreground">No se encontraron resultados.</CommandEmpty>
                              <CommandGroup>
                                {personnel.map((p) => {
                                  const isSelected = selectedPersonnelIds.includes(p.id);
                                  const isAlreadyInTeam = workers.some(w => w.rut === (p.rut_t || p.rut));
                                  return (
                                    <CommandItem
                                      key={p.id}
                                      onSelect={() => !isAlreadyInTeam && togglePersonnelSelection(p.id)}
                                      className={`p-4 rounded-xl cursor-pointer transition-all ${isAlreadyInTeam ? 'opacity-50 grayscale' : 'hover:bg-primary/5'}`}
                                    >
                                      <div className="flex items-center gap-4 w-full">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                          isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                                        }`}>
                                          {isSelected ? <Check className="h-5 w-5" /> : p.nombre_t?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                          <span className="font-black text-xs uppercase text-primary">{p.nombre_t}</span>
                                          <span className="text-[10px] font-medium text-muted-foreground">{p.rut_t || p.rut || 'Sin RUT'}</span>
                                        </div>
                                        {isAlreadyInTeam && <Badge variant="outline" className="text-[8px] uppercase">En equipo</Badge>}
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                            <div className="p-4 bg-muted/30 border-t flex flex-col gap-2">
                              <span className="text-[10px] font-black uppercase text-center text-muted-foreground">
                                {selectedPersonnelIds.length} seleccionados
                              </span>
                              <Button 
                                onClick={confirmSelection} 
                                disabled={selectedPersonnelIds.length === 0}
                                className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest"
                              >
                                Agregar al Equipo
                              </Button>
                            </div>
                          </Command>
                        </DialogContent>
                      </Dialog>

                      {workers.length < 10 && (
                        <Button type="button" onClick={addWorker} variant="outline" size="sm" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-primary/20 text-primary">
                          <Plus className="h-4 w-4 mr-2" /> Manual
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {workers.map((worker, idx) => (
                      <Card key={idx} className="bg-muted/10 border-none rounded-3xl p-6 relative group border-2 border-transparent hover:border-primary/5 transition-all">
                        <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 text-destructive opacity-40 group-hover:opacity-100 transition-opacity" onClick={() => removeWorker(idx)}>
                          <X className="h-5 w-5" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Nombre Trabajador</Label>
                            <Input value={worker.nombre} onChange={(e) => updateWorker(idx, 'nombre', e.target.value)} className="bg-white border-none rounded-2xl font-bold h-12 shadow-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">RUT</Label>
                            <Input value={worker.rut} onChange={(e) => updateWorker(idx, 'rut', e.target.value)} className="bg-white border-none rounded-2xl font-bold h-12 shadow-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Cargo</Label>
                            <Input value={worker.cargo} onChange={(e) => updateWorker(idx, 'cargo', e.target.value)} className="bg-white border-none rounded-2xl font-bold h-12 shadow-sm" />
                          </div>
                          <div className="col-span-full space-y-4 mt-2">
                            <SignaturePad 
                              label={`Firma de ${worker.nombre || 'Integrante'}`} 
                              onSave={(url) => updateWorker(idx, 'firma', url)} 
                              initialValue={worker.firma}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    {workers.length === 0 && (
                      <div className="text-center py-10 opacity-30 border-2 border-dashed border-black/10 rounded-[2rem] flex flex-col items-center gap-4">
                        <Users className="h-10 w-10" />
                        <p className="font-black uppercase text-[10px] tracking-[0.2em]">Equipo Vacío</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Resources */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">RECURSOS / COORDINACIÓN / PERMISOS:</p>
                <div className="grid grid-cols-1 gap-4">
                  {dynamicQuestions.recursos.map((item: any, idx: number) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/10 rounded-[2rem] gap-4 group hover:bg-muted/20 transition-all border border-transparent hover:border-black/5">
                      <div className="flex gap-4 items-start flex-1 min-w-0">
                        <span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-[10px] shrink-0">{idx + 1}</span>
                        <Label className="text-xs font-bold leading-tight pt-1 truncate whitespace-normal">{item.label}</Label>
                      </div>
                      <div className="flex bg-white/50 p-1 rounded-xl shadow-inner gap-1 shrink-0">
                        {['SI', 'NO', 'N/A'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setRecursos((prev: any) => ({ ...prev, [item.item_key]: opt }))}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                              recursos[item.item_key] === opt 
                                ? 'bg-primary text-white shadow-md scale-105' 
                                : 'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Risks */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">IDENTIFICACIÓN DE ACCIDENTES POTENCIALES O RIESGOS ASOCIADOS:</p>
                <div className="grid grid-cols-1 gap-3">
                  {dynamicQuestions.riesgos.filter((q: any) => q.item_key !== 'otros').map((item: any, idx: number) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/10 rounded-2xl gap-3 group hover:bg-muted/20 transition-all border border-transparent hover:border-black/5">
                      <div className="flex gap-4 items-start flex-1 min-w-0">
                        <span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-[10px] shrink-0">{idx + 1}</span>
                        <Label className="text-[11px] font-bold leading-tight pt-1 truncate whitespace-normal">{item.label}</Label>
                      </div>
                      <div className="flex bg-white/50 p-1 rounded-lg shadow-inner gap-1 shrink-0">
                        {['SI', 'NO', 'N/A'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setRiesgos((prev: any) => ({ ...prev, [item.item_key]: opt }))}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black transition-all ${
                              riesgos[item.item_key] === opt 
                                ? 'bg-primary text-white shadow-md' 
                                : 'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Otros riesgos (always at end if exists) */}
                  {questions.find(q => q.category === 'riesgos' && q.item_key === 'otros') && (
                    <div className="space-y-2 pt-4 border-t border-black/5">
                      <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Otros Riesgos:</Label>
                      <Input 
                        placeholder="Especifique otros riesgos..." 
                        value={riesgos.otros || ""} 
                        onChange={(e) => setRiesgos((prev: any) => ({ ...prev, otros: e.target.value }))} 
                        className="h-12 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" 
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Safety Measures */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">IDENTIFICACIÓN DE LAS MEDIDAS DE SEGURIDAD:</p>
                <div className="grid grid-cols-1 gap-3">
                  {dynamicQuestions.medidas.map((item: any, idx: number) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/10 rounded-2xl gap-3 group hover:bg-muted/20 transition-all border border-transparent hover:border-black/5">
                      <div className="flex gap-4 items-start flex-1 min-w-0">
                        <span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-[10px] shrink-0">{idx + 1}</span>
                        <Label className="text-[11px] font-bold leading-tight pt-1 truncate whitespace-normal">{item.label}</Label>
                      </div>
                      <div className="flex bg-white/50 p-1 rounded-lg shadow-inner gap-1 shrink-0">
                        {['SI', 'NO', 'N/A'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setMedidas((prev: any) => ({ ...prev, [item.item_key]: opt }))}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black transition-all ${
                              medidas[item.item_key] === opt 
                                ? 'bg-primary text-white shadow-md' 
                                : 'text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: EPP */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xs font-black text-primary uppercase tracking-widest leading-relaxed">EQUIPOS DE PROTECCIÓN Y SEGURIDAD REQUERIDOS:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dynamicQuestions.epp.filter((q: any) => q.item_key !== 'otros').map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-muted/10 rounded-xl hover:bg-muted/20 transition-all border border-transparent hover:border-black/5">
                      <Checkbox 
                        id={item.id} 
                        checked={!!epp[item.item_key]} 
                        onCheckedChange={(val) => setEpp((prev: any) => ({ ...prev, [item.item_key]: !!val }))} 
                        className="h-5 w-5 rounded border-primary/20 data-[state=checked]:bg-primary" 
                      />
                      <Label htmlFor={item.id} className="text-[10px] font-black uppercase tracking-tight cursor-pointer flex-1 py-1 leading-tight">{item.label}</Label>
                    </div>
                  ))}
                </div>
                {/* Otros EPP (always at end if exists or just standard) */}
                <div className="space-y-2 pt-4 border-t border-black/5">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Otros EPP / Observaciones:</Label>
                  <Input 
                    placeholder="Especifique..." 
                    value={epp.otros || ""} 
                    onChange={(e) => setEpp((prev: any) => ({ ...prev, otros: e.target.value }))} 
                    className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" 
                  />
                </div>
              </div>
            )}


            {/* Step 6: Final Supervisor Signature */}
            {currentStep === 6 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                  <h4 className="font-black uppercase text-xs text-primary mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> Declaración del Supervisor
                  </h4>
                  <p className="text-[11px] font-medium leading-relaxed opacity-80 italic">
                    Declaro que he evaluado los riesgos asociados a esta tarea y que se han tomado todas las medidas de prevención necesarias, 
                    verificando el estado de los recursos, equipos y el personal bajo mi cargo.
                  </p>
                </div>

                <div className="space-y-6">
                  <SignaturePad 
                    label="Firma del Supervisor a Cargo" 
                    onSave={(url) => setFormData((prev: any) => ({ ...prev, firmaSupervisor: url }))} 
                    initialValue={formData.firmaSupervisor}
                  />
                </div>

                <div className="pt-6 flex flex-col gap-3">
                  <Button 
                    type="button" 
                    onClick={() => handleNext()} 
                    disabled={!formData.firmaSupervisor}
                    className="h-20 bg-primary text-white rounded-[2rem] font-black text-xl uppercase tracking-tighter shadow-xl shadow-primary/30"
                  >
                    Siguiente: Firma Prevención
                  </Button>
                </div>
              </div>
            )}

            {/* Step 7: Prevención Signature Request */}
            {currentStep === 7 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 text-center">
                  <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h4 className="font-black uppercase text-lg text-primary mb-2">Solicitud de Firma Remota</h4>
                  <p className="text-[11px] font-medium leading-relaxed opacity-80">
                    Para finalizar la HPT, es necesario que el Departamento de Prevención revise y firme el documento.
                    Se enviará un enlace seguro al correo electrónico especificado.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre Prevencionista (Opcional)</Label>
                    <Input 
                      placeholder="Ej: Juan Pérez"
                      value={formData.prevencionName}
                      onChange={(e) => setFormData(prev => ({ ...prev, prevencionName: e.target.value }))}
                      className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Prevencionista</Label>
                    <Input 
                      type="email"
                      placeholder="prevencionista@icsaingenieria.cl"
                      value={formData.prevencionEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, prevencionEmail: e.target.value }))}
                      className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-6 flex flex-col gap-3">
                  <Button 
                    type="button" 
                    onClick={sendSignatureRequest} 
                    disabled={loading || !formData.prevencionEmail || !formData.firmaSupervisor}
                    className="h-24 bg-primary text-white rounded-[2.5rem] font-black text-2xl uppercase tracking-tighter shadow-2xl shadow-primary/40 border-b-8 border-primary/50 active:border-b-0 active:translate-y-1 transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin h-8 w-8 mr-3" /> : <ShieldCheck className="h-8 w-8 mr-3" />}
                    Enviar Firma a Prevención
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => onSubmit(false)} 
                      disabled={loading}
                      className="h-14 flex-1 font-black text-xs uppercase tracking-widest text-muted-foreground rounded-2xl"
                    >
                      <Save className="h-4 w-4 mr-2" /> Guardar Borrador
                    </Button>
                    
                    {isAdmin && (
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => onSubmit(true)} 
                        disabled={loading || !formData.firmaSupervisor}
                        className="h-14 flex-1 font-black text-xs uppercase tracking-widest rounded-2xl"
                      >
                         Omitir y Finalizar (Admin)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-8 border-t border-black/5">
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={handleBack} className="h-16 flex-1 rounded-2xl border-none bg-muted/50 font-black uppercase text-xs tracking-widest hover:bg-muted group">
                  <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Atrás
                </Button>
              )}
              {currentStep < 7 && (
                <Button type="button" onClick={handleNext} className="h-16 flex-[1.5] rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/30 group">
                  Siguiente <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </div>

          </form>
        </CardContent>
      </Card>

      {/* Helper Text */}
      <div className="flex items-center justify-center gap-2 opacity-30 mt-4">
        <Shield className="h-4 w-4" />
        <span className="text-[9px] font-black uppercase tracking-widest">ICSA - Sistema de Gestión de Seguridad</span>
      </div>
    </div>
  );
}
