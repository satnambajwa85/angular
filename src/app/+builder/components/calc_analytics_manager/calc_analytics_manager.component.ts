import { Component, AfterViewInit, Output, EventEmitter, OnInit , Input} from '@angular/core';
import { FeatureAuthService } from "../../../../shared/services/feature-access.service";
declare var jQuery: any;

@Component({
  selector: './calc-analytics-manager',
  templateUrl: './calc_analytics_manager.component.html',
  styleUrls: ['./../assets/css/leftList.style.css']
})

export class CalcAnalyticsManagerComponent implements AfterViewInit, OnInit {

  templateJson: any;
  selected: any = 'overview';
  @Output() selection = new EventEmitter();
  @Input() selectedAnalyticComponent:any;
  isTrafficDetailAvailable: Boolean = true;
  isFunnelAvailable: Boolean = true;

  constructor(public _featureAuthService: FeatureAuthService) {//
   
  }

  ngOnInit() {
    this.isTrafficDetailAvailable = this._featureAuthService.features.analytics.traffic_details;
    this.selected = this.selectedAnalyticComponent;
  }

  ngAfterViewInit() {
  }

  onSelect(comp: string) {
    //console.log(this.isTrafficDetailAvailable, '********************************');
    this.isTrafficDetailAvailable = this._featureAuthService.features.analytics.traffic_details;
    this.isFunnelAvailable = this._featureAuthService.features.analytics.funnel;
    if (['overview', 'user_detail'].indexOf(comp) != -1 || (comp == 'traffic_detail' && this.isTrafficDetailAvailable) || (comp == 'funnel' && this.isFunnelAvailable)) {
      this.selected = comp;
      this.selection.emit(comp);
    } else {
      this._featureAuthService.setSelectedFeature('analytics', comp);
      jQuery('.analytics').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
    jQuery('.clear-set').trigger('click');
  }
}

