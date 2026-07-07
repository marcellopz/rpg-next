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
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: y, left: x }}
    >
      <ul>
        <li
          onClick={() => {
            onClose();
            onAddCondition();
          }}
        >
          Add condition
        </li>
        {isDm && (
          <>
            <li
              onClick={() => {
                onEdit();
                onClose();
              }}
            >
              Edit
            </li>
            <li
              onClick={() => {
                onClose();
                onDelete();
              }}
            >
              Delete
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
