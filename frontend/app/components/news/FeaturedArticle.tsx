export default function FeaturedArticle() {
  return (
    <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded border border-[#3a3a3a] p-6 shadow-lg">
      <h2 className="text-[#ffd700] text-xl font-bold mb-4 pb-2 border-b border-[#3a3a3a]">
        Featured Article
      </h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-[#ffd700] text-lg font-bold mb-3">
            ➤ CodexAAC Global Servers + CodexAAC Client (CAC) + Brazil Host Low Ping +
          </h3>
          <p className="text-[#d4d4d4] text-sm leading-relaxed mb-4">
            Bem-vindo ao CodexAAC! Um servidor premium de Tibia com múltiplos mundos,
            sistema de VIP, eventos exclusivos e muito mais. Nossa infraestrutura
            brasileira garante baixa latência e uma experiência de jogo fluida.
          </p>
          <p className="text-[#b0b0b0] text-sm leading-relaxed">
            Explore 11 mundos diferentes: 4 Retro-PVP, 4 Optional-PVP e 3 Open-PVP.
            Cada mundo oferece uma experiência única de jogo, adaptada ao seu estilo
            de preferência.
          </p>
        </div>
        <div className="w-full md:w-64 h-48 bg-[#151515] rounded border border-[#3a3a3a] flex items-center justify-center">
          <span className="text-[#666] text-sm">Featured Image</span>
        </div>
      </div>
    </div>
  )
}

