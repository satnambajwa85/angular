import { Component, AfterViewInit, Input, ViewEncapsulation } from '@angular/core';
import { OverviewComponent, UserDetailsComponent, TrafficDetailsComponent } from '../../../components/+analytics/components/index';
import { Script } from '../../../../shared/services/script.service';
import { Section, Page, App, Item } from '@builder/models';
declare var jQuery: any;
declare var google: any;
declare var window: any;

@Component({
  selector: 'calc-analytics',
  templateUrl: './calc_analytics.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    './../../../components/+analytics/assets/css/daterangepicker.css',
    './../../../components/+analytics/assets/css/analytics.component.css'
  ],
})

export class CalcAnalyticsComponent implements AfterViewInit {
  @Input() calc: App;
  @Input() component: string;
  scriptsLoaded: boolean = false;

  constructor(public _script: Script) {//
  }

  ngAfterViewInit() {
    this._script.load('highcharts', 'slimScroll', 'gCharts', 'raphael', 'morrisCharts', 'datatables', 'daterangepicker')
      .then((data) => {
        console.log('Scripts Loaded', data);
        window.loadGoogleCharts();
        this.scriptsLoaded = true;
      })
      .catch((error) => {
        //any error
      });
  }
}

