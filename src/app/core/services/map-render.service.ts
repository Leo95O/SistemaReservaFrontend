import { Injectable, OnDestroy, signal, computed, WritableSignal, Signal } from '@angular/core';

// Interfaces (Asumo que existen según tu contexto)
import { Zone } from '../models/zone.interface';

@Injectable({
  providedIn: 'root'
})
export class MapRenderService implements OnDestroy {

  // --- STATE SIGNALS ---
  
  /** Ancho del contenedor HTML (div) en píxeles */
  private containerWidth: WritableSignal<number> = signal<number>(0);

  /** Ancho real de la zona física en METROS */
  private zoneWidthMeters: WritableSignal<number> = signal<number>(0);

  /** * Referencia al ResizeObserver para limpiarlo al destruir el servicio 
   * (o desconectar una vista).
   */
  private resizeObserver: ResizeObserver | null = null;

  // --- COMPUTED SIGNALS (El "Cerebro") ---

  /**
   * FACTOR DE ESCALA (px por metro).
   * Se recalcula automáticamente si cambia el ancho del contenedor o el ancho de la zona.
   * * Ejemplo: 
   * Si el contenedor es 1000px y la zona mide 10m -> Scale = 100 px/m.
   * Una mesa de 1m se dibujará de 100px.
   */
  readonly scaleFactor: Signal<number> = computed(() => {
    const cw = this.containerWidth();
    const zw = this.zoneWidthMeters();
    
    // Evitamos división por cero al inicio
    if (zw <= 0) return 1; 
    
    return cw / zw;
  });

  constructor() {
    // Constructor limpio. La inicialización es explícita.
  }

  // --- MÉTODOS DE INICIALIZACIÓN ---

  /**
   * Inicializa el servicio vinculándolo a un contenedor HTML y a los datos de la zona.
   * Activa el "ojo" del ResizeObserver.
   * * @param containerElement El elemento HTML donde vivirá el Canvas (Konva).
   * @param zone La data de la zona (traída del backend).
   */
  init(containerElement: HTMLElement, zone: Zone): void {
    // 1. Seteamos la verdad base de la zona (Metros)
    this.zoneWidthMeters.set(zone.width);

    // 2. Medición inicial del contenedor
    this.updateContainerDimensions(containerElement);

    // 3. Configurar Observador para cambios de tamaño (Responsive real)
    this.disconnectObserver(); // Seguridad por si se llama doble vez
    
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Usamos contentRect para precisión
        const width = entry.contentRect.width;
        // Solo actualizamos si hay un cambio real para evitar ciclos
        if (width !== this.containerWidth()) {
          this.containerWidth.set(width);
        }
      }
    });

    this.resizeObserver.observe(containerElement);
  }

  // --- CONVERSORES MATEMÁTICOS (Utilities) ---

  /**
   * Convierte Metros Reales -> Píxeles de Pantalla.
   * Úsalo para dibujar: x, y, width, height.
   */
  metersToPixels(meters: number): number {
    return meters * this.scaleFactor();
  }

  /**
   * Convierte Píxeles de Pantalla -> Metros Reales.
   * Úsalo para guardar: Cuando el Admin suelta una mesa (drop),
   * convertimos la posición del mouse a metros para el Backend.
   */
  pixelsToMeters(pixels: number): number {
    const scale = this.scaleFactor();
    if (scale === 0) return 0;
    // Limitamos a 2 decimales para limpieza en BD, o dejamos raw según preferencia.
    // Para física exacta, mejor retornar raw.
    return pixels / scale;
  }

  /**
   * Devuelve las dimensiones calculadas para el Stage de Konva.
   * Basado en la relación de aspecto de la zona real.
   */
  getStageDimensions(zoneHeightMeters: number): { width: number, height: number } {
    const scale = this.scaleFactor();
    return {
      width: this.containerWidth(),
      height: zoneHeightMeters * scale
    };
  }

  // --- LIMPIEZA ---

  private updateContainerDimensions(element: HTMLElement) {
    const { width } = element.getBoundingClientRect();
    this.containerWidth.set(width);
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