import { pointerWithin } from '@dnd-kit/core';
import type { RowId, RowModel } from '../types';

/**
 * Build a collision detection function that prefers edge (before/after) zones
 * and filters out disallowed targets using getRowCanDrop and a precomputed valid target set.
 */
export function createCollisionDetector<T extends object>(
  params: {
    activeId: string | null;
    byKey: Map<string, RowModel<T>>;
    getRowCanDrop?: (source: RowModel<T>, target: RowModel<T>, position: 'inside' | 'before' | 'after') => boolean;
    validTargets: Set<RowId> | null;
  }
) {
  const { activeId, byKey, getRowCanDrop, validTargets } = params;
  return (args: any) => {
    const hits: any[] = pointerWithin(args) || [];

    const score = (id: unknown): number => {
      const s = String(id);
      if (s.startsWith('before:') || s.startsWith('after:')) return 0; // highest priority
      if (s.startsWith('inside:')) return 1; // fallback if not over edge zones
      return 2; // anything else
    };

    const isAllowed = (id: string): boolean => {
      if (!activeId) return true;
      const parts = id.includes(':') ? (id.split(':') as [string, string]) : (['', ''] as [string, string]);
      const pos = parts[0] as 'inside' | 'before' | 'after' | '';
      const targetKey = parts[1];
      if (!pos || !targetKey) return true;
      const source = byKey.get(activeId);
      const target = byKey.get(targetKey);
      if (!source || !target) return false;
      if (source.id === target.id) return false;
      const byProps = getRowCanDrop ? getRowCanDrop(source, target, pos) : true;
      const byList = validTargets ? validTargets.has(target.id) : true;
      return byProps && byList;
    };

    const filtered = hits.filter((h) => isAllowed(String(h.id)));
    if (filtered.length === 0) return [] as any[];

    filtered.sort((a, b) => {
      const sa = score(a.id);
      const sb = score(b.id);
      if (sa !== sb) return sa - sb;
      const va = a?.data && typeof a.data.value === 'number' ? a.data.value : 0;
      const vb = b?.data && typeof b.data.value === 'number' ? b.data.value : 0;
      return vb - va;
    });

    return filtered;
  };
}
