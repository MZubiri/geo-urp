import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Apartado, Actividad } from '../../models/coneic.models';
import { ActividadModalComponent } from '../../components/actividad-modal/actividad-modal.component';

export interface GroupedDay {
  dateKey: string;
  dateLabel: string;
  dayName: string;
  actividades: Actividad[];
}

export interface GCalEvent {
  actividad: Actividad;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
  hasConflict: boolean;
}

export interface GCalDayColumn {
  dateKey: string;
  dayName: string;
  dateLabel: string;
  events: GCalEvent[];
  numSubCols: number;
  colMinWidthPx: number;
}

@Component({
  selector: 'app-cronograma',
  standalone: true,
  imports: [CommonModule, FormsModule, ActividadModalComponent],
  templateUrl: './cronograma.component.html',
  styleUrls: ['./cronograma.component.css']
})
export class CronogramaComponent implements OnInit {
  @ViewChild('gcalScrollContainer') gcalScrollContainer!: ElementRef<HTMLDivElement>;

  apartados: Apartado[] = [];
  selectedApartadoId: number | null = null;
  savedActivityIds: Set<number> = new Set<number>();

  searchTerm: string = '';
  viewMode: 'cards' | 'gcal' = 'cards';

  selectedActividad: Actividad | null = null;
  isLoading: boolean = true;
  Math = Math;

  hoursList: number[] = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  zoomLevel: number = 1.0;
  minZoom: number = 0.6;
  maxZoom: number = 1.8;
  baseHourRowHeight: number = 60;

  private touchStartDist: number = 0;
  private initialZoomOnTouch: number = 1.0;

