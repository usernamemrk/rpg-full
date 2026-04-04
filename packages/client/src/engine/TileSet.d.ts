export declare class TileSet {
    image: HTMLImageElement | null;
    tilesPerRow: number;
    load(src: string, tileSize: number): Promise<void>;
    drawTile(ctx: CanvasRenderingContext2D, index: number, dx: number, dy: number, tileSize: number): void;
}
//# sourceMappingURL=TileSet.d.ts.map