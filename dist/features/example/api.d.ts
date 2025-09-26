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
export declare function useGetLineItemsQuery(_: undefined): {
    data: LineItem[];
    isLoading: boolean;
    error: unknown;
};
export type MoveLineItemsInput = {
    selectedLineItemIds: (string | number)[];
    parentLineItemId: string | number | null;
    previousLineItem: 'FIRST' | 'LAST' | {
        lineItemId: string | number;
    };
};
export declare function useMoveLineItemsMutation(): [
    (input: MoveLineItemsInput) => Promise<void>,
    {
        isLoading: boolean;
        error?: unknown;
    }
];
export type UpdateLineItemInput = {
    lineItemId: string | number;
    properties: Partial<Pick<LineItem, 'name' | 'quantity' | 'unitPrice'>> & Record<string, unknown>;
};
export declare function useUpdateLineItemMutation(): [
    (input: UpdateLineItemInput) => Promise<void>,
    {
        isLoading: boolean;
        error?: unknown;
    }
];
export type DeleteLineItemsInput = {
    selectedLineItemIds: (string | number)[];
};
export declare function useDeleteLineItemsMutation(): [
    (input: DeleteLineItemsInput) => Promise<void>,
    {
        isLoading: boolean;
        error?: unknown;
    }
];
export type DuplicateLineItemsInput = {
    selectedLineItemIds: (string | number)[];
};
export declare function useDuplicateLineItemsMutation(): [
    (input: DuplicateLineItemsInput) => Promise<void>,
    {
        isLoading: boolean;
        error?: unknown;
    }
];
