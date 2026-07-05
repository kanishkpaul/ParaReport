import { register } from "node:module";

// Registers the "@/" alias resolver for the test process.
register("./alias-loader.mjs", import.meta.url);
