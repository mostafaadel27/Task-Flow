"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/auth/actions";

export function useKeyboardShortcuts(workspaceId?: string) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Global Logout: CMD+Q
      if (cmdOrCtrl && key === 'q') {
        event.preventDefault();
        // Since logout is a form action, we can programmatically submit it or call the action
        logout();
        return;
      }

      // App Navigation
      const basePath = workspaceId ? `/ws/${workspaceId}` : '';

      switch (key) {
        case 'd':
          router.push(`${basePath}/dashboard`);
          break;
        case 'p':
          router.push(`${basePath}/projects`);
          break;
        case 'w':
          router.push(`${basePath}/workspace`);
          break;
        case 't':
          router.push(`${basePath}/team`);
          break;
        case 'a':
          router.push(`${basePath}/analytics`);
          break;
        case 's':
          router.push(`${basePath}/settings`);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, workspaceId]);
}
