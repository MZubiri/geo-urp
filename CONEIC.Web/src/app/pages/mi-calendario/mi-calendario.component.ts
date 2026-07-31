import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { IcsService } from '../../services/ics.service';
import { Actividad } from '../../models/coneic.models';
import { ActividadModalComponent } from '../../components/actividad-modal/actividad-modal.component';

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
  selector: 'app-mi-calendario',
  standalone: true,
  imports: [CommonModule, RouterLink, ActividadModalComponent],
  templateUrl: './mi-calendario.component.html',
  styleUrls: ['./mi-calendario.component.css']
})
export class MiCalendarioComponent implements OnInit {
  @ViewChild('gcalScrollContainer') gcalScrollContainer!: ElementRef<HTMLDivElement>;

  misActividades: Actividad[] = [];
  selectedActividad: Actividad | null = null;
  isLoading: boolean = true;
  viewMode: 'gcal' | 'list' = 'gcal';
  Math = Math;

  zoomLevel: number = 1.0;
  minZoom: number = 0.1;
  maxZoom: number = 2.0;
  baseHourRowHeight: number = 60;

  private touchStartDist: number = 0;
  private initialZoomOnTouch: number = 1.0;

  hoursList: number[] = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

  get hourRowHeight(): number {
    return Math.max(16, Math.round(this.baseHourRowHeight * this.zoomLevel));
  }

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private icsService: IcsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMisActividades();
  }

  loadMisActividades(): void {
    this.isLoading = true;
    this.apiService.getMisActividades().subscribe({
      next: (data) => {
        this.misActividades = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar agenda', err);
        this.isLoading = false;
        if (err.status === 401) {
          this.authService.logout();
        }
        this.cdr.detectChanges();
      }
    });
  }

  setViewMode(mode: 'gcal' | 'list'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel = Math.min(this.maxZoom, Math.round((this.zoomLevel + 0.10) * 100) / 100);
      this.cdr.detectChanges();
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel = Math.max(this.minZoom, Math.round((this.zoomLevel - 0.10) * 100) / 100);
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

  getGCalColumns(): GCalDayColumn[] {
    const fixedDays = [
      { key: '2026-08-10', name: 'LUN', label: '10-AGO.' },
      { key: '2026-08-11', name: 'MAR', label: '11-AGO.' },
      { key: '2026-08-12', name: 'MIÉ', label: '12-AGO.' },
      { key: '2026-08-13', name: 'JUE', label: '13-AGO.' },
      { key: '2026-08-14', name: 'VIE', label: '14-AGO.' }
    ];

    return fixedDays.map(fd => {
      const dayActs = this.misActividades.filter(a => a.horaInicio && a.horaInicio.startsWith(fd.key));

      const events: GCalEvent[] = dayActs.map(act => {
        const start = new Date(act.horaInicio);
        const end = new Date(act.horaFin);

        const startMinutes = (start.getHours() - 6) * 60 + start.getMinutes();
        const endMinutes = (end.getHours() - 6) * 60 + end.getMinutes();

        const topPx = Math.max(0, (startMinutes / 60) * this.hourRowHeight);
        const durationMinutes = Math.max(30, endMinutes - startMinutes);
        const heightPx = (durationMinutes / 60) * this.hourRowHeight;

        const hasConflict = dayActs.some(other => {
          if (other.id === act.id) return false;
          return (start < new Date(other.horaFin) && end > new Date(other.horaInicio));
        });

        return {
          actividad: act,
          topPx,
          heightPx,
          leftPercent: 0,
          widthPercent: 100,
          hasConflict
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
      const colMinWidthPx = Math.max(50, Math.round(baseMinWidth * this.zoomLevel));

      return {
        dateKey: fd.key,
        dayName: fd.name,
        dateLabel: fd.label,
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

  hasOverlap(actividad: Actividad): boolean {
    const start = new Date(actividad.horaInicio);
    const end = new Date(actividad.horaFin);

    return this.misActividades.some(other => {
      if (other.id === actividad.id) return false;
      const otherStart = new Date(other.horaInicio);
      const otherEnd = new Date(other.horaFin);
      return (start < otherEnd && end > otherStart);
    });
  }

  openModal(actividad: Actividad): void {
    this.selectedActividad = actividad;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.selectedActividad = null;
    this.cdr.detectChanges();
  }

  quitar(actividad: Actividad): void {
    this.apiService.quitarActividad(actividad.id).subscribe({
      next: () => {
        this.misActividades = this.misActividades.filter(a => a.id !== actividad.id);
        if (this.selectedActividad?.id === actividad.id) {
          this.closeModal();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al quitar actividad', err)
    });
  }

  exportIcs(actividad: Actividad): void {
    this.icsService.downloadIcs(actividad);
  }

  exportAllIcs(): void {
    this.icsService.downloadAllIcs(this.misActividades);
  }

  formatDate(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  formatTime(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatHourLabel(hour: number): string {
    if (hour === 24 || hour === 0) return '12:00 AM';
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12.toString().padStart(2, '0')}:00 ${period}`;
  }

  showPdfModal: boolean = false;

  abrirPdfModal(): void {
    this.showPdfModal = true;
    this.cdr.detectChanges();
  }

  cerrarPdfModal(): void {
    this.showPdfModal = false;
    this.cdr.detectChanges();
  }

  getActividadesOrdenadas(): Actividad[] {
    return [...this.misActividades].sort((a, b) => 
      new Date(a.horaInicio).getTime() - new Date(b.horaInicio).getTime()
    );
  }

  getFechaEmision(): string {
    const d = new Date();
    return `${d.toLocaleDateString('es-PE')} a las ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
  }

  descargarPdfDirecto(): void {
    const element = document.getElementById('pdf-report-content');
    if (!element) {
      window.print();
      return;
    }

    const user = this.authService.currentUser();
    const userName = user ? user.nombre : 'Participante';

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Mi_Agenda_CONEIC_2026_${userName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    if ((window as any).html2pdf) {
      (window as any).html2pdf().set(opt).from(element).save().catch(() => window.print());
    } else {
      window.print();
    }
  }

  imprimirDirecto(): void {
    window.print();
  }

  sincronizarAppleCalendar(): void {
    const token = this.authService.getToken();
    const path = '/coneic/api/agenda/export/ics';
    const webcalUrl = `webcal://${window.location.host}${path}?token=${encodeURIComponent(token || '')}`;
    window.location.href = webcalUrl;
  }

  sincronizarGoogleCalendar(): void {
    const token = this.authService.getToken();
    const origin = window.location.origin;
    const icsUrl = `${origin}/coneic/api/agenda/export/ics?token=${encodeURIComponent(token || '')}`;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = icsUrl;
    } else {
      const gcalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(icsUrl)}`;
      window.open(gcalUrl, '_blank');
    }
  }
}
