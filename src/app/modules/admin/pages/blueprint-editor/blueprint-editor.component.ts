import { 
  Component, ElementRef, ViewChild, OnDestroy, inject, NgZone, OnInit 
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController, ViewDidEnter } from '@ionic/angular';
import Konva from 'konva';
import { MapRenderService } from '../../../../core/services/map-render.service';
import { BlueprintService } from '../../../../core/services/blueprints.service';
import { Wall } from '../../../../core/models/blueprint.interface';

@Component({
  selector: 'app-blueprint-editor',
  standalone: false,
  templateUrl: './blueprint-editor.component.html',
 // Asegúrate de que este archivo exista, aunque esté vacío
})
export class BlueprintEditorComponent implements OnInit, ViewDidEnter, OnDestroy {

  @ViewChild('editorContainer') containerRef!: ElementRef<HTMLDivElement>;

  // --- INYECCIONES ---
  private mapService = inject(MapRenderService);
  private bpService = inject(BlueprintService);
  private ngZone = inject(NgZone);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  // --- ESTADO ---
  currentBlueprintId: string | null = null;
  isNew = false;
  walls: Wall[] = [];
  isDrawing = false;
  startPoint: { x: number, y: number } | null = null;
  
  // Configuración inicial del lienzo (se puede editar al guardar)
  zoneConfig = { width: 15, height: 10 }; 

  // --- KONVA ---
  private stage: Konva.Stage | null = null;
  private gridLayer: Konva.Layer | null = null;
  private wallsLayer: Konva.Layer | null = null;
  private tempLayer: Konva.Layer | null = null;

  // Constantes visuales
  private readonly SNAP_THRESHOLD = 15; // Pixeles para imantar
  private readonly WALL_THICKNESS = 6;
  private readonly WALL_COLOR = '#374151';

