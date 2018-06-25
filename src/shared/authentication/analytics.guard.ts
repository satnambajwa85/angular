import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import { isLoggedin } from './is-loggedin';
import {CookieService} from './../services/cookie.service';
import {FeatureAuthService} from './../services/feature-access.service';
@Injectable()
export class AnalyticsGuard implements CanActivate {

	constructor(public router: Router, public _featureAuthService : FeatureAuthService, public _cookieService :CookieService) {
		//this.getAccess();
	}

  	canActivate() {
          return this.getAnalyticFeature();
    }

	getAnalyticFeature(): Promise<boolean> {
		let self = this;
		return new Promise(function(resolve,reject){
			let interval = setInterval(function(){
				if(self._featureAuthService.features.isLoaded){
					let isAnalytic = <boolean>self._featureAuthService.features.analytics.active;
					resolve(isAnalytic);
					clearInterval(interval);
				}
			},50);
		})
	}


  }



