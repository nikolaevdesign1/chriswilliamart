import { resolve } from "node:path";
import { defineConfig } from "vite";

const root = import.meta.dirname;

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        list: resolve(root, "list.html"),
        about: resolve(root, "about.html"),
        contacts: resolve(root, "contacts.html"),
        welcome: resolve(root, "welcome.html"),
      },
    },
  },
});