  constructor() {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'new') {
      this.isNew = true;
      this.currentBlueprintId = null;
    } else if (id) {
      this.isNew = false;
      this.currentBlueprintId = id;
    }
  }

  // 👇 CORRECCIÓN CLAVE: Usamos ionViewDidEnter + setTimeout
  // Esto asegura que el HTML ya tenga tamaño real antes de iniciar Konva
  ionViewDidEnter() {
    setTimeout(() => {
      this.initKonva();
      
      if (!this.isNew && this.currentBlueprintId) {
        this.loadBlueprintData(this.currentBlueprintId);
      }
    }, 150); // 150ms es suficiente para esperar la animación de Ionic
  }

  private initKonva() {
    if (!this.containerRef) return;

    // Aseguramos que el contenedor tenga dimensiones
    const width = this.containerRef.nativeElement.offsetWidth;
    const height = this.containerRef.nativeElement.offsetHeight;

    if (width === 0 || height === 0) {
      console.error('El contenedor tiene tamaño 0. Konva no puede iniciar.');
      return;
    }

    this.mapService.init(this.containerRef.nativeElement, this.zoneConfig as any);

    this.stage = new Konva.Stage({
      container: this.containerRef.nativeElement,
      width: width,
      height: height,
    });

    this.gridLayer = new Konva.Layer();
    this.wallsLayer = new Konva.Layer();
    this.tempLayer = new Konva.Layer();

    this.stage.add(this.gridLayer);
    this.stage.add(this.wallsLayer);
    this.stage.add(this.tempLayer);

    this.drawGrid();

    // Eventos
    this.stage.on('mousedown touchstart', (e) => this.handleMouseDown(e));
    this.stage.on('mousemove touchmove', (e) => this.handleMouseMove(e));
    this.stage.on('mouseup touchend', () => this.handleMouseUp());
  }

  // --- LÓGICA DE DIBUJO ---
  private handleMouseDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    // Solo click izquierdo
    if (e.evt instanceof MouseEvent && e.evt.button !== 0) return;
    
    const pos = this.stage?.getPointerPosition();
    if (!pos) return;

    this.isDrawing = true;
    this.startPoint = { x: pos.x, y: pos.y };

    // Marcador visual de inicio
    const anchor = new Konva.Circle({
      x: pos.x, y: pos.y, radius: 5, fill: '#2563EB', opacity: 0.8
    });
    this.tempLayer?.add(anchor);
  }

  private handleMouseMove(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (!this.isDrawing || !this.startPoint || !this.stage) return;
    
    // Ejecutamos fuera de Angular para rendimiento (no disparar detección de cambios a cada pixel)
    this.ngZone.runOutsideAngular(() => {
      const currentPos = this.stage!.getPointerPosition();
      if (!currentPos) return;

      let endX = currentPos.x;
      let endY = currentPos.y;

      // Snapping (Imán) para líneas rectas
      const dx = endX - this.startPoint!.x;
      const dy = endY - this.startPoint!.y;
      const angleRad = Math.atan2(dy, dx);
      let angleDeg = angleRad * (180 / Math.PI);
      if (angleDeg < 0) angleDeg += 360;

      // Imantar a 0, 90, 180, 270 grados
      if (this.isNear(angleDeg, 0) || this.isNear(angleDeg, 360)) endY = this.startPoint!.y; 
      else if (this.isNear(angleDeg, 90)) endX = this.startPoint!.x; 
      else if (this.isNear(angleDeg, 180)) endY = this.startPoint!.y; 
      else if (this.isNear(angleDeg, 270)) endX = this.startPoint!.x; 

      this.tempLayer?.destroyChildren(); // Limpiar guía anterior
      
      // Línea guía
      const line = new Konva.Line({
        points: [this.startPoint!.x, this.startPoint!.y, endX, endY],
        stroke: '#3B82F6', strokeWidth: 4, dash: [10, 5], opacity: 0.7
      });

      // Etiqueta de medida
      const lengthPx = Math.sqrt(Math.pow(endX - this.startPoint!.x, 2) + Math.pow(endY - this.startPoint!.y, 2));
      const lengthMeters = this.mapService.pixelsToMeters(lengthPx).toFixed(2);
      
      const label = new Konva.Label({
        x: (this.startPoint!.x + endX) / 2,
        y: (this.startPoint!.y + endY) / 2 - 25
      });
      label.add(new Konva.Tag({ fill: 'black', cornerRadius: 4, opacity: 0.8 }));
      label.add(new Konva.Text({ text: `${lengthMeters}m`, fontSize: 12, padding: 6, fill: 'white' }));

      this.tempLayer?.add(line);
      this.tempLayer?.add(label);
      this.tempLayer?.batchDraw();
    });
  }

  private handleMouseUp() {
    if (!this.isDrawing || !this.startPoint || !this.tempLayer) return;

    const line = this.tempLayer.findOne('Line') as Konva.Line;
    
    // Solo creamos el muro si hay una línea válida (arrastre)
    if (line) {
      const points = line.points();
      const x1 = points[0]; const y1 = points[1];
      const x2 = points[2]; const y2 = points[3];
      
      // Evitar muros microscópicos
      const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      if (dist > 20) {
        this.confirmWall(x1, y1, x2, y2);
      }
    }

    this.isDrawing = false;
    this.startPoint = null;
    this.tempLayer.destroyChildren(); // Borrar guías
    this.tempLayer.batchDraw();
  }

  private confirmWall(x1Px: number, y1Px: number, x2Px: number, y2Px: number) {
     // Convertimos a metros para guardar
     const x1 = this.mapService.pixelsToMeters(x1Px);
     const y1 = this.mapService.pixelsToMeters(y1Px);
     const x2 = this.mapService.pixelsToMeters(x2Px);
     const y2 = this.mapService.pixelsToMeters(y2Px);
     
     const length = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
     const angle = Math.atan2(y2-y1, x2-x1) * (180/Math.PI);

     const newWall: Wall = { x1, y1, x2, y2, length, angle };
     
     // Angular debe saber que el array cambió
     this.ngZone.run(() => {
       this.walls.push(newWall);
     });

     // Dibujamos el muro permanente
     this.drawPermanentWall(x1Px, y1Px, x2Px, y2Px);
  }

  private drawPermanentWall(x1: number, y1: number, x2: number, y2: number) {
    const group = new Konva.Group();
    
    const wallLine = new Konva.Line({
      points: [x1, y1, x2, y2],
      stroke: this.WALL_COLOR, strokeWidth: this.WALL_THICKNESS, lineCap: 'round', lineJoin: 'round',
      shadowColor: 'black', shadowBlur: 2, shadowOpacity: 0.2
    });
    
    const node1 = new Konva.Circle({ x: x1, y: y1, radius: 4, fill: '#6B7280' });
    const node2 = new Konva.Circle({ x: x2, y: y2, radius: 4, fill: '#6B7280' });

    group.add(wallLine);
    group.add(node1);
    group.add(node2);
    
    this.wallsLayer?.add(group);
    this.wallsLayer?.batchDraw();
  }

  // --- LOGICA DE GUARDADO ---
  async handleSaveProcess() {
    if (!this.stage) return;

    if (this.isNew) {
        // Si es nuevo, pedimos nombre y dimensiones
        await this.presentCreateDialog();
    } else {
        // Si ya existe, solo guardamos el layout
        this.saveLayoutChanges();
    }
  }

  async presentCreateDialog() {
    const alert = await this.alertCtrl.create({
        header: 'Crear Nuevo Plano',
        subHeader: 'Define las propiedades del local',
        inputs: [
            { name: 'name', type: 'text', placeholder: 'Nombre (ej: Sede Principal)' },
            { name: 'description', type: 'text', placeholder: 'Descripción (Opcional)' },
            { name: 'width', type: 'number', value: 15, placeholder: 'Ancho (m)', min: 1 },
            { name: 'height', type: 'number', value: 10, placeholder: 'Largo (m)', min: 1 }
        ],
        buttons: [
            { text: 'Cancelar', role: 'cancel' },
            {
                text: 'Crear',
                handler: (data) => {
                    if (!data.name || !data.width || !data.height) {
                        this.presentToast('El nombre y las dimensiones son obligatorios', 'warning');
                        return false;
                    }
                    this.createBlueprint(data);
                    return true;
                }
            }
        ]
    });
    await alert.present();
  }

  createBlueprint(data: any) {
    const payload = {
        name: data.name,
        description: data.description,
        width: Number(data.width),
        height: Number(data.height)
    };

    // Actualizamos la config local por si el usuario cambió el tamaño
    this.zoneConfig = { width: payload.width, height: payload.height };

    this.bpService.create(payload).subscribe({
        next: (newBp) => {
            this.currentBlueprintId = newBp.id;
            this.isNew = false;
            this.presentToast('¡Plano creado! Guardando muros...', 'success');
            // Ahora que tenemos ID, guardamos lo que dibujamos
            this.saveLayoutChanges(); 
        },
        error: () => this.presentToast('Error al crear el plano en el servidor', 'danger')
    });
  }

  saveLayoutChanges() {
    if (!this.currentBlueprintId || !this.stage) return;

    // Generar miniatura
    const previewUrl = this.stage.toDataURL({
      mimeType: 'image/jpeg', quality: 0.6, pixelRatio: 0.5 
    });

    const payload = {
        walls: this.walls,
        previewImageUrl: previewUrl
    };

    this.bpService.updateLayout(this.currentBlueprintId, payload).subscribe({
      next: () => {
        this.presentToast('✅ Cambios guardados correctamente', 'success');
        this.router.navigate(['/admin/blueprints']); // Volver a la lista
      },
      error: (err) => {
        console.error(err);
        this.presentToast('❌ Error al guardar los muros', 'danger');
      }
    });
  }

  // --- CARGA DE DATOS ---
  private loadBlueprintData(id: string) {
    this.bpService.getOne(id).subscribe({
      next: (bp) => {
        // Redibujar muros existentes
        this.walls = bp.walls || [];
        this.walls.forEach(w => {
           const px1 = this.mapService.metersToPixels(w.x1);
           const py1 = this.mapService.metersToPixels(w.y1);
           const px2 = this.mapService.metersToPixels(w.x2);
           const py2 = this.mapService.metersToPixels(w.y2);
           this.drawPermanentWall(px1, py1, px2, py2);
        });
        
        // Ajustar grilla si las dimensiones del plano son diferentes a la defecto
        if (bp.width && bp.height) {
           this.zoneConfig = { width: bp.width, height: bp.height };
           // Aquí podrías regenerar la grilla si fuera necesario
        }
      },
      error: () => this.presentToast('Error al cargar datos del plano', 'danger')
    });
  }

  // --- UTILIDADES ---
  private drawGrid() {
    if (!this.gridLayer || !this.stage) return;
    
    // Limpiar grilla anterior si existe
    this.gridLayer.destroyChildren();

    const width = this.stage.width();
    const height = this.stage.height();
    const step = this.mapService.metersToPixels(1); // 1 metro

    // Líneas verticales
    for (let i = 0; i < width / step; i++) {
      this.gridLayer.add(new Konva.Line({ 
        points: [Math.round(i * step) + 0.5, 0, Math.round(i * step) + 0.5, height], 
        stroke: '#E5E7EB', strokeWidth: 1 
      }));
    }
    // Líneas horizontales
    for (let j = 0; j < height / step; j++) {
      this.gridLayer.add(new Konva.Line({ 
        points: [0, Math.round(j * step) + 0.5, width, Math.round(j * step) + 0.5], 
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

  private async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    toast.present();
  }

  ngOnDestroy() {
    this.stage?.destroy();
  }
}