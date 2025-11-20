import Link from 'next/link'

export default function SystemRequirementsPage() {
  return (
    <div>
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="text-[#ffd700]">System</span>
                <span className="text-[#3b82f6]"> Requirements</span>
              </h1>
              <p className="text-[#d0d0d0] text-sm">Minimum and recommended specifications</p>
            </div>

            {/* Content */}
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 sm:p-8 shadow-2xl ring-2 ring-[#ffd700]/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Minimum Requirements */}
                <div className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-6">
                  <h2 className="text-[#ffd700] text-xl font-bold mb-4 pb-2 border-b border-[#404040]/40">
                    Minimum Requirements
                  </h2>
                  <ul className="space-y-3 text-[#d0d0d0]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">OS:</strong> Windows 7 (64-bit) or later</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Processor:</strong> Intel Core i3 or equivalent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Memory:</strong> 2 GB RAM</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Graphics:</strong> DirectX 9.0c compatible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Storage:</strong> 500 MB available space</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Network:</strong> Broadband Internet connection</span>
                    </li>
                  </ul>
                </div>

                {/* Recommended Requirements */}
                <div className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-6">
                  <h2 className="text-[#ffd700] text-xl font-bold mb-4 pb-2 border-b border-[#404040]/40">
                    Recommended Requirements
                  </h2>
                  <ul className="space-y-3 text-[#d0d0d0]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">OS:</strong> Windows 10/11 (64-bit)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Processor:</strong> Intel Core i5 or equivalent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Memory:</strong> 4 GB RAM or more</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Graphics:</strong> DirectX 11 compatible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Storage:</strong> 1 GB available space</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#3b82f6]">•</span>
                      <span><strong className="text-[#e0e0e0]">Network:</strong> Stable broadband connection</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mt-6 bg-[#1a1a1a]/90 rounded-lg border-2 border-[#404040]/60 p-5">
                <h3 className="text-[#ffd700] font-bold mb-3">Additional Notes</h3>
                <ul className="space-y-2 text-[#d0d0d0] text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6]">•</span>
                    <span>Administrator privileges may be required for installation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6]">•</span>
                    <span>Antivirus software may flag the client - this is a false positive. Add it to your exceptions list</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6]">•</span>
                    <span>Make sure your graphics drivers are up to date for optimal performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6]">•</span>
                    <span>Firewall may need to allow the client through for online play</span>
                  </li>
                </ul>
              </div>

              {/* Back Button */}
              <div className="mt-8 pt-6 border-t border-[#404040]/40">
                <Link
                  href="/download"
                  className="inline-flex items-center gap-2 text-[#d0d0d0] hover:text-[#ffd700] transition-colors"
                >
                  <span>←</span>
                  <span>Back to Download</span>
                </Link>
              </div>
            </div>
          </div>
        </main>
    </div>
  )
}

