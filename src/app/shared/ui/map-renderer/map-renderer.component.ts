import { 
  Component, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter,
  OnDestroy, effect, inject, NgZone, OnChanges, SimpleChanges, HostListener 
} from '@angular/core';
import Konva from 'konva'; 
import { MapRenderService } from '../../../core/services/map-render.service';
import { Zone } from '../../../core/models/zone.interface';
import { Table } from '../../../core/models/table.interface';

@Component({
  selector: 'app-map-renderer',
  standalone: false,
  templateUrl: './map-renderer.component.html',
  styles: [`:host { display: block; width: 100%; height: 100%; }`]
})
export class MapRendererComponent implements AfterViewInit, OnDestroy, OnChanges {
  
  // --- INPUTS ---
  @Input({ required: true }) zoneData!: Zone;
  @Input() mode: 'admin' | 'client' = 'client';
  
  // Nuevos inputs para el Cliente
  @Input() occupiedTableIds: string[] = []; // IDs que vienen del backend como ocupados
  @Input() selectedTableIds: string[] = []; // IDs que el usuario está seleccionando

  // --- OUTPUTS ---
  @Output() tableChange = new EventEmitter<Table>();
  @Output() tableSelect = new EventEmitter<Table>();
  @Output() tableAdd = new EventEmitter<Table>(); 

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private mapService = inject(MapRenderService);
  private ngZone = inject(NgZone);

  // Konva Core
  private stage: Konva.Stage | null = null;
  private gridLayer: Konva.Layer | null = null;
  private wallsLayer: Konva.Layer | null = null;
  private tablesLayer: Konva.Layer | null = null;

  constructor() {
    // Efecto para redimensionar si cambia el tamaño de pantalla
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
      // 1. Si cambia la zona completa -> Reiniciar todo
      if (changes['zoneData'] && !changes['zoneData'].firstChange) {
        this.initKonva();
      }
      
      // 2. Si cambia el modo -> Redibujar mesas (para activar/desactivar drag)
      if (changes['mode'] && !changes['mode'].firstChange) {
        this.drawTables();
      }

      // 3. Si cambian los estados visuales (ocupado/seleccionado) -> Solo redibujar mesas
      if (changes['occupiedTableIds'] || changes['selectedTableIds']) {
        this.drawTables();
      }
  }
  
  ngAfterViewInit(): void { this.initKonva(); }

