import { Component,OnInit } from '@angular/core';
import { CookieService} from './../../shared/services/cookie.service';
import { FeatureAuthService} from './../../shared/services/feature-access.service';
import {MarketingService} from '../../shared/services/marketing.service';
import {Script} from '../../shared/services/script.service';

declare var window: any;

@Component({
  selector: 'og-builder',
  template: `
    <router-outlet></router-outlet>
  `,
})

export class BuilderParentComponent implements OnInit{
  constructor(
    public _cookieService : CookieService,
    public _featureAuthService : FeatureAuthService,
    public _script:Script,
    public _marketingService:MarketingService
  ) {
  }
  ngOnInit(){
    
  }
}
