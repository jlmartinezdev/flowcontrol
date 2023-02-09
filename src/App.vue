<template>
  <v-app>
    <v-navigation-drawer
      color="blue-grey darken-3"
      dark
      app
      v-model="drawer"
      :permanent="$vuetify.breakpoint.mdAndUp"
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6"> CONTROLHIGH </v-list-item-title>
          <v-list-item-subtitle> Control de Nivel </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item v-for="item in items" :key="item.title" link>
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar color="primary" dark app>
      <v-app-bar-nav-icon
        @click.stop="drawer = !drawer"
        class="hidden-md-and-up"
      ></v-app-bar-nav-icon>
      <div class="d-flex align-center">
        <span class="mr-2">CONTROL HIGH</span>
      </div>
    </v-app-bar>
    <!-- v-if="isLoggedIn" -->

    <v-main>
      <v-container fluid>
        <router-view></router-view>
        
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
//import HelloWorld from './components/HelloWorld';
//import LayoutHome from './components/LayoutHome';

export default {
  name: "App",

  components: {
    
  },

  data: () => ({
    items: [
      { title: "Inicio", icon: "mdi-view-dashboard" },
      { title: "Acerca de", icon: "mdi-information" },
    ],
    drawer: null,
  }),
  /* computed: {
    isLoggedIn: function() {
      return this.$store.getters.isAuthenticated;
    },
  },
  methods: {
    async logout() {
      await this.$store.dispatch("LogOut");
      this.$router.push("/login");
    },
  }, */
};
</script>
