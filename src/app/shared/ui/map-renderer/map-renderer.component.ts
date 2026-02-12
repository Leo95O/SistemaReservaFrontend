import { 
  Component, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  Input, 
  Output,
  EventEmitter,
  OnDestroy, 
  effect, 
  inject, 
  NgZone, 
  OnChanges, 
  SimpleChanges 
} from '@angular/core';
import Konva from 'konva'; 
import { MapRenderService } from '../../../core/services/map-render.service';
import { Zone } from '../../../core/models/zone.interface';
import { Table } from '../../../core/models/table.interface';

@Component({
  selector: 'app-map-renderer',
  standalone: false,
  templateUrl: './map-renderer.component.html',
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
  `]
})
export class MapRendererComponent implements AfterViewInit, OnDestroy, OnChanges {
  
  // --- INPUTS ---
  @Input({ required: true }) zoneData!: Zone;
  @Input() mode: 'admin' | 'client' = 'client'; // Default: solo lectura

  // --- OUTPUTS ---
  @Output() tableChange = new EventEmitter<Table>(); // Emite al soltar (dragend)
  @Output() tableSelect = new EventEmitter<Table>(); // Emite al tocar (click)

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private mapService = inject(MapRenderService);
  private ngZone = inject(NgZone);

  // Konva Core
  private stage: Konva.Stage | null = null;
  private gridLayer: Konva.Layer | null = null;
  private tablesLayer: Konva.Layer | null = null;

  constructor() {
    // Reactividad: Si cambia la pantalla, redibujamos
    effect(() => {
      const scale = this.mapService.scaleFactor();
      this.ngZone.runOutsideAngular(() => {
        if (this.stage && scale > 0) {
          this.resizeStage();
          this.drawEverything();
        }
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambia la data o el modo (admin/client), redibujamos
    if (changes['zoneData'] && !changes['zoneData'].firstChange) {
      this.initKonva();
    }
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.drawTables(); // Solo redibujamos mesas para actualizar draggable
    }
  }

  ngAfterViewInit(): void {
    this.initKonva();
  }

  private initKonva(): void {
    if (!this.mapContainer || !this.zoneData) return;

    this.mapService.init(this.mapContainer.nativeElement, this.zoneData);

    if (this.stage) this.stage.destroy();

    this.ngZone.runOutsideAngular(() => {
      this.stage = new Konva.Stage({
        container: this.mapContainer.nativeElement,
        width: this.mapContainer.nativeElement.offsetWidth,
        height: this.mapContainer.nativeElement.offsetHeight,
        draggable: true // Pan del mapa
      });

      this.gridLayer = new Konva.Layer();
      this.tablesLayer = new Konva.Layer();

      this.stage.add(this.gridLayer);
      this.stage.add(this.tablesLayer);

      this.drawEverything();
    });
  }

  private resizeStage(): void {
    if (!this.stage || !this.zoneData) return;
    const dims = this.mapService.getStageDimensions(this.zoneData.height);
    this.stage.width(dims.width);
    this.stage.height(dims.height);
  }

  private drawEverything(): void {
    this.drawGrid();
    this.drawTables();
  }

  private drawGrid(): void {
    if (!this.gridLayer || !this.zoneData || !this.stage) return;
    this.gridLayer.destroyChildren();

    const widthMeters = this.zoneData.width;
    const heightMeters = this.zoneData.height;
    const stepPixels = this.mapService.metersToPixels(1);

    const gridColor = '#e5e7eb';

    // Líneas
    for (let i = 0; i <= widthMeters; i++) {
      this.gridLayer.add(new Konva.Line({
        points: [i * stepPixels, 0, i * stepPixels, this.stage.height()],
        stroke: gridColor, strokeWidth: 1, listening: false
      }));
    }
    for (let j = 0; j <= heightMeters; j++) {
      this.gridLayer.add(new Konva.Line({
        points: [0, j * stepPixels, this.stage.width(), j * stepPixels],
        stroke: gridColor, strokeWidth: 1, listening: false
      }));
    }
  }

  // --- LÓGICA CORE DE MESAS ---
  private drawTables(): void {
    if (!this.tablesLayer || !this.zoneData.tables) return;
    this.tablesLayer.destroyChildren();

    const isAdmin = this.mode === 'admin';

    this.zoneData.tables.forEach(table => {
      // 1. Conversión M -> PX
      const xPx = this.mapService.metersToPixels(table.x);
      const yPx = this.mapService.metersToPixels(table.y);
      const wPx = this.mapService.metersToPixels(table.width);
      const hPx = this.mapService.metersToPixels(table.height);

      const group = new Konva.Group({
        x: xPx,
        y: yPx,
        rotation: table.rotation,
        draggable: isAdmin, // Solo admin puede arrastrar
        id: table.id,
        name: 'table-group'
      });

      // 2. Forma Visual
      let shape: Konva.Shape;
      const commonProps = {
        fill: '#ffffff',
        stroke: '#333',
        strokeWidth: 2,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOpacity: 0.2
      };

      if (table.shape === 'circle') {
        shape = new Konva.Circle({
          ...commonProps,
          radius: wPx / 2
        });
      } else {
        shape = new Konva.Rect({
          ...commonProps,
          width: wPx,
          height: hPx,
          cornerRadius: 4,
          offset: { x: wPx/2, y: hPx/2 } // Pivote central
        });
      }

      // 3. Texto
      const text = new Konva.Text({
        text: table.code,
        fontSize: 14,
        fontFamily: 'Arial',
        fill: '#333',
        align: 'center',
        verticalAlign: 'middle'
      });
      text.offsetX(text.width() / 2);
      text.offsetY(text.height() / 2);

      group.add(shape);
      group.add(text);

      // --- EVENTOS (Interacción) ---
      
      // A. UX Cursor
      group.on('mouseenter', () => {
        if (this.stage) this.stage.container().style.cursor = isAdmin ? 'move' : 'pointer';
      });
      group.on('mouseleave', () => {
        if (this.stage) this.stage.container().style.cursor = 'default';
      });

      // B. Selección (Click/Tap)
      group.on('click tap', () => {
        // Ejecutamos dentro de NgZone para que Angular detecte el Output
        this.ngZone.run(() => {
          this.tableSelect.emit(table);
        });
      });

      // C. Drag End (Solo Admin)
      if (isAdmin) {
        group.on('dragend', (e) => {
          const node = e.target;
          
          // 1. Obtener Píxeles Finales
          const finalX = node.x();
          const finalY = node.y();

          // 2. Convertir a Metros
          const rawMetersX = this.mapService.pixelsToMeters(finalX);
          const rawMetersY = this.mapService.pixelsToMeters(finalY);

          // 3. Snap to Grid (0.1m)
          // Ejemplo: 1.234 -> 1.2, 5.58 -> 5.6
          const snappedX = Math.round(rawMetersX * 10) / 10;
          const snappedY = Math.round(rawMetersY * 10) / 10;

          // 4. Corrección Visual (Snap visual inmediato)
          const snappedPxX = this.mapService.metersToPixels(snappedX);
          const snappedPxY = this.mapService.metersToPixels(snappedY);
          
          node.position({ x: snappedPxX, y: snappedPxY });
          this.tablesLayer?.batchDraw(); // Redibujar posición ajustada

          // 5. Emitir cambio al padre (Angular)
          this.ngZone.run(() => {
            // Creamos un nuevo objeto con las coordenadas actualizadas
            const updatedTable: Table = {
              ...table,
              x: snappedX,
              y: snappedY
            };
            this.tableChange.emit(updatedTable);
          });
        });
      }

      this.tablesLayer?.add(group);
    });

    this.tablesLayer.batchDraw();
  }

  ngOnDestroy(): void {
    if (this.stage) this.stage.destroy();
  }
}