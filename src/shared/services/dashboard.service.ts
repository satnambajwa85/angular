import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Section, Page, App, Item } from '@models';
import { Observable } from 'rxjs/Observable';
import { BaseService } from './base.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class DashboardService extends BaseService {
    token: string;
    response: any;
    premades: BehaviorSubject<any> = new BehaviorSubject<any>([]);

    constructor(public _http: Http) {
        super();
    }

    duplicateApp(appId: any): Observable<App> {
        return this._http.post(this._url + '/dashboard/duplicate_app', appId, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    deleteApp(appId: any): Observable<App> {
        return this._http.post(this._url + '/dashboard/delete_app', appId, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    changeAppMode(id: string): Observable<App> {
        return this._http.post(this._url + '/dashboard/change_app_mode', { id: id }, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }
    changeAppPublicMode(id: string): Observable<App> {
        return this._http.post(this._url + '/dashboard/change_public_mode', { id: id }, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }
    changeLiveCalculators(id: string, status: boolean): Observable<App> {
        return this._http.post(this._url + '/dashboard/change_live_show_calc', { id, status }, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    quesChangesTemp(apps: any[]): Observable<App> {
        return this._http.post(this._url + '/dashboard/dashboard_question_changes', { apps: apps }, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    //The Temporary routes that are to be removed later

    tempCtaFixes(apps: any[]): Observable<any> {
        return this._http.post(this._url + '/temporary/fix_share_urls', { apps: apps }, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    tempShareURLFixes(apps: any[]): Observable<any> {
        return this._http.post(this._url + '/temporary/add_cta_items', { apps: apps }, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }
    getFakeUsers(amount) {
        return this._http.get(`https://uinames.com/api/?ext&amount=${amount}&region=united+states&gender=female`)
            .map(res => res.json())
            .catch(this.handleError);
    }

    getChildCompanies(companyId: String) {
        return this._http.get(this._url + '/dashboard/' + companyId + '/child-company', this.get_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    getAppDetails(appUrl: String) {
        return this._http.get(this._url + '/dashboard/' + appUrl + '/app_details', this.get_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    getPremadePreviliged(data: any) {
        // return this._http.post(this._url + '/company/get_premade_calc_status', data)
        return this._http.get(`${this._url}/company/isAccessToFeature/?type=premades&feature=${data.url}&companyId=${data.id}&companyPlan=${data.chargebee_plan_id}`)
            .map(this.extractData)
            .catch(this.handleError);
    }

    getEvents() {
        return this._http.get(`${this._url}/get_events`, this.get_options())
            .map(this.extractData)
            .catch(this.handleError);
    }
    getBlogs() {
        return this._http.get("https://outgrow.co/blog/api/get_posts/").map(data => data.json());
    }

    getCompanyPremades(data) {
        return this._http.post(`${this._url}/company/premade_calcs`, data, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    getPremades() {
        return this.premades.asObservable();
    }

    setPremades(premades) {
        this.premades.next(premades);
    }

    createCompanyFolder(data: any) {
        return this._http.post(`${this._url}/dashboard/createFolder`, data, this.post_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    getCompanyFolders(id) {
        return this._http.get(`${this._url}/dashboard/folders/${id}`)
            .map(this.extractData)
            .catch(this.handleError);
    }

    updateCompanyFolder(data) {
        return this._http.put(`${this._url}/dashboard/updateFolder`, data, this.put_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    moveFile(data) {
        return this._http.put(`${this._url}/dashboard/moveFile`, data, this.put_options())
            .map(this.extractData)
            .catch(this.handleError);
    }

    removeCompanyFolder(id) {
        return this._http.delete(`${this._url}/dashboard/deleteFolder/${id}`)
            .map(this.extractData)
            .catch(this.handleError);
    }
}
