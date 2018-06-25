import { Injectable } from '@angular/core';
import { CanActivate, Router} from '@angular/router';

@Injectable()
export class CompanyProfileRouteGuard implements CanActivate {
  constructor(public router: Router) {}

  canActivate() {
    let url = window.location.hostname;
    let url_array = url.split('.');
    if(url_array.length !== 3) {
      this.router.navigate(['/']);
    }
    return true;
  }
}
