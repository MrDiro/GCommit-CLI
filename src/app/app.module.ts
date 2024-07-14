import { AppComponent } from "./app.component";
import { AppService } from "./app.service";
import { Module } from "modilitejs";

@Module({
  components: [
    AppComponent
  ],
  providers: [
    AppService
  ]
})
export class AppModule {}
