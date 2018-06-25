import { SliderComponent } from './../components/slider_layout/slider.component';
import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {DashboardService} from "./../services/dashboard.service";

@NgModule({
  declarations: [SliderComponent],
  imports: [],
  providers: [DashboardService],
  exports:[CommonModule, FormsModule, HttpModule, 
    ReactiveFormsModule,SliderComponent]
})
export class SharedModule { }
