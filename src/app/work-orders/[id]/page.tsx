
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, User, Phone, Mail, MapPin, Building2, Hash, Calendar, ClipboardCheck, Info, Users, CreditCard, Loader2, ShieldCheck, Camera } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { generateWorkOrderPDF } from "@/lib/pdf-generator";
import { getOrderById, getTools } from "@/actions/db-actions";
import { useActionData } from "@/hooks/use-action-data";
import { useUserProfile } from "@/lib/auth-provider";
import { cn, formatFolio } from "@/lib/utils";
import { Wrench } from "lucide-react";

export default function WorkOrderView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: order, isLoading } = useActionData<any>(() => getOrderById(id), [id]);
  const { userProfile, isProfileLoading } = useUserProfile();

  const isPrivileged = userProfile?.rol_t?.toLowerCase() === 'admin' ||
    userProfile?.rol_t?.toLowerCase() === 'administrador' ||
    userProfile?.rol_t?.toLowerCase() === 'supervisor';

  const { data: allTools } = useActionData<any[]>(() => isPrivileged ? getTools() : Promise.resolve([]), [isPrivileged]);

  useEffect(() => {
    if (order && (order.status === 'Pendiente' || order.status === 'Pending')) {
      router.replace(`/work-orders/${id}/edit`);
    }
  }, [order, router, id]);

  if (isLoading || (order && (order.status === 'Pendiente' || order.status === 'Pending'))) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
      <p className="font-black tracking-widest text-xs uppercase">Cargando Orden...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-10 text-center space-y-4">
      <Info size={60} className="text-muted-foreground opacity-20" />
      <h1 className="text-xl font-black text-primary uppercase">No encontrado</h1>
      <p className="text-muted-foreground font-medium">La orden solicitada no existe o ha sido movida.</p>
      <Link href="/dashboard">
        <Button className="bg-primary rounded-xl font-bold">Volver al Dashboard</Button>
      </Link>
    </div>
  );

  const isCompleted = order.status === 'Completed' || order.status === 'Completado';

  const utilizedTools = order && allTools ? allTools.filter((t: any) =>
    (t.asignadoA === order.techName || t.asignadoA === order.techEmail) && t.estado === 'En Terreno'
  ) : [];

  return (
    <div className="min-h-screen bg-muted/20 pb-20 animate-fade-in bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <header className="bg-primary text-white backdrop-blur-2xl border-b border-white/10 sticky top-0 z-40 shadow-lg h-16 flex items-center">
        <div className="container mx-auto px-4 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="font-black text-sm md:text-lg uppercase tracking-tighter leading-tight">Visualizar Orden</h1>
              <span className="text-xs font-bold opacity-70 uppercase tracking-widest">OT {formatFolio(order.folio)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="icon" onClick={() => generateWorkOrderPDF(order)} className="bg-white text-primary hover:bg-white/90 h-10 w-10 rounded-xl shadow-lg border-none">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.print()} className="h-10 w-10 rounded-xl hidden sm:flex text-white hover:bg-white/10">
              <Printer className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-6 max-w-3xl space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
          <Badge className={cn("border-none text-xs px-4 py-1 font-black uppercase rounded-full", isCompleted ? 'bg-accent text-primary' : 'bg-primary text-white')}>
            {isCompleted ? 'FINALIZADA' : 'EN CURSO'}
          </Badge>
          <div className="text-xs text-muted-foreground flex items-center gap-2 font-bold uppercase">
            <Calendar className="h-3 w-3" /> {order.startDate ? new Date(order.startDate).toLocaleDateString() : "N/A"}
          </div>
        </div>

        <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary/5 p-6 border-b">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <User className="h-4 w-4" /> Datos del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-1">
              <p className="text-xs uppercase font-black text-muted-foreground">Empresa</p>
              <div className="flex flex-col">
                <p className="font-black text-primary text-3xl tracking-tighter uppercase leading-none mb-1">{order.clientName}</p>
                {order.clientRut && <p className="text-sm font-bold text-muted-foreground">RUT: {order.clientRut}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-xs uppercase font-black text-muted-foreground">Teléfono</p>
                  <p className="text-base font-bold">{order.clientPhone || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-xs uppercase font-black text-muted-foreground">Email</p>
                  <p className="text-base font-bold">{order.clientEmail || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-xs uppercase font-black text-muted-foreground">Sucursal / Instalación</p>
                  <p className="text-base font-bold">{order.branch || "Casa Matriz"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-1" />
                <div>
                  <p className="text-xs uppercase font-black text-muted-foreground">Dirección Central</p>
                  <p className="text-base font-bold">{order.address || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-1 opacity-60" />
                <div>
                  <p className="text-xs uppercase font-black text-muted-foreground">Dirección de la Sucursal</p>
                  <p className="text-base font-bold">{order.interventionAddress || "N/A"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isPrivileged && order.team && order.team.length > 0 && (
          <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b bg-muted/10">
              <CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2">
                <Users className="h-4 w-4" /> Equipo Técnico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {order.team.map((member: string, index: number) => (
                  <Badge key={index} className="text-xs bg-primary/10 text-primary border-none font-bold py-1.5 px-4 rounded-xl">
                    {member}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isPrivileged && utilizedTools.length > 0 && (
          <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b bg-primary/5">
              <CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Equipos Utilizados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {utilizedTools.map((tool: any) => (
                  <div key={tool.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-primary/5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Wrench size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-primary leading-tight">{tool.nombre}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase">{tool.marca} {tool.modelo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b bg-primary/5">
            <CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Especificaciones Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/20 rounded-xl border border-primary/5">
                <p className="text-xs uppercase font-black text-muted-foreground mb-1">Tipo de Trabajo</p>
                <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-xs">
                  {order.tipoTrabajo?.includes('Otro') ? order.tipoTrabajo.replace('Otro', order.tipoTrabajoOtro || 'Otro') : order.tipoTrabajo || "N/A"}
                </Badge>
              </div>
              <div className="p-4 bg-muted/20 rounded-xl border border-primary/5">
                <p className="text-xs uppercase font-black text-muted-foreground mb-1">Estado</p>
                <Badge className={cn("border-none font-bold uppercase text-xs flex justify-center text-center",
                  order.estadoTrabajo?.includes('correctamente') ? 'bg-emerald-100 text-emerald-700' :
                    order.estadoTrabajo?.includes('observaciones') ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700')}>
                  {order.estadoTrabajo || "N/A"}
                </Badge>
              </div>
            </div>

            {(order.building || order.floor) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/20 rounded-xl text-center">
                  <Building2 className="h-4 w-4 text-primary mx-auto mb-1 opacity-40" />
                  <p className="text-xs uppercase font-black text-muted-foreground">Edificio</p>
                  <p className="font-bold text-sm">{order.building || "N/A"}</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-xl text-center">
                  <Hash className="h-4 w-4 text-primary mx-auto mb-1 opacity-40" />
                  <p className="text-xs uppercase font-black text-muted-foreground">Piso</p>
                  <p className="font-bold text-sm">{order.floor || "N/A"}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs uppercase font-black text-primary tracking-widest pl-1">Descripción del Trabajo</p>
              <div className="p-5 bg-muted/10 rounded-2xl text-sm leading-relaxed border border-dashed border-primary/20 font-medium">
                {order.description || "Sin descripción."}
              </div>
            </div>

            {Array.isArray(order.detalleTecnico) && order.detalleTecnico.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase font-black text-primary tracking-widest pl-1 border-l-4 border-primary ml-1 h-4 flex items-center">Detalle Técnico</p>
                {/* Desktop Table */}
                <div className="hidden md:block border border-primary/10 rounded-2xl overflow-hidden text-sm">
                  <table className="w-full text-left">
                    <thead className="bg-primary/5 text-xs uppercase font-black text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Elemento</th>
                        <th className="px-4 py-3 text-center">Cantidad</th>
                        <th className="px-4 py-3">Observación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {order.detalleTecnico.map((item: any, idx: number) => {
                        if (!item.cantidad && !item.observacion) return null;
                        return (
                          <tr key={idx} className="bg-white hover:bg-muted/5 transition-colors">
                            <td className="px-4 py-3 font-bold text-xs">{item.elemento}</td>
                            <td className="px-4 py-3 font-black text-center text-primary">{item.cantidad || "-"}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{item.observacion || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Mobile List */}
                <div className="md:hidden space-y-3">
                  {order.detalleTecnico.map((item: any, idx: number) => {
                    if (!item.cantidad && !item.observacion) return null;
                    return (
                      <div key={idx} className="bg-muted/10 p-4 rounded-2xl border border-primary/5 flex flex-col gap-2">
                        <p className="font-black text-primary text-sm uppercase leading-tight">{item.elemento}</p>
                        <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-dashed border-primary/10">
                          <span className="text-muted-foreground">CANTIDAD: {item.cantidad || "-"}</span>
                          {item.observacion && <span className="text-muted-foreground italic truncate ml-4">{item.observacion}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {Array.isArray(order.puntosRed) && order.puntosRed.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs uppercase font-black text-primary tracking-widest pl-1 border-l-4 border-primary ml-1 h-4 flex items-center">Identificación de Puntos de Red</p>
                {/* Desktop Table */}
                <div className="hidden md:block border border-primary/10 rounded-2xl overflow-hidden text-sm overflow-x-auto">
                  <table className="w-full text-left min-w-[400px]">
                    <thead className="bg-primary/5 text-xs uppercase font-black text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-center w-20">Punto</th>
                        <th className="px-4 py-3">Ubicación</th>
                        <th className="px-4 py-3">Puerto</th>
                        <th className="px-4 py-3 w-32">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {order.puntosRed.map((punto: any, idx: number) => (
                        <tr key={idx} className="bg-white hover:bg-muted/5 transition-colors">
                          <td className="px-4 py-2 font-black text-xs text-center uppercase">{punto.id || "-"}</td>
                          <td className="px-4 py-2 font-medium text-xs">{punto.ubicacion || "-"}</td>
                          <td className="px-4 py-2 font-medium text-xs uppercase">{punto.puerto || "-"}</td>
                          <td className="px-4 py-2">
                            <Badge className={cn("border-none text-xs uppercase font-bold", punto.resultado === 'Aprobado' || punto.resultado === 'Certificado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                              {punto.resultado || "N/A"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile List */}
                <div className="md:hidden space-y-3">
                  {order.puntosRed.map((punto: any, idx: number) => (
                    <div key={idx} className="bg-muted/10 p-5 rounded-2xl border border-primary/5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary text-sm uppercase">{punto.id || "?"}</div>
                        <Badge className={cn("border-none text-xs uppercase font-black px-3 py-1", punto.resultado === 'Aprobado' || punto.resultado === 'Certificado' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white')}>
                          {punto.resultado || "N/A"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-black text-muted-foreground uppercase text-xs">Ubicación</p>
                          <p className="font-bold text-primary italic uppercase">{punto.ubicacion || "-"}</p>
                        </div>
                        <div>
                          <p className="font-black text-muted-foreground uppercase text-xs">Puerto / Pach</p>
                          <p className="font-bold text-primary uppercase">{punto.puerto || "-"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.observacionesGenerales && (
              <div className="space-y-2">
                <p className="text-xs uppercase font-black text-primary tracking-widest pl-1">Observaciones Adicionales</p>
                <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10">
                  <p className="text-sm font-medium text-muted-foreground whitespace-pre-wrap">{order.observacionesGenerales}</p>
                </div>
              </div>
            )}

            {(order.photos && (typeof order.photos === 'string' ? JSON.parse(order.photos) : order.photos).length > 0) && (
              <div className="space-y-4 pt-6 mt-6 border-t border-dashed">
                <p className="text-xs uppercase font-black text-primary tracking-widest pl-1 flex items-center gap-2">
                  <Camera className="h-3 w-3" /> Registro Fotográfico de Evidencia
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(typeof order.photos === 'string' ? JSON.parse(order.photos) : order.photos).map((photo: string, index: number) => (
                    <div
                      key={index}
                      className="group relative aspect-square rounded-3xl overflow-hidden border-4 border-white shadow-xl hover:scale-105 transition-all duration-500 cursor-pointer"
                    >
                      <Image
                        src={photo}
                        alt={`Evidencia ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-3">
                        <p className="text-xs text-white font-black uppercase tracking-widest">Ver Foto {index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-4 bg-muted/5 border-b">
              <CardTitle className="text-xs font-black text-center uppercase tracking-widest">Firma Técnico ICSA</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-xs font-bold uppercase">{order.techName || "N/A"}</p>
                <p className="text-xs text-muted-foreground">RUT: {order.techRut || "N/A"}</p>
              </div>
              <div className="relative h-32 w-full bg-muted/10 rounded-xl border border-dashed flex items-center justify-center">
                {order.techSignatureUrl ? (
                  <div className="relative w-full h-full">
                    <Image src={order.techSignatureUrl} alt="Firma Técnico" fill className="object-contain p-2" />
                  </div>
                ) : (
                  <span className="text-xs uppercase font-bold opacity-20">Pendiente</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-white rounded-2xl overflow-hidden">
            <CardHeader className="p-4 bg-accent/10 border-b">
              <CardTitle className="text-xs font-black text-center uppercase tracking-widest">Firma Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-xs font-bold uppercase">{order.clientReceiverName || "N/A"}</p>
                <p className="text-xs text-muted-foreground">RUT: {order.clientReceiverRut || "N/A"}</p>
                <p className="text-xs text-muted-foreground italic truncate max-w-[150px]">{order.clientReceiverEmail || ""}</p>
              </div>
              <div className="relative h-32 w-full bg-muted/10 rounded-xl border border-dashed flex items-center justify-center">
                {order.clientSignatureUrl ? (
                  <div className="relative w-full h-full">
                    <Image src={order.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain p-2" />
                  </div>
                ) : (
                  <span className="text-xs uppercase font-bold opacity-20">Pendiente</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-12 text-center pb-12 px-6">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed italic opacity-60">
            La presente Orden de Trabajo y su firma electrónica se encuentran reguladas bajo la Ley 19.799, siendo plenamente válidas como Firma Electrónica Simple para todos los efectos legales.
          </p>
          <div className="flex flex-col items-center opacity-30">
            <span className="font-black text-lg tracking-tighter text-primary">ICSA</span>
            <span className="text-[7px] font-bold uppercase tracking-[0.3em] mt-1">ingeniería comunicaciones S.A.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
