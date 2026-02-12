import { Component } from '@angular/core';
import { Zone } from '../../../../core/models/zone.interface';
import { Table } from '../../../../core/models/table.interface';

@Component({
  selector: 'app-map-playground',
  standalone: false,
  templateUrl: './map-playground.component.html'
})
export class MapPlaygroundComponent {

  // MOCK DATA: Zona de 10x10m
  playgroundZone: Zone = {
    id: 'zone-playground',
    name: 'Laboratorio de Pruebas',
    width: 10,
    height: 10,
    tables: [
      {
        id: 't1', code: 'M-01',
        x: 1.0, y: 1.0, width: 1.0, height: 1.0,
        rotation: 0, seats: 4, shape: 'rect'
      },
      {
        id: 't2', code: 'R-01',
        x: 3.0, y: 1.0, width: 1.2, height: 1.2,
        rotation: 0, seats: 5, shape: 'circle'
      },
      {
        id: 't3', code: 'VIP',
        x: 5.0, y: 5.0, width: 2.0, height: 1.0,
        rotation: 45, seats: 6, shape: 'rect'
      }
    ]
  };

  selectedTable: Table | null = null;

  // Maneja el evento dragend
  onTableChange(updatedTable: Table) {
    console.log('Mesa movida:', updatedTable);
    
    // Actualizamos nuestro array local para reflejar el cambio en el JSON
    if (this.playgroundZone.tables) {
      this.playgroundZone.tables = this.playgroundZone.tables.map(t => 
        t.id === updatedTable.id ? updatedTable : t
      );
    }
  }

  // Maneja el click
  onTableSelect(table: Table) {
    this.selectedTable = table;
    console.log('Mesa seleccionada:', table);
  }
}