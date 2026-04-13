"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useParams } from "next/navigation";

export function ShortcutHandler() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  useKeyboardShortcuts(workspaceId);

  return null;
}
