import { PublicCalculator } from './../../site/templates/publicCalculators/publicCalculator.component';
import { Routes } from '@angular/router';
//import {LazyAssistantComponent} from '../../site/lazyAssistant.component';
import {CalculatorComponent} from '../../site/templates/calculator.component';
import { SeoComponent } from './../../site/templates/seo.component';

export const CALCULATOR_ROUTES: Routes = [
  {
    path : 'public-calculators',
    component: PublicCalculator
  },
  {
    path : 'seo/:name',
    component: SeoComponent
  },
  // {
  //   path : 'calc',
  //   loadChildren: 'app/site/templates/calculator.module#CalculatorModule'
  // },
  {
    path: '**',
    component: CalculatorComponent
  }
  // ,
  //   {
  //     path: 'result/:leadId',
  //     component: ResultComponent
  //   }
];
