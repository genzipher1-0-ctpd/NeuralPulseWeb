import Link from "next/link";
import { User, Activity, ArrowLeft } from "lucide-react";

export default function PatientPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden text-center">
            <div className="absolute top-6 left-6 z-20">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-mono text-sm">BACK</span>
                </Link>
            </div>

            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow" />
            </div>

            <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center mb-6 animate-float">
                <User className="w-12 h-12 text-secondary" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">PATIENT VAULT</h1>
            <p className="text-secondary/80 font-mono text-sm tracking-widest uppercase mb-8">Identity Active</p>

            <div className="glass-card p-6 rounded-xl max-w-md w-full border border-secondary/20">
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                    <Activity className="w-5 h-5 animate-pulse text-secondary" />
                    <span>Broadcasting health shards to mesh...</span>
                </div>
            </div>
        </div>
    );
}
