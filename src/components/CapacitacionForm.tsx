
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/SignaturePad";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ArrowRight, Save, User, 
  CheckCircle2, Plus, Trash2, MessageSquare, 
  MapPin, Clock, Users, X, Loader2
} from "lucide-react";
import { useUser, useUserProfile } from "@/lib/auth-provider";
import { saveCapacitacion, getNextFolioCapacitacion, getPersonnel } from "@/actions/db-actions";
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
import { Search, Check, Send } from "lucide-react";
import { sendCapacitacionSignatureRequest } from "@/ai/flows/send-capacitacion-signature-request-flow";

const STEPS = [
  { id: 'general', title: 'Información General', icon: MapPin },
  { id: 'content', title: 'Temario / Contenido', icon: MessageSquare },
  { id: 'assistants', title: 'Asistentes', icon: Users },
  { id: 'review', title: 'Firma y Envío', icon: CheckCircle2 }
];

export function CapacitacionForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { userProfile } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    supervisorName: initialData?.supervisorName || "",
    cargo: initialData?.cargo || "Supervisor",
    lugar: initialData?.lugar || "",
    fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
    horaInicio: initialData?.horaInicio || "",
    horaTermino: initialData?.horaTermino || "",
    temario: initialData?.temario || "",
    firmaSupervisor: initialData?.firmaSupervisor || "",
    status: initialData?.status || "Pendiente",
    prevencionEmail: initialData?.prevencionEmail || "icsaprevencion@gmail.com",
    prevencionName: initialData?.prevencionName || "Departamento de Prevención"
  });

  const [assistants, setAssistants] = useState<any[]>(initialData?.assistants || []);
  const [folio, setFolio] = useState<number | string>(initialData?.folio || 0);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPersonnel = async () => {
      const data = await getPersonnel();
      setPersonnel(data);
    };
    fetchPersonnel();
  }, []);

  useEffect(() => {
    if (initialData?.folio) return;
    const fetchFolio = async () => {
      const next = await getNextFolioCapacitacion();
      setFolio(next);
    };
    fetchFolio();
  }, [initialData]);

  useEffect(() => {
    if (userProfile && !formData.supervisorName) {
      setFormData(prev => ({
        ...prev,
        supervisorName: userProfile.nombre_t || "",
        cargo: userProfile.cargo_t || "Supervisor"
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

  const addAssistant = () => {
    setAssistants(prev => [...prev, { nombre: "", rut: "", cargo: "", firma: "" }]);
  };

  const addAssistantsFromPersonnel = (selected: any[]) => {
    const existingRuts = new Set(assistants.map(a => a.rut));
    const newAssistants = selected
      .filter(p => !existingRuts.has(p.rut_t || p.rut))
      .map(p => ({
        nombre: p.nombre_t || "",
        rut: p.rut_t || p.rut || "",
        cargo: p.cargo_t || p.cargo || "",
        firma: ""
      }));
    
    setAssistants(prev => [...prev, ...newAssistants]);
    setIsSelectModalOpen(false);
    setSelectedPersonnelIds([]);
    if (newAssistants.length > 0) {
      toast({ title: "Asistentes agregados", description: `Se han añadido ${newAssistants.length} personas a la lista.` });
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
    addAssistantsFromPersonnel(selected);
  };

  const removeAssistant = (index: number) => {
    setAssistants(prev => prev.filter((_, i) => i !== index));
  };

  const updateAssistant = (index: number, field: string, value: string) => {
    const newAssistants = [...assistants];
    newAssistants[index][field] = value;
    setAssistants(newAssistants);
  };

  const onSubmit = async () => {
    if (!user) return;
    
    // Validate assistant signatures
    const unsignedAssistants = assistants.filter(a => !a.firma && a.nombre);
    if (unsignedAssistants.length > 0) {
      toast({ 
        variant: "destructive", 
        title: "Firmas Faltantes", 
        description: `Faltan las firmas de: ${unsignedAssistants.map(a => a.nombre).join(", ")}` 
      });
      return;
    }

    if (!formData.prevencionEmail) {
      toast({ variant: "destructive", title: "Firma Remota Requerida", description: "Ingrese el email del departamento de prevención." });
      return;
    }
    setLoading(true);

    const payload = {
      ...formData,
      folio: folio,
      createdBy: user.uid,
      status: 'Pendiente'
    };

    const result = await saveCapacitacion(payload, assistants);

    if (result.success) {
      // Send Remote Signature Request
      try {
        const flowResult = await sendCapacitacionSignatureRequest({
          id: result.id,
          recipientEmail: formData.prevencionEmail,
          prevencionName: formData.prevencionName,
          folio: folio,
          baseUrl: window.location.origin
        });

        if (flowResult.success) {
          toast({ title: "Solicitud Enviada", description: "El registro ha sido guardado y enviado a Prevención para su firma." });
          router.push("/capacitaciones");
        } else {
          toast({ variant: "destructive", title: "Error al enviar email", description: flowResult.error });
        }
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error de Sistema", description: err.message });
      }
    } else {
      toast({ variant: "destructive", title: "Error al guardar", description: result.error });
    }
    setLoading(false);
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
            <div key={step.id} className="flex flex-col items-center gap-2 min-w-[80px]">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                isActive ? 'bg-primary text-white scale-110 shadow-lg' : 
                isPast ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {isPast ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest text-center ${isActive ? 'text-primary' : 'text-muted-foreground opacity-50'}`}>
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

        <CardContent className="p-8">
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            
            {/* Step 0: General Info */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Relator (Supervisor)</Label>
                    <Input placeholder="Nombre del relator" value={formData.supervisorName} onChange={(e) => setFormData(prev => ({ ...prev, supervisorName: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Cargo</Label>
                    <Input placeholder="Cargo del relator" value={formData.cargo} onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Lugar de la Charla</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                    <Input placeholder="Ej: Obra Central, Sala A..." value={formData.lugar} onChange={(e) => setFormData(prev => ({ ...prev, lugar: e.target.value }))} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold shadow-inner" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Fecha</Label>
                    <Input type="date" value={formData.fecha} onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))} className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Hora Inicio</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                      <Input type="time" value={formData.horaInicio} onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold shadow-inner" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Hora Término</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none" />
                      <Input type="time" value={formData.horaTermino} onChange={(e) => setFormData(prev => ({ ...prev, horaTermino: e.target.value }))} className="h-14 pl-12 bg-muted/30 border-none rounded-2xl font-bold shadow-inner" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Content */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Temario / Contenido de la Charla</Label>
                  <Textarea 
                    placeholder="Describa los puntos tratados en la charla de seguridad..." 
                    value={formData.temario} 
                    onChange={(e) => setFormData(prev => ({ ...prev, temario: e.target.value }))} 
                    className="min-h-[250px] bg-muted/30 border-none rounded-[2rem] p-8 font-medium text-sm shadow-inner resize-none" 
                  />
                </div>
              </div>
            )}

            {/* Step 2: Assistants */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">Asistentes a la charla:</p>
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
                          <DialogTitle className="text-xl font-black text-primary uppercase tracking-tighter">Seleccionar Personal</DialogTitle>
                        </DialogHeader>
                        <Command className="border-none">
                          <CommandInput placeholder="Buscar por nombre o RUT..." className="h-14 font-bold border-none" />
                          <CommandList className="max-h-[350px] p-2">
                            <CommandEmpty className="py-10 text-center font-bold text-muted-foreground">No se encontraron resultados.</CommandEmpty>
                            <CommandGroup>
                              {personnel.map((p) => {
                                const isSelected = selectedPersonnelIds.includes(p.id);
                                const isAlreadyInList = assistants.some(a => a.rut === (p.rut_t || p.rut));
                                return (
                                  <CommandItem
                                    key={p.id}
                                    onSelect={() => !isAlreadyInList && togglePersonnelSelection(p.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all ${isAlreadyInList ? 'opacity-50 grayscale' : 'hover:bg-primary/5'}`}
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
                                      {isAlreadyInList && <Badge variant="outline" className="text-[8px] uppercase">Ya agregado</Badge>}
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
                              Agregar Asistentes
                            </Button>
                          </div>
                        </Command>
                      </DialogContent>
                    </Dialog>
                    <Button type="button" onClick={addAssistant} variant="outline" size="sm" className="h-10 px-4 text-[10px] font-black uppercase rounded-xl border-primary/20 text-primary">
                      <Plus className="h-4 w-4 mr-2" /> Añadir Manual
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {assistants.map((asis, idx) => (
                    <Card key={idx} className="bg-muted/10 border-none rounded-3xl p-6 relative group border-2 border-transparent hover:border-primary/5 transition-all">
                      <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 text-destructive opacity-40 group-hover:opacity-100 transition-opacity" onClick={() => removeAssistant(idx)}>
                        <X className="h-5 w-5" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Nombre Completo</Label>
                          <Input value={asis.nombre} onChange={(e) => updateAssistant(idx, 'nombre', e.target.value)} className="bg-white border-none rounded-2xl font-bold h-12 shadow-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">RUT</Label>
                          <Input value={asis.rut} onChange={(e) => updateAssistant(idx, 'rut', e.target.value)} className="bg-white border-none rounded-2xl font-bold h-12 shadow-sm" />
                        </div>
                        <div className="col-span-full space-y-4 mt-2">
                          <SignaturePad 
                            label={`Firma de ${asis.nombre || 'Asistente'}`} 
                            onSave={(url) => updateAssistant(idx, 'firma', url)} 
                            initialValue={asis.firma}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  {assistants.length === 0 && (
                    <div className="text-center py-20 opacity-30 border-2 border-dashed border-black/10 rounded-[2.5rem] flex flex-col items-center gap-4">
                      <Users className="h-12 w-12" />
                      <p className="font-black uppercase text-xs tracking-[0.2em]">Sin asistentes registrados</p>
                      <Button onClick={addAssistant} variant="outline" className="rounded-full font-black text-[9px] uppercase px-8">Empezar Lista</Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Final Signature */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 space-y-4">
                  <h4 className="font-black uppercase text-xs text-primary mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> Cierre de Registro
                  </h4>
                  <p className="text-[11px] font-medium leading-relaxed opacity-80 italic">
                    Certifico que he realizado la charla de seguridad descrita anteriormente, cumpliendo con los objetivos establecidos 
                    y asegurando la asistencia y participación de las personas listadas.
                  </p>
                </div>

                <div className="space-y-6">
                  <SignaturePad 
                    label="Firma de quien imparte (Supervisor)" 
                    onSave={(url) => setFormData(prev => ({ ...prev, firmaSupervisor: url }))} 
                    initialValue={formData.firmaSupervisor}
                  />
                </div>

                <div className="space-y-4 pt-6 border-t border-dashed">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Email de Prevención (Para Firma Remota)</Label>
                    <Input 
                      type="email" 
                      placeholder="prevencion@empresa.com" 
                      value={formData.prevencionEmail} 
                      onChange={(e) => setFormData(prev => ({ ...prev, prevencionEmail: e.target.value }))} 
                      readOnly
                      className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner opacity-70 cursor-not-allowed" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-muted-foreground ml-1">Nombre / Departamento</Label>
                    <Input 
                      placeholder="Ej: Prevención de Riesgos" 
                      value={formData.prevencionName} 
                      onChange={(e) => setFormData(prev => ({ ...prev, prevencionName: e.target.value }))} 
                      className="h-14 bg-muted/30 border-none rounded-2xl font-bold px-6 shadow-inner" 
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="button" 
                    onClick={onSubmit} 
                    disabled={loading || !formData.firmaSupervisor || !formData.prevencionEmail}
                    className="w-full h-20 bg-primary text-white rounded-[2rem] font-black text-xl uppercase tracking-tighter shadow-xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6" />}
                    Enviar a Prevención
                  </Button>
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
              {currentStep < 3 && (
                <Button type="button" onClick={handleNext} className="h-16 flex-[1.5] rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/30 group">
                  Siguiente <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
