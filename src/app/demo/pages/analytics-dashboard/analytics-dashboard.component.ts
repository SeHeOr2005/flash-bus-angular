import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule, NgApexchartsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss']
})
export default class AnalyticsDashboardComponent implements OnInit {

  // Chart Options
  chartIngresos: any;
  chartEdades: any;
  chartIncidentes: any;

  cargando = true;
  error = false;

  constructor(private analyticsService: AnalyticsService) {
    this.initCharts(); // inicializa con datos de placeholder mientras carga
  }

  ngOnInit(): void {
    this.cargarData();
  }

  initCharts() {
    // HU-014: Ingresos (Bar Chart) - placeholder
    this.chartIngresos = {
      series: [{ name: 'Ingresos ($)', data: [] }],
      chart: { type: 'bar', height: 320, toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 6, horizontal: false } },
      dataLabels: { enabled: false },
      xaxis: { categories: [] },
      colors: ['#4680ff'],
      title: { text: 'Cargando...', align: 'left', style: { color: '#888' } }
    };

    // HU-015: Edades (Pie Chart) - placeholder
    this.chartEdades = {
      series: [],
      chart: { type: 'pie', height: 320 },
      labels: [],
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }],
      colors: ['#4680ff', '#2ca87f', '#e58a00', '#dc2626', '#673ab7', '#999']
    };

    // HU-016: Incidentes (Line Chart) - placeholder
    this.chartIncidentes = {
      series: [],
      chart: { height: 320, type: 'line', zoom: { enabled: false }, toolbar: { show: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      grid: { row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 } },
      xaxis: { categories: [] },
      colors: ['#dc2626', '#e58a00', '#4680ff', '#2ca87f']
    };
  }

  cargarData() {
    this.cargando = true;
    this.error = false;

    forkJoin({
      ingresos: this.analyticsService.getIngresosAnalytics(),
      edades: this.analyticsService.getEdadesAnalytics(),
      incidentes: this.analyticsService.getIncidentesAnalytics()
    }).subscribe({
      next: ({ ingresos, edades, incidentes }) => {
        this.buildIngresosChart(ingresos);
        this.buildEdadesChart(edades);
        this.buildIncidentesChart(incidentes);
        this.cargando = false;
      },
      error: () => {
        // Datos de demostración en caso de que el backend no tenga datos aún
        this.buildIngresosChartMock();
        this.buildEdadesChartMock();
        this.buildIncidentesChartMock();
        this.cargando = false;
      }
    });
  }

  // HU-014: Construir gráfico de ingresos desde datos reales
  buildIngresosChart(data: any[]) {
    if (!data || data.length === 0) { this.buildIngresosChartMock(); return; }
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const categorias = data.map(d => `${meses[(d._id?.mes || 1) - 1]} ${d._id?.anio || ''}`);
    const valores = data.map(d => d.totalIngresos || 0);
    this.chartIngresos = {
      ...this.chartIngresos,
      series: [{ name: 'Ingresos ($)', data: valores }],
      xaxis: { categories: categorias },
      title: { text: 'Ingresos por Mes', align: 'left' }
    };
  }

  // HU-015: Construir gráfico de edades desde datos reales
  buildEdadesChart(data: Record<string, number>) {
    if (!data || Object.keys(data).length === 0) { this.buildEdadesChartMock(); return; }
    const labels = Object.keys(data).filter(k => data[k] > 0);
    const valores = labels.map(k => data[k]);
    this.chartEdades = {
      ...this.chartEdades,
      series: valores,
      labels: labels
    };
  }

  // HU-016: Construir gráfico de incidentes desde datos reales
  buildIncidentesChart(data: any[]) {
    if (!data || data.length === 0) { this.buildIncidentesChartMock(); return; }
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const tipos = [...new Set(data.map(d => d._id?.tipo || 'Otro'))];
    const categorias = [...new Set(data.map(d => `${meses[(d._id?.mes || 1) - 1]} ${d._id?.anio || ''}`))];
    const series = tipos.map(tipo => ({
      name: tipo,
      data: categorias.map(cat => {
        const item = data.find(d => d._id?.tipo === tipo && `${meses[(d._id?.mes || 1) - 1]} ${d._id?.anio || ''}` === cat);
        return item?.cantidad || 0;
      })
    }));
    this.chartIncidentes = {
      ...this.chartIncidentes,
      series,
      xaxis: { categories: categorias }
    };
  }

  // --- Mocks para demostración cuando no hay datos en BD ---
  buildIngresosChartMock() {
    this.chartIngresos = {
      ...this.chartIngresos,
      series: [{ name: 'Ingresos ($)', data: [150000, 230000, 180000, 290000, 320000, 210000] }],
      xaxis: { categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'] },
      title: { text: 'Ingresos por Mes (Datos de demo)', align: 'left', style: { color: '#aaa', fontSize: '12px' } }
    };
  }

  buildEdadesChartMock() {
    this.chartEdades = {
      ...this.chartEdades,
      series: [44, 55, 13, 43, 22],
      labels: ['18-25', '26-35', '36-45', '46-60', '60+']
    };
  }

  buildIncidentesChartMock() {
    this.chartIncidentes = {
      ...this.chartIncidentes,
      series: [
        { name: 'Mecánico', data: [3, 5, 2, 8, 4, 6, 7] },
        { name: 'Tráfico', data: [7, 9, 6, 4, 10, 8, 5] }
      ],
      xaxis: { categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] }
    };
  }
}
