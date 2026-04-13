"use client";

import { use, useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, AlertCircle, Trash2, Pencil, Clock, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useWorkspace } from "@/hooks/useWorkspace";
import { RoleBadge } from "@/components/RoleBadge";
import { ActivityTimeline } from "@/components/ActivityTimeline";
// Helper for relative time
function formatRelativeTime(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString();
}

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  useDroppable,
  closestCenter,
  rectIntersection,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

// --- Components ---

function HoldToConfirmButton({ 
  onConfirm, 
  children, 
  className,
  disabled
}: { 
  onConfirm: () => void, 
  children: React.ReactNode, 
  className?: string,
  disabled?: boolean
}) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<any>(null);

  const startHold = () => {
    if (disabled) return;
    setHolding(true);
    let start = 0;
    timerRef.current = setInterval(() => {
      start += 2;
      setProgress(start);
      if (start >= 100) {
        clearInterval(timerRef.current);
        onConfirm();
        setHolding(false);
        setProgress(0);
      }
    }, 20);
  };

  const endHold = () => {
    setHolding(false);
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={endHold}
      onMouseLeave={endHold}
      onTouchStart={startHold}
      onTouchEnd={endHold}
      className={`relative overflow-hidden group/hold ${className}`}
      disabled={disabled}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
        {holding && <span className="text-[8px] font-mono animate-pulse">HOLD</span>}
      </div>
      <div 
        className="absolute bottom-0 left-0 h-full bg-red-500/20 transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </button>
  );
}

