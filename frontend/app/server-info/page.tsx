'use client'

import { useState, useEffect } from 'react'
import { serverService, ServerConfig, stagesService, StagesConfig } from '../services/server'
import { useServerName } from '../hooks/useServerName'
import StagesModal from '../components/server/StagesModal'

export default function ServerInfoPage() {
  const serverName = useServerName()
  const [config, setConfig] = useState<ServerConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStagesModal, setShowStagesModal] = useState(false)
  const [stages, setStages] = useState<StagesConfig | null>(null)
  const [stagesLoading, setStagesLoading] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true)
        const serverConfig = await serverService.getConfig()
        setConfig(serverConfig)
        setError(null)
      } catch (err) {
        setError('Failed to load server information')
        console.error('Error fetching server config:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#151515] to-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-[#ffd700] text-2xl font-bold mb-4">Loading server information...</div>
            <div className="text-[#d0d0d0]">Please wait</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#151515] to-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-red-500/70 p-6 shadow-2xl">
            <h2 className="text-red-400 text-xl font-bold mb-4">Error</h2>
            <p className="text-[#d0d0d0]">{error || 'Failed to load server information'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#151515] to-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-[#ffd700]">{serverName}</span>
            <span className="text-[#3b82f6]"> Server Information</span>
          </h1>
          <p className="text-[#d0d0d0] text-sm">Complete server configuration and rates</p>
        </div>

        {/* Server Rates Section - Only show if rateUseStages is false */}
        {!config.rateUseStages && (
          <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl ring-2 ring-[#ffd700]/10 mb-6">
            <h2 className="text-[#ffd700] text-2xl font-bold mb-6 pb-3 border-b border-[#404040]/40">
              ⚡ Server Rates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <RateCard
              title="Experience Rate"
              value={config.rateExp}
              icon="📈"
              description="Multiplier for experience gained"
            />
            <RateCard
              title="Skill Rate"
              value={config.rateSkill}
              icon="⚔️"
              description="Multiplier for skill advancement"
            />
            <RateCard
              title="Magic Rate"
              value={config.rateMagic}
              icon="✨"
              description="Multiplier for magic level advancement"
            />
            <RateCard
              title="Loot Rate"
              value={config.rateLoot}
              icon="💰"
              description="Multiplier for item drop rates"
            />
            <RateCard
              title="Spawn Rate"
              value={config.rateSpawn}
              icon="👹"
              description="Multiplier for monster spawn rates"
            />
            </div>
          </div>
        )}

        {/* Show Rates Button - Only show if rateUseStages is true */}
        {config.rateUseStages && (
          <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl ring-2 ring-[#ffd700]/10 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-[#ffd700] text-2xl font-bold mb-2">
                  ⚡ Server Rates
                </h2>
                <p className="text-[#d0d0d0] text-sm">Rates are configured using stages system</p>
              </div>
              <button
                onClick={async () => {
                  setShowStagesModal(true)
                  if (!stages) {
                    setStagesLoading(true)
                    try {
                      const stagesData = await stagesService.getStages()
                      setStages(stagesData)
                    } catch (err) {
                      console.error('Error fetching stages:', err)
                    } finally {
                      setStagesLoading(false)
                    }
                  }
                }}
                className="px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-lg transition-colors"
              >
                Show Rates
              </button>
            </div>
          </div>
        )}

        {/* PvP Settings Section */}
        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl ring-2 ring-[#ffd700]/10 mb-6">
          <h2 className="text-[#ffd700] text-2xl font-bold mb-6 pb-3 border-b border-[#404040]/40">
            ⚔️ PvP Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Basic PvP Info */}
            <div className="space-y-3">
              <InfoRow label="Protection Level" value={config.protectionLevel || 'N/A'} />
              <InfoRow label="Low Level Bonus Exp" value={config.lowLevelBonusExp ? `Works up to level ${config.lowLevelBonusExp}` : 'N/A'} />
            </div>
            
            {/* Skull Durations */}
            <div className="space-y-3">
              <InfoRow label="Frag duration" value={config.fragDuration ? `${config.fragDuration} hours` : 'N/A'} />
              <InfoRow label="Red Skull duration" value={config.redSkullDuration ? `${config.redSkullDuration} days` : 'N/A'} />
              <InfoRow label="Black Skull duration" value={config.blackSkullDuration ? `${config.blackSkullDuration} days` : 'N/A'} />
            </div>
          </div>

          {/* Kills to Red Skull */}
          <div className="mb-6">
            <h3 className="text-[#ffd700] text-lg font-bold mb-3">Kills to Red Skull</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] rounded-lg border border-[#404040]/60 p-3">
                <div className="text-[#d0d0d0] text-sm mb-1">Daily</div>
                <div className="text-[#ffd700] font-bold text-xl">{config.dayKillsToRedSkull || 'N/A'}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg border border-[#404040]/60 p-3">
                <div className="text-[#d0d0d0] text-sm mb-1">Weekly</div>
                <div className="text-[#ffd700] font-bold text-xl">{config.weekKillsToRedSkull || 'N/A'}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg border border-[#404040]/60 p-3">
                <div className="text-[#d0d0d0] text-sm mb-1">Monthly</div>
                <div className="text-[#ffd700] font-bold text-xl">{config.monthKillsToRedSkull || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* House Commands Section */}
        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl ring-2 ring-[#ffd700]/10 mb-6">
          <h2 className="text-[#ffd700] text-2xl font-bold mb-6 pb-3 border-b border-[#404040]/40">
            🏠 House Commands
          </h2>
          <div className="space-y-4">
            <CommandRow
              command="aleta sio"
              description="Opens the list of invited characters to enter your house"
            />
            <CommandRow
              command="aleta som"
              description="Opens the list of sub-owners in your house"
            />
            <CommandRow
              command="aleta grav"
              description="Use facing the door you want to grant access to the player and add them to the list"
            />
            <CommandRow
              command="alana sio"
              description='Add the name of who you want to expel from the house ("nickname")'
            />
          </div>
        </div>

        {/* Stages Modal */}
        {showStagesModal && (
          <StagesModal
            stages={stages}
            loading={stagesLoading}
            onClose={() => setShowStagesModal(false)}
          />
        )}
      </div>
    </div>
  )
}

interface RateCardProps {
  title: string
  value: number
  icon: string
  description: string
}

function RateCard({ title, value, icon, description }: RateCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#404040]/60 p-4 hover:border-[#ffd700]/50 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-[#ffd700] font-bold text-lg">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-[#3b82f6] mb-2">{value}x</div>
      <p className="text-[#a0a0a0] text-sm">{description}</p>
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string | number
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#404040]/30 last:border-b-0">
      <span className="text-[#d0d0d0] font-medium">{label}:</span>
      <span className="text-[#ffd700] font-semibold">{value}</span>
    </div>
  )
}

interface CommandRowProps {
  command: string
  description: string
}

function CommandRow({ command, description }: CommandRowProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#404040]/60 p-4 hover:border-[#ffd700]/50 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <code className="text-[#3b82f6] font-mono font-bold text-lg">{command}</code>
        <p className="text-[#d0d0d0] text-sm sm:text-base">{description}</p>
      </div>
    </div>
  )
}




