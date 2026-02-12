import { Injectable, OnDestroy, signal, computed, WritableSignal } from '@angular/core';
import { Zone } from '../models/zone.interface';

@Injectable({
  providedIn: 'root'
})
export class MapRenderService implements OnDestroy {

  // Estado Reactivo (Signals)
  private containerWidth: WritableSignal<number> = signal<number>(0);
  private zoneWidthMeters: WritableSignal<number> = signal<number>(1); // Iniciamos en 1 para evitar división por 0

  private resizeObserver: ResizeObserver | null = null;

  // --- CÁLCULO MAESTRO ---
  // Calcula cuántos píxeles vale 1 metro.
  // Se actualiza solo si cambia el ancho de pantalla o la zona.
  readonly scaleFactor = computed(() => {
    const cw = this.containerWidth();
    const zw = this.zoneWidthMeters();
    return zw > 0 ? cw / zw : 1;
  });

  constructor() {}

  // 1. Inicialización
  init(container: HTMLElement, zone: Zone): void {
    this.zoneWidthMeters.set(zone.width);
    this.updateDimensions(container);

    // Observador de cambios de tamaño (Responsive real)
    this.disconnectObserver();
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Usamos contentRect para precisión decimal
        if (entry.contentRect.width !== this.containerWidth()) {
          this.containerWidth.set(entry.contentRect.width);
        }
      }
    });
    this.resizeObserver.observe(container);
  }

  // 2. Conversores (Utilities)
  metersToPixels(meters: number): number {
    return meters * this.scaleFactor();
  }

  pixelsToMeters(pixels: number): number {
    const scale = this.scaleFactor();
    return scale > 0 ? pixels / scale : 0;
  }

  // Calcula altura del canvas manteniendo el Aspect Ratio
  getStageDimensions(zoneHeightMeters: number): { width: number, height: number } {
    return {
      width: this.containerWidth(),
      height: zoneHeightMeters * this.scaleFactor()
    };
  }

  private updateDimensions(element: HTMLElement) {
    this.containerWidth.set(element.getBoundingClientRect().width);
  }

  private disconnectObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
  }
}