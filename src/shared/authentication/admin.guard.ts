import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import { isLoggedin } from './is-loggedin';
import {CookieService} from '../services/cookie.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(public router: Router,public _cookieService: CookieService) {}

  canActivate() {
  	let storage = JSON.parse(this._cookieService.readCookie('storage'));
    if (this._cookieService.readCookie('storage') !== null && storage.user.role=="ADMIN") {
    	return true;
 	}
 	this.router.navigate(['/login']);
    return false;
  }
}
