import { Component, OnInit, AfterViewInit, signal } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';
import { catchError, of } from 'rxjs';
import * as L from 'leaflet';
import Chart from 'chart.js/auto';
import { Title } from '@angular/platform-browser';
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap';
import * as fgb from 'flatgeobuf';

Chart.register(TreemapController, TreemapElement);

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [HttpClientModule, CommonModule, DecimalPipe],
  template: `
    <div [style.backgroundColor]="isDark() ? '#121212' : '#FFF9C4'" 
         [style.color]="isDark() ? '#e2e8f0' : '#1e293b'"
         class="h-screen w-full relative overflow-hidden font-sans flex flex-col transition-colors duration-300">

      @if (cargando()) {
        <div [style.backgroundColor]="isDark() ? '#121212' : '#FFF9C4'" class="absolute inset-0 z-[100] flex flex-col items-center justify-center">
          <div class="w-16 h-16 border-4 border-zinc-500 border-t-yellow-500 rounded-full animate-spin"></div>
          <p class="text-[10px] text-zinc-500 font-mono uppercase mt-4 tracking-widest animate-pulse">Decodificando binario...</p>
        </div>
      }

      <div class="flex-1 flex min-h-0">
        <aside [style.backgroundColor]="isDark() ? '#1F1F1F' : '#FFFDE7'" 
               [style.borderColor]="isDark() ? '#333' : '#FBC02D'"
               class="w-80 border-r flex flex-col shadow-2xl z-20 flex-shrink-0 transition-colors duration-300">
          <header [style.borderColor]="isDark() ? '#333' : '#FBC02D'" class="p-6 border-b">
            <div class="flex justify-between items-start mb-4">
              <img src="logoani.png" alt="Logo ANI" class="h-15 object-contain">
              <button (click)="toggleTema()" 
                      [style.backgroundColor]="isDark() ? '#333' : '#F9A825'"
                      class="px-3 py-1.5 rounded-lg text-lg border-none shadow-sm cursor-pointer transition-transform active:scale-90">
                {{ isDark() ? '🌞' : '🌚' }}
              </button>
            </div>
            <p [style.color]="isDark() ? '#FFCD00' : '#F9A825'" class="text-[10px] uppercase tracking-widest font-bold mb-1 mt-2">Proyecto ANI</p>
            <h1 [class]="isDark() ? 'text-white' : 'text-slate-900'" class="text-xl font-black leading-tight uppercase">
              {{ info()?.nombre || '---' }}
            </h1>
          </header>

          <section class="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div class="flex flex-col gap-6">
              <div>
                <p [style.color]="isDark() ? '#888' : '#F9A825'" class="text-[10px] uppercase font-bold mb-1">Modo</p>
                <p class="text-lg font-bold">{{ info()?.modo || '---' }}</p>
              </div>
              <div>
                <p [style.color]="isDark() ? '#888' : '#F9A825'" class="text-[10px] uppercase font-bold mb-1">Etapa</p>
                <p class="text-lg font-bold">{{ info()?.etapa || '---' }}</p>
              </div>
              <div>
                <p [style.color]="isDark() ? '#888' : '#F9A825'" class="text-[10px] uppercase font-bold mb-1">Longitud</p>
                <p class="text-lg font-bold font-mono">{{ info()?.longitud || 0 }} km</p>
              </div>
              <div>
                <p [style.color]="isDark() ? '#888' : '#F9A825'" class="text-[10px] uppercase font-bold mb-1">Mes de Avance</p>
                <p class="text-lg font-bold capitalize">{{ info()?.mesAvance || '---' }}</p>
              </div>
            </div>
          </section>
        </aside>

        <main class="flex-1 relative z-0">
          <div id="map" class="h-full w-full"></div>
        </main>

        <aside [style.backgroundColor]="isDark() ? '#1F1F1F' : '#FFFDE7'" 
               [style.borderColor]="isDark() ? '#333' : '#FBC02D'"
               class="w-72 border-l flex flex-col shadow-2xl z-10 flex-shrink-0 transition-colors duration-300">
          
          <div [style.borderColor]="isDark() ? '#333' : '#FBC02D'" class="p-4 border-b">
            <button (click)="resetZoom()" 
                    [style.backgroundColor]="isDark() ? '#333' : '#F9A825'"
                    class="w-full py-2 text-[10px] font-black uppercase rounded border border-zinc-500/30 text-white cursor-pointer hover:brightness-110 active:scale-95 transition-all">
              📍 Recentrar Mapa
            </button>
          </div>

          <div [style.borderColor]="isDark() ? '#333' : '#FBC02D'" class="p-4 border-b transition-colors duration-300">
            <p class="text-[9px] uppercase font-bold text-zinc-500 mb-2">Mapa Base</p>
            <div class="flex gap-1">
              @for (base of ['Oscuro', 'Satélite', 'Calles']; track base) {
                <button (click)="cambiarBase(base)" 
                        [class.bg-yellow-500]="mapaBaseActual === base"
                        [class.text-black]="mapaBaseActual === base"
                        [style.backgroundColor]="mapaBaseActual !== base ? (isDark() ? '#333' : '#F9A825') : ''"
                        class="flex-1 py-1.5 text-[9px] font-bold uppercase rounded border-none transition-colors cursor-pointer text-white">
                  {{ base }}
                </button>
              }
            </div>
          </div>

          <div [style.borderColor]="isDark() ? '#333' : '#FBC02D'" 
               [style.backgroundColor]="isDark() ? 'rgba(31,31,31,0.5)' : 'rgba(255,253,231,0.5)'"
               class="p-4 border-b flex justify-between items-center transition-colors duration-300">
            <span class="text-[10px] uppercase font-bold text-zinc-500">Inventario GIS ({{ totalActivos | number }})</span>
            <div class="flex gap-1">
              <button (click)="toggleTodas(true)" [style.backgroundColor]="isDark() ? '#444' : '#FBC02D'" class="text-[8px] uppercase font-bold px-2 py-1 rounded text-white border-none cursor-pointer transition-colors">Todo</button>
              <button (click)="toggleTodas(false)" [style.backgroundColor]="isDark() ? '#444' : '#FBC02D'" class="text-[8px] uppercase font-bold px-2 py-1 rounded text-white border-none cursor-pointer transition-colors">Nada</button>
            </div>
          </div>

          <div class="flex-1 p-2 overflow-y-auto custom-scrollbar">
            @for (capa of capasFisicas; track capa.nombre) {
              <label [class]="isDark() ? 'hover:bg-white/5' : 'hover:bg-black/5'" class="flex items-center justify-between group cursor-pointer p-2 rounded transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full border border-zinc-500" [style.backgroundColor]="capa.color"></div>
                  <div class="flex flex-col">
                    <span [class]="isDark() ? 'text-zinc-300 group-hover:text-white' : 'text-slate-700 group-hover:text-black'" class="text-xs font-bold leading-none transition-colors">{{ capa.nombre }}</span>
                    <span class="text-[10px] text-zinc-500 font-mono mt-1">{{ capa.cantidad | number }} pts</span>
                  </div>
                </div>
                <input type="checkbox" [checked]="capa.visible" (change)="toggleCapa(capa)" [disabled]="capa.cantidad === 0" class="w-4 h-4 accent-yellow-500 cursor-pointer">
              </label>
            }
          </div>
        </aside>
      </div>

      <section 
        [class.absolute]="graficaExpandida()" [class.inset-0]="graficaExpandida()" [class.z-[60]]="graficaExpandida()"
        [class.relative]="!graficaExpandida()" [class.h-48]="!graficaExpandida()"
        [style.backgroundColor]="isDark() ? '#1F1F1F' : '#FFFDE7'"
        [style.borderColor]="isDark() ? '#333' : '#FBC02D'"
        class="border-t flex-shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.3)] transition-all duration-300">
        
        <button (click)="toggleGrafica()" [style.backgroundColor]="isDark() ? '#333' : '#F9A825'" class="absolute top-2 right-2 z-10 px-3 py-1.5 rounded text-[10px] uppercase font-bold text-white border-none shadow-lg cursor-pointer">
          {{ graficaExpandida() ? 'Reducir' : 'Expandir' }}
        </button>
        <div class="h-full w-full pt-10 pb-2 px-2">
          <canvas id="chartActivos"></canvas>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #666; border-radius: 4px; }
  `]
})
export class MapViewerComponent implements OnInit, AfterViewInit {
  cargando = signal(true); 
  graficaExpandida = signal(false);
  isDark = signal(true); 
  info = signal<any>(null);
  
