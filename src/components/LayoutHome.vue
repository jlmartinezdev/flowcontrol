<template>
  <div>
    <v-card>
      <v-card-title>Datos de Sensores</v-card-title>
      <v-card-text>
        <v-row>
          <v-col class="col-sm-12 col-md-6 col-12">
            <v-layout class="d-flex justify-center">
              <div id="target" style="width: 300px; height: 300px"></div>
            </v-layout>

            <v-layout d-inline>
              <div class="d-flex justify-center">
                <strong>{{ nombre_tanque }}</strong>
              </div>
              <div class="d-flex justify-center">
                <div class="text-h6">
                  {{ getLitros
                  }}<span class="mdi mdi-plus-minus-variant"></span>
                </div>
              </div>
            </v-layout>
          </v-col>
          <v-col class="col-sm-12 col-md-6 col-12">
            <v-layout d-inline>
              <span class="text-h6">Flujo de Agua Litros</span>
              <div>
                <odometer :val="flujoAgua" />
              </div>
              <br />
              <div><odometer :val="pulsos" /></div>
            </v-layout>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <br />
    <v-card>
      <v-card-title>Historial Nivel de Agua</v-card-title>
      <v-row>
        <v-col class="col-12">
          <div id="chartdiv" class="chart"></div>
        </v-col>
      </v-row>
    </v-card>
  </div>
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
    isConectedMqtt: false,
    isReceivedData: false,
    altura: 190,
    distanciaMin: 68,
    nombre_tanque: "TANQUE 1",
    alturaReal: 0,
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
          if (value > 0) return value.toFixed(0) + "%";
          else return "-";
        },
      });

      this.medidor.progress = 0;
    },
    conectMqtt: function () {
      const options = {
        clean: true, // retain session
        connectTimeout: 4000, // Timeout period
        // Authentication information
        clientId:
          "webclient_" +
          Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1),
        username: "webclient",
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
        this.medidor.progress = 0;
        this.isConectedMqtt = false;
        console.log("reconnecting...");
      });

      client.on("error", (error) => {
        console.log("Connection failed:", error);
      });

      client.on("message", (topic, message) => {
        if (topic === "S_T_AGUA") {
          this.notificacion();
          this.isReceivedData = true;
          console.log(message.toString());
          const lectura = JSON.parse(new TextDecoder("utf-8").decode(message));
          this.flujoAgua = lectura.Litro;
          this.pulsos = lectura.Pulsos;
          const nivel = this.getNivel(lectura.distancia, this.altura);
          this.pushData(nivel);
          const p = this.getPromedio();
          console.log(`Nivel: ${p}`);
          if (p > 0) {
            this.medidor.progress = p;
          }
        }
      });
    },
    notificacion: function () {
      this.medidor.borderColor = "#11c53c";
      setTimeout(()=>{ this.medidor.borderColor = "#00ff00";}, 100);
    },
    getAltura: function (lectura) {
      // Invertir lectura
      if (lectura > 0 && lectura - this.distanciaMin < this.altura) {
        if (lectura > this.distanciaMin) {
          this.alturaReal = this.altura - (lectura - this.distanciaMin);
        } else {
          this.alturaReal = this.altura;
        }
      } else {
        this.alturaReal = 0;
      }
    },
    getNivel: function (lectura, altura) {
      this.contadorLectura++;
      var nivel = 0;
      this.getAltura(lectura);
      if (lectura - this.distanciaMin > altura) {
        lectura = altura + this.distanciaMin;
      }
      if (lectura > this.distanciaMin) {
        nivel = 100 - ((lectura - this.distanciaMin) * 100) / altura;
      } else {
        nivel = 101;
      }
      if (nivel < 1) {
        nivel = 0;
      }

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
          if (response.data.length > 0) {
            this.niveles = response.data;
            this.drawChart();
          }
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
  computed: {
    getLitros: function () {
      if (this.alturaReal > 0 && this.isConectedMqtt) {
        const ancho = 200;
        const largo = 500;
        return parseInt((ancho * largo * this.alturaReal) / 100) + " Litros";
      } else {
        return "-";
      }
    },
  },
  watch: {
    isConectedMqtt: function (newVal) {
      if (newVal) {
        this.medidor.borderColor = "#31a24c";
      } else {
        this.medidor.borderColor = "#D9D9D9";
      }
    },
  },
};
</script>
<style scoped>
.chart {
  width: 100%;
  height: 500px;
}
</style>