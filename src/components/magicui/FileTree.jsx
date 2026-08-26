// File tree ala Magic UI + drag & drop ala VSCode:
// - Node bisa di-drag (file maupun folder)
// - Folder jadi drop target (masukkan ke dalam folder)
// - Area kosong tree = drop ke root
// - Klik kanan node -> menu konteks (Rename / Delete)
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFolder,
  FaFolderOpen,
  FaFileCode,
  FaChevronRight,
  FaChevronDown,
  FaPen,
  FaTrash,
} from "react-icons/fa";

function ContextMenu({ x, y, isFolder, onClose, onRename, onDelete }) {
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[150px] bg-slate-900 border border-white/15 rounded-lg shadow-2xl py-1 text-sm"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-white/10 text-left"
      >
        <FaPen className="text-white/50 text-xs" /> Ganti Nama
      </button>
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-500/20 text-red-300 text-left"
      >
        <FaTrash className="text-xs" /> Hapus
      </button>
    </div>
  );
}

function Folder({ element, expanded, toggle, selectedId, onSelect, depth, onDragMove, onContext }) {
  const isOpen = expanded.has(element.id);
  const [isDropTarget, setIsDropTarget] = useState(false);

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(true);
  }

  function handleDragLeave(e) {
    e.stopPropagation();
    setIsDropTarget(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);
    const src = e.dataTransfer.getData("text/tree-id");
    if (src && src !== element.id) onDragMove?.(src, element.id);
  }

  return (
    <div>
      <button
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/tree-id", element.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          toggle(element.id);
          onSelect?.(element.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onContext?.(element.id, e.clientX, e.clientY);
        }}
        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/10 text-sm font-semibold text-left transition-colors ${
          selectedId === element.id ? "bg-sky-500/25 text-white" : "text-white"
        } ${isDropTarget ? "ring-2 ring-sky-400 bg-sky-500/20" : ""}`}
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        {isOpen ? (
          <FaChevronDown className="text-[10px] text-white/40" />
        ) : (
          <FaChevronRight className="text-[10px] text-white/40" />
        )}
        {isOpen ? (
          <FaFolderOpen className="text-amber-400" />
        ) : (
          <FaFolder className="text-amber-400" />
        )}
        <span>{element.name}</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && element.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {element.children.map((child) => (
              <TreeNode
                key={child.id}
                element={child}
                expanded={expanded}
                toggle={toggle}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
                onDragMove={onDragMove}
                onContext={onContext}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function File({ element, selectedId, onSelect, depth, onDragMove, onContext }) {
  const active = selectedId === element.id;
  const [isDropTarget, setIsDropTarget] = useState(false);

  // Drop di atas file = pindahkan ke folder induknya (ala VSCode)
  function handleDragOver(e) {
    e.preventDefault();
    setIsDropTarget(true);
  }

  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/tree-id", element.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDropTarget(false);
        const idx = element.id.lastIndexOf("/");
        const parentDir = idx === -1 ? "" : element.id.slice(0, idx);
        const src = e.dataTransfer.getData("text/tree-id");
        if (src && src !== element.id && !src.startsWith(element.id + "/")) {
          onDragMove?.(src, parentDir);
        }
      }}
      onClick={() => onSelect?.(element.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContext?.(element.id, e.clientX, e.clientY);
      }}
      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm text-left transition-colors ${
        active ? "bg-sky-500/25 text-white" : "hover:bg-white/10 text-white/70"
      } ${isDropTarget ? "ring-2 ring-sky-400 bg-sky-500/20" : ""}`}
      style={{ paddingLeft: depth * 14 + 30 }}
    >
      <FaFileCode className={active ? "text-sky-300" : "text-white/40"} />
      <span>{element.name}</span>
    </button>
  );
}

function TreeNode(props) {
  const { element } = props;
  if (element.type === "folder") return <Folder {...props} />;
  return <File {...props} />;
}

export function Tree({
  elements,
  initialExpandedItems = [],
  selectedId,
  onSelect,
  onMove,
  onContext,
}) {
  const [expanded, setExpanded] = useState(new Set(initialExpandedItems));
  const [rootDropActive, setRootDropActive] = useState(false);

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div
      className="p-2 min-h-[120px]"
      onDragOver={(e) => {
        // Hanya aktif kalau drag berasal dari dalam tree
        if (e.dataTransfer.types.includes("text/tree-id")) {
          e.preventDefault();
          setRootDropActive(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setRootDropActive(false);
      }}
      onDrop={(e) => {
        setRootDropActive(false);
        const src = e.dataTransfer.getData("text/tree-id");
        if (!src) return;
        // Drop yang tidak kena folder/file manapun = pindah ke root
        onMove?.(src, "");
      }}
    >
      <div className={rootDropActive ? "rounded-lg ring-2 ring-dashed ring-sky-400/60" : ""}>
        {elements.map((el) => (
          <TreeNode
            key={el.id}
            element={el}
            expanded={expanded}
            toggle={toggle}
            selectedId={selectedId}
            onSelect={onSelect}
            depth={0}
            onDragMove={onMove}
            onContext={onContext}
          />
        ))}
      </div>
    </div>
  );
}

export { ContextMenu };