  private map!: L.Map;
  private chartInstance!: Chart;
  private initialBounds: L.LatLngBounds | null = null;
  
  totalActivos = 0;
  baseUrl = '';
  
  private tileLayers: { [key: string]: L.TileLayer } = {
    'Oscuro': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxNativeZoom: 19, maxZoom: 22 }),
    'Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 19, maxZoom: 22 }),
    'Calles': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxNativeZoom: 19, maxZoom: 22 })
  };
  mapaBaseActual = 'Oscuro';

  capasFisicas = [
    { nombre: 'Calzadas', archivo: 'calzada.fgb', color: '#FF5733', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Puentes', archivo: 'puente.fgb', color: '#DC143C', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Túneles', archivo: 'tunel.fgb', color: '#FF69B4', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Estaciones de Peaje', archivo: 'estacion_peaje.fgb', color: '#FFFF00', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Estaciones de Pesaje', archivo: 'estacion_pesaje.fgb', color: '#FF4500', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Ciclorruta', archivo: 'ciclorruta.fgb', color: '#00FF00', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Muros', archivo: 'muro.fgb', color: '#8A2BE2', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'CCO', archivo: 'cco.fgb', color: '#FF00FF', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Bermas', archivo: 'berma.fgb', color: '#FFD700', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Cunetas', archivo: 'cuneta.fgb', color: '#00FFFF', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Defensa Vial', archivo: 'defensa_vial.fgb', color: '#FF1493', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Dispositivos ITS', archivo: 'dispositivo_its.fgb', color: '#9400D3', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Luminarias', archivo: 'luminarias.fgb', color: '#7FFF00', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Señales Verticales', archivo: 'senal_vertical.fgb', color: '#1E90FF', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Separador', archivo: 'separador.fgb', color: '#32CD32', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 },
    { nombre: 'Zonas de servicio', archivo: 'zona_servicio.fgb', color: '#FFA500', visible: true, instance: null as L.GeoJSON | null, cantidad: 0 }
  ];

  constructor(private http: HttpClient, private titleService: Title) {}

  ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('proyecto') || 'app-buga-buenaventura'; 
    this.baseUrl = `https://raw.githubusercontent.com/NicolasPlataANI/ani-datos-gis/main/${proyectoId}`;
    this.titleService.setTitle(`Inventario - ${proyectoId}`);

    this.http.get(`${this.baseUrl}/info_proyecto.json`).pipe(catchError(() => of(null))).subscribe({
      next: (data: any) => {
        if (!data) return;
        const epoch = data.fecha_avance?.["0"];
        this.info.set({
          nombre: data.nombre?.["0"], modo: data.modo?.["0"], etapa: data.etapa?.["0"], longitud: data.longitud?.["0"],
          mesAvance: epoch ? new Date(epoch).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : '---'
        });
      }
    });
  }

  ngAfterViewInit() { this.initMap(); }

  private initMap() {
    this.map = L.map('map', { zoomControl: false, maxZoom: 22 }).setView([4.6, -74.3], 7);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    this.tileLayers[this.mapaBaseActual].addTo(this.map);
    this.cargarGeometrias();
  }

  private async cargarGeometrias() {
    this.totalActivos = 0;
    let bbox = L.latLngBounds([]);

    // Procesamos todas las capas en paralelo para máxima velocidad
    const promesas = this.capasFisicas.map(async (capa) => {
      try {
        const url = `${this.baseUrl}/${capa.archivo}`;
        const response = await fetch(url);
        if (!response.ok) return;

        // Deserialización binaria usando stream
        const iterador = fgb.geojson.deserialize(response.body!);
        const features: any[] = [];
        for await (const feature of iterador) {
          features.push(feature);
        }

        if (features.length > 0) {
          capa.cantidad = features.length;
          this.totalActivos += capa.cantidad;
          capa.instance = L.geoJSON(features as any, {
            style: { color: capa.color, weight: 3, opacity: 0.9 },
            pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 3, color: capa.color, fillColor: capa.color, fillOpacity: 0.8 })
          });

          if (capa.visible) {
            capa.instance.addTo(this.map);
            bbox.extend(capa.instance.getBounds());
          }
        }
      } catch (e) {
        console.error(`Error cargando binario ${capa.nombre}:`, e);
      }
    });

    await Promise.all(promesas);

    if (bbox.isValid()) {
      this.initialBounds = bbox;
      this.map.fitBounds(bbox, { padding: [50, 50] });
    }
    this.renderizarGrafico();
    setTimeout(() => this.cargando.set(false), 300);
  }

  resetZoom() { if (this.initialBounds) this.map.fitBounds(this.initialBounds, { padding: [50, 50] }); }
  cambiarBase(nombre: string) {
    this.map.removeLayer(this.tileLayers[this.mapaBaseActual]);
    this.tileLayers[nombre].addTo(this.map);
    this.mapaBaseActual = nombre;
  }

  toggleTema() {
    this.isDark.set(!this.isDark());
    this.cambiarBase(this.isDark() ? 'Oscuro' : 'Calles');
  }

  toggleCapa(capa: any) {
    capa.visible = !capa.visible;
    if (capa.visible && capa.instance) this.map.addLayer(capa.instance);
    else if (!capa.visible && capa.instance) this.map.removeLayer(capa.instance);
  }

  toggleTodas(estado: boolean) { this.capasFisicas.forEach(capa => { if (capa.cantidad > 0 && capa.visible !== estado) this.toggleCapa(capa); }); }
  toggleGrafica() { this.graficaExpandida.set(!this.graficaExpandida()); setTimeout(() => this.chartInstance?.resize(), 50); }

  private renderizarGrafico() {
    const datosValidos = this.capasFisicas.filter(c => c.cantidad > 0).sort((a, b) => b.cantidad - a.cantidad);
    if (this.chartInstance) this.chartInstance.destroy();
    if (datosValidos.length === 0) return;
    const ctx = document.getElementById('chartActivos') as HTMLCanvasElement;
    this.chartInstance = new Chart(ctx, {
      type: 'treemap',
      data: {
        datasets: [{
          tree: datosValidos as any, key: 'cantidad', groups: ['nombre'], spacing: 2, borderWidth: 1, borderRadius: 6, borderColor: 'rgba(0,0,0,0.3)',
          backgroundColor: (ctx: any) => this.capasFisicas.find(c => c.nombre === ctx.raw?.g)?.color || '#666',
          labels: {
            display: true, color: '#000000', font: [{ size: 13, weight: '900' }, { size: 11, weight: 'normal' }],
            formatter: (ctx: any) => [ctx.raw?.g, `${ctx.raw?.v} pts`]
          }
        } as any]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
}