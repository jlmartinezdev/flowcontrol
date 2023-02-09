<template>
  <v-form>
    <v-container fluid fill-height>
      <v-layout align-center justify-center>
        <v-flex xs12 sm8 md4>
          <v-card class="elevation-12">
            <v-toolbar dark color="primary">
              <v-toolbar-title>Iniciar sesion</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
              <v-text-field
                v-model="form.username"
                label="Usuario"
                name="username"
                outlined
              ></v-text-field>

              <v-text-field
                v-model="form.password"
                :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
                :type="show ? 'text' : 'password'"
                name="password"
                label="Contraseña"
                hint="Se recomienda 8 caracter"
                counter
                @click:append="show = !show"
                outlined
              ></v-text-field>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="submit()">Login</v-btn>
            </v-card-actions>

            <p v-if="showError" id="error">Usuario/Contraseña incorrecta...</p>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </v-form>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "AuthLogin",
  components: {},
  data() {
    return {
      form: {
        username: "",
        password: "",
      },
      show: false,
      showError: false,
    };
  },
  methods: {
    ...mapActions(["LogIn"]),
    async submit() {
      const User = new FormData();
      User.append("username", this.form.username);
      User.append("password", this.form.password);
      try {
        await this.LogIn(User);
        this.$router.push("/");
        this.showError = false;
      } catch (error) {
        console.log(error)
        this.showError = true;
      }
    },
  },
};
</script>
