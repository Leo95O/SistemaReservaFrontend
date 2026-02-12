import { 
  Component, ElementRef, ViewChild, AfterViewInit, 
  OnDestroy, inject, NgZone, OnInit 
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import Konva from 'konva';
import { MapRenderService } from '../../../../core/services/map-render.service';
import { BlueprintService } from '../../../../core/services/blueprints.service';
import { Wall } from '../../../../core/models/blueprint.interface';

@Component({
  selector: 'app-blueprint-editor',
  standalone: false,
  templateUrl: './blueprint-editor.component.html'
})
export class BlueprintEditorComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('editorContainer') containerRef!: ElementRef<HTMLDivElement>;

  // --- INYECCIONES ---
  private mapService = inject(MapRenderService);
  private bpService = inject(BlueprintService);
  private ngZone = inject(NgZone);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);

  // --- ESTADO ---
  currentBlueprintId: string | null = null;
  walls: Wall[] = []; // Fuente de la verdad (en Metros)
  isDrawing = false;
  startPoint: { x: number, y: number } | null = null;
  isLoading = true;

  // --- KONVA CORE ---
  private stage: Konva.Stage | null = null;
  private gridLayer: Konva.Layer | null = null;
  private wallsLayer: Konva.Layer | null = null;
  private tempLayer: Konva.Layer | null = null;

  // --- CONFIGURACIÓN ---
  private readonly SNAP_THRESHOLD = 10;
  private readonly WALL_THICKNESS = 6;
  private readonly WALL_COLOR = '#374151'; // Gray-700
  
  // Configuración base para inicializar escala (20x15m por defecto)
  private zoneConfig = { width: 20, height: 15 }; 

  constructor() {}

  // 1. INICIALIZACIÓN
  ngOnInit() {
    // Obtener ID de la URL (ej: /blueprint-editor/123)
    this.currentBlueprintId = this.route.snapshot.paramMap.get('id');
  }

  ngAfterViewInit() {
    this.initKonva();
    
    // Si hay ID, cargar datos del backend
    if (this.currentBlueprintId) {
      this.loadBlueprintData(this.currentBlueprintId);
    } else {
      this.isLoading = false; // Modo "Nuevo Plano"
    }
  }

  private initKonva() {
    if (!this.containerRef) return;

    // Inicializar servicio de escala
    this.mapService.init(this.containerRef.nativeElement, this.zoneConfig as any);

    this.stage = new Konva.Stage({
      container: this.containerRef.nativeElement,
      width: this.containerRef.nativeElement.offsetWidth,
      height: this.containerRef.nativeElement.offsetHeight,
    });

    // Crear capas
    this.gridLayer = new Konva.Layer();
    this.wallsLayer = new Konva.Layer();
    this.tempLayer = new Konva.Layer();

    this.stage.add(this.gridLayer);
    this.stage.add(this.wallsLayer);
    this.stage.add(this.tempLayer);

    this.drawGrid();

    // Event Listeners (Dibujo)
    this.stage.on('mousedown touchstart', (e) => this.handleMouseDown(e));
    this.stage.on('mousemove touchmove', (e) => this.handleMouseMove(e));
    this.stage.on('mouseup touchend', () => this.handleMouseUp());
  }

  // 2. LÓGICA DE CARGA (BACKEND -> FRONTEND)
  private loadBlueprintData(id: string) {
    this.isLoading = true;
    this.bpService.getOne(id).subscribe({
      next: (blueprint) => {
        this.walls = blueprint.walls || [];
        
        // Dibujar muros existentes
        this.walls.forEach(wall => {
          const x1 = this.mapService.metersToPixels(wall.x1);
          const y1 = this.mapService.metersToPixels(wall.y1);
          const x2 = this.mapService.metersToPixels(wall.x2);
          const y2 = this.mapService.metersToPixels(wall.y2);
          this.drawPermanentWall(x1, y1, x2, y2);
        });
        
        this.isLoading = false;
        this.presentToast('Plano cargado', 'success');
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.presentToast('Error al cargar plano', 'danger');
      }
    });
  }

  // 3. LÓGICA DE DIBUJO (MÁQUINA DE ESTADOS)
  private handleMouseDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    // Solo clic izquierdo
    if (e.evt instanceof MouseEvent && e.evt.button !== 0) return;

    const pos = this.stage?.getPointerPosition();
    if (!pos) return;

    this.isDrawing = true;
    this.startPoint = { x: pos.x, y: pos.y };

    // Feedback visual (punto inicio)
    const anchor = new Konva.Circle({
      x: pos.x, y: pos.y, radius: 4, fill: '#2563EB', opacity: 0.5
    });
    this.tempLayer?.add(anchor);
  }

  private handleMouseMove(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!this.isDrawing || !this.startPoint || !this.stage) return;
    
    this.ngZone.runOutsideAngular(() => {
      const currentPos = this.stage!.getPointerPosition();
      if (!currentPos) return;

      let endX = currentPos.x;
      let endY = currentPos.y;

      // --- SNAPPING (Ortogonalidad) ---
      const dx = endX - this.startPoint!.x;
      const dy = endY - this.startPoint!.y;
      const angleRad = Math.atan2(dy, dx);
      let angleDeg = angleRad * (180 / Math.PI);
      if (angleDeg < 0) angleDeg += 360;

      if (this.isNear(angleDeg, 0) || this.isNear(angleDeg, 360)) endY = this.startPoint!.y; 
      else if (this.isNear(angleDeg, 90)) endX = this.startPoint!.x; 
      else if (this.isNear(angleDeg, 180)) endY = this.startPoint!.y; 
      else if (this.isNear(angleDeg, 270)) endX = this.startPoint!.x; 

      // Dibujar línea temporal
      this.tempLayer?.destroyChildren();
      
      const line = new Konva.Line({
        points: [this.startPoint!.x, this.startPoint!.y, endX, endY],
        stroke: '#3B82F6',
        strokeWidth: this.WALL_THICKNESS,
        dash: [10, 5],
        opacity: 0.7
      });

      // Etiqueta de medida
      const lengthPx = Math.sqrt(Math.pow(endX - this.startPoint!.x, 2) + Math.pow(endY - this.startPoint!.y, 2));
      const lengthMeters = this.mapService.pixelsToMeters(lengthPx).toFixed(2);
      
      const label = new Konva.Label({
        x: (this.startPoint!.x + endX) / 2,
        y: (this.startPoint!.y + endY) / 2 - 20
      });
      label.add(new Konva.Tag({ fill: 'black', cornerRadius: 4 }));
      label.add(new Konva.Text({ text: `${lengthMeters}m`, fontSize: 12, padding: 4, fill: 'white' }));

      this.tempLayer?.add(line);
      this.tempLayer?.add(label);
      this.tempLayer?.batchDraw();
    });
  }

  private handleMouseUp() {
    if (!this.isDrawing || !this.startPoint || !this.tempLayer) return;

    // Obtener la línea final (con snap aplicado)
    const line = this.tempLayer.findOne('Line') as Konva.Line;
    
    if (line) {
      const points = line.points();
      const x1Px = points[0];
      const y1Px = points[1];
      const x2Px = points[2];
      const y2Px = points[3];

      // Mínimo 10px para evitar clics accidentales
      const dist = Math.sqrt(Math.pow(x2Px - x1Px, 2) + Math.pow(y2Px - y1Px, 2));
      if (dist > 10) {
        this.confirmWall(x1Px, y1Px, x2Px, y2Px);
      }
    }

    // Reset
    this.isDrawing = false;
    this.startPoint = null;
    this.tempLayer.destroyChildren();
    this.tempLayer.draw();
  }

  private confirmWall(x1Px: number, y1Px: number, x2Px: number, y2Px: number) {
     // 1. Convertir a Metros
     const x1 = this.mapService.pixelsToMeters(x1Px);
     const y1 = this.mapService.pixelsToMeters(y1Px);
     const x2 = this.mapService.pixelsToMeters(x2Px);
     const y2 = this.mapService.pixelsToMeters(y2Px);
     
     // 2. Calcular datos
     const length = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
     const angle = Math.atan2(y2-y1, x2-x1) * (180/Math.PI);

     const newWall: Wall = { x1, y1, x2, y2, length, angle };
     
     // 3. Guardar en memoria
     this.ngZone.run(() => this.walls.push(newWall));
     
     // 4. Dibujar permanente
     this.drawPermanentWall(x1Px, y1Px, x2Px, y2Px);
  }

  private drawPermanentWall(x1: number, y1: number, x2: number, y2: number) {
    const wallLine = new Konva.Line({
      points: [x1, y1, x2, y2],
      stroke: this.WALL_COLOR,
      strokeWidth: this.WALL_THICKNESS,
      lineCap: 'round',
      lineJoin: 'round'
    });
    const node1 = new Konva.Circle({ x: x1, y: y1, radius: 3, fill: '#9CA3AF' });
    const node2 = new Konva.Circle({ x: x2, y: y2, radius: 3, fill: '#9CA3AF' });

    this.wallsLayer?.add(wallLine);
    this.wallsLayer?.add(node1);
    this.wallsLayer?.add(node2);
    this.wallsLayer?.batchDraw();
  }

  // 4. LÓGICA DE GUARDADO (FRONTEND -> BACKEND)
  async saveBlueprint() {
    if (!this.currentBlueprintId) {
      this.presentToast('Error: No hay ID de plano', 'warning');
      return;
    }
    if (!this.stage) return;

    // Generar captura
    const previewUrl = this.stage.toDataURL({
      mimeType: 'image/jpeg',
      quality: 0.8,
      pixelRatio: 0.5 
    });

    this.bpService.updateLayout(this.currentBlueprintId, this.walls, previewUrl).subscribe({
      next: () => this.presentToast('✅ Plano guardado', 'success'),
      error: (err) => {
        console.error(err);
        this.presentToast('❌ Error al guardar', 'danger');
      }
    });
  }

  // --- UTILIDADES ---
  private drawGrid() {
    if (!this.gridLayer || !this.stage) return;
    const width = this.stage.width();
    const height = this.stage.height();
    const step = this.mapService.metersToPixels(1);

    for (let i = 0; i < width / step; i++) {
      this.gridLayer.add(new Konva.Line({
        points: [i * step, 0, i * step, height],
        stroke: '#E5E7EB', strokeWidth: 1
      }));
    }
    for (let j = 0; j < height / step; j++) {
      this.gridLayer.add(new Konva.Line({
        points: [0, j * step, width, j * step],
        stroke: '#E5E7EB', strokeWidth: 1
      }));
    }
    this.gridLayer.batchDraw();
  }

  private isNear(value: number, target: number): boolean {
    return Math.abs(value - target) <= this.SNAP_THRESHOLD;
  }

  clearAll() {
    this.walls = [];
    this.wallsLayer?.destroyChildren();
    this.wallsLayer?.batchDraw();
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message, duration: 2000, color, position: 'bottom'
    });
    await toast.present();
  }

  ngOnDestroy() {
    this.stage?.destroy();
  }
}