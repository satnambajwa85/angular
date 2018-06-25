import { Component, AfterViewInit, ViewEncapsulation, Input } from '@angular/core';
declare var jQuery: any;

@Component({
  selector: "config",
  templateUrl: './config.template.html',
  styleUrls: ['./assets/css/component_config.style.css'],
  encapsulation: ViewEncapsulation.None
})

export class ConfigComponent implements AfterViewInit {
  @Input() component: any;
  @Input() item?:any;
  ConfigArray: any[] = ['settings', 'integrations', 'email', 'share-your-calculator', 'launch-popup', 'embedded-code', 'logic-jump',
    'customJS', 'customCSS', 'webhooks', 'promotion-checklist', 'opinion-email'];


  constructor() { }

  ngAfterViewInit() {
    if (jQuery.inArray(localStorage.getItem('hash-link'), this.ConfigArray) != -1) {
      this.component = localStorage.getItem('hash-link');
      jQuery('#config-' + this.component).click();
      jQuery('.collapseTwo').click();
      localStorage.removeItem('hash-link');
    }
  }
}
