export type AmbientName = 'floresta' | 'caverna' | 'cidade' | 'dungeon' | 'batalha' | 'chuva';
export declare class AudioManager {
    private _context;
    private buffers;
    private currentSource;
    private currentGain;
    currentAmbient: AmbientName | null;
    private masterVolume;
    private get context();
    resume(): Promise<void>;
    private generateProcedural;
    loadAmbient(name: AmbientName): Promise<void>;
    crossfadeTo(name: AmbientName, durationMs?: number): Promise<void>;
    setVolume(v: number): void;
}
//# sourceMappingURL=AudioManager.d.ts.map