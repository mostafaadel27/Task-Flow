"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, GripVertical, Clock, ArrowLeft, FolderKanban } from "lucide-react";
import { useMyTasks } from "@/hooks/useMyTasks";
import { useSearchParams } from "next/navigation";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { useCallback, useRef, useMemo } from "react";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

// --- Read-Only Task Card ---
function EmployeeTaskCard({ task, isOverlay }: { task: any, isOverlay?: boolean }) {
  return (
    <div 
      className={`bg-background border p-5 touch-none overflow-hidden relative group/card ${
        isOverlay ? 'border-foreground shadow-2xl scale-[1.03] opacity-100 rotate-2' : 'border-border/50 hover:border-foreground/40 hover:-translate-y-1 hover:shadow-xl'
      }`}
    >
      <div className={`absolute inset-0 bg-muted/10 -translate-x-full transition-transform duration-300 ease-out z-0 ${!isOverlay ? 'group-hover/card:translate-x-0' : ''}`} />
      
      <div className="relative z-10 text-left">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-sm font-bold uppercase tracking-tight leading-snug flex-1 break-words line-clamp-2">
            {task.title}
          </h4>
          {!isOverlay && (
            <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1 cursor-grab active:cursor-grabbing" />
          )}
        </div>

        <div className="flex items-end justify-between mt-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              {new Date(task.created_at).toLocaleDateString()}
              <span className="opacity-30">|</span>
              BY {task.user?.name || task.user?.email || "Manager"}
            </span>
          </div>
          
          <span className={`flex items-center gap-1.5 text-[10px] font-mono border px-2 py-0.5 uppercase tracking-widest ${
            task.priority === 'high' ? 'border-red-500/30 text-red-500 dark:text-red-400 bg-red-500/5' :
            task.priority === 'low' ? 'border-blue-500/30 text-blue-500 dark:text-blue-400 bg-blue-500/5' :
            'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5'
          }`}>
            <span className={`w-1.5 h-1.5 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'low' ? 'bg-blue-500' : 'bg-amber-500'}`} />
            {task.priority || 'medium'}
          </span>
        </div>
      </div>
    </div>
  );
}

function SortableEmployeeTask({ task }: { task: any }) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <EmployeeTaskCard task={task} />
    </div>
  );
}

