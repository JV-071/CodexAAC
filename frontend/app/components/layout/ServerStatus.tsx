export default function ServerStatus() {
  const isOnline = false // You can change this to true when the server is online
  const playersOnline = 0 // You can connect this with real data

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-4 sm:p-6 shadow-xl">
      <h2 className="text-[#ffd700] text-xl sm:text-2xl font-bold mb-4 sm:mb-6 pb-3 border-b border-[#404040]/40">Server Status</h2>
      
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[#e0e0e0] text-sm font-medium">Status:</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></div>
            <span className={`text-sm font-semibold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-[#404040]/40">
          <span className="text-[#e0e0e0] text-sm font-medium">Players Online:</span>
          <span className="text-[#00ff88] font-bold text-base sm:text-lg">{playersOnline.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

