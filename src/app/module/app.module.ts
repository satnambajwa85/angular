import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './../components/app/app.component';
import { HomeComponent } from './../components/home/home.component';

import { routes, APP_ROUTER_PROVIDERS } from './../../config/routes/index';
import { SharedModule } from './../../shared/modules/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    routes,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
