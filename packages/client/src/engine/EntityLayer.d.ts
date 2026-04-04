import { Camera } from './Camera';
export interface Entity {
    id: string;
    x: number;
    y: number;
    color: string;
    label?: string;
}
export declare class EntityLayer {
    private entities;
    upsert(entity: Entity): void;
    remove(id: string): void;
    get(id: string): Entity | undefined;
    all(): Entity[];
    render(ctx: CanvasRenderingContext2D, camera: Camera, tileSize: number): void;
}
//# sourceMappingURL=EntityLayer.d.ts.map