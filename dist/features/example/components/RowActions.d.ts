import type { RowModel } from '../../../components/GenericTreeTable/genericTreeTable.types';
export type RowActionsProps<T extends object = {}> = {
    row: RowModel<T> & {
        permission?: boolean;
        configurationPermission?: boolean;
        propertyPermissions?: Partial<Record<'name' | 'quantity' | 'unitPrice', boolean>>;
    };
    isDuplicating: boolean;
    isDeleting: boolean;
    confirmDelete?: boolean;
    onEdit: () => void;
    onDuplicate: () => void | Promise<void>;
    onDelete: () => void | Promise<void>;
};
export default function RowActions<T extends object = {}>({ row, isDuplicating, isDeleting, confirmDelete, onEdit, onDuplicate, onDelete, }: RowActionsProps<T>): import("react/jsx-runtime").JSX.Element | null;
