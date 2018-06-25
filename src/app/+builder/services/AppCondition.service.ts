import { AppCondition } from './../../templates/models/appConditions.model';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BaseService } from '../../../shared/services/base.service';
@Injectable()
export class AppConditionService extends BaseService {

  public appConditions: AppCondition[];

  constructor(public _http: Http) {
    super();
  }

  fetch(payload: any): Observable<AppCondition> {
    return this._http.post(this._url + '/app_conditions/fetch_app_conditions', payload, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  create(payload: any): Observable<AppCondition> {
    return this._http.post(this._url + '/app_conditions/create_app_condition', payload, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  delete(id: any): Observable<AppCondition> {
    return this._http.post(this._url + '/app_conditions/delete_app_condition', { _id: id}, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  update(payload:any): Observable<AppCondition> {
    return this._http.post(this._url + '/app_conditions/update_app_condition', payload, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }
}
