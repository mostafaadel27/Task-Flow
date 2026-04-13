'use client'

import React, { useMemo } from 'react'
import { useActivityLogs, ActivityLog } from '@/hooks/useActivityLogs'
import { Loader2, Zap, Clock, User, Clipboard, Trash2, Edit3, ArrowRight } from 'lucide-react'

interface ActivityTimelineProps {
  entityId?: string
  entityType?: string
  workspaceId?: string | null
}

const ACTION_TYPES = [
  { id: 'all', label: 'All Operations' },
  { id: 'project_created', label: 'New Project' },
  { id: 'project_completed', label: 'Mission Accomplished' },
  { id: 'project_deleted', label: 'Purged Project' },
  { id: 'user_joined', label: 'New Access Node (Join)' },
  { id: 'task_created', label: 'Inbound Tasks' },
  { id: 'status_changed', label: 'Progress Shifting' },
]

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'JUST NOW'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}M AGO`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}H AGO`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}D AGO`
  
  return date.toLocaleDateString()
}

const getActionIcon = (type: string) => {
  if (type === 'project_created') return <Zap className="w-3 h-3 text-amber-500" />
  if (type === 'project_completed') return <CheckCircle2 className="w-3 h-3 text-emerald-500" />
  if (type === 'project_deleted') return <Trash2 className="w-3 h-3 text-red-500" />
  if (type === 'user_joined') return <UserPlus className="w-3 h-3 text-emerald-500" />
  if (type === 'task_created') return <Clipboard className="w-3 h-3 text-sky-500" />
  if (type === 'status_changed' || type === 'task_completed') return <ArrowRight className="w-3 h-3 text-blue-500" />
  if (type.includes('deleted')) return <Trash2 className="w-3 h-3 text-red-500" />
  if (type.includes('assigned')) return <User className="w-3 h-3 text-purple-500" />
  return <Edit3 className="w-3 h-3 text-muted-foreground" />
}

import { UserPlus, Calendar, Filter, Users } from 'lucide-react'
import { useState } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'

export function ActivityTimeline({ entityId, entityType, workspaceId }: ActivityTimelineProps) {
  const [filterType, setFilterType] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [filterUserId, setFilterUserId] = useState('all')

  const { members } = useWorkspace(workspaceId || '')
  
  const { logs, isLoading } = useActivityLogs(entityId, entityType, workspaceId, {
    type: filterType,
    date: filterDate,
    userId: filterUserId
  })

  const groupedLogs = useMemo(() => {
    if (!logs) return []
    
    const groups: { title: string, items: ActivityLog[] }[] = []
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    logs.forEach(log => {
      const date = new Date(log.created_at).toDateString()
      let title = date === today ? 'TODAY' : date === yesterday ? 'YESTERDAY' : date.toUpperCase()
      
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.title === title) {
        lastGroup.items.push(log)
      } else {
        groups.push({ title, items: [log] })
      }
    })
    
    return groups
  }, [logs])

  return (
    <div className="space-y-12">
      {/* Filters UI */}
      {!entityId && (
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-8 pb-10 border-b border-border/20">
          <div className="flex-1 space-y-3">
            <label className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Logical Sector (Type)
            </label>
            <div className="flex flex-wrap gap-2 text-primary/80">
              {ACTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={`px-3 py-2 text-[10px] font-mono border transition-all uppercase tracking-[0.2em] font-bold ${
                    filterType === type.id 
                      ? 'bg-foreground text-background border-foreground shadow-[3px_3px_0px_rgba(255,255,255,0.1)]' 
                      : 'bg-muted/5 border-border/50 text-muted-foreground hover:border-foreground/50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 space-y-3">
              <label className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Personnel (Member)
              </label>
              <select 
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="w-full h-10 bg-muted/10 border border-border/50 text-[10px] font-mono uppercase tracking-widest px-3 focus:border-primary outline-none focus:bg-background transition-all appearance-none cursor-pointer"
              >
                <option value="all">ALL DEPLOYED STAFF</option>
                {members?.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user?.name || m.user?.email || "UNKNOWN NODE"} ({(m.role || 'MEMBER').toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-56 space-y-3">
              <label className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Temporal Date
              </label>
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full h-10 bg-muted/10 border border-border/50 text-[10px] font-mono uppercase tracking-widest px-3 focus:border-primary outline-none focus:bg-background transition-all"
              />
            </div>
          </div>

          {(filterType !== 'all' || filterDate || filterUserId !== 'all') && (
            <button 
              onClick={() => { setFilterType('all'); setFilterDate(''); setFilterUserId('all'); }}
              className="mt-6 xl:mt-auto text-[9px] font-mono font-black uppercase tracking-[0.2em] text-red-500 hover:text-red-400 decoration-red-500/30 hover:underline underline-offset-8 transition-all"
            >
              Clear Logs Terminal
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-[spin_3s_linear_infinite] text-muted-foreground/20" />
        </div>
      ) : !logs || logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <Clock className="w-12 h-12 text-muted-foreground opacity-10 mb-6" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground max-w-[200px] leading-relaxed">
            No records match the current filter configuration.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedLogs.map((group) => (
            <div key={group.title} className="relative">
              {/* Group Header */}
              <div className="sticky top-0 z-10 flex items-center gap-4 mb-10">
                <div className="bg-background/80 backdrop-blur px-4 py-1 border border-border/50">
                  <h3 className="text-[10px] font-mono font-black tracking-[0.5em] text-foreground">
                    {group.title}
                  </h3>
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-border/50 to-transparent" />
              </div>

              {/* Logs List */}
              <div className="space-y-8 relative ml-4">
                {/* Vertical Line Lineage */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/40 via-border/20 to-transparent" />

                {group.items.map((log) => (
                  <div key={log.id} className="relative pl-10 group/item">
                    {/* Tactical Dot */}
                    <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-none bg-background border-2 border-primary group-hover/item:scale-150 transition-transform z-20 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2.5 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-muted/5 border border-border/40 shadow-sm group-hover/item:border-primary/50 transition-colors">
                            {getActionIcon(log.action_type)}
                          </div>
                          <p className="text-[13px] font-medium tracking-tight text-foreground/90 leading-snug">
                            {log.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 pl-[42px]">
                            <span className="text-[9px] font-mono text-muted-foreground uppercase opacity-40 font-bold">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="h-[1px] w-3 bg-border/20" />
                            <span className="text-[9px] font-mono text-muted-foreground uppercase opacity-60 flex items-center gap-1.5 bg-muted/20 px-2 py-0.5 border border-border/20">
                              <User className="w-2.5 h-2.5" />
                              {log.user?.name || log.user?.email || "System"}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-widest hidden sm:block">
                              {formatRelativeTime(log.created_at)}
                            </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

