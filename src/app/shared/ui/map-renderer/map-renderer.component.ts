import { 
  Component, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  Input, 
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
  standalone: false, // 👈 ¡ESTA LÍNEA ES LA SOLUCIÓN!
  templateUrl: './map-renderer.component.html',
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .map-container { width: 100%; height: 100%; background-color: #f3f4f6; overflow: hidden; }
  `]
})
export class MapRendererComponent implements AfterViewInit, OnDestroy, OnChanges {
  
  @Input({ required: true }) zoneData!: Zone;
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private mapService = inject(MapRenderService);
  private ngZone = inject(NgZone);

  // Instancias de Konva
  private stage: Konva.Stage | null = null;
  private gridLayer: Konva.Layer | null = null;
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

    for (let i = 0; i <= widthMeters; i++) {
      this.gridLayer.add(new Konva.Line({
        points: [i * stepPixels, 0, i * stepPixels, this.stage.height()],
        stroke: '#e5e7eb', strokeWidth: 1, listening: false
      }));
    }
    for (let j = 0; j <= heightMeters; j++) {
      this.gridLayer.add(new Konva.Line({
        points: [0, j * stepPixels, this.stage.width(), j * stepPixels],
        stroke: '#e5e7eb', strokeWidth: 1, listening: false
      }));
    }
  }

  private drawTables(): void {
    if (!this.tablesLayer || !this.zoneData.tables) return;
    this.tablesLayer.destroyChildren();

    this.zoneData.tables.forEach(table => {
      const xPx = this.mapService.metersToPixels(table.x);
      const yPx = this.mapService.metersToPixels(table.y);
      const wPx = this.mapService.metersToPixels(table.width);
      const hPx = this.mapService.metersToPixels(table.height);

      const group = new Konva.Group({
        x: xPx,
        y: yPx,
        rotation: table.rotation,
        draggable: true,
        id: table.id
      });

      let shape: Konva.Shape;
      
      if (table.shape === 'circle') {
        shape = new Konva.Circle({
          radius: wPx / 2,
          fill: '#ffffff',
          stroke: '#333',
          strokeWidth: 2,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOpacity: 0.2
        });
      } else {
        shape = new Konva.Rect({
          width: wPx,
          height: hPx,
          fill: '#ffffff',
          stroke: '#333',
          strokeWidth: 2,
          cornerRadius: 4,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOpacity: 0.2,
          offset: { x: wPx/2, y: hPx/2 }
        });
      }

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
      this.tablesLayer?.add(group);
    });

    this.tablesLayer.batchDraw();
  }

  ngOnDestroy(): void {
    if (this.stage) this.stage.destroy();
  }
}