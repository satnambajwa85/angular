import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import {CookieService} from '../services/cookie.service';

@Injectable()
export class AdminLtdGuard implements CanActivate {
  constructor(public router: Router,public _cookieService: CookieService) {}

  canActivate() {
    let storage = JSON.parse(this._cookieService.readCookie('storage'));
    if (this._cookieService.readCookie('storage') !== null && storage.user.sub_role==="ADMIN_LTD") {
      this.router.navigate(['/admin/successrate'])
    }
    else if (this._cookieService.readCookie('storage') !== null && storage.user.sub_role===null) {
      return true;
    }
    else if (this._cookieService.readCookie('storage') !== null && storage.user.sub_role!=="ADMIN_LTD") {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
