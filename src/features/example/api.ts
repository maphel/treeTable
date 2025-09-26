import * as React from 'react';

export type LineItemType = 'folder' | 'product' | 'custom' | 'subproduct';

export type LineItem = {
  lineItemId: string;
  type: LineItemType;
  name: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  children?: LineItem[];
  draggable?: boolean;
};

const sampleData: LineItem[] = [
  {
    lineItemId: 'grp-1',
    type: 'folder',
    name: 'Angebotspositionen',
    children: [
      {
        lineItemId: 'p-100',
        type: 'product',
        name: 'Laptop Pro 15 (SKU LP-15)',
        quantity: 3,
        unitPrice: 1499.0,
        discount: 5,
        children: [
          {
            lineItemId: 'sp-100-1',
            type: 'subproduct',
            name: 'Docking Station',
            quantity: 3,
            unitPrice: 129.0,
          },
          {
            lineItemId: 'sp-100-2',
            type: 'subproduct',
            name: 'USB‑C Adapter',
            quantity: 3,
            unitPrice: 19.99,
          },
          {
            lineItemId: 'sp-100-3',
            type: 'subproduct',
            name: 'Garantieverlängerung 2 Jahre',
            quantity: 3,
            unitPrice: 99.0,
          },
        ],
      },
      {
        lineItemId: 'p-200',
        type: 'product',
        name: 'Monitor 27" 4K (SKU MON-27-4K)',
        quantity: 5,
        unitPrice: 349.99,
        children: [
          {
            lineItemId: 'sp-200-1',
            type: 'subproduct',
            name: 'Tischhalterung',
            quantity: 5,
            unitPrice: 59.9,
          },
        ],
      },
      {
        lineItemId: 'c-1',
        type: 'custom',
        name: 'Einrichtungspauschale',
        quantity: 1,
        unitPrice: 299.0,
      },
      {
        lineItemId: 'c-2',
        type: 'custom',
        name: 'Projektmanagement (8 Std.)',
        quantity: 8,
        unitPrice: 95.0,
        discount: 10,
      },
      {
        lineItemId: 'grp-1-opt',
        type: 'folder',
        name: 'Optionen',
        children: [
          {
            lineItemId: 'c-3',
            type: 'custom',
            name: 'Vor‑Ort‑Installation',
            quantity: 1,
            unitPrice: 450.0,
          },
          {
            lineItemId: 'c-4',
            type: 'custom',
            name: 'Express‑Lieferung',
            quantity: 1,
            unitPrice: 59.0,
          },
          {
            lineItemId: 'c-4b',
            type: 'custom',
            name: 'Anfahrtskosten (pauschal)',
            quantity: 1,
            unitPrice: 45.0,
          },
          {
            lineItemId: 'c-4c',
            type: 'custom',
            name: 'Hinweis: Lieferzeit ca. 10–14 Tage',
            quantity: 1,
            draggable: false,
          },
        ],
      },
    ],
  },
  {
    lineItemId: 'grp-2',
    type: 'folder',
    name: 'Abonnements',
    children: [
      {
        lineItemId: 'p-300',
        type: 'product',
        name: 'Software‑Support (12 Monate)',
        quantity: 10,
        unitPrice: 12.5,
        discount: 10,
      },
      {
        lineItemId: 'p-310',
        type: 'product',
        name: 'Cloud‑Backup 1 TB je Benutzer',
        quantity: 10,
        unitPrice: 7.99,
      },
    ],
  },
  {
    lineItemId: 'grp-3',
    type: 'folder',
    name: 'Versand & Logistik',
    children: [
      {
        lineItemId: 'c-5',
        type: 'custom',
        name: 'Versand innerhalb DE',
        quantity: 1,
        unitPrice: 24.9,
      },
      {
        lineItemId: 'c-6',
        type: 'custom',
        name: 'Verpackung',
        quantity: 1,
      },
    ],
  },
  {
    lineItemId: 'grp-4',
    type: 'folder',
    name: 'Sonstiges',
    children: [
      {
        lineItemId: 'c-7',
        type: 'custom',
        name: 'Gesamtrabatt',
        quantity: 1,
        unitPrice: -150.0,
      },
      {
        lineItemId: 'c-8',
        type: 'custom',
        name: 'Notiz: Angebot gültig bis 31.12.2025',
        quantity: 1,
        draggable: false,
      },
    ],
  },
];