  private initKonva(): void {
    if (!this.mapContainer || !this.zoneData) return;
    this.mapService.init(this.mapContainer.nativeElement, this.zoneData);
    
    if (this.stage) this.stage.destroy();
    
    this.ngZone.runOutsideAngular(() => {
        this.stage = new Konva.Stage({
            container: this.mapContainer.nativeElement,
            width: this.mapContainer.nativeElement.offsetWidth,
            height: this.mapContainer.nativeElement.offsetHeight,
            draggable: true // Permitir pan/zoom del mapa completo
        });
        
        this.gridLayer = new Konva.Layer();
        this.wallsLayer = new Konva.Layer();
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
      this.drawWalls();
      this.drawTables();
  }

  private drawGrid(): void {
      if (!this.gridLayer || !this.zoneData || !this.stage) return;
      this.gridLayer.destroyChildren();
      
      const widthMeters = this.zoneData.width;
      const heightMeters = this.zoneData.height;
      const stepPixels = this.mapService.metersToPixels(1); // Grid de 1 metro
      
      // Líneas Verticales
      for (let i = 0; i <= widthMeters; i++) {
        this.gridLayer.add(new Konva.Line({ 
          points: [i * stepPixels, 0, i * stepPixels, this.stage.height()], 
          stroke: '#e5e7eb', strokeWidth: 1, listening: false 
        }));
      }
      // Líneas Horizontales
      for (let j = 0; j <= heightMeters; j++) {
        this.gridLayer.add(new Konva.Line({ 
          points: [0, j * stepPixels, this.stage.width(), j * stepPixels], 
          stroke: '#e5e7eb', strokeWidth: 1, listening: false 
        }));
      }
      this.gridLayer.batchDraw();
  }

  private drawWalls(): void {
      if (!this.wallsLayer || !this.zoneData.walls) return;
      this.wallsLayer.destroyChildren();
      
      this.zoneData.walls.forEach(wall => {
          const x1 = this.mapService.metersToPixels(wall.x1);
          const y1 = this.mapService.metersToPixels(wall.y1);
          const x2 = this.mapService.metersToPixels(wall.x2);
          const y2 = this.mapService.metersToPixels(wall.y2);
          
          this.wallsLayer?.add(new Konva.Line({ 
            points: [x1, y1, x2, y2], 
            stroke: '#374151', strokeWidth: 6, 
            lineCap: 'round', lineJoin: 'round' 
          }));
      });
      this.wallsLayer.batchDraw();
  }

  private drawTables(): void {
      if (!this.tablesLayer || !this.zoneData.tables) return;
      this.tablesLayer.destroyChildren();
      
      const isAdmin = this.mode === 'admin';

      this.zoneData.tables.forEach(table => {
          const xPx = this.mapService.metersToPixels(table.x);
          const yPx = this.mapService.metersToPixels(table.y);
          const wPx = this.mapService.metersToPixels(table.width);
          const hPx = this.mapService.metersToPixels(table.height);

          // --- LÓGICA DE ESTADO VISUAL ---
          const isOccupied = this.occupiedTableIds.includes(table.id);
          const isSelected = this.selectedTableIds.includes(table.id);

          let fillColor = '#ffffff'; // Default: Blanco
          let strokeColor = '#333333';
          
          if (isOccupied) {
            fillColor = '#EF4444'; // Rojo (Tailwind red-500)
            strokeColor = '#991B1B';
          } else if (isSelected) {
            fillColor = '#22C55E'; // Verde (Tailwind green-500)
            strokeColor = '#14532D';
          }

          // Grupo contenedor
          const group = new Konva.Group({ 
            x: xPx, y: yPx, rotation: table.rotation, 
            draggable: isAdmin, // Solo admin puede arrastrar
            id: table.id,
            opacity: isOccupied ? 0.6 : 1 // Las ocupadas un poco transparentes
          });
          
          // Forma (Círculo o Rectángulo)
          let shape: Konva.Shape;
          const commonProps = {
            fill: fillColor, stroke: strokeColor, strokeWidth: 2,
            shadowColor: 'black', shadowBlur: 5, shadowOpacity: 0.2
          };

          if (table.shape === 'circle') {
             shape = new Konva.Circle({ radius: wPx/2, ...commonProps });
          } else {
             shape = new Konva.Rect({ 
               width: wPx, height: hPx, cornerRadius: 4, 
               offset: { x: wPx/2, y: hPx/2 }, ...commonProps 
             });
          }
          
          // Etiqueta de texto (Código)
          const text = new Konva.Text({ 
            text: table.code, 
            fontSize: 14, 
            fontFamily: 'Arial',
            fill: isOccupied ? 'white' : '#333', // Texto blanco si el fondo es rojo
            align: 'center', verticalAlign: 'middle' 
          });
          text.offsetX(text.width()/2); 
          text.offsetY(text.height()/2);

          group.add(shape); 
          group.add(text);

          // --- EVENTOS ---
          if (isAdmin) {
              // Lógica Admin: Drag & Snap
              group.on('dragend', (e) => {
                  const node = e.target;
                  const rawX = this.mapService.pixelsToMeters(node.x());
                  const rawY = this.mapService.pixelsToMeters(node.y());
                  const snapX = Math.round(rawX * 10) / 10;
                  const snapY = Math.round(rawY * 10) / 10;
                  
                  // Snap Visual inmediato
                  node.position({ 
                    x: this.mapService.metersToPixels(snapX), 
                    y: this.mapService.metersToPixels(snapY) 
                  });
                  this.tablesLayer?.batchDraw();

                  // Emitir cambio
                  this.ngZone.run(() => this.tableChange.emit({ ...table, x: snapX, y: snapY }));
              });
              
              group.on('click tap', () => this.ngZone.run(() => this.tableSelect.emit(table)));
              group.on('mouseenter', () => this.stage!.container().style.cursor = 'grab');
              group.on('mouseleave', () => this.stage!.container().style.cursor = 'default');

          } else {
              // Lógica Cliente: Selección
              if (!isOccupied) {
                 group.on('click tap', () => {
                    this.ngZone.run(() => this.tableSelect.emit(table));
                 });
                 // Cursor pointer para mesas libres
                 group.on('mouseenter', () => this.stage!.container().style.cursor = 'pointer');
                 group.on('mouseleave', () => this.stage!.container().style.cursor = 'default');
              } else {
                 // Cursor "prohibido" para ocupadas
                 group.on('mouseenter', () => this.stage!.container().style.cursor = 'not-allowed');
                 group.on('mouseleave', () => this.stage!.container().style.cursor = 'default');
              }
          }

          this.tablesLayer?.add(group);
      });
      this.tablesLayer.batchDraw();
  }

  // --- ARRASTRAR DESDE HTML (ADMIN) ---

  @HostListener('dragover', ['$event'])
  onDragOver(e: DragEvent) {
    e.preventDefault(); 
    if (this.mode === 'admin') e.dataTransfer!.dropEffect = 'copy';
  }

  @HostListener('drop', ['$event'])
  onDrop(e: DragEvent) {
    e.preventDefault();
    if (this.mode !== 'admin' || !this.stage) return;

    const dataString = e.dataTransfer?.getData('application/json');
    if (!dataString) return;

    const furnitureData = JSON.parse(dataString); 

    this.stage.setPointersPositions(e);
    const pointer = this.stage.getPointerPosition();
    
    if (pointer) {
      // Ajustar por si el stage tiene desplazamiento
      const stageAttrs = this.stage.attrs;
      const x = (pointer.x - (stageAttrs.x || 0)) / (stageAttrs.scaleX || 1);
      const y = (pointer.y - (stageAttrs.y || 0)) / (stageAttrs.scaleY || 1);

      const metersX = this.mapService.pixelsToMeters(x);
      const metersY = this.mapService.pixelsToMeters(y);

      const snapX = Math.round(metersX * 10) / 10;
      const snapY = Math.round(metersY * 10) / 10;

      const newTable: Table = {
        id: crypto.randomUUID(), 
        code: 'NEW',
        x: snapX,
        y: snapY,
        width: furnitureData.width,
        height: furnitureData.height,
        seats: furnitureData.seats,
        shape: furnitureData.shape,
        rotation: 0
      };

      this.tableAdd.emit(newTable);
    }
  }

  ngOnDestroy(): void {
    if (this.stage) this.stage.destroy();
  }
}