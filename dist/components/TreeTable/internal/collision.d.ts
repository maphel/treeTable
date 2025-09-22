import type { RowId, RowModel } from '../types';
/**
 * Build a collision detection function that prefers edge (before/after) zones
 * and filters out disallowed targets using getRowCanDrop and a precomputed valid target set.
 */
export declare function createCollisionDetector<T extends object>(params: {
    activeId: string | null;
    byKey: Map<string, RowModel<T>>;
    getRowCanDrop?: (source: RowModel<T>, target: RowModel<T>, position: 'inside' | 'before' | 'after') => boolean;
    validTargets: Set<RowId> | null;
}): (args: any) => any[];
