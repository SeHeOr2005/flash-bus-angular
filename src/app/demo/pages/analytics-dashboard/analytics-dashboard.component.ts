import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { AnalyticsService } from 'src/app/services/analytics.service';

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexYAxis,
  ApexLegend,
  ApexPlotOptions,
  ApexTooltip,
  ApexFill
} from "ng-apexcharts";

export type ChartOptions = {
  series: any;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  fill: ApexFill;
  colors: string[];
};

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule, NgApexchartsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss']
})
export default class AnalyticsDashboardComponent implements OnInit {
  @ViewChild("chart") chart: ChartComponent;

  // Chart Options
  chartIngresos: Partial<ChartOptions>;
  chartEdades: Partial<ChartOptions>;
  chartIncidentes: Partial<ChartOptions>;

  cargando = true;

  constructor(private analyticsService: AnalyticsService) {
    this.initCharts();
  }

  ngOnInit(): void {
    this.cargarData();
  }

  initCharts() {
    // HU-014: Ingresos (Bar Chart)
    this.chartIngresos = {
      series: [{ name: "Ingresos", data: [150000, 230000, 180000, 290000, 320000, 210000] }],
      chart: { type: "bar", height: 350 },
      plotOptions: { bar: { borderRadius: 4, horizontal: false } },
      dataLabels: { enabled: false },
      xaxis: { categories: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"] },
      colors: ["#4680ff"]
    };

    // HU-015: Edades (Pie Chart)
    this.chartEdades = {
      series: [44, 55, 13, 43, 22],
      chart: { type: "pie", height: 350 },
      labels: ["18-25", "26-35", "36-45", "46-60", "60+"],
      responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: "bottom" } } }],
      colors: ["#4680ff", "#2ca87f", "#e58a00", "#dc2626", "#673ab7"]
    };

    // HU-016: Incidentes (Line Chart)
    this.chartIncidentes = {
      series: [{ name: "Incidentes", data: [10, 41, 35, 51, 49, 62, 69, 91, 148] }],
      chart: { height: 350, type: "line", zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth" },
      grid: { row: { colors: ["#f3f3f3", "transparent"], opacity: 0.5 } },
      xaxis: { categories: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"] },
      colors: ["#dc2626"]
    };
  }

  cargarData() {
    this.cargando = true;
    // In a real app, we would use the service to update the series
    /*
    this.analyticsService.getIngresosAnalytics().subscribe(data => {
      this.chartIngresos.series = [{ name: "Ingresos", data: data.values }];
    });
    */
    setTimeout(() => {
      this.cargando = false;
    }, 1000);
  }
}
