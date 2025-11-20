export default function VideoSection() {
  return (
    <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded border border-[#3a3a3a] p-6 shadow-lg">
      <h2 className="text-[#ffd700] text-xl font-bold mb-4 pb-2 border-b border-[#3a3a3a]">
        Winter Update
      </h2>
      
      <div className="aspect-video bg-[#0a0a0a] rounded border border-[#3a3a3a] mb-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">▶️</div>
            <p className="text-[#d4d4d4] text-lg font-semibold mb-2">
              NOVIDADES DO WINTER UPDATE
            </p>
            <p className="text-[#666] text-sm">YouTube Video Player</p>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded text-white text-xs">
          YouTube
        </div>
      </div>
      
      <div className="mb-4">
        <a
          href="#"
          className="inline-block text-[#ff0000] hover:text-[#cc0000] text-sm font-semibold transition-colors"
        >
          Assistir no YouTube
        </a>
      </div>
      
      <div className="text-[#d4d4d4] text-sm leading-relaxed space-y-3">
        <p>
          O Winter Update trouxe funcionalidade multi-mundo, permitindo que você
          gerencie múltiplos personagens em diferentes mundos simultaneamente.
        </p>
        <p>
          Além disso, várias cidades foram completamente reformuladas, começando
          por Thais, que agora oferece uma experiência visual e funcional totalmente
          nova e aprimorada.
        </p>
      </div>
    </div>
  )
}

