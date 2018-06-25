import { Injectable, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BaseService } from '../../../shared/services/base.service';
import { JSONBuilder } from './JSONBuilder.service';
@Injectable()
export class LocaleService extends BaseService {
  emitterLocale: EventEmitter<any> = new EventEmitter();

  constructor(public _http: Http, public JSONBuilderHelper: JSONBuilder) {
    super();
  }

  /* returns all langCode and names list (langCode == undefined) */
  get(langCode?: any): Observable<any> {
    return this._http.post(this._url + '/locale/get_locale', { langCode: langCode }, this.post_options())
      .map(res => {
        const newRes = this.extractData(res);
        if (langCode) {
          this.JSONBuilderHelper.translatedFields = newRes.fields;
          delete this.JSONBuilderHelper.translatedFields['_id'];
          this.emitterLocale.emit('Locales Loaded');
        }
        return newRes;
      })
      .catch(this.handleError);
  }

  add(data: any): Observable<any> {
    return this._http.post(this._url + '/locale/add_locale', data, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  update(data: any): Observable<any> {
    return this._http.post(this._url + '/locale/update_locale', data, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  remove(langCode: any): Observable<any> {
    return this._http.post(this._url + '/locale/remove_locale', { langCode: langCode }, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  getTranslatedText(type) {
    return this.JSONBuilderHelper.translatedFields[type];
  }

  getEmitterLocale() {
    return this.emitterLocale;
  }
}
