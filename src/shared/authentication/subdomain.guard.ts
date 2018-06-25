import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import {SubDomainService} from '../services/subdomain.service';

@Injectable()
export class SubdomainGuard implements CanActivate {
    constructor(
        public router: Router,
        public subDomainService : SubDomainService
    ) {
    }

    canActivate() {
        if (this.subDomainService.subDomain.is_sub_domain_url && !this.subDomainService.subDomain.exists) {
            this.router.navigate(['Error']);
            return false;
        }
        return true;
    }
}
