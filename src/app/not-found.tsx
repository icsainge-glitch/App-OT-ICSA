import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary p-6 text-center">
            <h2 className="text-4xl font-black uppercase mb-4">Página no encontrada</h2>
            <p className="text-muted-foreground mb-8">La página que buscas no existe o ha sido movida.</p>
            <Link href="/">
                <Button className="font-bold text-lg h-12 px-8 rounded-xl uppercase">Volver al Inicio</Button>
            </Link>
        </div>
    );
}
