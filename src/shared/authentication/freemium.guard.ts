import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import {CookieService} from '../services/cookie.service';
import {SubDomainService} from '../services/subdomain.service';
import { CompanyService } from '../services/company.service';

@Injectable()
export class FreemiumGuard implements CanActivate {
    constructor(
        public router: Router,
        public subDomainService: SubDomainService,
        public _cookieService: CookieService,
        public _companyService: CompanyService
    ) { }

    canActivate() {
        let cookie = this._cookieService.readCookie('storage');
        let storage = cookie != null ? JSON.parse(cookie) : '';
        if(this.subDomainService.currentCompany){
            let plan_id = this.subDomainService.currentCompany.billing.chargebee_plan_id;
            let companyAccess = JSON.parse(this._cookieService.readCookie('filepicker_token_json'));
            let subscription_status = '';
            if (!companyAccess)
                window.location.href = window.location.origin + '/logout';
            else{
                let length = companyAccess.length;
                for(let i = 0; i < length ; i++){
                    if (companyAccess[i].key === storage.currentCompany) {
                        subscription_status = companyAccess[i].value;
                    }
                }
            }
            // after initial  trial period if customer dont upgrade the plan
            if (((subscription_status == "active" && plan_id == 'freemium') || subscription_status == "cancelled" ) && !this.subDomainService.currentCompany.is_admin_created) {
                let timer = setInterval(()=>{
                    this._cookieService.readCookie('storage') != null ? this.abortTimer(timer) : '';
                }, 200);

                return false;
            }
        }else if(!this.subDomainService.currentCompany){
            return false;
        }
        return true;

    }

    abortTimer(timer : any) {
         clearInterval(timer);
         this.router.navigate(['/settings/membership']);
    }
}
