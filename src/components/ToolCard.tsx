"use client";

import React from "react";
import Image from "next/image";
import { Wrench, UserRound, Trash2, CheckCircle, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  tool: any;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onReturn?: (tool: any) => void;
  onSave?: (data: any) => void;
  onEdit?: (tool: any) => void;
  onDelete?: (id: string, type: string) => void;
  isAdmin: boolean;
  userIdentifier: string;
  isAvailableSection?: boolean;
}

export const ToolCard = React.memo(({
  tool,
  isSelected,
  onToggle,
  onReturn,
  onSave,
  onEdit,
  onDelete,
  isAdmin,
  userIdentifier,
  isAvailableSection = false
}: ToolCardProps) => {
  const handleToggle = (e: React.MouseEvent) => {
    // Prevent toggle if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    onToggle(tool.id);
  };

  const isMyTool = tool.asignadoA === userIdentifier && tool.estado === 'En Terreno';
  const isAvailable = tool.estado === 'Disponible';

  // Determine if this specific card should be clickable for selection
  const canSelect = isAvailableSection ? isAvailable : isMyTool;

  return (
    <Card 
      onClick={canSelect ? handleToggle : undefined}
      className={cn(
        "group h-full transition-all rounded-2xl overflow-hidden relative border-2",
        canSelect ? "cursor-pointer" : "cursor-default",
        isSelected 
          ? (isAvailableSection ? "border-accent shadow-xl shadow-accent/10 ring-4 ring-accent/5" : "border-primary shadow-lg ring-4 ring-primary/5")
          : "border-white shadow-sm hover:shadow-md bg-white/80 backdrop-blur-xl"
      )}
    >
      {canSelect && (
        <div className={cn(
          "absolute top-4 right-4 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
          isSelected 
            ? (isAvailableSection ? "bg-accent border-accent text-primary" : "bg-primary border-primary text-white")
            : "bg-white/50 border-primary/20 text-transparent"
        )}>
          {isSelected ? <CheckCircle size={14} /> : <CheckCircle size={14} />}
        </div>
      )}

      <CardContent className="p-4 md:p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <Badge className={cn(
            "text-[9px] font-black uppercase px-2 py-0.5 border-none shadow-sm",
            isAvailable ? "bg-accent text-primary" : "bg-destructive text-white"
          )}>
            {tool.estado}
          </Badge>
          <span className="text-[9px] font-black uppercase text-primary/40 tracking-widest truncate max-w-[100px]">
            {tool.categoria}
          </span>
        </div>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-4 bg-primary/5 group-hover:scale-[1.01] transition-transform">
          {tool.imageUrl ? (
            <Image src={tool.imageUrl} alt={tool.nombre} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/20">
              <Wrench size={32} />
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-1">
            {tool.codigoInterno && (
              <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black px-1 py-0 rounded-md bg-primary/5 uppercase">
                {tool.codigoInterno}
              </Badge>
            )}
            <h3 className="font-black text-primary text-lg leading-none uppercase tracking-tighter line-clamp-1">
              {tool.nombre}
            </h3>
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
            {tool.marca} {tool.modelo}
          </p>
          
          {tool.descripcion && (
            <p className="text-[10px] text-primary/60 line-clamp-2 leading-tight mb-4 italic border-l-2 border-primary/10 pl-3">
              {tool.descripcion}
            </p>
          )}

          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground mb-4 mt-auto">
            <UserRound size={14} className="text-primary/40 shrink-0" />
            <span className="truncate">Asignado: {tool.asignadoA || 'Sin asignar'}</span>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex gap-2 w-full">
              {isAvailable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave?.({ ...tool, estado: 'En Terreno', asignadoA: userIdentifier });
                  }}
                  className="flex-1 h-9 rounded-xl bg-accent text-primary font-black text-[10px] uppercase hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
                >
                  Elegir Herramienta
                </Button>
              ) : isMyTool ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReturn?.(tool);
                  }}
                  className="flex-1 h-9 rounded-xl bg-primary text-white font-black text-[10px] uppercase hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                >
                  Devolver Equipo
                </Button>
              ) : !isAdmin && (
                <div className="flex-1 h-9 rounded-xl bg-muted/20 flex items-center justify-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No Disponible</span>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="flex gap-2 w-full">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(tool);
                  }} 
                  className="flex-1 h-9 rounded-xl bg-primary/5 text-primary font-black text-[10px] uppercase hover:bg-primary hover:text-white transition-all"
                >
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(tool.id, 'herramientas');
                  }} 
                  className="h-9 w-9 rounded-xl bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to only re-render if essential props change
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.tool.updatedAt === nextProps.tool.updatedAt &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.userIdentifier === nextProps.userIdentifier
  );
});

ToolCard.displayName = "ToolCard";
