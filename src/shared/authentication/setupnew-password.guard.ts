import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import {CookieService} from '../services/cookie.service';
import {SubDomainService} from '../services/subdomain.service';

@Injectable()
export class SetupNewPasswordGuard implements CanActivate {
  constructor(  public router: Router,
                public _cookieService:CookieService,
                public subDomainService:SubDomainService
  ) {}

  canActivate() {
    let verification:any  = JSON.parse(localStorage.getItem('verification')) ;
    let storage = JSON.parse(this._cookieService.readCookie('storage'));
    let sub_domain = this.subDomainService.subDomain.sub_domain;
        if (verification != null ) { return true; }
        if (this._cookieService.readCookie('storage') != null && storage.companyList.includes(sub_domain)) {
            this.router.navigate(['/dashboard']);
            return false;
        }else{
            this.router.navigate(['/']);
            return false;
        }
  }
}
