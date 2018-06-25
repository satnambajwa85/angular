import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';
import { isLoggedin } from './is-loggedin';

@Injectable()
export class HomeRouteGuard implements CanActivate {
  constructor(public router: Router) {}

  canActivate() {
    let url = window.location.hostname;
    let url_array = url.split('.');
    if(url_array.length === 3) {
      this.router.navigate(['company-profile']);
    }
    if (isLoggedin()) {
      this.router.navigate(['dashboard']);
    }
    return true;
  }
}
