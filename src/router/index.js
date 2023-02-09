import Vue from "vue";
import VueRouter from "vue-router";
//import store from "../store";
import LayoutHome from "../components/LayoutHome";
import AuthRegister from "../components/AuthRegister";
import AuthLogin from "../components/AuthLogin";


Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: LayoutHome,
    //meta: { requiresAuth: true },
  },
  {
    path: "/register",
    name: "Register",
    component: AuthRegister,
    //meta: { guest: true },
  },
  {
    path: "/login",
    name: "Login",
    component: AuthLogin,
    //meta: { guest: true },
  },

];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

/* router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (store.getters.isAuthenticated) {
      next();
      return;
    }
    next("/login");
  } else {
    next();
  }
});

router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.guest)) {
    if (store.getters.isAuthenticated) {
      next("/");//home
      return;
    }
    next();
  } else {
    next();
  }
}); */

export default router;