function MemberSelector({ 
  members, 
  currentUserId, 
  selectedId, 
  onSelect, 
  label 
}: { 
  members: any[], 
  currentUserId: string, 
  selectedId: string, 
  onSelect: (id: string) => void,
  label: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedMember = members.find(m => m.user_id === selectedId);
  const selectedName = selectedId === currentUserId ? "Me (Assigned)" : (selectedMember?.user?.name || selectedMember?.user?.email || "Select Member");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground block">{label}</label>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 bg-background border border-border/50 hover:border-foreground transition-all flex items-center justify-between px-4 group ${isOpen ? 'border-foreground ring-1 ring-foreground/10' : ''}`}
      >
        <div className="flex items-center gap-3">
          {selectedId ? (
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
              {selectedName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">?</div>
          )}
          <span className={`text-sm font-bold uppercase tracking-widest ${!selectedId ? 'opacity-40' : ''}`}>
            {selectedName}
          </span>
        </div>
        <ArrowRight className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-all ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-background border border-border shadow-2xl p-2 max-h-64 overflow-y-auto custom-scrollbar"
          >
            {members.map((m) => {
              const IsMe = m.user_id === currentUserId;
              const name = m.user?.name || m.user?.email || "Member";
              return (
                <button 
                  key={m.id} 
                  type="button"
                  onClick={() => { onSelect(m.user_id); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition-all group/opt ${selectedId === m.user_id ? 'bg-muted border-l-2 border-foreground' : 'hover:bg-muted/30 border-l-2 border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-transform group-hover/opt:scale-110 ${IsMe ? 'bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-muted border border-border group-hover/opt:bg-foreground group-hover/opt:text-background'}`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${IsMe ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {IsMe ? "Me (You)" : name}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground opacity-60 truncate max-w-[120px]">{m.user?.email}</span>
                    </div>
                  </div>
                  <RoleBadge role={m.role} size="xs" />
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TaskCard = memo(function TaskCard({ task, isOverlay, onEdit, onDelete }: { task: any, isOverlay?: boolean, onEdit?: (task: any) => void, onDelete?: (task: any) => void }) {
  const isDone = task.status === 'done';
  const progressPercent = task.subtasks?.length > 0 
    ? (task.subtasks.filter((s: any) => s.completed).length / task.subtasks.length) * 100 
    : 0;

  return (
    <div 
      className={`bg-background border p-5 touch-none overflow-hidden relative group/card ${
        isOverlay ? 'border-foreground shadow-2xl scale-[1.03] opacity-100 rotate-2' : 'border-border/50 hover:border-foreground/40 hover:-translate-y-1 hover:shadow-xl'
      } ${isDone ? 'grayscale-[0.8] opacity-70 hover:grayscale-0 hover:opacity-100' : ''}`}
      role="listitem"
    >
      {/* Scanline Delight */}
      <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent -translate-x-full group-hover/card:animate-[shimmer_2s_infinite] pointer-events-none z-0`} />
      
      {/* Selection Background */}
      <div className={`absolute inset-0 bg-muted/10 -translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0 ${!isOverlay ? 'group-hover/card:translate-x-0' : ''}`} />
      
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3 text-[10px] font-mono uppercase tracking-widest text-primary/70">
            {(task.assigned_to || task.assignee_email) && (
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-none ${isDone ? 'bg-muted-foreground' : 'bg-primary'}`} />
                <span>FOR: {task.user?.name || task.assignee_email || "Target Member"}</span>
              </div>
            )}
            {!isDone && task.priority === 'high' && (
              <span className="animate-pulse flex items-center gap-1 text-red-500 font-bold">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                CRITICAL
              </span>
            )}
          </div>
        <div className="flex items-start justify-between gap-4">
          <h4 className={`text-sm md:text-base font-bold uppercase tracking-tight leading-snug flex-1 break-words transition-all duration-300 ${isDone ? 'line-through text-muted-foreground' : 'group-hover/card:text-primary'}`}>
            {task.title}
          </h4>
          
          {!isOverlay && onEdit && onDelete && (
            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                className="p-2.5 bg-background shadow-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-none"
                aria-label={`Edit ${task.title}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(task); }}
                className="p-2.5 bg-background shadow-sm border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-colors rounded-none"
                aria-label={`Delete ${task.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex flex-col gap-3">
          {task.blocker && task.blocker !== 'none' && (
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white font-mono text-[10px] font-bold px-2 py-0.5 tracking-widest uppercase animate-pulse border border-red-500/20">
                ⚠️ BLOCKED: {task.blocker}
              </span>
            </div>
          )}
          
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground group-hover/card:text-foreground transition-colors overflow-hidden">
              <div className="font-mono text-xs tracking-tighter opacity-80 flex gap-0">
                <motion.span 
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {'█'.repeat(Math.round(progressPercent / 12.5))}
                </motion.span>
                <span className="opacity-20">
                  {'░'.repeat(8 - Math.round(progressPercent / 12.5))}
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase font-mono bg-muted/50 px-1">
                {task.subtasks.filter((s: any) => s.completed).length}/{task.subtasks.length}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-end justify-between mt-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              {new Date(task.created_at).toLocaleDateString()}
              <span className="opacity-30">|</span>
              BY {task.user?.name || "Member"}
            </span>
            {task.due_date && (() => {
              const now = new Date();
              const due = new Date(task.due_date);
              const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isOverdue = diffDays < 0;
              const isUrgent = diffDays >= 0 && diffDays <= 2;
              return (
                <span className={`flex items-center gap-1 text-[10px] font-mono border px-2 py-0.5 uppercase tracking-widest ${
                  isOverdue ? 'border-red-500 text-red-500 bg-red-500/10 animate-pulse' :
                  isUrgent ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                  'border-border/50 text-muted-foreground'
                }`}>
                  <Clock className="w-3 h-3" />
                  {isOverdue ? `OVERDUE ${Math.abs(diffDays)}D` : diffDays === 0 ? 'TODAY' : `${diffDays}D LEFT`}
                </span>
              );
            })()}
          </div>
          
          <span className={`flex items-center gap-1.5 text-[10px] font-mono border px-2 py-0.5 uppercase tracking-widest ${
            task.priority === 'high' ? 'border-red-500/30 text-red-500 dark:text-red-400 bg-red-500/5' :
            task.priority === 'low' ? 'border-blue-500/30 text-blue-500 dark:text-blue-400 bg-blue-500/5 opacity-80' :
            'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5'
          }`}>
            <span className={`w-1.5 h-1.5 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'low' ? 'bg-blue-500' : 'bg-amber-500'}`} />
            {task.priority || 'medium'}
          </span>
        </div>
      </div>
    </div>
  );
});

const SortableTask = memo(function SortableTask({ task, onEdit, onDelete }: { task: any, onEdit?: (task: any) => void, onDelete?: (task: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="bg-muted/10 border-2 border-dashed border-border/50 h-[100px]" />
    );
  }

  const isReadOnly = !onEdit || !onDelete;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...(isReadOnly ? {} : { ...attributes, ...listeners })} 
      className={isReadOnly ? "" : "cursor-grab active:cursor-grabbing"}
    >
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
});

const BoardColumn = memo(function BoardColumn({ column, tasks, onCreateTask, onEditTask, onDeleteTask }: { 
  column: any, tasks: any[], onCreateTask?: (status: string) => void, 
  onEditTask?: (task: any) => void, onDeleteTask?: (task: any) => void 
}) {
  const { setNodeRef } = useDroppable({
    id: column.status,
    data: { type: "Column", column },
  });

  return (
    <div className="w-[320px] md:w-[380px] flex flex-col h-full flex-shrink-0" role="group" aria-label={`${column.title} column`}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-foreground/10 flex-none group">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-extrabold uppercase tracking-tight">{column.title}</h3>
          <span className="text-xs font-mono bg-muted px-2 py-0.5 text-muted-foreground font-bold">{tasks.length}</span>
        </div>
        {onCreateTask && (
          <button
            onClick={() => onCreateTask(column.status)}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer rounded-none"
            aria-label={`Add task to ${column.title}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 px-0.5 space-y-4 min-h-[200px]" ref={setNodeRef} role="list">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
});

// --- Main Page ---

export default function BoardPage({ params }: { params: Promise<{ projectId: string; workspaceId: string }> }) {
  const router = useRouter();
  const { projectId, workspaceId } = use(params);
  const { projects, updateProject, isLoading: loadingProjects } = useProjects();
  const project = projects?.find((p: any) => p.id === projectId);

  // Redirect if project is not found after loading
  useEffect(() => {
    if (!loadingProjects && projects && !project) {
      router.push('/dashboard');
    }
  }, [loadingProjects, projects, project, router]);
  
  const { tasks, isLoading, error, refetch, createTask, updateTask, deleteTask } = useTasks(projectId, project?.workspace_id);
  const { members, userId, currentRole } = useWorkspace(workspaceId);
  
  // Role Levels for Hierarchy (Owner: 2, Admin: 1, Member: 0)
  const roleLevels: Record<string, number> = { owner: 2, admin: 1, member: 0 };
  const myLevel = roleLevels[currentRole || 'member'] || 0;

  const canManageTask = useCallback((task: any) => {
    if (currentRole === 'owner' || currentRole === 'admin') return true;
    if (currentRole === 'member') {
      return task.user_id === userId || task.assigned_to === userId;
    }
    return false;
  }, [currentRole, userId]);

  // Sort members to put current user (ME) at the top
  const sortedMembers = [...members].sort((a, b) => {
    if (a.user_id === userId) return -1;
    if (b.user_id === userId) return 1;
    return 0;
  });

  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const activeTasksRef = useRef<any[]>([]);
  useEffect(() => { activeTasksRef.current = activeTasks; }, [activeTasks]);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [boardTitle, setBoardTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const tasksRef = useRef<any[]>([]);

  useEffect(() => {
    if (tasks) tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    if (project?.title) setBoardTitle(project.title);
  }, [project?.title]);

  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Calculate base tasks with stable filtering
  const baseTasks = useMemo(() => {
    if (!tasks) return [];
    let filtered = [...tasks];
    
    // Role-based visibility: Members only see their own tasks
    if (currentRole === 'member' && userId) {
      filtered = filtered.filter(t => t.assigned_to === userId || t.user_id === userId);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.description?.toLowerCase().includes(query) ||
        t.user?.name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [tasks, currentRole, userId, searchQuery]);

  // 2. Synchronize activeTasks with baseTasks only when NOT interacted with
  useEffect(() => {
    if (!isDragging && !updateTask.isPending) {
      setActiveTasks(baseTasks);
    }
  }, [baseTasks, isDragging, updateTask.isPending]);

  // 3. Columns pre-filtered from activeTasks
  const todoTasks = useMemo(() => activeTasks.filter(t => t.status === 'todo'), [activeTasks]);
  const inProgressTasks = useMemo(() => activeTasks.filter(t => t.status === 'in_progress'), [activeTasks]);
  const doneTasks = useMemo(() => activeTasks.filter(t => t.status === 'done'), [activeTasks]);
  const handleTitleBlur = () => {
    const newTitle = boardTitle.trim() || "UNTITLED WORKSTREAM";
    setBoardTitle(newTitle);
    if (newTitle !== project?.title) {
      updateProject.mutate({ id: projectId, title: newTitle });
    }
  };

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("todo");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  // Edit dialog state
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editBlocker, setEditBlocker] = useState<string>("none");
  const [editAssignee, setEditAssignee] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editSubtasks, setEditSubtasks] = useState<any[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const columnDefinitions = [
    { id: "todo", title: "To do", status: "todo" },
    { id: "in_progress", title: "In progress", status: "in_progress" },
    { id: "done", title: "Done", status: "done" }
  ];

  const openCreateDialog = useCallback((status: string = "todo") => {
    setNewTaskStatus(status);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskAssignee(userId || "");
    setNewTaskDeadline("");
    setIsCreateOpen(true);
    requestAnimationFrame(() => {
      createDialogRef.current?.showModal();
      createInputRef.current?.focus();
    });
  }, [userId]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openCreateDialog("todo");
      }
      if (e.key.toLowerCase() === 'f' || e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchQuery("");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCreateDialog]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    createTask.mutate({ 
      title, 
      description: newTaskDescription.trim() || null,
      status: newTaskStatus as any, 
      priority: newTaskPriority as any, 
      assigned_to: newTaskAssignee.trim() || null,
      due_date: newTaskDeadline || null,
      position: 0 
    });
    setIsCreateOpen(false);
    createDialogRef.current?.close();
  };

  const openEditDialog = useCallback((task: any) => {
    setEditTarget(task);
    setEditTitle(task.title);
    setEditPriority(task.priority || "medium");
    setEditBlocker(task.blocker || "none");
    setEditAssignee(task.assigned_to || "");
    setEditDeadline(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "");
    setEditSubtasks(task.subtasks || []);
    setNewSubtaskTitle("");
    requestAnimationFrame(() => {
      editDialogRef.current?.showModal();
      editInputRef.current?.focus();
    });
  }, []);

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = editTitle.trim();
    if (!title || !editTarget) return;
    updateTask.mutate({ 
      id: editTarget.id, 
      updates: { 
        title, 
        priority: editPriority as any,
        blocker: editBlocker === 'none' ? null : editBlocker,
        assigned_to: editAssignee.trim() || null,
        due_date: editDeadline || null,
        subtasks: editSubtasks
      } 
    });
    setEditTarget(null);
    editDialogRef.current?.close();
  };

  const handleAddSubtask = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!newSubtaskTitle.trim()) return;
      setEditSubtasks([...editSubtasks, { id: crypto.randomUUID(), title: newSubtaskTitle.trim(), completed: false }]);
      setNewSubtaskTitle("");
    }
  };

  const openDeleteDialog = useCallback((task: any) => {
    setDeleteTarget(task);
    requestAnimationFrame(() => deleteDialogRef.current?.showModal());
  }, []);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteTask.mutate(deleteTarget.id);
    setDeleteTarget(null);
    deleteDialogRef.current?.close();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = useCallback((event: any) => {
    setIsDragging(true);
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
    }
  }, []);

  const onDragOver = useCallback((event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    setActiveTasks((prev) => {
      const activeIdx = prev.findIndex((t) => t.id === active.id);
      if (activeIdx === -1) return prev;

      if (isOverTask) {
        const overIdx = prev.findIndex((t) => t.id === over.id);
        if (overIdx === -1) return prev;

        if (prev[activeIdx].status !== prev[overIdx].status) {
          const next = [...prev];
          next[activeIdx] = { ...next[activeIdx], status: prev[overIdx].status };
          return arrayMove(next, activeIdx, overIdx);
        }
        return arrayMove(prev, activeIdx, overIdx);
      }

      if (isOverColumn) {
        if (prev[activeIdx].status === over.id) return prev;
        const next = [...prev];
        next[activeIdx] = { ...next[activeIdx], status: over.id as string };
        return arrayMove(next, activeIdx, activeIdx);
      }
      
      return prev;
    });
  }, []);

  const onDragEnd = useCallback((event: any) => {
    setActiveTask(null);
    
    if (event.active.data.current?.type === "Task") {
      const movedTask = activeTasksRef.current.find(t => t.id === event.active.id);
      if (movedTask) {
        // Trigger mutation with the final local state
        updateTask.mutate({ id: movedTask.id, updates: { status: movedTask.status } });
      }
    }
    
    // Set isDragging to false AFTER the mutation has been triggered
    // This ensures updateTask.isPending is likely true when the next render happens
    setTimeout(() => setIsDragging(false), 0);
  }, [updateTask]); // Ref-stable dependency

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 gap-6" role="status">
        <Loader2 className="w-8 h-8 animate-[spin_3s_linear_infinite] text-muted-foreground/30" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Loading workspace…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4" role="alert">
        <div className="py-24 text-center w-full max-w-2xl mx-auto border-2 border-dashed border-red-500/20 bg-red-500/5 rounded-none">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest text-red-500/80">System Failure</p>
          <button onClick={() => refetch()} className="text-sm font-bold uppercase tracking-widest mt-6 hover:text-red-500 transition-colors uppercase">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-140px)] bg-transparent overflow-hidden">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-none pb-10 border-b border-border/50 mb-10"
        >
          {/* Top Level: Title and Primary Action */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <input
                  value={boardTitle || project?.title || "UNTITLED WORKSTREAM"}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                  className="text-4xl md:text-6xl font-black uppercase tracking-tighter truncate leading-none bg-transparent border-none outline-none focus:ring-0 p-0 hover:bg-muted/10 focus:bg-muted/10 transition-colors cursor-text rounded-sm py-1 -ml-1 pl-1 max-w-full"
                  maxLength={100}
                />
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-none" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">
                    Operational Sector: Scrum
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-muted/5 border border-border/50 text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60 rounded-none">
                  HELP: SHIFT+?
                </div>
              </div>
            </div>

            {currentRole !== 'member' && (
              <Button 
                onClick={() => openCreateDialog("todo")} 
                size="lg" 
                className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-black h-12 px-10 uppercase tracking-[0.2em] text-[11px] gap-3 group/add shadow-[6px_6px_0px_rgba(0,0,0,0.2)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex-none min-w-[140px]"
              >
                <Plus className="w-5 h-5 transition-transform group-hover/add:rotate-90" />
                New Mission
              </Button>
            )}
          </div>

          {/* Second Level: Search and Secondary Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Search Control - Positioned Under Title */}
              <div className="relative group/search w-full sm:w-[320px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground opacity-40 group-focus-within/search:opacity-100 transition-opacity">
                  [F]
                </div>
                <input 
                  ref={searchInputRef}
                  placeholder="FILTER MISSIONS..." 
                  className="bg-muted/10 border-border border h-10 pl-10 pr-4 text-[10px] font-mono uppercase tracking-widest focus:outline-none focus:border-foreground focus:bg-background transition-all w-full rounded-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {project?.user && (
                <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 border border-border/30 rounded-none w-fit">
                  <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">Authored By:</span>
                  <span className="text-[9px] font-mono text-foreground uppercase tracking-widest font-bold">
                    {project.user.name || project.user.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Columns Container */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex-1 overflow-x-auto overflow-y-hidden"
        >
          <DndContext 
            sensors={sensors} 
            collisionDetection={rectIntersection} 
            onDragStart={onDragStart} 
            onDragOver={onDragOver} 
            onDragEnd={onDragEnd}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
          >
            <div className="h-full flex items-start gap-8 md:gap-12 w-max pb-8">
              {columnDefinitions.map((column) => (
                <BoardColumn 
                  key={column.status} 
                  column={column} 
                  tasks={column.status === 'todo' ? todoTasks : column.status === 'in_progress' ? inProgressTasks : doneTasks}
                  onCreateTask={currentRole !== 'member' ? openCreateDialog : undefined}
                  onEditTask={(task) => canManageTask(task) ? openEditDialog(task) : undefined}
                  onDeleteTask={(task) => canManageTask(task) ? openDeleteDialog(task) : undefined}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </motion.div>
      </div>

      {/* Create mission dialog */}
      <dialog 
        ref={createDialogRef} 
        className="fixed inset-0 m-auto bg-background text-foreground w-full max-w-2xl border-x border-y border-border rounded-none shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop:bg-black/90 backdrop:backdrop-blur-md p-0 overflow-hidden" 
        onClick={(e) => { if (e.target === createDialogRef.current) { setIsCreateOpen(false); createDialogRef.current?.close(); }}}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          <div className="p-8 border-b border-border/50 bg-muted/5 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-primary">Initialize Mission</h2>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] mt-1">Directives Deployment Protocol</p>
            </div>
            <div className="bg-foreground text-background px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
              TARGET: {columnDefinitions.find(c => c.status === newTaskStatus)?.title || "TODO"}
            </div>
          </div>

          <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground" /> Primary Objective (Title)
                </label>
                <Input 
                  ref={createInputRef} 
                  placeholder="WHAT NEEDS TO BE DEFINED?" 
                  value={newTaskTitle} 
                  onChange={(e) => setNewTaskTitle(e.target.value)} 
                  maxLength={100} 
                  required 
                  className="w-full h-16 bg-muted/10 border-0 border-b-2 border-border/50 text-2xl font-black uppercase tracking-tight placeholder:opacity-20 rounded-none focus-visible:ring-0 focus-visible:border-foreground transition-all px-0" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground" /> Intelligence Brief (Description)
                </label>
                <textarea 
                  placeholder="PROVIDE ADDITIONAL CONTEXT AND SPECIFICATIONS FOR THE TEAM..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full min-h-[120px] bg-muted/5 border border-border/50 p-4 font-mono text-xs uppercase tracking-widest focus:outline-none focus:border-foreground transition-all resize-none rounded-none placeholder:opacity-30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <MemberSelector 
                label="Assigned Agent" 
                members={sortedMembers?.filter(m => (roleLevels[m.role || 'member'] || 0) <= myLevel || m.user_id === userId) || []} 
                currentUserId={userId || ""} 
                selectedId={newTaskAssignee} 
                onSelect={setNewTaskAssignee} 
              />

              <div className="space-y-4">
                <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground block">Operational Deadline</label>
                <input type="date" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full h-12 bg-background border border-border/50 text-sm font-mono uppercase tracking-widest rounded-none px-4 focus:outline-none focus:border-foreground appearance-none" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground block">Engagement Priority</label>
              <div className="grid grid-cols-3 gap-4" role="radiogroup">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button key={p} type="button" role="radio" aria-checked={newTaskPriority === p} onClick={() => setNewTaskPriority(p)}
                    className={`flex flex-col items-center justify-center gap-3 p-4 text-center transition-all border rounded-none group/pri ${newTaskPriority === p ? p === 'high' ? 'border-red-500 bg-red-500/10 text-red-500' : p === 'low' ? 'border-blue-500 bg-blue-500/10 text-blue-600' : 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-border/50 bg-background text-muted-foreground hover:border-foreground/30'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${p === 'high' ? 'bg-red-500' : p === 'low' ? 'bg-blue-500' : 'bg-amber-500'} ${newTaskPriority === p ? 'animate-pulse' : 'opacity-40'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover/pri:scale-110 transition-transform">{p}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>

          <div className="p-8 border-t border-border/50 bg-muted/5 flex gap-4 justify-end">
            <Button type="button" variant="ghost" className="font-mono uppercase text-[10px] tracking-widest hover:bg-muted" onClick={() => { setIsCreateOpen(false); createDialogRef.current?.close(); }}>Terminate Call</Button>
            <Button onClick={handleCreate} className="font-black uppercase tracking-wider h-14 px-12 rounded-none transition-all shadow-[0_5px_15px_rgba(0,0,0,0.3)] bg-foreground text-background" disabled={!newTaskTitle.trim() || createTask.isPending}>
              {createTask.isPending ? "Synchronizing..." : "Create Issue"}
            </Button>
          </div>
        </div>
      </dialog>

      {/* Edit mission dialog */}
      <dialog 
        ref={editDialogRef} 
        className="fixed inset-0 m-auto bg-background text-foreground w-full max-w-4xl border border-border rounded-none shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop:bg-black/90 backdrop:backdrop-blur-xl p-0 overflow-hidden" 
        onClick={(e) => { if (e.target === editDialogRef.current) { setEditTarget(null); editDialogRef.current?.close(); }}}
      >
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Main Edit Form */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar border-r border-border/20">
            <div className="mb-12 border-l-4 border-primary pl-6">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">Operational Update</h2>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] mt-2">Modify mission parameters and directives</p>
            </div>

            <form onSubmit={handleEdit} className="space-y-12">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground block ml-1">Primary Objective</label>
                <Input ref={editInputRef} placeholder="MISSION DETAILS" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={200} required className="w-full h-16 bg-muted/10 border-border/50 text-2xl font-black uppercase tracking-tight rounded-none focus-visible:border-primary transition-colors" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <MemberSelector 
                  label="Field Agent" 
                  members={sortedMembers?.filter(m => (roleLevels[m.role || 'member'] || 0) <= myLevel || m.user_id === userId) || []} 
                  currentUserId={userId || ""} 
                  selectedId={editAssignee} 
                  onSelect={setEditAssignee} 
                />

                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground block ml-1">Engagement Deadline</label>
                  <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className="w-full h-12 bg-muted/5 border border-border/40 text-sm font-mono uppercase tracking-[0.2em] rounded-none px-4 focus:outline-none focus:border-primary transition-colors appearance-none" />
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-4">
                <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground block ml-1">Technical Directives (Subtasks)</label>
                <div className="border border-border/30 bg-muted/5 p-6 space-y-6">
                  <div className="space-y-4">
                    {editSubtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-4 group">
                        <button type="button" onClick={() => setEditSubtasks(editSubtasks.map(s => s.id === st.id ? {...s, completed: !s.completed} : s))} className={`w-6 h-6 shrink-0 border-2 transition-all flex items-center justify-center ${st.completed ? 'bg-foreground border-foreground text-background' : 'border-border/40 bg-background hover:border-primary'}`}>
                          {st.completed && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <span className={`text-sm font-bold uppercase tracking-tight truncate flex-1 ${st.completed ? 'opacity-30 line-through' : 'opacity-80'}`}>{st.title}</span>
                        <button type="button" onClick={() => setEditSubtasks(editSubtasks.filter(s => s.id !== st.id))} className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-border/40" />
                    <Input placeholder="INITIALIZE NEW DIRECTIVE..." value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} onKeyDown={handleAddSubtask} className="w-full h-10 bg-transparent border-none text-[10px] font-mono uppercase tracking-[0.3em] placeholder:opacity-20 rounded-none focus-visible:ring-0 pl-8 transition-all" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground block ml-1">Blocker Protocol</label>
                  <div className="flex gap-2" role="radiogroup">
                    {(['none', 'review', 'client'] as const).map(b => (
                      <button key={b} type="button" role="radio" aria-checked={editBlocker === b} onClick={() => setEditBlocker(b)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${editBlocker === b ? b === 'none' ? 'border-foreground bg-foreground text-background' : 'border-red-600 bg-red-600 text-white' : 'border-border/30 bg-background text-muted-foreground/50 hover:border-foreground/50'}`}
                      >{b}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground block ml-1">Threat Level (Priority)</label>
                  <div className="flex gap-2" role="radiogroup">
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button key={p} type="button" role="radio" aria-checked={editPriority === p} onClick={() => setEditPriority(p)}
                        className={`flex items-center justify-center gap-2 flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                          editPriority === p 
                            ? p === 'high' ? 'border-red-600 bg-red-600/10 text-red-600 shadow-[0_0_15px_rgba(220,38,38,0.2)]' 
                            : p === 'low' ? 'border-blue-600 bg-blue-600/10 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                            : 'border-amber-600 bg-amber-600/10 text-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.2)]'
                            : 'border-border/30 bg-background text-muted-foreground/50 hover:border-foreground/40'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-none ${p === 'high' ? 'bg-red-600' : p === 'low' ? 'bg-blue-600' : 'bg-amber-600'} ${editPriority === p ? 'animate-pulse' : 'opacity-20'}`} />
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-8 border-t border-border/20">
                <Button type="button" variant="ghost" className="font-mono uppercase text-[10px] tracking-widest rounded-none h-12 px-6" onClick={() => { setEditTarget(null); editDialogRef.current?.close(); }}>Abort Changes</Button>
                <Button type="submit" className="font-black uppercase tracking-widest h-14 px-12 rounded-none transition-all shadow-[8px_8px_0px_rgba(0,0,0,0.15)] bg-foreground text-background hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_rgba(0,0,0,0.2)] active:translate-x-px active:translate-y-px active:shadow-none" disabled={!editTitle.trim() || updateTask.isPending}>
                  {updateTask.isPending ? "Synchronizing…" : "Deploy Updates"}
                </Button>
              </div>
            </form>
          </div>

          {/* Activity Sidebar */}
          <div className="hidden lg:flex flex-col w-[360px] bg-muted/5 p-10 overflow-y-auto custom-scrollbar">
            <div className="mb-8 flex items-center gap-4">
              <div className="w-1.5 h-1.5 bg-primary" />
              <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-muted-foreground">Mission Archive</h3>
            </div>
            
            {editTarget && (
              <ActivityTimeline 
                entityId={editTarget.id} 
                entityType="task" 
                workspaceId={project?.workspace_id} 
              />
            )}
            
            <div className="mt-auto pt-10 border-t border-border/10">
              <div className="p-4 bg-muted/10 border border-border/30">
                <p className="text-[9px] font-mono leading-relaxed text-muted-foreground/60 uppercase tracking-widest italic">
                  All operations are logged and synchronized across the tactical network. 
                  Audit trails are permanent and immutable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </dialog>

      <dialog ref={deleteDialogRef} className="fixed inset-0 m-auto bg-background text-foreground w-full max-md border border-border shadow-2xl backdrop:bg-background/80 backdrop:backdrop-blur p-8 rounded-none" onClick={(e) => { if (e.target === deleteDialogRef.current) { setDeleteTarget(null); deleteDialogRef.current?.close(); }}}>
        <div className="">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight text-red-500">Purge Mission</h2>
          <p className="text-sm font-medium mt-4">Eliminate <span className="font-mono bg-muted px-1.5 py-0.5">{deleteTarget?.title}</span> from the system forever?</p>
          <div className="flex gap-4 justify-end mt-10">
            <Button type="button" variant="ghost" className="font-mono uppercase text-xs tracking-widest rounded-none" onClick={() => { setDeleteTarget(null); deleteDialogRef.current?.close(); }}>Cancel</Button>
            <HoldToConfirmButton 
              onConfirm={() => {
                deleteTask.mutate(deleteTarget?.id);
                setDeleteTarget(null);
                deleteDialogRef.current?.close();
              }} 
              className="font-black uppercase tracking-wider h-12 px-12 rounded-none transition-all shadow-lg bg-red-600 text-white"
            >
              Confirm Purge
            </HoldToConfirmButton>
          </div>
        </div>
      </dialog>
    </>
  );
}
