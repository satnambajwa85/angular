import { Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import { environment } from './../../../environments/environment';
// declare var emailjs:any;
declare var jQuery: any;
export class BaseService {

  storage: any;
  protected _url = environment.API;
  protected headers: any;
  protected options: any;
  // public loggedOutService : LoggedOutService = new LoggedOutService();
  constructor() {
    this.storage = this.readCookie('storage');
    if (this.storage) {
      this.storage = JSON.parse(this.storage);
      this.headers = new Headers({ 'Content-Type': 'application/json', 'Authorization': 'JWT ' + this.storage.token });
    } else {
      this.headers = new Headers({ 'Content-Type': 'application/json' });
    }
    this.options = new RequestOptions({ headers: this.headers });
  }

  protected post_options() {
    return new RequestOptions({ headers: this.headers, method: 'post' });
  }

  protected get_options() {
    this.storage = this.readCookie('storage');
    if (this.storage) {
      this.storage = JSON.parse(this.storage);
      this.headers = new Headers({ 'Content-Type': 'application/json', 'Authorization': 'JWT ' + this.storage.token });
    }
    return new RequestOptions({ headers: this.headers });
  }

  protected put_options() {
    this.storage = this.readCookie('storage');
    if (this.storage) {
      this.storage = JSON.parse(this.storage);
      this.headers = new Headers({ 'Content-Type': 'application/json', 'Authorization': 'JWT ' + this.storage.token });
    }
    return new RequestOptions({ headers: this.headers, method: 'put' });
  }

  protected patch_options() {
    return new RequestOptions({ headers: this.headers, method: 'patch' });
  }

  protected extractData(res: Response) {
    let body = res.json();
    return body.data || {};
  }

  protected boolData(res: Response) {
    let body = res.json();
    return body.data;
  }

  protected handleError(error: Response) {
    let body = error.json();
    if (error.type == 3 && error.status == 0) {
      jQuery('#serverError').removeClass('hide');
      jQuery('.preloader').addClass('hide');
    }
    else {
      jQuery('#serverError').addClass('hide');
    }
    if (body.error && body.error.code === 'TokenExpiredError') {
      let expires = "";
      let domain = environment.APP_EXTENSION;
      let days = -1;
      let value = '';
      if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = "storage=" + value + expires + "; domain=" + domain + "; path=/";
      window.location.href = environment.APP_DOMAIN;
    }
    return Observable.throw(body);
  }

  readCookie(name: string) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  createCookie(name: string, value: string, days: number) {
    value = (name == 'storage' && value != '' ? this.spliceCookie(JSON.parse(value)) : value);
    let expires = "";
    let domain = environment.APP_EXTENSION;
    if (days) {
      let date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; domain=" + domain + "; path=/";
  }

  spliceCookie(storage) {
    storage.user ? storage.user.location = '' : '';
    // storage.company ? storage.company.name = '' : '';

    return JSON.stringify(storage);
  }

  eraseCookie(name: string) {
    this.createCookie(name, "", -1);
  }
}

