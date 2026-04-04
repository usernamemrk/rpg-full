interface Entry {
    itemId: string;
    quantity: {
        min: number;
        max: number;
    };
    weight: number;
}
interface LootTable {
    mode: 'single_use' | 'infinite';
    guaranteed_min: number;
    entries: Entry[];
}
interface Props {
    chestId: string;
    initialTable: LootTable;
    token: string;
    onSave?: () => void;
    onClose: () => void;
}
export default function ChestEditor({ chestId, initialTable, token, onSave, onClose }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ChestEditor.d.ts.map