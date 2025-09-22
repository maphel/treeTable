import * as React from 'react';
const sampleData = [
    {
        lineItemId: 'grp-1',
        type: 'folder',
        name: 'Angebotspositionen',
        children: [
            {
                lineItemId: 'p-100',
                type: 'product',
                name: 'Produkt A',
                quantity: 2,
                unitPrice: 129.99,
                children: [
                    {
                        lineItemId: 'sp-100-1',
                        type: 'subproduct',
                        name: 'Zubehör A1',
                        quantity: 1,
                        unitPrice: 19.99,
                    },
                    {
                        lineItemId: 'sp-100-2',
                        type: 'subproduct',
                        name: 'Zubehör A2',
                        quantity: 3,
                        unitPrice: 9.5,
                    },
                ],
            },
            {
                lineItemId: 'p-200',
                type: 'product',
                name: 'Produkt B',
                quantity: 5,
                unitPrice: 49.0,
                draggable: false,
            },
            {
                lineItemId: 'c-1',
                type: 'custom',
                name: 'Sonderposition',
                quantity: 1,
                unitPrice: 250,
            },
            {
                lineItemId: 'c-2',
                type: 'custom',
                name: 'Individuelle Beschriftung',
                quantity: 2,
                unitPrice: 15.5,
            },
            {
                lineItemId: 'grp-1-opt',
                type: 'folder',
                name: 'Optionen',
                children: [
                    {
                        lineItemId: 'c-3',
                        type: 'custom',
                        name: 'Express-Lieferung',
                        quantity: 1,
                        unitPrice: 39.99,
                    },
                    {
                        lineItemId: 'c-4',
                        type: 'custom',
                        name: 'Sonderverpackung (ohne Preis)',
                        quantity: 1,
                    },
                ],
            },
        ],
    },
    {
        lineItemId: 'grp-2',
        type: 'folder',
        name: 'Zubehörpakete',
        children: [
            {
                lineItemId: 'p-300',
                type: 'product',
                name: 'Produkt C (Bundle)',
                quantity: 1,
                unitPrice: 999.9,
                children: [
                    {
                        lineItemId: 'sp-300-1',
                        type: 'subproduct',
                        name: 'Bundle-Komponente 1',
                        quantity: 2,
                        unitPrice: 12.34,
                    },
                    {
                        lineItemId: 'sp-300-2',
                        type: 'subproduct',
                        name: 'Bundle-Komponente 2',
                        quantity: 4,
                        unitPrice: 7.89,
                    },
                ],
            },
            {
                lineItemId: 'c-5',
                type: 'custom',
                name: 'Zusätzliche Montage',
                quantity: 3,
                unitPrice: 80,
            },
        ],
    },
];
// very small store to enable "invalidation"
let version = 0;
const subscribers = new Set();
function notify() { version++; subscribers.forEach((l) => l()); }
export function useGetLineItemsQuery(_) {
    // rerender on store changes
    React.useSyncExternalStore((listener) => { subscribers.add(listener); return () => { subscribers.delete(listener); }; }, () => version, () => version);
    return { data: sampleData, isLoading: false, error: undefined };
}
export function useMoveLineItemsMutation() {
    const [isLoading, setLoading] = React.useState(false);
    const [error, setError] = React.useState();
    const mutate = React.useCallback(async (input) => {
        setLoading(true);
        setError(undefined);
        try {
            // Simuliere Backend-Call + Invalidation
            // In echter App: API aufrufen und Query invalidieren/refetchen
            await new Promise((res) => setTimeout(res, 200));
            // eslint-disable-next-line no-console
            console.log('moveLineItems', input);
            notify();
        }
        catch (e) {
            setError(e);
            throw e;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return [mutate, { isLoading, error }];
}
export function useUpdateLineItemMutation() {
    const [isLoading, setLoading] = React.useState(false);
    const [error, setError] = React.useState();
    const mutate = React.useCallback(async (input) => {
        setLoading(true);
        setError(undefined);
        try {
            await new Promise((res) => setTimeout(res, 120));
            // apply to sample data
            const apply = (list) => {
                if (!list)
                    return false;
                for (const item of list) {
                    if (item.lineItemId === input.lineItemId) {
                        Object.assign(item, input.properties);
                        return true;
                    }
                    if (apply(item.children))
                        return true;
                }
                return false;
            };
            apply(sampleData);
            // eslint-disable-next-line no-console
            console.log('updateLineItem', input);
            notify();
        }
        catch (e) {
            setError(e);
            throw e;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return [mutate, { isLoading, error }];
}
export function useDeleteLineItemsMutation() {
    const [isLoading, setLoading] = React.useState(false);
    const [error, setError] = React.useState();
    const mutate = React.useCallback(async (input) => {
        setLoading(true);
        setError(undefined);
        try {
            await new Promise((res) => setTimeout(res, 120));
            const ids = new Set(input.selectedLineItemIds.map(String));
            const removeFrom = (list) => {
                if (!list)
                    return list;
                const next = [];
                for (const item of list) {
                    if (ids.has(String(item.lineItemId))) {
                        // skip -> deleted
                        continue;
                    }
                    const children = removeFrom(item.children);
                    next.push({ ...item, children });
                }
                return next;
            };
            // mutate sampleData in place to keep references
            const next = removeFrom(sampleData) || [];
            sampleData.splice(0, sampleData.length, ...next);
            // eslint-disable-next-line no-console
            console.log('deleteLineItems', input);
            notify();
        }
        catch (e) {
            setError(e);
            throw e;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return [mutate, { isLoading, error }];
}
export function useDuplicateLineItemsMutation() {
    const [isLoading, setLoading] = React.useState(false);
    const [error, setError] = React.useState();
    const mutate = React.useCallback(async (input) => {
        setLoading(true);
        setError(undefined);
        try {
            await new Promise((res) => setTimeout(res, 120));
            let counter = 0;
            const newId = (oldId) => `${String(oldId)}-copy-${++counter}`;
            const cloneWithNewIds = (node) => {
                var _a;
                return ({
                    ...node,
                    lineItemId: newId(node.lineItemId),
                    children: (_a = node.children) === null || _a === void 0 ? void 0 : _a.map(cloneWithNewIds),
                });
            };
            const byId = new Set(input.selectedLineItemIds.map(String));
            const duplicateIn = (list) => {
                if (!list)
                    return;
                for (let i = 0; i < list.length; i++) {
                    const item = list[i];
                    if (byId.has(String(item.lineItemId))) {
                        const copy = cloneWithNewIds(item);
                        list.splice(i + 1, 0, copy);
                        i++; // skip over the inserted copy
                    }
                    duplicateIn(item.children);
                }
            };
            duplicateIn(sampleData);
            // eslint-disable-next-line no-console
            console.log('duplicateLineItems', input);
            notify();
        }
        catch (e) {
            setError(e);
            throw e;
        }
        finally {
            setLoading(false);
        }
    }, []);
    return [mutate, { isLoading, error }];
}
