"use client";

import { useEffect, useRef } from "react";

export function ConditionActionsMenu({
  x,
  y,
  onClose,
  onEdit,
  onDelete,
}: {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Condition actions"
      className="fixed z-[80] min-w-32 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      style={{
        top: Math.min(y, window.innerHeight - 100),
        left: Math.min(x, window.innerWidth - 150),
      }}
    >
      <button
        type="button"
        role="menuitem"
        className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        Edit
      </button>
      <button
        type="button"
        role="menuitem"
        className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete
      </button>
    </div>
  );
}
