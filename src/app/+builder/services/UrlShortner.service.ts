import {Injectable} from '@angular/core';
import {Http, Response, Headers} from '@angular/http';
import {BaseService} from '../../../shared/services/base.service';
import {environment} from "../../../../environments/environment";

@Injectable()
export class UrlShortner extends BaseService {
  shortUrl: string = '';

  constructor(public _http: Http) {
    super();
  }

  public googleShortner(longUrl: any) {
    let headers: any = new Headers({'Content-Type': 'application/json'});
    let body = {longUrl: longUrl};
    return this._http.post('https://www.googleapis.com/urlshortener/v1/url?shortUrl=http://goo.gl/fbsS&key=AIzaSyAyEiPl1ZWGqIjhCb4hPz34HgwLS_G9zZk', body, headers)
      .map((res: Response) => res.json());
  }

  public bitlyShortner(longUrl: string) {
    let headers: any = new Headers({'Content-Type': 'application/json'});
    return this._http.get(`https://api-ssl.bitly.com/v3/shorten?access_token=${environment.BITLY_ACCESS_TOKEN}&longUrl=${longUrl}`)
      .map((res: Response) => res.json());
  }
}
