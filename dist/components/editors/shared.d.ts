import type { SxProps, Theme } from "@mui/material/styles";
export declare function useCommitCancelHandlers(onCommit?: () => void, onCancel?: () => void): {
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onBlur: () => void | undefined;
};
export declare function useSelectOnAutoFocus<T extends HTMLInputElement>(autoFocus?: boolean): import("react").MutableRefObject<T | null>;
export declare const getOtherDecimal: (dec: string) => "." | ",";
export declare function countUnitsBeforeCaret(s: string, caretPos: number, dec: string, otherDec?: string): number;
export declare const compactTextFieldSx: SxProps<Theme>;
export declare function restoreCaretByUnits(input: HTMLInputElement, unitsLeft: number, dec: string, includeOtherDecimal?: boolean): void;
