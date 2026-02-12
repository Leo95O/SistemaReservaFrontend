import { 
  Component, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  Input, 
  OnDestroy, 
  effect, 
  inject,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import Konva from 'konva'; // Asegúrate de npm install konva @types/konva
import { MapRenderService } from '../../../core/services/map-render.service';
import { Zone } from '../../../core/models/zone.interface';

@Component({
  selector: 'app-map-renderer',
  templateUrl: './map-renderer.component.html',
  styleUrls: ['./map-renderer.component.scss']
})
export class MapRendererComponent implements AfterViewInit, OnDestroy, OnChanges {
  
  // --- INPUTS ---
  // Recibimos la Zona. Si cambia, debemos reinicializar el mapa.
  @Input({ required: true }) zone!: Zone;

  // --- VIEW CHILDREN ---
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  // --- SERVICIOS ---
  private mapService = inject(MapRenderService);

  // --- KONVA CORE ---
  private stage: Konva.Stage | null = null;
  private mainLayer: Konva.Layer | null = null;
  private gridLayer: Konva.Layer | null = null;

  constructor() {
    // EFECTO REACTIVO: Escucha cambios en el scaleFactor del servicio
    effect(() => {
      const scale = this.mapService.scaleFactor(); // Dependencia reactiva
      
      if (this.stage && scale > 0) {
        this.redrawScene();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['zone'] && !changes['zone'].firstChange) {
      // Si cambia la zona (ej: cambiamos de "Terraza" a "Salón"), reiniciamos todo
      this.initKonva();
    }
  }

  ngAfterViewInit(): void {
    // Inicializamos Konva solo cuando el DIV ya existe en el DOM
    this.initKonva();
  }

  private initKonva(): void {
    if (!this.mapContainer || !this.zone) return;

    // 1. Inicializar el "Cerebro Matemático" con el contenedor real
    this.mapService.init(this.mapContainer.nativeElement, this.zone);

    // 2. Destruir stage previo si existe (limpieza de memoria)
    if (this.stage) {
      this.stage.destroy();
    }

    // 3. Crear el Stage (Lienzo raíz)
    // Inicialmente con tamaño 0, el effect() lo ajustará inmediatamente
    this.stage = new Konva.Stage({
      container: this.mapContainer.nativeElement,
      width: this.mapContainer.nativeElement.offsetWidth,
      height: this.mapContainer.nativeElement.offsetHeight,
      draggable: true // Permitimos pan/zoom nativo de Konva
    });

    // 4. Crear capas (Layers)
    // GridLayer: Para el fondo (cuadrícula)
    // MainLayer: Para las mesas (objetos)
    this.gridLayer = new Konva.Layer();
    this.mainLayer = new Konva.Layer();

    this.stage.add(this.gridLayer);
    this.stage.add(this.mainLayer);

    // 5. Dibujar primera vez
    this.redrawScene();
  }

  /**
   * Redibuja toda la escena.
   * Se llama al inicio y cada vez que cambia el tamaño de pantalla (scaleFactor).
   */
  private redrawScene(): void {
    if (!this.stage || !this.gridLayer || !this.zone) return;

    // A. Actualizar dimensiones del Stage según el nuevo factor de escala
    const dims = this.mapService.getStageDimensions(this.zone.height);
    this.stage.width(dims.width);
    this.stage.height(dims.height);

    // B. Dibujar el Grid (Cuadrícula de 1x1 metro)
    this.drawGrid();
  }

  private drawGrid(): void {
    if (!this.gridLayer) return;
    
    this.gridLayer.destroyChildren(); // Limpiar grid anterior

    const widthMeters = this.zone.width;
    const heightMeters = this.zone.height;
    
    // Convertimos 1 metro a píxeles actuales
    const stepPixels = this.mapService.metersToPixels(1); 
    
    // Color suave para la cuadrícula
    const gridColor = '#e5e7eb'; // Tailwind gray-200

    // Líneas Verticales (cada 1 metro)
    for (let i = 0; i <= widthMeters; i++) {
      const x = i * stepPixels;
      this.gridLayer.add(new Konva.Line({
        points: [x, 0, x, this.stage.height()],
        stroke: gridColor,
        strokeWidth: 1,
        listening: false // Optimización: No capturar eventos de mouse en el grid
      }));
    }

    // Líneas Horizontales (cada 1 metro)
    for (let j = 0; j <= heightMeters; j++) {
      const y = j * stepPixels;
      this.gridLayer.add(new Konva.Line({
        points: [0, y, this.stage.width(), y],
        stroke: gridColor,
        strokeWidth: 1,
        listening: false
      }));
    }

    this.gridLayer.batchDraw(); // Renderizado eficiente
  }

  ngOnDestroy(): void {
    if (this.stage) {
      this.stage.destroy(); // Limpieza vital para evitar memory leaks
    }
  }
}