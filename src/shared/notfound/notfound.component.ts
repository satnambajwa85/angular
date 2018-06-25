import { Component, OnInit, ViewEncapsulation} from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {CookieService} from '../services/cookie.service';

declare var jQuery:any;

@Component({
    selector: 'og-not-found',
    templateUrl: './notfound.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./notfound.component.css']
})

export class NotFoundComponent implements OnInit {
    isLoggedin: Boolean = false;
    link: string;
    constructor(
                public _cookieService:CookieService,
                public _router:Router)
                {};
    ngOnInit(){
        this.link= environment.APP_EXTENSION;
        let storage : any = this._cookieService.readCookie('storage');
        if (storage) {
			this.isLoggedin = true;
		}
    }

    login(){
         this._router.navigate(['/login']);
    }
   pricing(){
        this.link = environment.APP_EXTENSION;
        let protocol = environment.PROTOCOL;
        let url = this.link + '/pricing.html';
        jQuery(location).attr('href',protocol + url);

    }

    features(){
        this.link = environment.APP_EXTENSION;
        let protocol = environment.PROTOCOL;
        let url = this.link + '/features.html';
        jQuery(location).attr('href',protocol + url);

    }

    whyCalculators(){
        this.link = environment.APP_EXTENSION;
        let protocol = environment.PROTOCOL;
        let url = this.link + '/why_calculators.html';
        jQuery(location).attr('href',protocol + url);

    }

     examples(){
        this.link = environment.APP_EXTENSION;
        let protocol = environment.PROTOCOL;
        let url = this.link + '/examples.html';
        jQuery(location).attr('href',protocol + url);

    }
 }
