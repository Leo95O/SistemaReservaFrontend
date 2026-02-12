import { Component } from '@angular/core';
import { Zone } from '../../../../core/models/zone.interface';
import { Table } from '../../../../core/models/table.interface';

@Component({
  selector: 'app-furniture-editor',
  standalone: false,
  templateUrl: './furniture-editor.component.html'
})
export class FurnitureEditorComponent {

  // ZONA DE PRUEBA (MOCK)
  // Simulamos una zona que ya tiene muros dibujados pero está vacía de mesas.
  currentZone: Zone = {
    id: 'zone-editor-demo',
    name: 'Salón Principal',
    width: 15, // 15 metros de ancho
    height: 10, // 10 metros de alto
    walls: [
      // Un contorno simple
      { x1: 0, y1: 0, x2: 15, y2: 0, length: 15, angle: 0 },
      { x1: 0, y1: 0, x2: 0, y2: 10, length: 10, angle: 90 },
      { x1: 15, y1: 0, x2: 15, y2: 10, length: 10, angle: 90 },
      { x1: 0, y1: 10, x2: 15, y2: 10, length: 15, angle: 0 }
    ],
    tables: [] // Empieza vacía
  };

  constructor() {}

  /**
   * 1. INICIO DEL ARRASTRE (HTML)
   * Se dispara cuando agarras un mueble de la barra lateral.
   */
  onDragStart(event: DragEvent, shape: 'rect' | 'circle', seats: number, w: number, h: number) {
    if (event.dataTransfer) {
      // Empaquetamos los datos del mueble en un JSON para enviarlo al Canvas
      const payload = { shape, seats, width: w, height: h };
      event.dataTransfer.setData('application/json', JSON.stringify(payload));
      event.dataTransfer.effectAllowed = 'copy';
      
      // Opcional: Cambiar la imagen fantasma del drag (si quisieras personalizarla)
    }
  }

  /**
   * 2. MESA SOLTADA EN EL MAPA
   * El MapRenderer emite esto cuando sueltas el mueble sobre él.
   */
  onTableAdded(newTable: Table) {
    console.log('✨ Nuevo mueble colocado:', newTable);
    
    // Generar ID y Código temporal
    const count = (this.currentZone.tables?.length || 0) + 1;
    newTable.code = `M-${count}`;

    // Actualización Inmutable (Crucial para que Angular detecte el cambio)
    this.currentZone = {
      ...this.currentZone,
      tables: [...(this.currentZone.tables || []), newTable]
    };
  }

  /**
   * 3. MESA MOVIDA O ROTADA
   * Se dispara cuando manipulas una mesa ya existente en el mapa.
   */
  onTableUpdated(updatedTable: Table) {
    console.log('📍 Mueble reubicado:', updatedTable);
    if (!this.currentZone.tables) return;

    this.currentZone = {
      ...this.currentZone,
      tables: this.currentZone.tables.map(t => 
        t.id === updatedTable.id ? updatedTable : t
      )
    };
  }

  /**
   * 4. SELECCIÓN
   */
  onTableSelected(table: Table) {
    console.log('👆 Mueble seleccionado:', table);
    // Aquí podrías mostrar un menú para eliminar la mesa
  }
}