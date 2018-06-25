import { Injectable } from "@angular/core";
import { Section, Page, App, Item } from '@builder/models';
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { BaseService } from "../../../shared/services/base.service";
import { CookieService } from "../../../shared/services/index";
import { Subject } from "rxjs/Subject";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { environment } from "../../../../environments/environment";
declare var window: any;

@Injectable()
export class BuilderService extends BaseService {
  public isDemo: boolean = false;
  public saveStatus: string = "Saved";
  storage: any;
  userMisMatch: Subject<boolean> = new BehaviorSubject<boolean>(false);
  selectboxReInit: Subject<Item> = new BehaviorSubject<Item>(null);
  public premadeLogin: Subject<boolean> = new BehaviorSubject<boolean>(false);
  public createPremade: boolean = false;

  //selectizeInit: Subject<any> = new BehaviorSubject<any>(null);
  constructor(public _http: Http, public _cookieService: CookieService) {
    super();
    const cookie = this._cookieService.readCookie("storage");
    this.storage = cookie ? JSON.parse(cookie) : "";
  }

  createApp(app: App): Observable<App> {
    return this._http
      .post(this._url + "/builder/create_app", app, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  publishApp(app: any): Observable<App> {
    return this._http
      .post(this._url + "/builder/publish_app", app, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  getProject(data: any): Observable<App> {
    if (this.isDemo && this.createPremade) {
      //route with no authentication
      return this._http
        .post(
          this._url + "/builder-demo/get_project/true",
          data,
          this.post_options()
        )
        .map(this.extractData)
        .catch(this.handleError);
    } else if (this.isDemo && !this.createPremade) {
      return this._http
        .post(
          this._url + "/builder-demo/get_project/false",
          data,
          this.post_options()
        )
        .map(this.extractData)
        .catch(this.handleError);
    } else {
      return this._http
        .post(this._url + "/builder/get_project", data, this.post_options())
        .map(this.extractData)
        .catch(this.handleError);
    }
  }
  changeTemplate(dataObj): Observable<App> {
    return this._http
      .post(
        this._url + "/builder/change_template",
        dataObj,
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }
  remove(itemId: any, sectionId: any): Observable<Item> {
    if (this.isDemo) return Observable.of("").catch(this.handleError);
    return this._http
      .post(
        this._url + "/builder/remove",
        { itemId: itemId, sectionId: sectionId },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }
  removeBulk(itemId: any[], sectionId: any): Observable<Item> {
    return this._http
      .post(
        this._url + "/builder/removeBulk",
        { itemIds: itemId, sectionId: sectionId },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }
  deleteItem(itemId: any, sectionId: any): Observable<Item> {
    if (this.isDemo)
      return Observable.of({ title: "Deleted" }).catch(this.handleError);
    return this._http
      .post(
        this._url + "/builder/delete_item",
        { itemId: itemId, sectionId: sectionId },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  checkUniqueUrl(id: string, url: string): any {
    if (this.isDemo)
      return Observable.of({
        exsists: false,
        url: this.sanitizeUrl(url)
      }).catch(this.handleError);
    return this._http
      .post(
        this._url + "/builder/check_unique_url",
        {
          id: id,
          url: this.sanitizeUrl(url)
        },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  updateName(id: string, name: string): any {
    if (this.isDemo)
      return Observable.of({
        exsists: false,
        url: this.sanitizeUrl(name)
      }).catch(this.handleError);
    return this._http
      .post(
        this._url + "/builder/update_name",
        {
          id: id,
          name: name,
          url: this.sanitizeUrl(name)
        },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  addItem(sectionId: string, item: Item, index: number): Observable<any> {
    if (this.isDemo) {
      item["_id"] = this.randomId();
      return Observable.of(item).catch(this.handleError);
    }
    return this._http
      .post(
        this._url + "/builder/add_item",
        { item: item, sectionId: sectionId, index: index },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }
  insertItemOrDelete(
    sectionId: string,
    section: Section,
    item: Item[],
    status: string
  ): Observable<any> {
    return this._http
      .post(
        this._url + "/builder/insert_or_delete",
        { item: item, section: section, sectionId: sectionId, status: status },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  addSection(section: Section, item: Item, pageId: string): Observable<any> {
    if (this.isDemo) {
      section["_id"] = this.randomId();
      item["_id"] = this.randomId();
      return Observable.of([section, item]).catch(this.handleError);
    }
    return this._http
      .post(
        this._url + "/builder/add_section",
        { item: item, section: section, pageId: pageId },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  removeSection(sectionId: any): Observable<Item> {
    if (this.isDemo) return Observable.of("").catch(this.handleError);
    return this._http
      .post(
        this._url + "/builder/remove_section",
        { sectionId: sectionId },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  updateInterSectionOrder(items: Item[], sectionId: any): Observable<any> {
    if (this.isDemo) return Observable.of("").catch(this.handleError);
    return this._http
      .post(
        this._url + "/builder/update_intersection",
        { items: items, sectionId: sectionId },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  updateIntraSectionOrder(
    items: Item[],
    sectionId: any,
    itemId: any
  ): Observable<Section> {
    if (this.isDemo) return Observable.of("").catch(this.handleError);
    return this._http
      .post(
        this._url + "/builder/update_intrasection",
        { items: items, sectionId: sectionId, itemId: itemId },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }
  updateSectionOrder(sectionIds: any[], pageId: any): Observable<any> {
    return this._http
      .post(
        this._url + "/builder/update_section_order",
        { sectionIds: sectionIds, pageId: pageId },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  /** update unsaved changes **/
  updateChanges(unSavedData: any, code: any, id: any): Observable<any> {
    this.saveStatus = "Saving...";
    if (!localStorage.getItem('connect') || (localStorage.getItem('connect') && localStorage.getItem('connect').trim() != 'set')) {
      code = 'switch';
    } else if (unSavedData.sections && unSavedData.sections.length && code == 'blank') {
      let leadForm = unSavedData.sections.filter(d => d.type == "LeadFormQ" || d.type == "LeadForm");
      if (leadForm && leadForm.length) {
        code = 'switch';
      }
    } else if (unSavedData.items && unSavedData.items.length && code == 'blank') {
      let leadForm = unSavedData.items.filter(d => d.type == "leadform" || d.type == "leadform_question");
      if (leadForm && leadForm.length) {
        code = 'switch';
      }
    } else if (unSavedData.page && unSavedData.page.sections.length && code == 'blank') {
      let leadForm = unSavedData.page.sections.filter(d => d.type == "LeadFormQ" || d.type == "LeadForm");
      if (leadForm && leadForm.length) {
        code = 'switch';
      }
    }
    if (this.isDemo && this.createPremade) {
      this.premadeLogin.next(true);
      return Observable.of("").catch(this.handleError)
    } else if (this.isDemo && !this.createPremade) {
      return Observable.of("").catch(this.handleError)
    }
    return this._http
      .post(
        this._url + "/builder/" + code + "/update_changes/" + id,

        // return this._http.post(this._url + '/builder/update_changes/',
        unSavedData,
        this.post_options()
      )
      .map(res => {
        const newRes = this.extractData(res);
        this.saveStatus = "Saved";
        if (newRes.saveCode && (newRes.saveCode == 'false')) {
          //set value for understand user
          localStorage.setItem("taken_user", newRes.user_name);
          localStorage.setItem("taken_userId", newRes.user_id);
          this.userMisMatch.next(true);
        } else {
          localStorage.removeItem("taken_user");
          localStorage.removeItem("taken_userId");
          this.userMisMatch.next(false);
        }
        return newRes;
      })
      .catch(this.handleError);
  }
  sendTestMail(data: any): Observable<any> {
    if (this.isDemo) return Observable.of("").catch(this.handleError);
    return this._http
      .post(this._url + "/builder/send_test_mail", data, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  //utility functions
  sanitizeUrl(url: any): any {
    url = url
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, " ")
      .replace(/\s\s+/g, " ")
      .toString()
      .split(" ")
      .join("-");
    if (url.charAt(0) === "-") url = url.substring(1);
    if (url.charAt(url.length - 1) === "-")
      url = url.substring(0, url.length - 1);
    return url;
  }

  debounce(func: any, wait: number) {
    var timeout: any;
    return function () {
      var context = this;
      var later = function () {
        timeout = null;
        func.apply(context);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  saveCalcEmail(data: any) {
    if (this.isDemo) {
      return Observable.of({ _id: this.randomId() }).catch(this.handleError);
    }
    return this._http
      .post(this._url + "/builder/save_calc_email", data, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  calcEmail(data: any) {
    if (this.isDemo) {
      return Observable.of([
        {
          type: "Finish",
          email: "sample@outgrow.co",
          subject: "Sample subject",
          message: `Hi {fullname},
        
        Thank you for completing our quiz. Just for your record, your result was {R1}. Feel free to reply back in case you have any questions.
        
        Best`,
          sendFromName: "John Doe"
        }
      ]).catch(this.handleError);
    }
    return this._http
      .post(this._url + "/builder/calc_email", data, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  saveCustomScript(data: any): Observable<any> {
    if (this.isDemo) {
      return Observable.of({ custom_script: {} }).catch(this.handleError);
    }
    return this._http
      .post(
        this._url + "/builder/save_custom_script/" + data["app_id"],
        { scriptData: data["scriptData"] },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  saveCustomCSS(data: any): Observable<any> {
    if (this.isDemo) {
      return Observable.of({ custom_script: {} }).catch(this.handleError);
    }
    return this._http
      .post(
        this._url + "/builder/save_custom_css/" + data["app_id"],
        { cssData: data },
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  getSameCal(type: any): Observable<any> {
    // Get All Calculator With Same type and created by us
    return this._http
      .get(this._url + "/builder/" + type + "/get_same_calc/")
      .map(this.extractData)
      .catch(this.handleError);
  }

  getDuplicateAppConfig(data: any): Observable<any> {
    // Get All details of selected calculator
    return this._http
      .get(this._url + "/builder/get_duplicate_app/" + data)
      .map(this.extractData)
      .catch(this.handleError);
  }

  getAppName(data: any): Observable<any> {
    return this._http
      .get(this._url + "/builder/get_app_name/" + data)
      .map(this.extractData)
      .catch(this.handleError);
  }

  addDeleteSectionQuestion(data: any): Observable<any> {
    if (this.isDemo) return Observable.of("").catch(this.handleError);
    return this._http
      .post(
        this._url + "/builder/add_delete_question/",
        data,
        this.post_options()
      )
      .map(this.extractData)
      .catch(this.handleError);
  }

  //random ID generation
  randomId(): string {
    let length = 24;
    let chars =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      result = "";
    for (let i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * length)];
    return result;
  }

  //Unset calc user
  unsetCalcUser(id) {
    return this._http
      .get(this._url + "/builder/" + id + "/unset_app_logd")
      .map(this.extractData)
      .catch(this.handleError);
  }

  //set calc used by
  setCalcUsedBy(id, user_name, user_id, code) {
    return this._http
      .get(
        this._url +
        "/builder/" +
        id +
        "/save_app_loggd/" +
        user_id +
        "/" +
        user_name +
        "/" +
        code
      )
      .map(this.extractData)
      .catch(this.handleError);
  }
  //getAppDetails
  getAppInfo(id) {
    return this._http
      .get(this._url + "/builder/" + id + "/get_app_info")
      .map(this.extractData)
      .catch(this.handleError);
  }


  //Save builder errors
  errorSaved(data) {
    return this._http
      .post(this._url + "/logs/frontend/", data, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }
  // fetchJson(data){
  //   return this._http.post(this._url+"/builder/fetchjson",data,this.post_options())
  //      .map(this.extractData)
  //      .catch(this.handleError);
  // }
  fbPageForInstantArticle(data) {
    return this._http.post(`${this._url}/builder/fbpage_instant_articles`, data, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }
  postAppAsIA(data) {
    return this._http.post(`${this._url}/builder/postAsIA`, data, this.post_options())
      .map(this.extractData)
      .catch(this.handleError)
  }
  turnOffFeatures(data) {
    return this._http.put(`${this._url}/builder/turnOfffeatures`, data, this.put_options())
      .map(this.extractData)
      .catch(this.handleError);
  }
  setUsedPremiumFeature(data) {
    return this._http.put(`${this._url}/builder/setusedfeatures`, data, this.put_options())
      .map(this.extractData)
      .catch(this.handleError);
  }
  checkStatusOfArticle(data) {
    return this._http.get(`${this._url}/builder/instant_article/${data.app}/${data['status_id']}`, this.get_options())
      .map(this.extractData)
      .catch(this.handleError);
  }
  getAppArticle(app) {
    return this._http.get(`${this._url}/builder/instant_article/${app}`, this.get_options())
      .map(this.extractData)
      .catch(this.handleError);
  }
  fetchJson(url) {
    return this._http.post(this._url + "/builder/fetchjson",{uri:url},this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  addUndoItem(items: Item) {
    return this._http.post(this._url + '/builder/undoRedo/item_add', { items }, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  deleteUndoItem(item_id) {
    return this._http.delete(this._url + '/builder/undoRedo/' + item_id + '/item_delete/')
      .map(this.extractData)
      .catch(this.handleError);
  }

  publishGif(params) {
    return this._http.post(environment.ROOT + '/api/v1' + '/builder/publish_gif', params, this.post_options())
      .map(this.extractData)
      .catch(this.handleError);
  }

  emitSelectizeInit(data: any) {
    //this.selectizeInit.next(data);
  }

  selectboxReInitSubscribe(item: Item) {
    this.selectboxReInit.next(item);
  }

  downloadGif(gifUrl) {
    let url = encodeURIComponent(gifUrl)
    return this._http.get(`${this._url}/builder/getImage?imageUrl=${url}`, this.get_options())
  }

  getCalcOfATemplate(template, template_type) {
    return this._http.get(`${this._url}/builder/${template}/getCalc/${template_type}`)
      .map(this.extractData)
      .catch(this.handleError);
  }

}