function EmployeeColumn({ title, status, tasks }: { title: string, status: string, tasks: any[] }) {
  const { setNodeRef } = useSortable({
    id: status,
    data: { type: "Column", column: { status } },
  });

  return (
    <div className="w-[300px] md:w-[350px] flex flex-col h-full flex-shrink-0">
      <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-foreground/10 flex-none px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
          <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 text-muted-foreground font-bold">{tasks.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 px-1 space-y-4 min-h-[400px]" ref={setNodeRef}>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableEmployeeTask key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function WorkspacePage() {
  const { tasks, isLoading, error, refetch, updateTaskStatus } = useMyTasks();
  const searchParams = useSearchParams();
  const [personalTasks, setPersonalTasks] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const projectFromUrl = searchParams.get('project');
    if (projectFromUrl) {
      setSelectedProjectId(projectFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (tasks) setPersonalTasks(tasks);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="w-8 h-8 animate-[spin_3s_linear_infinite] text-muted-foreground/30" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground translate-y-1">Syncing sectors…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
        <div className="py-24 text-center w-full max-w-2xl mx-auto border-2 border-dashed border-red-500/20 bg-red-500/5">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm font-mono uppercase tracking-widest text-red-500/80">Sync Error</p>
          <button onClick={() => refetch()} className="text-sm font-bold uppercase tracking-widest mt-6 hover:text-red-500 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const groupedTasks = personalTasks.reduce((acc: any, task: any) => {
    const projId = task.project_id || "unassigned";
    const projTitle = task.project?.title || "Untitled Workstream";
    if (!acc[projId]) {
      acc[projId] = { id: projId, title: projTitle, tasks: [] } as { id: string, title: string, tasks: any[] };
    }
    acc[projId].tasks.push(task);
    return acc;
  }, {} as Record<string, { id: string, title: string, tasks: any[] }>);

  const projects = Object.values(groupedTasks);
  const activeProject = selectedProjectId ? (groupedTasks[selectedProjectId] as { id: string, title: string, tasks: any[] }) : null;
  const doneCount = personalTasks.filter(t => t.status === 'done').length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-transparent">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex-none pb-8 border-b border-border/50 mb-8"
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {selectedProjectId && (
              <button 
                onClick={() => setSelectedProjectId(null)}
                className="w-12 h-12 flex items-center justify-center border border-border/50 hover:bg-muted/50 transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                {selectedProjectId ? activeProject?.title : "Assigned Sectors"}
              </h1>
              <span className="block text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] mt-3">
                {selectedProjectId ? "Operational Tactical View" : `Ready for deployment in ${projects.length} sectors`}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content View */}
      <AnimatePresence mode="wait">
        {!selectedProjectId ? (
          /* Project Selection List */
          <motion.div 
            key="list"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
          >
            {projects.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-24 px-8 border-2 border-dashed border-border/50 max-w-lg w-full">
                  <p className="text-lg font-extrabold uppercase tracking-tight mb-2">Zero Missions</p>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Awaiting command briefing.</p>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((proj) => {
                  const doneTasks = proj.tasks.filter((t: any) => t.status === 'done').length;
                  const total = proj.tasks.length;
                  const progress = Math.round((doneTasks / total) * 100);

                  return (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className="group p-8 border border-border/50 bg-background text-left hover:border-foreground/30 hover:shadow-2xl transition-all duration-500 flex flex-col h-[280px] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FolderKanban className="w-24 h-24" />
                      </div>
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Code Name: {proj.title.split(' ')[0]}</div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors mb-auto">
                          {proj.title}
                        </h2>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                            <span className="text-muted-foreground">{doneTasks} / {total} Completed</span>
                            <span className="font-bold">{progress}%</span>
                          </div>
                          <div className="w-full bg-muted h-[2px] overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="bg-foreground h-full"
                            />
                          </div>
                          <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 text-right">Enter Sector →</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* Single Project Board View */
          <motion.div 
            key="board"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-x-auto overflow-y-hidden"
          >
            {activeProject && (
              <ProjectBoard 
                tasks={activeProject.tasks} 
                updateTaskStatus={updateTaskStatus}
                refetch={refetch}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectBoard({ tasks, updateTaskStatus, refetch }: { 
  tasks: any[], 
  updateTaskStatus: any,
  refetch: any 
}) {
  const [boardTasks, setBoardTasks] = useState(tasks);
  const boardTasksRef = useRef([...boardTasks]);
  useEffect(() => { boardTasksRef.current = boardTasks; }, [boardTasks]);
  
  const [activeTask, setActiveTask] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging && !updateTaskStatus.isPending) {
      setBoardTasks(tasks);
    }
  }, [tasks, isDragging, updateTaskStatus.isPending]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnDefinitions = [
    { id: "todo", title: "Target Status", status: "todo" },
    { id: "in_progress", title: "In Operation", status: "in_progress" },
    { id: "done", title: "Secured", status: "done" }
  ];

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

    setBoardTasks((prev) => {
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
      const movedTask = boardTasksRef.current.find(t => t.id === event.active.id);
      if (movedTask) {
        updateTaskStatus.mutate({ taskId: movedTask.id, status: movedTask.status });
      }
    }
    setTimeout(() => setIsDragging(false), 0);
  }, [updateTaskStatus]);

  const todoTasks = useMemo(() => boardTasks.filter(t => t.status === 'todo'), [boardTasks]);
  const inProgressTasks = useMemo(() => boardTasks.filter(t => t.status === 'in_progress'), [boardTasks]);
  const doneTasks = useMemo(() => boardTasks.filter(t => t.status === 'done'), [boardTasks]);

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={rectIntersection} 
      onDragStart={onDragStart} 
      onDragOver={onDragOver} 
      onDragEnd={onDragEnd}
    >
      <div className="h-full flex items-start gap-8 md:gap-12 w-max px-2">
        {columnDefinitions.map((col) => (
          <EmployeeColumn 
            key={col.id} 
            title={col.title}
            status={col.status}
            tasks={col.status === 'todo' ? todoTasks : col.status === 'in_progress' ? inProgressTasks : doneTasks} 
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? <EmployeeTaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
