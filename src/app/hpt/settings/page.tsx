"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Plus, ShieldCheck, Loader2, Edit2, Check, X, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/lib/auth-provider";
import { getHPTQuestions, updateHPTQuestion, addHPTQuestion } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HPTSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, isProfileLoading } = useUserProfile();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [isAdding, setIsAdding] = useState<string | null>(null); // category name
  const [newLabel, setNewLabel] = useState("");

  const { data: questions, isLoading, refetch } = useActionData<any[]>(() => getHPTQuestions(), []);

  const isAdminOrPrevencionista = userProfile?.rol_t?.toLowerCase() === 'admin' || 
    userProfile?.rol_t?.toLowerCase() === 'administrador' ||
    userProfile?.rol_t?.toLowerCase() === 'prevencionista' ||
    userProfile?.rol_t?.toLowerCase() === 'prevenc';

  if (!isProfileLoading && userProfile && !isAdminOrPrevencionista) {
    router.replace('/hpt');
    return null;
  }

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, any[]> = {
      recursos: [],
      riesgos: [],
      medidas: [],
      epp: []
    };
    (questions || []).forEach(q => {
      if (groups[q.category]) groups[q.category].push(q);
    });
    return groups;
  }, [questions]);

  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setEditLabel(q.label);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateHPTQuestion(id, { label: editLabel });
      toast({ title: "Cambios guardados", description: "La pregunta ha sido actualizada." });
      setEditingId(null);
      refetch();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleToggleActive = async (q: any) => {
    try {
      await updateHPTQuestion(q.id, { active: !q.active });
      toast({ title: q.active ? "Pregunta desactivada" : "Pregunta activada", description: "Se ha actualizado el estado." });
      refetch();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleAddQuestion = async (category: string) => {
    if (!newLabel) return;
    try {
      const itemKey = newLabel.toLowerCase().replace(/\s+/g, '_').substring(0, 20) + '_' + Date.now().toString().slice(-4);
      const nextOrder = (groupedQuestions[category]?.length || 0) + 1;
      
      await addHPTQuestion({
        category,
        item_key: itemKey,
        label: newLabel,
        order_index: nextOrder,
        active: true
      });
      
      toast({ title: "Pregunta añadida", description: "El nuevo item ya está disponible en el formulario." });
      setNewLabel("");
      setIsAdding(null);
      refetch();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="font-black tracking-tighter text-xl uppercase">Cargando Configuración...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed animate-fade-in">
      <header className="bg-primary text-white backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2">
            <Link href="/hpt">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-white">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="font-black text-lg uppercase tracking-tighter leading-tight">Configuración de HPT</h1>
              <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none">Gestión de Items y Preguntas</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-5xl">
        <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary/5 p-8 border-b border-black/5">
            <CardTitle className="text-xl flex items-center gap-3 uppercase font-black tracking-tighter text-primary">
              <ShieldCheck className="h-7 w-7" /> Panel de Control de HPT
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase text-muted-foreground">
              Como {userProfile?.rol_t}, usted puede modificar las preguntas que aparecen en cada paso del formulario HPT.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue="recursos" className="w-full">
              <TabsList className="grid grid-cols-4 h-14 bg-muted/30 rounded-2xl p-1 mb-8">
                <TabsTrigger value="recursos" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Recursos</TabsTrigger>
                <TabsTrigger value="riesgos" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Riesgos</TabsTrigger>
                <TabsTrigger value="medidas" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Medidas</TabsTrigger>
                <TabsTrigger value="epp" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">EPP</TabsTrigger>
              </TabsList>

              {Object.keys(groupedQuestions).map((cat) => (
                <TabsContent key={cat} value={cat} className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black uppercase text-primary text-sm tracking-tighter">Items de {cat.toUpperCase()}</h3>
                    <Button 
                      onClick={() => setIsAdding(cat)} 
                      disabled={!!isAdding}
                      className="bg-primary hover:bg-primary/90 rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Añadir Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {isAdding === cat && (
                      <div className="flex gap-2 p-4 bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl animate-in slide-in-from-top-2">
                        <Input 
                          placeholder="Nueva pregunta o item..." 
                          value={newLabel} 
                          onChange={(e) => setNewLabel(e.target.value)}
                          className="flex-1 h-12 bg-white border-none rounded-xl font-bold shadow-sm"
                        />
                        <Button onClick={() => handleAddQuestion(cat)} className="bg-primary text-white h-12 rounded-xl border-none shadow-lg px-6"><Check size={20} /></Button>
                        <Button onClick={() => setIsAdding(null)} variant="ghost" className="h-12 w-12 rounded-xl"><X size={20} /></Button>
                      </div>
                    )}

                    {(groupedQuestions[cat] || []).length === 0 && !isAdding && (
                      <div className="text-center py-10 opacity-30 italic font-bold">No hay items configurados para esta categoría.</div>
                    )}

                    {groupedQuestions[cat].map((q) => (
                      <div key={q.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${q.active ? 'bg-white border-black/5 hover:border-primary/20' : 'bg-muted/30 border-dashed opacity-60'}`}>
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-black text-xs text-muted-foreground shrink-0">
                          {q.order_index}
                        </div>
                        
                        <div className="flex-1">
                          {editingId === q.id ? (
                            <div className="flex gap-2">
                              <Input 
                                value={editLabel} 
                                onChange={(e) => setEditLabel(e.target.value)}
                                className="h-10 bg-muted/30 border-none rounded-lg font-bold"
                              />
                              <Button onClick={() => handleSaveEdit(q.id)} variant="ghost" size="icon" className="h-10 w-10 text-primary"><Check size={18} /></Button>
                              <Button onClick={() => setEditingId(null)} variant="ghost" size="icon" className="h-10 w-10 text-destructive"><X size={18} /></Button>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-bold text-xs">{q.label}</span>
                              <span className="text-[8px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">{q.item_key}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(q)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleToggleActive(q)}
                            className={`h-8 w-8 rounded-lg transition-colors ${q.active ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                          >
                            {q.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex gap-4 items-start">
          <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
          <div className="space-y-1">
            <h4 className="font-black text-xs text-amber-900 uppercase">Aviso de Seguridad</h4>
            <p className="text-[10px] font-medium text-amber-800 leading-relaxed italic">
              Al modificar estas preguntas, los cambios afectarán a todos los nuevos HPT que se creen a partir de este momento. 
              Los documentos existentes conservarán sus datos originales para fines de auditoría.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
