import Link from "next/link";
import { User, Stethoscope, Activity, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-background text-foreground">

      <div className="z-10 flex flex-col items-center text-center max-w-4xl w-full">
        {/* Header */}
        <div className="mb-16 animate-float">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-xs font-mono tracking-[0.3em] text-primary uppercase">Decentralized Mesh Network</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-primary">
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
            <div className="glass-card p-8 rounded-2xl h-full transition-all duration-300 hover:shadow-lg hover:border-black/50 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 group-hover:scale-105 transition-all">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-primary">Patient</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Broadcast your critical medical data securely to the mesh.
              </p>
              <div className="mt-auto w-full py-2 px-4 rounded-full border border-black/30 text-primary text-sm font-mono group-hover:bg-primary group-hover:text-white transition-all">
                INITIALIZE IDENTITY
              </div>
            </div>
          </Link>


          {/* Doctor Card */}
          <Link href="/doctor" className="group">
            <div className="glass-card p-8 rounded-2xl h-full transition-all duration-300 hover:shadow-lg hover:border-black/50 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 group-hover:scale-105 transition-all">
                <Stethoscope className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-primary">Doctor</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Scan for distressed signals and decrypt patient shards.
              </p>
              <div className="mt-auto w-full py-2 px-4 rounded-full border border-black/30 text-primary text-sm font-mono group-hover:bg-primary group-hover:text-white transition-all">
                ACCESS RADAR HUD
              </div>
            </div>
          </Link>
        </div>

        {/* Auditor Card */}
        <div className="w-full max-w-2xl px-4 mt-6">
          <Link href="/auditor" className="group block">
            <div className="glass-card p-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:border-black/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-black/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary text-left">COMPLIANCE AUDITOR</h2>
                  <p className="text-xs text-muted-foreground font-mono text-left">ACCESS IMMUTABLE LOGS</p>
                </div>
              </div>
              <div className="py-2 px-4 rounded-full border border-black/30 text-primary text-xs font-mono group-hover:bg-primary group-hover:text-white transition-all hidden sm:block">
                ENTER PORTAL
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
