"use client";

import { useEffect, useRef } from "react";

export function CombatRowContextMenu({
  x,
  y,
  open,
  isDm,
  onClose,
  onEdit,
  onDelete,
  onAddCondition,
}: {
  x: number;
  y: number;
  open: boolean;
  isDm: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddCondition: () => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Combatant actions"
      className="fixed z-[70] min-w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
      style={{
        top: Math.min(y, window.innerHeight - 140),
        left: Math.min(x, window.innerWidth - 180),
      }}
    >
      <div>
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => {
            onClose();
            onAddCondition();
          }}
        >
          Add condition
        </button>
        {isDm && (
          <>
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
                onClose();
                onDelete();
              }}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