  get hourRowHeight(): number {
    return Math.round(this.baseHourRowHeight * this.zoomLevel);
  }

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCalendario();
    if (this.authService.isLoggedIn()) {
      this.loadUserAgenda();
    }
  }

  loadCalendario(): void {
    this.isLoading = true;
    this.apiService.getCalendarioGeneral().subscribe({
      next: (data) => {
        this.apartados = data;
        if (this.apartados.length > 0 && this.selectedApartadoId === null) {
          this.selectedApartadoId = 0; // Default: 'Todas'
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar calendario', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadUserAgenda(): void {
    this.apiService.getMisActividades().subscribe({
      next: (actividades) => {
        this.savedActivityIds = new Set(actividades.map(a => a.id));
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          this.authService.logout();
        }
      }
    });
  }

  selectApartado(id: number): void {
    this.selectedApartadoId = id;
    this.cdr.detectChanges();
  }

  setViewMode(mode: 'cards' | 'gcal'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  onFilterChange(): void {
    this.cdr.detectChanges();
  }

  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.maxZoom, Math.round((this.zoomLevel + 0.15) * 100) / 100);
      this.cdr.detectChanges();
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.minZoom, Math.round((this.zoomLevel - 0.15) * 100) / 100);
      this.cdr.detectChanges();
    }
  }

  resetZoom(): void {
    this.zoomLevel = 1.0;
    this.cdr.detectChanges();
  }

  // Pinch-to-zoom support for mobile touch devices
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.touchStartDist = Math.hypot(dx, dy);
      this.initialZoomOnTouch = this.zoomLevel;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2 && this.touchStartDist > 0) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / this.touchStartDist;
      let newZoom = Math.round(this.initialZoomOnTouch * scale * 100) / 100;
      newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
      if (newZoom !== this.zoomLevel) {
        this.zoomLevel = newZoom;
        this.cdr.detectChanges();
      }
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length < 2) {
      this.touchStartDist = 0;
    }
  }

  scrollGCal(direction: 'left' | 'right'): void {
    if (this.gcalScrollContainer) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      this.gcalScrollContainer.nativeElement.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  getCurrentApartado(): Apartado | undefined {
    return this.apartados.find(a => a.id === this.selectedApartadoId);
  }

  getAllActividades(): Actividad[] {
    const all: Actividad[] = [];
    const seen = new Set<number>();
    this.apartados.forEach(ap => {
      ap.actividades.forEach(act => {
        if (!seen.has(act.id)) {
          seen.add(act.id);
          all.push({ ...act, apartadoNombre: act.apartadoNombre || ap.nombre });
        }
      });
    });
    return all;
  }

  getTotalActividadesCount(): number {
    return this.getAllActividades().length;
  }

  getFilteredActivities(): Actividad[] {
    const hasSearch = !!this.searchTerm.trim();

    // If searching, or if 'Todas' (0) is selected, search across ALL activities from ALL categories
    let sourceActivities: Actividad[];
    if (hasSearch || this.selectedApartadoId === 0 || this.selectedApartadoId === null) {
      sourceActivities = this.getAllActividades();
    } else {
      const current = this.getCurrentApartado();
      sourceActivities = current ? current.actividades : [];
    }

    if (hasSearch) {
      const query = this.searchTerm.toLowerCase().trim();
      sourceActivities = sourceActivities.filter(a =>
        a.nombre.toLowerCase().includes(query) ||
        (a.descripcion && a.descripcion.toLowerCase().includes(query)) ||
        (a.apartadoNombre && a.apartadoNombre.toLowerCase().includes(query)) ||
        (a.camposExtra && a.camposExtra.toLowerCase().includes(query))
      );
    }

    return sourceActivities;
  }

  getFilteredDays(): GroupedDay[] {
    const filtered = this.getFilteredActivities();

    const daysMap = new Map<string, Actividad[]>();
    filtered.forEach(act => {
      if (!act.horaInicio) return;
      const dateKey = act.horaInicio.split('T')[0];
      if (!daysMap.has(dateKey)) {
        daysMap.set(dateKey, []);
      }
      daysMap.get(dateKey)!.push(act);
    });

    return Array.from(daysMap.entries())
      .map(([dateKey, actividades]) => {
        const parts = dateKey.split('-').map(Number);
        const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dateKey);
        const dayName = d.toLocaleDateString('es-PE', { weekday: 'long' });
        const dateLabel = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
        return {
          dateKey,
          dayName: dayName.toUpperCase(),
          dateLabel,
          actividades: actividades.sort((a, b) => new Date(a.horaInicio).getTime() - new Date(b.horaInicio).getTime())
        };
      })
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }

  getGCalColumns(): GCalDayColumn[] {
    const filtered = this.getFilteredActivities();

    const dateKeysSet = new Set<string>();
    filtered.forEach(act => {
      if (act.horaInicio) {
        dateKeysSet.add(act.horaInicio.split('T')[0]);
      }
    });

    const sortedDateKeys = Array.from(dateKeysSet).sort();

    return sortedDateKeys.map(dateKey => {
      const parts = dateKey.split('-').map(Number);
      const d = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dateKey);
      const dayName = d.toLocaleDateString('es-PE', { weekday: 'short' }).toUpperCase();
      const dateLabel = d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).toUpperCase();

      const dayActs = filtered.filter(a => a.horaInicio && a.horaInicio.startsWith(dateKey));

      const events: GCalEvent[] = dayActs.map(act => {
        const start = new Date(act.horaInicio);
        const end = new Date(act.horaFin);

        const startMinutes = (start.getHours() - 6) * 60 + start.getMinutes();
        const endMinutes = (end.getHours() - 6) * 60 + end.getMinutes();

        const topPx = Math.max(0, (startMinutes / 60) * this.hourRowHeight);
        const durationMinutes = Math.max(30, endMinutes - startMinutes);
        const heightPx = (durationMinutes / 60) * this.hourRowHeight;

        return {
          actividad: act,
          topPx,
          heightPx,
          leftPercent: 0,
          widthPercent: 100,
          hasConflict: false
        };
      });

      events.sort((a, b) => {
        const startA = new Date(a.actividad.horaInicio).getTime();
        const startB = new Date(b.actividad.horaInicio).getTime();
        if (startA !== startB) return startA - startB;
        return b.heightPx - a.heightPx;
      });

      const subColumns: GCalEvent[][] = [];

      events.forEach(ev => {
        const evStart = new Date(ev.actividad.horaInicio).getTime();
        let placed = false;

        for (let colIdx = 0; colIdx < subColumns.length; colIdx++) {
          const col = subColumns[colIdx];
          const lastInCol = col[col.length - 1];
          const lastEnd = new Date(lastInCol.actividad.horaFin).getTime();

          if (evStart >= lastEnd) {
            col.push(ev);
            placed = true;
            break;
          }
        }

        if (!placed) {
          subColumns.push([ev]);
        }
      });

      const numCols = Math.max(1, subColumns.length);
      subColumns.forEach((col, colIdx) => {
        col.forEach(ev => {
          ev.widthPercent = Math.floor(96 / numCols);
          ev.leftPercent = Math.floor((colIdx * 100) / numCols);
        });
      });

      const baseMinWidth = Math.max(160, numCols * 135);
      const colMinWidthPx = Math.round(baseMinWidth * this.zoomLevel);

      return {
        dateKey,
        dayName,
        dateLabel,
        events,
        numSubCols: numCols,
        colMinWidthPx
      };
    });
  }

  getGCalGridColumnsStyle(): string {
    const cols = this.getGCalColumns();
    if (cols.length === 0) return '80px 1fr';
    const colTracks = cols.map(c => `minmax(${c.colMinWidthPx}px, 1fr)`).join(' ');
    return `80px ${colTracks}`;
  }

  openModal(actividad: Actividad): void {
    this.selectedActividad = actividad;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.selectedActividad = null;
    this.cdr.detectChanges();
  }

  onSaveToAgenda(actividad: Actividad): void {
    this.saveActividad(actividad);
  }

  onRemoveFromAgenda(actividad: Actividad): void {
    this.apiService.quitarActividad(actividad.id).subscribe({
      next: () => {
        this.savedActivityIds.delete(actividad.id);
        if (this.selectedActividad?.id === actividad.id) {
          this.closeModal();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al quitar actividad', err)
    });
  }

  onRequestLogin(): void {
    this.closeModal();
    this.router.navigate(['/login']);
  }

  private saveActividad(actividad: Actividad): void {
    this.apiService.agregarActividad(actividad.id, false).subscribe({
      next: () => {
        this.savedActivityIds.add(actividad.id);
        this.closeModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          this.authService.logout();
          this.onRequestLogin();
        } else {
          alert(err.error?.message || 'Error al agregar actividad.');
        }
      }
    });
  }

  formatTime(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatHourLabel(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12.toString().padStart(2, '0')}:00 ${period}`;
  }

  isSaved(id: number): boolean {
    return this.savedActivityIds.has(id);
  }
}
