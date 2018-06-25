import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import {CookieService} from '../services/cookie.service';

@Injectable()
export class LoginGuard implements CanActivate {
    constructor(
        public router: Router,
        public _cookieService:CookieService
    ) {}

    canActivate() {
        if (this._cookieService.readCookie('storage') == null) {
            return true;
        }
        this.router.navigate(['/dashboard']);
        return false;
    }
}
