#!/usr/bin/env node

import { AppModule } from "./app/app.module";
import { AppFactory } from "modilitejs";

function bootstrap() {
  AppFactory.create(AppModule)
  .then(() => {
    process.on('SIGINT', () => {
      process.exit(0);
    });
  })
  .catch((err: Error) => {
    console.error(`[App] Error:`, err.message);
  });
}

bootstrap();
