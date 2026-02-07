import Link from "next/link";
import { User, Stethoscope, Activity, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <div className="z-10 flex flex-col items-center text-center max-w-4xl w-full">
        {/* Header */}
        <div className="mb-16 animate-float">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-xs font-mono tracking-[0.3em] text-primary/80 uppercase">Decentralized Mesh Network</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            NEURAL-PULSE
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The 2035 Master Spec. Resilient healthcare for a disconnected world.
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">

          {/* Patient Card */}
          <Link href="/patient" className="group">
            <div className="glass-card p-8 rounded-2xl h-full transition-all duration-300 hover:bg-white/5 hover:border-secondary/50 hover:shadow-[0_0_30px_rgba(255,0,85,0.2)] flex flex-col items-center text-center border border-white/5">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-all">
                <User className="w-10 h-10 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-secondary transition-colors">Patient</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Broadcast your critical medical data securely to the mesh.
              </p>
              <div className="mt-auto w-full py-2 px-4 rounded-full border border-secondary/30 text-secondary text-sm font-mono group-hover:bg-secondary group-hover:text-black transition-all">
                INITIALIZE IDENTITY
              </div>
            </div>
          </Link>

          {/* Doctor Card */}
          <Link href="/doctor" className="group">
            <div className="glass-card p-8 rounded-2xl h-full transition-all duration-300 hover:bg-white/5 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] flex flex-col items-center text-center border border-white/5">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-all">
                <Stethoscope className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-primary transition-colors">Doctor</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Scan for distressed signals and decrypt patient shards.
              </p>
              <div className="mt-auto w-full py-2 px-4 rounded-full border border-primary/30 text-primary text-sm font-mono group-hover:bg-primary group-hover:text-black transition-all">
                ACCESS RADAR HUD
              </div>
            </div>
          </Link>

        </div>

        {/* Footer Status */}
        <div className="mt-20 flex items-center gap-6 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MESH STATUS: ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>AES-256</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">100%</span>
          </div>
        </div>
      </div>
    </main>
  );
}
