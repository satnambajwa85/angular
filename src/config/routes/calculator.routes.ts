import { Routes } from '@angular/router';
//import {LazyAssistantComponent} from '../../site/lazyAssistant.component';
import { SeoComponent } from './../../app/components/seo/seo.component';

export const CALCULATOR_ROUTES: Routes = [
  {
    path : 'seo/:name',
    component: SeoComponent
  },
  // {
  //   path : 'calc',
  //   loadChildren: 'app/site/templates/calculator.module#CalculatorModule'
  // }
];
