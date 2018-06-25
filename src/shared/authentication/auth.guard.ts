import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import { isLoggedin } from './is-loggedin';
import {SubDomainService} from '../services/subdomain.service';
import { CompanyService } from '../services/company.service';
import {CookieService} from '../services/cookie.service';
import {environment} from '../../../environments/environment';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    public router: Router,
    public subDomainService:SubDomainService,
    public _cookieService:CookieService,
    public _companyService: CompanyService
  ) {}

  canActivate() {
   return this.authenticate(); 
  }

  authenticate(){
      let url = window.location.hostname;
      url = url.split('.')[0];

    // .then((result)=>{
      let cookie = this._cookieService.readCookie('storage');
      let storage = cookie != null ? JSON.parse(cookie) : '';
      cookie == null ? this.router.navigate(['/login']) : '';
      if(cookie != null && !storage.currentCompany){
        let url = environment.PROTOCOL+'app.' + environment.APP_EXTENSION + '/admin';
        window.location.href =  url;
      }
      cookie != null && storage.companyList && storage.companyList.indexOf(storage.currentCompany) < 0 ? this.subDomainService.redirectToFirstCompany(storage) : '';
      if (cookie != null && storage.user.role === "ADMIN")  return true;
      if (cookie != null && storage.companyList && storage.companyList.indexOf(storage.currentCompany) >= 0 && storage.currentCompany===url)  return true;
      if (cookie != null && storage.companyList && storage.companyList.indexOf(storage.currentCompany) >= 0 && storage.currentCompany!==url)  this.subDomainService.redirectToFirstCompany(storage);
      return false;
    // })
    // .catch((err)=>{
    //   return false;
    // })
    // return false;
  }
}
