import { 
  Component, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter,
  OnDestroy, effect, inject, NgZone, OnChanges, SimpleChanges 
} from '@angular/core';
import Konva from 'konva'; 
import { MapRenderService } from '../../../core/services/map-render.service';
import { Zone } from '../../../core/models/zone.interface';
import { Table } from '../../../core/models/table.interface';
import { Wall } from '../../../core/models/blueprint.interface';


@Component({
  selector: 'app-map-renderer',
  standalone: false,
  templateUrl: './map-renderer.component.html',
  styles: [`:host { display: block; width: 100%; height: 100%; }`]
})
export class MapRendererComponent implements AfterViewInit, OnDestroy, OnChanges {
  
  @Input({ required: true }) zoneData!: Zone;
  @Input() mode: 'admin' | 'client' = 'client';

  @Output() tableChange = new EventEmitter<Table>();
  @Output() tableSelect = new EventEmitter<Table>();
  @Output() tableAdd = new EventEmitter<Table>();

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private mapService = inject(MapRenderService);
  private ngZone = inject(NgZone);

  private stage: Konva.Stage | null = null;
  private gridLayer: Konva.Layer | null = null;
  private wallsLayer: Konva.Layer | null = null; // 👈 NUEVA CAPA
  private tablesLayer: Konva.Layer | null = null;

  constructor() {
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
    if (changes['zoneData'] && !changes['zoneData'].firstChange) {
      this.initKonva();
    }
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.drawTables(); 
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
        draggable: true
      });

      // ORDEN DE CAPAS (Importante: El último añadido queda encima)
      this.gridLayer = new Konva.Layer();
      this.wallsLayer = new Konva.Layer(); // Muros debajo de mesas
      this.tablesLayer = new Konva.Layer();

      this.stage.add(this.gridLayer);
      this.stage.add(this.wallsLayer);
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
    this.drawWalls(); // 👈 NUEVO MÉTODO
    this.drawTables();
  }

  // --- DIBUJADO DE WALLS (Solo Lectura) ---
  private drawWalls(): void {
    if (!this.wallsLayer || !this.zoneData.walls) return;
    this.wallsLayer.destroyChildren();

    const wallColor = '#374151'; // Gray-700
    const wallThickness = 6;

    this.zoneData.walls.forEach(wall => {
      // Conversión Metros -> Pixels
      const x1 = this.mapService.metersToPixels(wall.x1);
      const y1 = this.mapService.metersToPixels(wall.y1);
      const x2 = this.mapService.metersToPixels(wall.x2);
      const y2 = this.mapService.metersToPixels(wall.y2);

      const line = new Konva.Line({
        points: [x1, y1, x2, y2],
        stroke: wallColor,
        strokeWidth: wallThickness,
        lineCap: 'round',
        lineJoin: 'round',
        shadowColor: 'black',
        shadowBlur: 2,
        shadowOpacity: 0.3,
        shadowOffset: { x: 1, y: 1 }
      });

      this.wallsLayer?.add(line);
    });

    this.wallsLayer.batchDraw();
  }

  // ... (El resto de métodos drawGrid y drawTables se mantienen igual)
  
  private drawGrid(): void {
     // ... (Mismo código anterior)
     if (!this.gridLayer || !this.zoneData || !this.stage) return;
     this.gridLayer.destroyChildren();
     const widthMeters = this.zoneData.width;
     const heightMeters = this.zoneData.height;
     const stepPixels = this.mapService.metersToPixels(1);
     const gridColor = '#e5e7eb';
     for (let i = 0; i <= widthMeters; i++) {
       this.gridLayer.add(new Konva.Line({ points: [i * stepPixels, 0, i * stepPixels, this.stage.height()], stroke: gridColor, strokeWidth: 1, listening: false }));
     }
     for (let j = 0; j <= heightMeters; j++) {
       this.gridLayer.add(new Konva.Line({ points: [0, j * stepPixels, this.stage.width(), j * stepPixels], stroke: gridColor, strokeWidth: 1, listening: false }));
     }
  }

  private drawTables(): void {
    // ... (Mismo código anterior, asegúrate de tenerlo copiado)
    if (!this.tablesLayer || !this.zoneData.tables) return;
    this.tablesLayer.destroyChildren();
    const isAdmin = this.mode === 'admin';
    this.zoneData.tables.forEach(table => {
      const xPx = this.mapService.metersToPixels(table.x);
      const yPx = this.mapService.metersToPixels(table.y);
      const wPx = this.mapService.metersToPixels(table.width);
      const hPx = this.mapService.metersToPixels(table.height);
      const group = new Konva.Group({ x: xPx, y: yPx, rotation: table.rotation, draggable: isAdmin, id: table.id });
      let shape: Konva.Shape;
      if (table.shape === 'circle') {
        shape = new Konva.Circle({ radius: wPx / 2, fill: '#ffffff', stroke: '#333', strokeWidth: 2, shadowColor: 'black', shadowBlur: 5, shadowOpacity: 0.2 });
      } else {
        shape = new Konva.Rect({ width: wPx, height: hPx, cornerRadius: 4, fill: '#ffffff', stroke: '#333', strokeWidth: 2, shadowColor: 'black', shadowBlur: 5, shadowOpacity: 0.2, offset: { x: wPx/2, y: hPx/2 } });
      }
      const text = new Konva.Text({ text: table.code, fontSize: 14, fontFamily: 'Arial', fill: '#333', align: 'center', verticalAlign: 'middle' });
      text.offsetX(text.width() / 2); text.offsetY(text.height() / 2);
      group.add(shape); group.add(text);
      
      if (isAdmin) {
          group.on('mouseenter', () => { if (this.stage) this.stage.container().style.cursor = 'move'; });
          group.on('mouseleave', () => { if (this.stage) this.stage.container().style.cursor = 'default'; });
          group.on('dragend', (e) => {
            const node = e.target;
            const finalX = node.x();
            const finalY = node.y();
            const rawMetersX = this.mapService.pixelsToMeters(finalX);
            const rawMetersY = this.mapService.pixelsToMeters(finalY);
            const snappedX = Math.round(rawMetersX * 10) / 10;
            const snappedY = Math.round(rawMetersY * 10) / 10;
            const snappedPxX = this.mapService.metersToPixels(snappedX);
            const snappedPxY = this.mapService.metersToPixels(snappedY);
            node.position({ x: snappedPxX, y: snappedPxY });
            this.tablesLayer?.batchDraw();
            this.ngZone.run(() => {
                const updatedTable: Table = { ...table, x: snappedX, y: snappedY };
                this.tableChange.emit(updatedTable);
            });
          });
      }
      group.on('click tap', () => { this.ngZone.run(() => { this.tableSelect.emit(table); }); });
      this.tablesLayer?.add(group);
    });
    this.tablesLayer.batchDraw();
  }

  ngOnDestroy(): void {
    if (this.stage) this.stage.destroy();
  }
}