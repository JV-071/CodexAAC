'use client'

import { useState } from 'react'

interface ChangeLogEntry {
  date: string
  category: string
  title: string
  description: string
  isImportant?: boolean
}

export default function ChangeLogs() {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const changeLogs: ChangeLogEntry[] = [
    {
      date: 'Nov 18 2025',
      category: '[Site]',
      title: 'Site Update',
      description: 'Queridos jogadores, é comum está sendo redirecionado para o link CodexAAC. Eternia...',
      isImportant: true,
    },
    {
      date: 'Oct 31 2025',
      category: '[Resgate de Varinha]',
      title: 'Wand Rescue',
      description: 'Melhore a segurança de sua conta e resgate 2x Durable Exercises Weapons, para sa...',
    },
    {
      date: 'Oct 31 2025',
      category: '[Yasir]',
      title: 'Yasir Update',
      description: 'Os itens negociados com o Yasir foram atualizados.',
    },
    {
      date: 'Oct 31 2025',
      category: '[NPCs]',
      title: 'NPC Behavior',
      description: 'Ao atacar um NPC, o personagem agora iniciará um diálogo com ele.',
    },
    {
      date: 'Oct 31 2025',
      category: '[Imbuements]',
      title: 'Imbuements Update',
      description: 'Agora é possivel imbuir alguns helmets de Knight com Epiphany igual o Global.',
    },
    {
      date: 'Oct 04 2025',
      category: '[Otimizacao e Correcao]',
      title: 'Optimization and Fixes',
      description: 'Hoje aplicamos uma importante otimização que reduziu o LAG relatado por muitos j...',
      isImportant: true,
    },
    {
      date: 'Sep 30 2025',
      category: '[Summer Update 2025]',
      title: 'Summer Update 2025',
      description: 'O Summer Update 2025 e muitas outras novidades está chegando! Confira nossas ...',
    },
    {
      date: 'Sep 25 2025',
      category: '[Lags e Kicks]',
      title: 'Lags and Kicks',
      description: 'Estamos cientes dos lags e kicks que vêm ocorrendo. O problema não é específico do servidor..',
      isImportant: true,
    },
  ]

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-4 sm:p-6 shadow-xl mb-6">
      <h2 className="text-[#ffd700] text-xl sm:text-2xl font-bold mb-4 sm:mb-6 pb-3 border-b border-[#404040]/40 flex items-center gap-2">
        <span>▲</span> CHANGE LOGS
      </h2>
      
      <div className="space-y-3">
        {changeLogs.slice(0, 5).map((entry, index) => (
          <div
            key={index}
            className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-4 hover:border-[#ffd700]/60 hover:bg-[#252525]/90 transition-all duration-200 shadow-md"
          >
            <div className="flex items-start gap-3">
              {entry.isImportant && (
                <div className="text-yellow-500 text-lg flex-shrink-0 mt-0.5">⚠️</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#888] text-xs">{entry.date}</span>
                    <span className="text-[#ffd700] text-xs font-semibold">{entry.category}</span>
                    <span className="text-[#d0d0d0] text-sm font-medium">{entry.title}</span>
                  </div>
                  <button
                    onClick={() => toggleExpand(index)}
                    className="text-[#666] hover:text-[#ffd700] transition-colors flex-shrink-0"
                    aria-label={expandedItems.has(index) ? 'Collapse' : 'Expand'}
                  >
                    {expandedItems.has(index) ? '−' : '+'}
                  </button>
                </div>
                <p className="text-[#d0d0d0] text-xs sm:text-sm leading-relaxed">
                  {expandedItems.has(index) ? entry.description : `${entry.description.substring(0, 80)}...`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

