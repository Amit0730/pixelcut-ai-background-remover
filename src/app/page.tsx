import { ImageEditor } from "@/components/ImageEditor";
import { Scissors } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">PixelCut AI</span>
          </div>
          <nav>
            <a href="https://github.com/amitk/pixelcut-ai-background-remover" target="_blank" rel="noreferrer" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Remove image backgrounds in seconds.
          </h1>
          <p className="text-lg text-zinc-400">
            Professional-grade background removal powered by AI. 
            Free, fast, and processes entirely in your browser.
          </p>
        </div>

        <ImageEditor />
        
      </main>

      <footer className="border-t border-zinc-900 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} PixelCut AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
