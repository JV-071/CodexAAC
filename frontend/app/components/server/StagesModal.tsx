'use client'

import { StagesConfig } from '../../services/server'

interface StagesModalProps {
  stages: StagesConfig | null
  loading: boolean
  onClose: () => void
}

export default function StagesModal({ stages, loading, onClose }: StagesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#252525] rounded-xl border-2 border-[#505050]/70 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#252525] border-b border-[#404040]/40 p-6 flex justify-between items-center">
          <h2 className="text-[#ffd700] text-2xl font-bold">Rate Stages</h2>
          <button
            onClick={onClose}
            className="text-[#d0d0d0] hover:text-white text-2xl font-bold transition-colors"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-[#ffd700] text-xl font-bold mb-4">Loading stages...</div>
            </div>
          ) : stages ? (
            <div className="space-y-8">
              {/* Experience Stages */}
              {stages.experienceStages.length > 0 && (
                <div>
                  <h3 className="text-[#3b82f6] text-xl font-bold mb-4">📈 Experience Stages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stages.experienceStages.map((stage, idx) => (
                      <StageCard key={idx} stage={stage} />
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Stages */}
              {stages.skillsStages.length > 0 && (
                <div>
                  <h3 className="text-[#3b82f6] text-xl font-bold mb-4">⚔️ Skills Stages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stages.skillsStages.map((stage, idx) => (
                      <StageCard key={idx} stage={stage} />
                    ))}
                  </div>
                </div>
              )}

              {/* Magic Level Stages */}
              {stages.magicLevelStages.length > 0 && (
                <div>
                  <h3 className="text-[#3b82f6] text-xl font-bold mb-4">✨ Magic Level Stages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stages.magicLevelStages.map((stage, idx) => (
                      <StageCard key={idx} stage={stage} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-[#d0d0d0]">No stages data available</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface StageCardProps {
  stage: { minLevel: number; maxLevel?: number; multiplier: number }
}

function StageCard({ stage }: StageCardProps) {
  const levelRange = stage.maxLevel 
    ? `Level ${stage.minLevel} - ${stage.maxLevel}`
    : `Level ${stage.minLevel}+`

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#404040]/60 p-4">
      <div className="text-[#d0d0d0] text-sm mb-2">{levelRange}</div>
      <div className="text-[#ffd700] font-bold text-2xl">{stage.multiplier}x</div>
    </div>
  )
}

