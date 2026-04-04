import { Camera } from './Camera';
export declare class SpellFX {
    private createPhaserScene;
    private cleanup;
    lightning(worldX: number, worldY: number, worldTargetX: number, worldTargetY: number, camera: Camera): Promise<void>;
    explosion(worldX: number, worldY: number, camera: Camera, radius?: number): Promise<void>;
    healing(worldX: number, worldY: number, camera: Camera): Promise<void>;
}
//# sourceMappingURL=SpellFX.d.ts.map