<template>
    <IOdometer
      class="iOdometer"
      :value="num"
      theme="train-station"
    />
  </template>
   
  <script type="text/babel">
    import IOdometer from 'vue-odometer';
    import 'odometer/themes/odometer-theme-train-station.css';
   
    export default {
      name: 'OdoMeterDefault',
      components: {
        IOdometer
      },
      props: ["val","tema"],
      data() {
        return {
         num:0
        };
      },
      mounted() {
        const that = this;
        that.num= this.val;
        
      },
      watch: {
        val: function(newVal){
          this.num= newVal;
        }
      }
    };
  </script>
   
  <style scoped>
    .iOdometer {
      font-size: 4em;
      margin: 0;
      line-height: 1em;
    }
  </style>