let version = 0;
const subscribers = new Set<() => void>();
function notify() { version++; subscribers.forEach((l) => l()); }

export function useGetLineItemsQuery(_: undefined) {
  React.useSyncExternalStore(
    (listener) => { subscribers.add(listener); return () => { subscribers.delete(listener); }; },
    () => version,
    () => version
  );
  return { data: sampleData, isLoading: false, error: undefined as unknown };
}

export type MoveLineItemsInput = {
  selectedLineItemIds: (string | number)[];
  parentLineItemId: string | number | null;
  previousLineItem: 'FIRST' | 'LAST' | { lineItemId: string | number };
};

export function useMoveLineItemsMutation(): [
  (input: MoveLineItemsInput) => Promise<void>,
  { isLoading: boolean; error?: unknown }
] {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>();

  const mutate = React.useCallback(async (input: MoveLineItemsInput) => {
    setLoading(true);
    setError(undefined);
    try {
      await new Promise((res) => setTimeout(res, 200));
      console.log('moveLineItems', input);
      notify();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return [mutate, { isLoading, error }];
}

export type UpdateLineItemInput = {
  lineItemId: string | number;
  properties: Partial<Pick<LineItem, 'name' | 'quantity' | 'unitPrice'>> & Record<string, unknown>;
};

export function useUpdateLineItemMutation(): [
  (input: UpdateLineItemInput) => Promise<void>,
  { isLoading: boolean; error?: unknown }
] {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>();

  const mutate = React.useCallback(async (input: UpdateLineItemInput) => {
    setLoading(true);
    setError(undefined);
    try {
      await new Promise((res) => setTimeout(res, 120));
      const apply = (list: LineItem[] | undefined): boolean => {
        if (!list) return false;
        for (const item of list) {
          if (item.lineItemId === input.lineItemId) {
            Object.assign(item as any, input.properties);
            return true;
          }
          if (apply(item.children)) return true;
        }
        return false;
      };
      apply(sampleData);
      console.log('updateLineItem', input);
      notify();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return [mutate, { isLoading, error }];
}

export type DeleteLineItemsInput = {
  selectedLineItemIds: (string | number)[];
};

export function useDeleteLineItemsMutation(): [
  (input: DeleteLineItemsInput) => Promise<void>,
  { isLoading: boolean; error?: unknown }
] {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>();

  const mutate = React.useCallback(async (input: DeleteLineItemsInput) => {
    setLoading(true);
    setError(undefined);
    try {
      await new Promise((res) => setTimeout(res, 120));
      const ids = new Set(input.selectedLineItemIds.map(String));

      const removeFrom = (list: LineItem[] | undefined): LineItem[] | undefined => {
        if (!list) return list;
        const next: LineItem[] = [];
        for (const item of list) {
          if (ids.has(String(item.lineItemId))) {
            continue;
          }
          const children = removeFrom(item.children);
          next.push({ ...item, children });
        }
        return next;
      };

      const next = removeFrom(sampleData) || [];
      sampleData.splice(0, sampleData.length, ...next);
      console.log('deleteLineItems', input);
      notify();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return [mutate, { isLoading, error }];
}

export type DuplicateLineItemsInput = {
  selectedLineItemIds: (string | number)[];
};

export function useDuplicateLineItemsMutation(): [
  (input: DuplicateLineItemsInput) => Promise<void>,
  { isLoading: boolean; error?: unknown }
] {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>();

  const mutate = React.useCallback(async (input: DuplicateLineItemsInput) => {
    setLoading(true);
    setError(undefined);
    try {
      await new Promise((res) => setTimeout(res, 120));

      let counter = 0;
      const newId = (oldId: string | number): string => `${String(oldId)}-copy-${++counter}`;

      const cloneWithNewIds = (node: LineItem): LineItem => ({
        ...node,
        lineItemId: newId(node.lineItemId),
        children: node.children?.map(cloneWithNewIds),
      });

      const byId = new Set(input.selectedLineItemIds.map(String));

      const duplicateIn = (list: LineItem[] | undefined) => {
        if (!list) return;
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          if (byId.has(String(item.lineItemId))) {
            const copy = cloneWithNewIds(item);
            list.splice(i + 1, 0, copy);
            i++;
          }
          duplicateIn(item.children);
        }
      };

      duplicateIn(sampleData);
      console.log('duplicateLineItems', input);
      notify();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return [mutate, { isLoading, error }];
}
