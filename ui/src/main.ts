import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import VueToast from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-default.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(VueToast)

app.mount('#app')
