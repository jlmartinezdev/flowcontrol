<template>
  <v-card>
    <v-card-title>Medidor de Nivel</v-card-title>
    <v-card-text>
      <v-row>
        <v-col class="col-sm-12 col-md-6 col-12">
          <v-layout class="d-flex justify-center">
            <div id="target" style="width: 300px; height: 300px"></div>
          </v-layout>

          <v-layout d-inline>
            <div class="d-flex justify-center"><strong>Tanque 1</strong></div>
            <div class="d-flex justify-center">ALTURA 300 CM</div>
          </v-layout>
        </v-col>
        <v-col class="col-sm-12 col-md-6 col-12">
          <v-layout d-inline>
            <div><odometer :val="flujoAgua" /></div>
            <br />
            <div><odometer :val="pulsos" /></div>
          </v-layout>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="col-12">
          <div id="chartdiv" class="chart"></div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
<script>
import { CircularFluidMeter } from "fluid-meter";
import mqtt from "precompiled-mqtt";
import OdoMeter from "../components/OdoMeter";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import axios from "axios";
export default {
  name: "LayoutHome",
  components: {
    odometer: OdoMeter,
  },
  data: () => ({
    medidor: [],
    promedio: [],
    contadorLectura: 0,
    pulsos: 0,
    flujoAgua: 0,
    niveles: [],
  }),
  methods: {
    showFluid: function () {
      const target = document.querySelector("#target");

      this.medidor = new CircularFluidMeter(target, {
        initialProgress: 0,
        fluidConfiguration: {
          color: "#1e90ff",
        },
        showBubbles: false,
        dropShadow: false,
        use3D: false,
        backgroundColor: "#D9D9D9",
        borderWidth: 3,
        progressFormatter: (value) => {
          return value.toFixed(0) + "%";
        },
      });
      this.medidor.progress = 0;
    },
    conectMqtt: function () {
      const options = {
        clean: true, // retain session
        connectTimeout: 4000, // Timeout period
        // Authentication information
        clientId: "emqx_test11",
        username: "admin",
        password: "admin",
      };

      const connectUrl = "ws://181.174.200.66:8083/mqtt";

      const client = mqtt.connect(connectUrl, options);

      client.on("connect", () => {
        this.isConectedMqtt = true;
        console.log(`Cliente ${options.username} conectado`);
        client.subscribe("S_T_AGUA");
      });

      client.on("reconnect", () => {
        this.isConectedMqtt = false;
        console.log("reconnecting...");
      });

      client.on("error", (error) => {
        console.log("Connection failed:", error);
      });

      client.on("message", (topic, message) => {
        console.log(message.toString());
        const lectura = JSON.parse(new TextDecoder("utf-8").decode(message));
        this.flujoAgua = lectura.Litro;
        this.pulsos = lectura.Pulsos;
        const nivel = this.getNivel(lectura.distancia, 300);
        this.pushData(nivel);
        const p = this.getPromedio();
        console.log(`Nivel: ${p}`);
        if (p > 0) {
          this.medidor.progress = p;
        }
      });
    },
    getNivel: function (lectura, altura) {
      this.contadorLectura++;
      var nivel = 0;
      var distanciaMin = 20;

      if (lectura > altura) {
        lectura = altura;
      }
      if (lectura > distanciaMin) {
        nivel = 100 - ((lectura - distanciaMin) * 100) / altura;
      } else {
        nivel = 100;
      }

      if (nivel < 1) {
        nivel = 0;
      }
      this.lecturaAnterior = lectura;
      return Math.trunc(nivel);
    },
    getPromedio: function () {
      if (this.promedio.length == 10) {
        let total = 0;
        for (var i = this.promedio.length - 1; i >= 0; i--) {
          total += this.promedio[i];
        }
        total = total / 10;
        return Math.trunc(total);
      } else {
        return 0;
      }
    },
    pushData: function (data) {
      if (this.promedio.length < 10) {
        this.promedio.push(data);
      } else {
        this.promedio = [];
        this.promedio.push(data);
      }
    },
    drawChart: function () {
      /* Chart code */
      // Create root and chart
      let root = am5.Root.new("chartdiv");

      root.setThemes([am5themes_Animated.new(root)]);

      let chart = root.container.children.push(
        am5xy.XYChart.new(root, {
          panX: true,
          panY: true,
          wheelY: "zoomX",
          layout: root.verticalLayout,
          pinchZoomX: true,
        })
      );

      // Create Y-axis
      let yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          maxDeviation: 1,
          renderer: am5xy.AxisRendererY.new(root, { pan: "zoom" }),
        })
      );

      // Create X-Axis
      let xAxis = chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          groupData: true,
          maxDeviation: 0.5,
          baseInterval: { timeUnit: "minute", count: 1 },
          renderer: am5xy.AxisRendererX.new(root, {
            minGridDistance: 50,
            pan: "zoom",
          }),
        })
      );

      let data = this.niveles;

      // Create series
      let series = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: "Nivel",
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: "nivel",
          valueXField: "fechahora",
          tooltip: am5.Tooltip.new(root, {
            pointerOrientation: "horizontal",
            labelText: "[bold]{name}[/]\n{valueX.formatDate()}: {valueY}",
          }),
        })
      );

      series.strokes.template.set("strokeWidth", 2);
      series.fills.template.setAll({
        visible: true,
        fillOpacity: 0.4,
      });

      series.data.setAll(data);

      // Pre-zoom X axis to last hour
      series.events.once("datavalidated", function (ev, target) {
        ev;
        target;
        let lastDate = new Date(data[data.length - 1].fechahora);
        let firstDate = new Date(lastDate.getTime() - 3600000);
        xAxis.zoomToDates(firstDate, lastDate);
      });

      // Add cursor
      chart.set(
        "cursor",
        am5xy.XYCursor.new(root, {
          behavior: "none",
          xAxis: xAxis,
        })
      );

      xAxis.set("tooltip", am5.Tooltip.new(root, {}));

      yAxis.set("tooltip", am5.Tooltip.new(root, {}));

      let scrollbarX = am5xy.XYChartScrollbar.new(root, {
        orientation: "horizontal",
        height: 50,
      });

      chart.set("scrollbarX", scrollbarX);

      let sbxAxis = scrollbarX.chart.xAxes.push(
        am5xy.DateAxis.new(root, {
          baseInterval: { timeUnit: "minute", count: 1 },
          renderer: am5xy.AxisRendererX.new(root, {
            opposite: false,
            strokeOpacity: 0,
          }),
        })
      );

      let sbyAxis = scrollbarX.chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, {}),
        })
      );

      let sbseries = scrollbarX.chart.series.push(
        am5xy.LineSeries.new(root, {
          xAxis: sbxAxis,
          yAxis: sbyAxis,
          valueYField: "nivel",
          valueXField: "fechahora",
        })
      );
      sbseries.data.setAll(data);
    },
    generateChartData: function () {
      axios
        .get("?data=10&filtro=1s")
        .then((response) => {
          this.niveles = response.data;
          this.drawChart();
        })
        .catch((e) => {
          console.log(e.message);
        });
      
    },
  },
  mounted() {
    this.showFluid();
    this.conectMqtt();
    this.generateChartData();
  },
};
</script>
<style scoped>
.chart {
  width: 100%;
  height: 500px;
}
</style>