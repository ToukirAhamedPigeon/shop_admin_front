// src/modules/documentation/components/DocSidebarTree.tsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocTreeNode } from '../types';

interface DocSidebarTreeProps {
  nodes: DocTreeNode[];
  activeSlug?: string;
  onSelectFile: (slug: string) => void;
  level?: number;
}

// Collect all ancestor folder slugs that contain the active file, so the
// tree opens automatically to reveal the currently selected page.
const collectAncestorSlugs = (nodes: DocTreeNode[], activeSlug?: string): Set<string> => {
  const openSlugs = new Set<string>();
  if (!activeSlug) return openSlugs;

  const visit = (node: DocTreeNode, ancestors: string[]): boolean => {
    if (node.isFile) {
      return node.slug === activeSlug;
    }
    const found = (node.children || []).some((child) => visit(child, [...ancestors, node.slug]));
    if (found) {
      ancestors.forEach((slug) => openSlugs.add(slug));
      openSlugs.add(node.slug);
    }
    return found;
  };

  nodes.forEach((node) => visit(node, []));
  return openSlugs;
};

export default function DocSidebarTree({
  nodes,
  activeSlug,
  onSelectFile,
  level = 0,
}: DocSidebarTreeProps) {
  const [openFolders, setOpenFolders] = useState<Set<string>>(() =>
    collectAncestorSlugs(nodes, activeSlug)
  );

  const toggleFolder = (slug: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  return (
    <div className={cn(level > 0 ? 'ml-3 space-y-0.5' : 'space-y-0.5')}>
      {nodes.map((node) => {
        if (!node.isFile) {
          const isOpen = openFolders.has(node.slug);
          return (
            <div key={node.slug}>
              <button
                type="button"
                onClick={() => toggleFolder(node.slug)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg text-left transition-colors cursor-pointer text-foreground hover:bg-accent"
              >
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                {isOpen ? (
                  <FolderOpen className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <Folder className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{node.name}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && node.children && node.children.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <DocSidebarTree
                      nodes={node.children}
                      activeSlug={activeSlug}
                      onSelectFile={onSelectFile}
                      level={level + 1}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }

        const isActive = node.slug === activeSlug;
        return (
          <button
            key={node.slug}
            type="button"
            onClick={() => onSelectFile(node.slug)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg text-left transition-colors cursor-pointer',
              isActive
                ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{node.name}</span>
          </button>
        );
      })}
    </div>
  );
}
