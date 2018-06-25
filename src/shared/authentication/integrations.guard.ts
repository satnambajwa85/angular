import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import {FeatureAuthService} from './../services/feature-access.service';
@Injectable()
export class IntegrationsGuard implements CanActivate {

  constructor(public router: Router, public featureAuth : FeatureAuthService) {
    //this.getAccess();
  }

  canActivate() {
    return <boolean>this.featureAuth.getfeatureAccess('integrations');
  }
  /* canActivate() {
   return true;//this.featureAuth.getfeatureAccess("analytics");
   }*/


}
