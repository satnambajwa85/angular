
import { UndoRedo } from './services/undoRedoBuilder.service';
import { Section } from './models/section.model';
import { Page } from './models/page.model';
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx';
import { CalcEmail } from './models/calc_email.model';
import { Component, AfterViewInit, OnInit, OnDestroy, DoCheck, EventEmitter, ElementRef, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { JSONBuilder } from './services/JSONBuilder.service';
import { TemplateSwitching } from './services/templateSwitching.service';
import { FormulaService } from './services/formula.service';
import { App, Item } from '@models';
import { BuilderService } from './services/builder.service';
import { JSONItemTracker } from './services/JSONUpdateItemTracker.service';
import { DashboardService } from '../../shared/services/dashboard.service';
import { ComponentService } from './services/component.service';
import { JSONElement } from './services/JSONElement.service';
import { Title } from '@angular/platform-browser';
import { setTimeout } from 'timers';

declare var jQuery: any;
declare var bootbox: any;
declare var window: any;
declare var ga: any;
declare var fbq: any;
// declare var _kmq: any;
declare var moment: any;
declare var document: any;
declare var zoomfactor: any;
declare var currentZoom: any;
declare var curYPos: any;
declare var curXPos: any;
declare var curDown: any;
declare var xAxis: any;
declare var yAxis: any;
declare var clipboard: any;
declare var filestack: any;
declare var Clipboard: any;
declare var Math: any;

@Component({
  selector: 'sd-builder',
  host: {
    '(window:keydown)': 'keypressHandeler($event)'
  },
  templateUrl: './builder.template.html',
  styleUrls: [
    './assets/css/builder.style.css',
  ]
})
export class BuilderComponent implements AfterViewInit, OnInit, OnDestroy, DoCheck {
  allowUse: any = true;
  selfOpen: any = false;
  storage: any;
  socket: any = null;
  userName: any = '';
  logoCompany = ['morganchaney', 'seniortransitionguide', 'conversionformula'];
  smartchoicestool: String = 'smartchoicestool';
  filePickerKey: any = environment.FILE_PICKER_API;
  controls: any;
  elements: any[];
  selectedSec: any = 'build';
  selectedAnalyticComponent: string = 'overview';
  selectedConfigComponent: string = 'settings';
  appName: string;
  uniqueUrlHandler: any;
  unique: boolean = true;
  oldCalcName: string;
  srcUrl: string;
  previousJson: any;
  startAutoSave: boolean = false;
  isAnalyticsAvailable: Boolean = true;
  copied: Boolean = false;
  isMobileView: Boolean = false;
  companyName: String;
  public autoSaver: any;
  public activeSince: any;
  public sub: any;
  zoomfactor = .05;
  currentZoom = 0;
  curYPos = 0;
  curXPos = 0;
  xAxis = 0;
  yAxis = 0;
  curDown = false;
  showCongoMessage: boolean = false;
  interComData: any = null;
  showPromoCodeBuilder: boolean = false;
  ConfigArray: any[] = ["settings", "integrations", "email", "share-your-calculator", "launch-popup", "embedded-code"];
  LandingArray: any[] = ["Result", "Questionnaire", "Landing"];
  AnalyticsArray: any[] = ["overview", "user_detail", "traffic_detail"];
  hash: string = 'Landing';
  bootboxText: String = 'Your Calculator is Live';
  imgContainer: any[] = [];
  intro_overlay: boolean = false;
  helloBar = {
    flag: false,
    type: '',
    message: ''
  };
  cardStatus: string = null;
  userId: string = null;
  planId: String = '';
  subscription_status: string;
  noOfPromoCodes: number;
  showPromoCode: boolean;
  online: boolean;
  hellobarMessage: any;
  configOptionals: any;
  // undo_stack: any = [];
  // redo_stack: any = [];
  socketEmiter: any = new EventEmitter<any>(false);
  featuresToDisable: any = [];
  beingPublished: boolean = false;
  // FormulaUndoRedoSet: Subject<boolean> = new BehaviorSubject<boolean>(false);
  // undoRedoAppData: any = null;
  propertiesHidden: boolean = false;
  // itemNotChnagedField: any = ['_id', 'setResulTTitle', 'setItemType', 'setCurrentValue', 'setFormulaIndex', 'setVisibility', 'setScale', 'setLeadPlaceholder', 'setOptionImageVisibility', 'qustionImageVisibility', 'setTitle', 'setPostTitle', 'setHelptext', 'setPlaceHolder', 'setOptions', 'getField', 'getOption', 'addOptions', 'addFieldToCheckbox', 'addLinksToFooter', 'deserialize', 'updateTextFieldForT7', 'setResultLeadformPosition'];
  turningOffFeature: boolean = false;
  demoBuilder: any = false;
  currentSubscription: any;
  currentCompany: any;
  isCNameAccess: boolean = false;
  publishUrl: string;
  emptyConditions: any = {};
  invalidConditions: any = {};
  canvasEl: any;
  height: any;
  width: any;
  public popUpHeading: String = 'e'; // e for embeded and s for share
  ecomOverFlow: boolean = false; /** use for ecom purpose */

  @HostListener('window:beforeunload')
  unloadPage(event) { }
  showBanner: Boolean = true;
  showDropdown: boolean = false;

  //Embeded code
  iloaderJS: any = '//dyv6f9ner1ir9.cloudfront.net/assets/js/sloader.js';
  public fullPageCode: any = 'Generating Embed Code...';
  public fbCommentsCode: any = '';
  csrc: any;
  fsrc: any;
  constructor(public jsonBuilderHelper: JSONBuilder,
    public subDomainService: SubDomainService,
    public _builderService: BuilderService,
    public _defaultJson: DefaultJSON,
    public _itemTrackService: JSONItemTracker,
    public route: ActivatedRoute,
    public _router: Router,
    public _dashboardService: DashboardService,
    public formulaService: FormulaService,
    public _featureAuthService: FeatureAuthService,
    public _cookieService: CookieService,
    public _script: Script,
    public _TemplateSwitching: TemplateSwitching,
    public recommendationService: RecommendationService,
    public _userService: UserService,
    public _urlShortner: UrlShortner,
    public _appConditionService: AppConditionService,
    public componentService: ComponentService,
    public themingService: ThemingService,
    public _jsonElementService: JSONElement,
    public _membershipService: MembershipService,
    private _marketingService: MarketingService,
    private _titleService: Title,
    public countdownPromoService: CountdownPromoService,
    public tvs: TemplateValidatorService,
    private _redoUndoService: UndoRedo) {
    jQuery('#modalcss').attr('href', "./assets/css/common.css");
    this.uniqueUrlHandler = this._builderService.debounce(this.isUnique, 800);
    this.autoSaver = this.debounce(this.saveUnsavedData, 1000);

    this.interComData = JSON.parse(localStorage.getItem('icd'));

    //back button click fix
    this.backButtonHandling();

    this.online = false;
    this.hellobarMessage = null;
    this.publishUrl = '';
  }
  backButtonHandling() {
    window.innerDocClick = true;
    this._router.events
      .map(event => event instanceof NavigationEnd)
      .subscribe((event: boolean) => {
        if (event && !window.innerDocClick)
          window.location.href = environment.PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION + '/dashboard';
      });
  }
  previewOnMobile() {
    this.isMobileView = true;
  }
  previewOnWeb() {
    this.isMobileView = false;
  }
  goBack() {
    window.history.back();
  }
  getNavUrl() {
    return environment.PROTOCOL + environment.APP_EXTENSION;
  }
  ngOnInit() {
    console.time('loadTimeJS');
    console.time('loadTimeBuilder');
    // Clipboard 
    this.jsonBuilderHelper.isClipboardSupported = Clipboard.isSupported();
    // Get Cookie
    let cookie = this._cookieService.readCookie('storage');
    this.storage = cookie ? JSON.parse(cookie) : '';
    // socket: set user loggedIn.
    this.socketEmiter.subscribe(emit => {
      if (!(this._router.url.startsWith('/builder-demo')) && (this.socket && this.socket.id) && this.allowUse && emit && this.jsonBuilderHelper && this.jsonBuilderHelper.getJSONBuilt() && Object.keys(this.jsonBuilderHelper.getJSONBuilt()).length) {
        this.setUser(this.socket.id);
      }
    });
    // Redo/Undo: initialize stack.
    this._redoUndoService.initRedoUndoStack();
    // builder functionality
    //Premade calc made login 
    this._builderService.premadeLogin.subscribe((show) => {
      if (show) {
        setTimeout(() => this.demoBuilder = true, 2000);
        this._builderService.premadeLogin.next(false);
      }
    });

    if (this._router.url.startsWith('/builder-demo')) {
      this.initDemoBuilder();
    } else {
      this.initActualBuilder();
    }
    // Init other stuff like membership, subscription status, woomatric etc.
    this.initOtherStuff();
  }

  initActualBuilder() {
    // initializing Socket
    this.socketInitialization.call(this);
    // get features then load JS libraries then finaly load calculator in DEVMODE.
    this._featureAuthService.getAllFeatureAccess().subscribe((result) => {
      this._featureAuthService.features = new FeatureAccess(result);
      this.sub = this.route.params.subscribe(params => {
        let name = params['name'];
        if (name) this.appName = name;
        this._script.load('selectize', 'wysiwyg', 'slimScroll', 'math', 'fancybox', 'jqueryUI', 'colorPickerSliders', 'tinyColor', 'bootBox', 'handsontable', 'highcharts', 'exporting', 'gCharts', 'JSHINT', 'NumberedTextarea', 'raphael')
          .then((data) => {
            console.log('Loaded');
            this._script.load('highchartsMore', 'link', 'code', 'colors', 'font', 'font_family')
              .then((data) => {
                window.loadGoogleCharts();
                this.initiateGetCalcProcess();
              })
              .catch((error) => {
                //any error
              });
          })
          .catch((error) => {
            //any error
          });
      });
      this.isAnalyticsAvailable = this._featureAuthService.features.analytics.active;
      //Set current company name
      let storage = this.storage;
      this.userId = storage ? storage.user._id : null;
      this.planId = this.subDomainService.currentCompany.billing.chargebee_plan_id;
      this.companyName = this.subDomainService.currentCompany.name;
    });
  }

  initDemoBuilder() {
    this._featureAuthService.features = new DemoFeatureAccess();
    this.sub = this.route.params.subscribe(params => {
      let name;
      if (this.route.snapshot.queryParams['premade']) {
        name = this.route.snapshot.queryParams['premade'];
        this._builderService.createPremade = true;
      } else {
        name = params['name'] || 'sample-calculator';   // app name is required,by default it redirects to _ url
      }
      if (name)
        this.appName = name;
      this._script.load('selectize', 'wysiwyg', 'slimScroll', 'math', 'fancybox', 'jqueryUI', 'colorPickerSliders', 'tinyColor', 'bootBox', 'handsontable', 'highcharts', 'exporting', 'gCharts', 'JSHINT', 'NumberedTextarea', 'raphael')
        .then((data) => {
          console.log('Loaded');
          this._script.load('highchartsMore', 'link', 'code', 'colors', 'font', 'font_family')
            .then((data) => {
              window.loadGoogleCharts();
              this.getApp({ url: this.appName });
            })
            .catch((error) => {
              //any error
            });
        })
        .catch((error) => {
          //any error
        });
    });
    this.isAnalyticsAvailable = this._featureAuthService.features.analytics.active;
    this.companyName = 'Demo';
    this._builderService.isDemo = true;
  }

  initOtherStuff() {
    this.subscription_status_company();

    this.calculateNumberOfPromoCode();
    this.initWooMatrics();

    this.getPlanSubscription();

    this.calculateNumberOfPromoCode();
    this.initWooMatrics();
    if (this.storage) {
      this.online = true;
    }
    this.hellobarMessage = this._cookieService.readCookie('hellobar') ? JSON.parse(this._cookieService.readCookie('hellobar')) : null;
    this.formulaUndoRedoSet();
  }

  subscription_status_company() {
    let companyAccess = JSON.parse(this._cookieService.readCookie('filepicker_token_json'));
    if (companyAccess) {
      companyAccess.forEach((e: any) => {
        if (e.key === this.subDomainService.subDomain.sub_domain) {
          this.subscription_status = e.value;
        }
      });
    }
  }

  formulaUndoRedoSet() {
    this._redoUndoService.FormulaUndoRedoSet.subscribe(flg => {
      if (flg) {
        this._redoUndoService.updateFormula();
      }
    });
  }

  getPlanSubscription() {
    this._membershipService.getPlanSubscription()
      .subscribe(
        (success: any) => {
          this.currentSubscription = new Subscriptions(success.currentplan.subscription);
          switch (this.currentSubscription.status) {
            case 'in_trial':
              let difference;
              this.countdownPromoService.subscription = this.currentSubscription;
              if (this.countdownPromoService.trialEnd) {
                difference = moment.duration(this.countdownPromoService.trialEnd.diff(moment(new Date())));
              }
              let trialEnd = moment.unix(success.currentplan.subscription.trial_end);
              this.countdownPromoService.setCountdownTimer(trialEnd);
              break;
          }
        });
  }

  initWooMatrics() {
    this._marketingService.initGTM()
      .then(data => this._marketingService.initWootric())
      .then(data => this._marketingService.identifyUser())
      .catch(err => console.log('Errpr', err));
  }

  socketInitialization() {
    localStorage.setItem('connect', 'wait');
    //Socket connection....
    this.socket = (environment.APP_DOMAIN == 'https://app.outgrow.co') ? io.connect(environment.ROOT, { secure: true }) : io.connect(environment.ROOT);
    this.socket.on('connect', () => localStorage.setItem('connect', 'connect'));
    this.socket.on('socket-conn-id', this.connectionInit.bind(this));
    this.socket.on('connect_error', this.connectionError.bind(this));
    this.socket.on('calc-used-by-set-done', this.setAppLockSetting.bind(this));
    this.socket.on('lock-builder', this.lockBuilder.bind(this));
    this.socket.on('disconnect', () => localStorage.setItem('connect', 'disconnect'));
    this.socket.on('publish_gif', this.gifPublished.bind(this));
    this._builderService.userMisMatch.subscribe(result => {
      if (result) {
        if ((!this.socket || !this.socket.id) && !(this._router.url.startsWith('/builder-demo'))) {
          //wait for socket connection....
        } else {
          const user_id = localStorage.getItem('taken_userId');
          if (this.jsonBuilderHelper.getJSONBuilt().user_id == user_id) {
            this.selfOpen = true;
          } else {
            this.selfOpen = false;
          }
          this.allowUse = false;
          this.userName = localStorage.getItem('taken_user');
          this.checkTimeOut();
        }
      } else {
        this.allowUse = true;
        let data = JSON.stringify(this.jsonBuilderHelper.getJSONBuilt());
        this._redoUndoService.setUndoStack(this.jsonBuilderHelper.getJSONBuilt() ? data : null);
      }
    });
  }

  ngAfterViewInit() {
    this._featureAuthService.getFeatures().subscribe(result => {
      if (result.length) {
        (this._featureAuthService.features && this._featureAuthService.features.cname && this._featureAuthService.features.cname.active) && (this.isCNameAccess = true);
      }
    })
    document.onmouseover = () => window.innerDocClick = true;
    document.onmouseleave = () => window.innerDocClick = false;
    if (window.Intercom) {
      window.Intercom('update', { 'app_current_page': 'builder' });
      window.Intercom('update', { 'app_current_page_url': window.location.href });
    }
    this.setPublishUrl();
  }

  introoverlay() {
    this.intro_overlay = false;
    localStorage.removeItem('intro');
  }

  callPopup(id: string) {
    const pid = id.split('_')[0] + '_y';
    jQuery('button[id=' + pid + '_nd]').trigger('click');
  }

  publishUpgrade() {
    jQuery('#publish-upgrade').modal('hide');
    this.showCongoMessage = false;
    jQuery('.editor-modal').removeClass('golive-popup');
    setTimeout(() => {
      this.callPopup('essentials_m');
    }, 200);
  }

  public planBasedCta(json: any) {
    if (!this._featureAuthService.features.cta.redirect_url) {
      if (json.templateType == 'Numerical') {
        let section = json.pages.find((page: any) => page.type == 'Result')
          .sections.find((section: any) => section.type == 'LeadForm');
        section.items.map((item: any) => {
          if (item.type == 'click_button') item.visible = false;
          else if (item.type == 'cta_shares') item.visible = true;
          else if (item.type == 'cta_likes') item.visible = false;
        });
      } else if (json.templateType != 'Graded') {
        json.formula.map((formula: any) => {
          formula.isValid = false;
          formula.units.postfix = true;
        });
      }
    }

    //Tint toggle set according to plan
    json.theme.tintToggle = this._featureAuthService.features.custom_styling.custom_tints;

    return json;
  }

  calculateNumberOfPromoCode() {
    this.showPromoCode = false;
    let promoCodeValidity = this._cookieService.readCookie('promo_codes_validity');
    if (this._cookieService.readCookie('promo_codes_count') && promoCodeValidity) {
      //decrease promo codes count randomly
      let today = new Date();
      let dateFromCookie = Date.parse(promoCodeValidity);
      let differenceInDays = Math.floor((today.getTime() - dateFromCookie) / (1000 * 60 * 60 * 24));
      differenceInDays = differenceInDays > 0 ? 1 : 0;
      let randomNum = Math.floor(Math.random() * (4 - 1) + 1);
      this.noOfPromoCodes = +this._cookieService.readCookie('promo_codes_count');
      let promoCodesCount = this.noOfPromoCodes - (differenceInDays * randomNum);
      if (promoCodesCount > 0) {
        this.noOfPromoCodes = promoCodesCount;
      }
      this._cookieService.createCookie('promo_codes_count', this.noOfPromoCodes + '', 30);

    } else {
      this._cookieService.createCookie('promo_codes_count', '50', 30);
      this.noOfPromoCodes = 50;
      this._cookieService.createCookie('promo_codes_validity', new Date().toDateString(), 30);
    }
  }

  initiateGetCalcProcess() {
    // window.Intercom('update', { hide_default_launcher: true });
    if (this.appName) {
      this.getApp({ url: this.appName, company: this.subDomainService.subDomain.sub_domain });
    } else {
      //create new app on load
      let project = localStorage.getItem('project');
      let template = localStorage.getItem('temp_name');
      let temp_type = localStorage.getItem('temp_type');
      if (project === 'New' || project == 'Duplicate') {
        let json: any;
        let appName: any;
        json = this._defaultJson.getJSON(template);
        this._builderService.getAppName(this.subDomainService.subDomain.company_id)
          .subscribe(data => {
            appName = data;
            localStorage.setItem('calc_name', appName);
            if (project === 'New') {
              json.url = appName;
              json.version = 'V_3_5';
              json.public = true;
              if (this.subDomainService.currentCompany.GDPR) {
                json.is_gdpr = true;
                json = this.checkforGDPR(json, this.subDomainService.currentCompany.name);
              }
              this.generateCalculator(json, template, temp_type);
            } else {
              this._builderService.getDuplicateAppConfig(localStorage.getItem('DuplicateURL'))
                .subscribe(data => {
                  let json = this.modifiedJson(data, appName);
                  localStorage.removeItem('DuplicateId');
                  localStorage.removeItem('DuplicateURL');
                  this.generateCalculator(json, json.template, json.templateType);
                }, err => console.log('Duplicate Data Fetch Error: ', err))
            }
            this.updateIntercomforPage();
          }, err => {
            appName = '';
            console.log(err);
          })
      }
      else if (!project) {
        // this._router.navigate(['/dashboard']);
      }
      else {
        this.getApp({ _id: project, company: this.subDomainService.subDomain.sub_domain });
      }
    }
  }

  modifiedJson(data, appName): any { // Some Manual Changes When User Select Duplicate Cal
    let json = new App().deserialize(data);
    json.status = 'DEV';
    json.version = 'V_3_5';
    json.public = true;
    json.url = appName;
    if (!(json.template === 'sound-cloud-v3' || json.template === 'template-seven' || json.template === 'experian' || json.template === 'template-eight')) {
      json.versioning['resultV2'] = true;
    }
    json.mode = 'PRIVATE';
    json['parentApp'] = null;
    json.changed = false;
    json.premade_data.is_premade = true;
    json.premade_data.app_url = localStorage.getItem('DuplicateURL');
    json.premade_data.app_id = data._id;
    json = this.getHeaderFooter(json);
    json = this.getVkButton(json);
    if (this.subDomainService.currentCompany.GDPR) {
      json.is_gdpr = true;
      json = this.checkforGDPR(json, this.subDomainService.currentCompany.name);
    }
    return json;
  }
  checkforGDPR(app: any, name: any) {
    let landing_leadform: any;
    let ques_leadform: any;
    let result_leadform: any;
    // For Welcome Screen
    app.pages[0].sections.forEach((section) => {
      if (!landing_leadform)
        landing_leadform = section.items.find((item) => item.type === 'leadform');
    });
    // For Question Page
    app.pages[1].sections.forEach((section) => {
      if (!ques_leadform)
        ques_leadform = section.items.find((item) => item.type === 'leadform_question');
    });
    // For Result Page
    app.pages[2].sections.forEach((section) => {
      if (!result_leadform)
        result_leadform = section.items.find((item) => item.type === 'leadform');
    });
    // Modify Leadform JSON
    let item = new Item;
    let temp_item = item.getField();
    temp_item.type = 'others';
    temp_item.subType = 'checkbox';
    temp_item.icon = 'GDPR';
    temp_item.key = 'others';
    temp_item.name = 'Confirm your subscription';
    temp_item.placeholder = ' I agree to share the information with ' + name + ' and its partners.';
    temp_item.validations.required.status = true;
    if (landing_leadform) {
      landing_leadform.fields.push(temp_item);
    }
    if (ques_leadform) {
      ques_leadform.fields.push(temp_item);
    }
    if (result_leadform) {
      result_leadform.fields.push(temp_item);
    }
    return app;
  }
  getHeaderFooter(app: any) {
    let sections = app.pages[0].sections;
    if (sections.findIndex(d => d.type == 'Page_Header') == -1) {
      const headerIndex = sections.findIndex(d => d.type == 'Footer');
      if (headerIndex >= 0) {
        app.pages[0].sections[headerIndex].type = 'Page_Header';
        app.pages[0].sections[headerIndex].title = 'Page_Header';
        app = this.createHeader(app, headerIndex);
      }
    }
    sections = app.pages[2].sections;
    const footerSection = sections.find(d => d.type == 'Page_Footer');
    if (!footerSection) {
      this.createFooter(app);
    }
    return app;
  }

  getVkButton(app) {
    let resultSec = app.pages[2].sections.find(sec => sec.type == 'LeadForm');
    let shares = resultSec.items.find(it => it.type == 'cta_shares');
    let newItem1 = new Item, option1 = newItem1.getOption();
    let newItem2 = new Item, option2 = newItem2.getOption();
    if (shares.options.length <= 3) {
      option1 = Object.assign(option1, { type: 'VKontakte', selected: false, label: shares.options[0].label, icon: shares.options[0].icon, title: shares.options[0].title })
      shares.options.push(option1)
    }
    if (shares.options.length <= 4) {
      option1 = Object.assign(option1, { type: 'Whatsapp', selected: false, label: shares.options[0].label, icon: shares.options[0].icon, title: shares.options[0].title })
      shares.options.push(option1)
      option1 = Object.assign(option1, { type: 'Mail' })
      shares.options.push(option1)
      option1 = Object.assign(option1, { type: 'Messenger' })
      shares.options.push(option1)
    }
    let likes = resultSec.items.find(it => it.type == 'cta_likes');
    if (likes.options.length <= 2) {
      option2 = Object.assign(option2, { type: 'VKontakte', selected: false, label: likes.options[0].label, icon: likes.options[0].icon, title: likes.options[0].title })
      likes.options.push(option2);
    }
    return app;
  }
  createHeader(app, headerIndex) {
    let item = new Item('header_links', 'This is the footer link', 'somehelp random');
    item.addLinksToFooter([{ label: 'Header Link1', value: 'http://outgrow.co' },
    { label: 'Header Link2', value: 'http://outgrow.co' },
    { label: 'Header Link3', value: 'http://outgrow.co' }
    ]);
    item.postfix = 'right';
    item.setVisibility(false);
    app.pages[0].sections[headerIndex].items.unshift(item);
    return app;
  }
  createFooter(app) {
    let section = new Section('Page_Footer', 'landing-footer-outer');
    let item = new Item('footer_links', 'This is the footer link', 'somehelp random');
    item.addLinksToFooter([{ label: 'Footer Link1', value: 'http://outgrow.co', title: '1' },
    { label: 'Footer Link2', value: 'http://outgrow.co', title: '1' },
    { label: 'Footer Link3', value: 'http://outgrow.co', title: '1' }
    ]);
    item.postfix = 'left';
    item.setVisibility(false);
    section.addItems(item);
    app.pages[2].sections.push(section);
    return app;
  }
  //Function For Generate Calculator.....
  generateCalculator(json, template, temp_type) {
    if (this.subDomainService.currentCompany['global_configuration'] &&
      this.subDomainService.currentCompany.global_configuration['logo_url']) {
      console.log('Updating Company Logo.....');
      let logo = this.jsonBuilderHelper.getLandingPageItemsList(json).find((item) => item.type === 'logo');
      logo.props.title = this.subDomainService.currentCompany.global_configuration['logo_url'];
      logo.props.postfix = true;
    }
    let company_id = this.subDomainService.subDomain.company_id;
    json.setCompany(company_id);
    json.setTemplateName(template);
    json.setTemplateType(temp_type);
    json.setNavigateUrl(this.getNavUrl());
    json = this.planBasedCta(json);
    this._builderService.createApp(json)
      .subscribe(
        (response: any) => {
          // FBQ event
          /*fbq('trackCustom', 'Calculator built', {
            'template': template
          })*/
          let app: App = new App().deserialize(response);
          this.activeSince = moment(response.createdAt).fromNow().replace('ago', '').trim();
          localStorage.setItem('project', app._id);
          localStorage.removeItem('temp_name');
          localStorage.removeItem('temp_type');
          if (localStorage.getItem('calc_name')) {
            let storageCookie = JSON.parse(this._cookieService.readCookie('storage'));
            if (storageCookie) {
              let name = storageCookie['user'].name.split(' ')[0];
            }
            app.name = `${this.capitalize(name)}'s #${localStorage.getItem('calc_name').split('-')[1]} ${app.templateType == 'Numerical' ? 'calculator' : (app.templateType == 'Poll' ? 'poll' : 'quiz')}`;
            this.addCalcName(app);
          }
          this.emailForNewApp(app);
        },
        (error: any) => {
          // this._router.navigate(['/dashboard']);
        }
      );
    /*==== Intercom ====*/
    if (this.interComData) {
      this.interComData.calculators_created++;
      localStorage.setItem('icd', JSON.stringify(this.interComData));
      window.Intercom('update', this.interComData);
    }
    this.setPublishUrl();
    /*====*/
  }

  capitalize(str: String) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  addCalcName(app: App) {
    this._builderService.updateName(app._id, app.name)
      .subscribe(
        (response: any) => {
          app.url = response.url;
          window.history.replaceState({}, '', '/builder/' + response.url);
          localStorage.removeItem('calc_name');
          this.jsonBuilderHelper.setTemplate(app);
          this.setUser(this.socket.id);
          this.showOverlay();
          if (app.template === 'template-seven' && !app.pages[0].visible) {
            this.jsonBuilderHelper.setSelectedModel('Control');
          } else {
            this.jsonBuilderHelper.setSelectedModel('Page');
          }
          this.jsonBuilderHelper.devMode = true;
          this.setShortUrl();
          this.initializeJqueryStuff();
          this.oldCalcName = this.jsonBuilderHelper.getJSONBuilt().name;
          //Document Title
          if (this.jsonBuilderHelper.getJSONBuilt().name == '')
            document.title = "Outgrow | " + this.companyName + "'s Calculator";
          else
            document.title = "Outgrow | " + this.jsonBuilderHelper.getJSONBuilt().name;
        },
        (error: any) => {
          console.log(error);
        });
  }

  //Do all the fixes that are to be done at builder init
  afterAppGet() {
    if (this.socket && this.socket.id && !(this._router.url.startsWith('/builder-demo'))) {
      this.setUser(this.socket.id);
    }
    try {
      if (this.jsonBuilderHelper.isTempType(['Graded', 'Numerical'])) {
        let resultPage = this.jsonBuilderHelper.getJSONBuilt().pages.find((page: any) => page.type == 'Result');
        let resultSection = resultPage.sections.find((section: any) => section.type == 'Result');
        let leadformSection = resultPage.sections.find((section: any) => section.type == 'LeadForm');
        if (resultSection.items[0].optionImageVisible) { //if conditionalCTA is ON
          leadformSection.items.map((item: any) => {
            (['click_button', 'cta_shares', 'cta_likes'].indexOf(item.type) !== -1) && (item.visible = false);
          });
        }
      }
    } catch (e) {
      console.log('result section cta fix error', e)
    }
  }

  setShortUrl() {
    if (!this.jsonBuilderHelper.getJSONBuilt().shortUrl) {
      this._urlShortner.googleShortner(environment.PROTOCOL + 'live' + '.' + environment.APP_EXTENSION + '/seo/' + this.jsonBuilderHelper.getJSONBuilt()._id +
        '?sLead=1').subscribe(
          body => {
            this.jsonBuilderHelper.getJSONBuilt().shortUrl = body.id;
          }
        );
    }
  }

  getApp(data: any) {
    console.time('loadTimeCalc');
    let projectId = localStorage.getItem('project');
    let templateName = localStorage.getItem('temp_name');
    if (templateName) {
      this.changeTemplate(projectId, templateName);
    } else {
      this._builderService.getProject(data)
        .subscribe(
          (response: any) => {
            if (jQuery.isEmptyObject(response)) {
              // this._router.navigate(['/dashboard']);
            } else {
              let app: App = new App().deserialize(response);
              console.timeEnd('loadTimeCalc');
              this.getAppStuff(app);
              window.history.replaceState({}, '', (this._builderService.isDemo ? '/builder-demo/' : '/builder/') + response.url);
            }
            this.updateIntercomforPage();
          },
          (error: any) => {
            // this._router.navigate(['/dashboard']);
          }
        );
    }
  }

  getAppStuff(app) {
    this.jsonBuilderHelper.setTemplate(app);
    console.timeEnd('loadTimeBuilder');
    if (localStorage.getItem('predefinedPallete')) {
      const pallete = JSON.parse(localStorage.getItem('predefinedPallete'));
      this.jsonBuilderHelper.getJSONBuilt().setThemeColor(pallete.themeClass);
      this.jsonBuilderHelper.getJSONBuilt().theme.componentColor = pallete.components;
      this.jsonBuilderHelper.getJSONBuilt().theme.textColor = pallete.text;
      this.jsonBuilderHelper.getJSONBuilt().theme.bgColor = pallete.backGround;
      this.themingService.setColors();
      localStorage.removeItem('predefinedPallete');
      this.saveUnsavedData({
        app: this.jsonBuilderHelper.getJSONBuilt(),
        page: this.jsonBuilderHelper.getJSONBuilt().pages[0],
        sections: [],
        items: []
      }, true);
    }

    if (app.template === 'template-seven' && !app.pages[0].visible) {
      this.jsonBuilderHelper.setSelectedModel('Control');
    } else {
      this.jsonBuilderHelper.setSelectedModel('Page');
    }
    this.jsonBuilderHelper.devMode = true;
    this.setShortUrl();
    this.afterAppGet();
    this.initializeJqueryStuff();
    this.oldCalcName = this.jsonBuilderHelper.getJSONBuilt().name;
    this.activeSince = moment(app.updatedAt).fromNow().replace('ago', '').trim();
    //getting particular AppSumo Features
    let isAppSumo = this.jsonBuilderHelper.getJSONBuilt().isAppSumoCreated;
    this._featureAuthService.getAppSumofeatures(isAppSumo);
    //Document Title
    if (this.jsonBuilderHelper.getJSONBuilt().name == '')
      document.title = "Outgrow | " + this.companyName + "'s Calculator";
    else
      document.title = "Outgrow | " + this.jsonBuilderHelper.getJSONBuilt().name;

    this.checkFeatures();
  }

  showOverlay() {
    if (localStorage.getItem('intro') === 'show')
      this.intro_overlay = true;
  }

  /* email entry for new app */
  emailForNewApp(app: App) {
    let storage = this.storage;
    if (app.templateType == 'Numerical') {
      var emailMessage = `<p>Hi {fullname},
      </p><p>Thank you for using our ` + app.name + ` calculator.
      Just for your record, your result was {R1}.
      Feel free to reply back in case you have any questions.</p><p>Best</p>`;
    } else if (app.templateType == 'Recommendation') {
      var emailMessage = `<p>Hi {fullname},
      </p><p>Thank you for completing our ` + app.name + ` quiz.
      Just for your record, you got {Outcome} as your outcome.
      Feel free to reply back in case you have any questions.</p><p>Best</p>`;
    } else if (app.templateType == 'Poll') {
      var emailMessage = `<p>Hi {fullname},
      </p><p>Thank you for completing our ` + app.name + ` poll.
      Just for your record, you got {Average_Poll_Result} as your poll score.
      Feel free to reply back in case you have any questions.</p><p>Best</p>`;
    } else {
      var emailMessage = `<p>Hi {fullname},
      </p><p>Thank you for completing our ` + app.name + ` quiz.
      Just for your record, you got {Score_absolute} as your score.
      Feel free to reply back in case you have any questions.</p><p>Best</p>`;
    }
    let tempType = {
      'Numerical': 'calculator',
      'Recommendation': 'quiz',
      'Graded': 'quiz',
      'Poll': 'poll',
      'Ecom': 'quiz'
    }
    let gdpr = this.subDomainService.currentCompany.GDPR;
    if (gdpr) {
      emailMessage += `<br><br><br>You are receiving this email as you took the ${app.name} ${tempType[app.templateType]}. If at any point in time, 
      you wish to receive or delete all your information held 
      by ${this.subDomainService.subDomain.sub_domain}, e-mail us at ${storage.user.emails[0].email}<br>`;
    }
    let calcModel = new CalcEmail({
      app: app._id,
      type: 'Finish',
      email: storage.user.emails[0].email,
      subject: app.name,
      message: emailMessage,
      customNotifyMail: true,
      notifyTeam: {
        sendFrom: storage.user.emails[0].email,
        subject: 'New Lead',
        message: `<p>Hey Admin,</p><p><br></p><p>You got a new lead on calculator  ${app.name}.</p><p><br></p><p>Some of the details are:</p><p><br></p><p>Name: {fullname}</p><p>Email: {email}</p><p><br></p><p>Thanks,</p><p><br></p><p>Outgrow Team</p>`,
        sendFromName: 'Outgrow'
      }
    });
    this._builderService.saveCalcEmail(calcModel)
      .subscribe(
        (response: any) => {
        },
        (error: any) => {
          console.log(error);
        }
      );
  }

  changeTemplate(projectId: any, templateName: string) {
    let currTemplate = localStorage.getItem('currTemplate');
    let controlArray = this.jsonBuilderHelper.templateControls(templateName);
    let DefaultAPP = this._defaultJson.getJSON(templateName);
    this._builderService.changeTemplate({
      projectId: projectId,
      templateName: templateName,
      currTemplate: currTemplate,
      controlArray: controlArray,
      defaultJSON: DefaultAPP
    }).subscribe(
      (response: any) => {
        if (jQuery.isEmptyObject(response)) {
          // this._router.navigate(['/dashboard']);
        } else {
          let app = new App().deserialize(response);
          if (!this.checkForCustomTheme(app, currTemplate)) {
            let themePalettes = this._jsonElementService.gettemplatePalettes(templateName);
            themePalettes.pallete = themePalettes.pallete.filter(pal => pal.subType.indexOf(app.templateType) >= 0)
            localStorage.setItem('predefinedPallete', JSON.stringify(themePalettes.pallete[0]));
          }
          localStorage.removeItem('changeTemplate');
          localStorage.removeItem('temp_type');
          localStorage.removeItem('temp_name');
          window.location.reload(true);
        }
      },
      (error: any) => {
        // this._router.navigate(['/dashboard']);
      }
    );
  }

  openLeadEditor(event: any) {
    if (['experian'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0) {
      if (this.jsonBuilderHelper.getSelectedPage().type !== 'Landing' && this.jsonBuilderHelper.getJSONBuilt().pages[0].visible) {
        this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getJSONBuilt().pages[0]);
        this.scrollIt('.page_0', 'Landing');
      } else if (!this.jsonBuilderHelper.getJSONBuilt().pages[0].visible) {
        bootbox.dialog({
          size: 'small',
          message: `
                      <div class="bootbox-body-left">
                          <div class="mat-icon">
                              <i class="material-icons">error</i>
                          </div>
                      </div>
                      <div class="bootbox-body-right">
                          <p class="">The lead generation form is only supported on the welcome screen for this template. Turn on the welcome screen for the lead generation form.</p>
                      </div>
              `,
          buttons: {
            cancel: {
              label: "Cancel",
              className: "btn-cancel btn-cancel-hover"
            }
          }
        });
        return;
      }
    }
    let data = this.jsonBuilderHelper.getVisibleLeadForm();
    if (['sound-cloud', 'sound-cloud-new', 'sound-cloud-v3', 'template-seven'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0) {
      if (this.jsonBuilderHelper.getSelectedPage().type === 'Questionnaire' && jQuery.isEmptyObject(data['page'][0])) {
        return;
      }
    }
    if (!jQuery.isEmptyObject(data['page'][0])) {
      this.jsonBuilderHelper.setSelectedPage(data['page'][0]);
      this.jsonBuilderHelper.setSelectedSection(data['section'][0]);
      this.jsonBuilderHelper.setSelectedModel('Section');
      if (data['page'][0].type === 'Questionnaire') {
        this.scrollIt('.sec_' + (data['page'][0].sections.length - 1));
      } else if (data['page'][0].type === 'Landing') {
        this.scrollIt('.page_0', data['page'][0].type);
      } else {
        if (this.jsonBuilderHelper.getPage('Landing').visible) {
          this.scrollIt('.page_2', data['page'][0].type);
        } else {
          this.scrollIt('.page_1', data['page'][0].type);
        }
      }
    } else {
      this.jsonBuilderHelper.setSelectedSection(this.getLeadSection());
      this.jsonBuilderHelper.setSelectedModel('Section');
      // event.stopPropagation();
      // event.preventDefault();
    }
  }

  getLeadSection() {
    if (this.jsonBuilderHelper.getSelectedPage().type == 'Questionnaire')
      this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getPage('Result'))
    for (let section of this.jsonBuilderHelper.getSelectedPage().sections) {
      if (section.type === 'LeadFormQ' || section.type === 'LeadForm' || section.type === 'Content Area') {
        return section;
      }
    }
  }

  scrollIt(bindingClass1: string, event?: any) {
    if (jQuery(bindingClass1).length) {
      var position = 0;
      var templateHeight = 0;
      var zoomFactor = 1;
      var topVal = 0;

      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        var tHeight = -150;
      }
      else {
        zoomFactor = jQuery('temp-dev').css('zoom');
        tHeight = 80;
      }
      if (jQuery('.sound-cloud').length > 0) {
        // for template sound-cloud
        jQuery('.sound-cloud').addClass('template2');
        console.log(bindingClass1, 'bindingClass1');
        if (bindingClass1 === ".page_0") {
          templateHeight = -jQuery(bindingClass1).position().top;
        }
        else if (bindingClass1 == ".page_1") {
          templateHeight = jQuery('.template2').height();
        }
        else {
          templateHeight = jQuery('.template2').height() + tHeight;

        }
        //console.log(templateHeight);
        position = jQuery(bindingClass1).position().top + templateHeight;
        //console.log('position', position);
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
      else if (jQuery('.sound-cloud-new').length > 0 || jQuery('.sound-cloud-v3').length > 0 || jQuery('.template-seven').length > 0) {
        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
          var tHeight = -150;
        }
        else {
          zoomFactor = jQuery('temp-dev').css('zoom');
          tHeight = 30;
        }
        // for template sound-cloud
        jQuery('.sound-cloud-new').addClass('template2');
        jQuery('.sound-cloud-v3').addClass('template2');
        jQuery('.template-seven').addClass('template2');
        if (bindingClass1 === ".page_0") {
          templateHeight = -jQuery(bindingClass1).position().top;
        }
        else if (bindingClass1 == ".page_1") {
          templateHeight = jQuery('.template2').height();
        }
        else {
          templateHeight = jQuery('.template2').height() + tHeight;

        }
        //console.log(templateHeight);
        position = jQuery(bindingClass1).position().top + templateHeight;
        //console.log('position', position);
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
      else if (['one-page-slider', 'one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'inline-temp', 'inline-temp-new', 'experian', 'template-five', 'template-five-oldresult', 'template-six', 'template-eight'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0) {
        // get postiion of div
        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
          var tHeight = -190;
        }
        else {
          tHeight = 0;
        }
        // templateHeight = jQuery('.editor-page-divider').height();
        if (jQuery('.t1-landing').length > 0) {
          templateHeight = jQuery('.t1-landing').height() + tHeight;
        } else {
          templateHeight = 0;
        }
        if (bindingClass1 == ".page_0") {
          templateHeight = -jQuery(bindingClass1).position().top;
        }
        else if (bindingClass1 == ".page_1") {
          templateHeight = 0;
        }
        if (['template-five', 'template-five-oldresult', 'experian'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0 && bindingClass1[7] == 'q') {
          templateHeight = templateHeight + jQuery(bindingClass1.substr(0, 6)).position().top;
        }
        if (['template-six', 'template-eight'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0 && bindingClass1.split('_')[0] == '.sec') {
          bindingClass1 = bindingClass1 + '_q_0';
        }
        position = jQuery(bindingClass1).position().top + templateHeight;
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
    }
  }

  selectPage() {
    if (this.jsonBuilderHelper.getSelectedPage().type === 'Questionnaire') {
      this.jsonBuilderHelper.setSelectedControl(this.jsonBuilderHelper.getQuestionsList()[0]);
      this.jsonBuilderHelper.setSelectedModel('Control');
      this.jsonBuilderHelper.setSelectedSection(this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[0]);
      this.scrollIt('.page_1', 'Questionnaire');
    } else {
      this.jsonBuilderHelper.setSelectedModel('Page');
    }
  }

  showNextImages() {
    let count: number = 0;
    for (let image in this.imgContainer) {
      if (!this.imgContainer[image].visible && count < 12) {
        this.imgContainer[image].visible = true;
        count++;
      }
    }
  }

  isLoadMoreButton() {
    for (let image of this.imgContainer)
      if (!image.visible) return true;
    return false;
  }

  initializeJqueryStuff() {
    // If Type Ecom then select tab as product
    if (this.jsonBuilderHelper.isTempType(['Ecom']))
      this.selectedSec = 'product_list';

    this.previousJson = JSON.parse(JSON.stringify(this.jsonBuilderHelper.getJSONBuilt()));
    setTimeout(() => this.startAutoSave = true, 2000);
    let self = this;
    jQuery(window).on("resize", function () {
      if (jQuery(window).width() > 767 && jQuery('.editor-sidebar').css('display') == 'none') {
        jQuery('.editor-sidebar').css('display', 'block');
      }
    });
    // jQuery(document).on('click', '#preview_calc', () => this.onPreview());
    // jQuery('.live-url1').on('click', () => {
    //   let self = this;
    //   new Clipboard('.live-url1', {
    //     text: function (trigger) {
    //       return self.srcUrl;
    //     }
    //   });
    //   window.toastNotification('Copied to Clipboard');
    // });

    jQuery(document).on('click', '.live-url2', function (e: any) {
      var textField = document.createElement('textarea');
      textField.innerText = self.srcUrl;
      document.body.appendChild(textField);
      textField.select();
      textField.focus();
      document.execCommand('copy');
      textField.remove();
      self.copied = true;
      window.toastNotification('Copied to Clipboard');
    });

    jQuery(document).on('click', '#list_share1', function (e: any) {
      jQuery('.tab-content.custom-tab-content .head-top h3').text('Share this public URL!');
      jQuery('#needMore').addClass('hide');
      jQuery('.tab-content.custom-tab-content .head-top .help-link').addClass('hide');
    });
    jQuery(document).on('click', '#list_website1', function (e: any) {
      jQuery('#needMore').removeClass('hide');
      jQuery('.tab-content.custom-tab-content .head-top .help-link').removeClass('hide');
      jQuery('.tab-content.custom-tab-content .head-top h3').text('Embed this code!');
    });
    jQuery(document).on('click', '#copyUrl', function (e: any) {
      var textField = document.createElement('textarea');
      if (jQuery('#list_website1').hasClass('active')) {
        textField.innerText = `${self.fullPageCode}${self.jsonBuilderHelper.getJSONBuilt().fbComments ? self.fbCommentsCode : ''}`;
      } else {
        textField.innerText = self.srcUrl;
      }
      document.body.appendChild(textField);
      textField.select();
      textField.focus();
      document.execCommand('copy');
      textField.remove();
      self.copied = true;
      window.toastNotification('Copied to Clipboard');
    });

    if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation')
      this.recommendationService.getRecomendedResult();

    if (localStorage.getItem('tab-selected')) {
      this.selectedSec = localStorage.getItem('tab-selected');
      localStorage.removeItem('tab-selected');
    }


    if (this.imgContainer) {
      const template_name = this.jsonBuilderHelper.getJSONBuilt().template.replace(/-/g, '_');
      if (template_name == 'template_six') {
        this.imgContainer = TEMPLATE_IMAGES[template_name];
      } else {
        this.imgContainer = TEMPLATE_IMAGES['common_images'];
      }
    }

    jQuery(document).on('click', '.tag_delete', function (e: any) {
      e.preventDefault();
      let txtArea = jQuery(this).parents('.fr-box');
      if (txtArea) {
        jQuery(this).parent().remove();
        jQuery(txtArea).froalaEditor('events.focus');
        jQuery('#wysiwyg-blur-button').focus();
      }
    });

    jQuery(document).on('click', '#promo-link', function (e: any) {
      e.preventDefault();
      self.gotoPromotionList();
    });
    jQuery(document).on('click', '#redirectToConfig', function (e: any) {
      self.redirectToConfig();
    })
  }

  //Jquery Function To angular function
  previwCopy() {
    // clipboard.copy(this.srcUrl);
    if (this.jsonBuilderHelper.isClipboardSupported) {
      let self = this;
      // new Clipboard('.cpy_link', {
      //   text: function (trigger) {
      //     console.log('in copy ', self.srcUrl)
      //     return self.srcUrl;
      //   }
      // });
      // window.toastNotification('Copied to Clipboard');
    }
  }

  toggleProperties() {
    var container = jQuery('#sidebar');
    var zoomFactor = 1;
    var minWinWidth = jQuery(window).width() - 575;
    if (container.hasClass('properties-close')) {
      container.animate({ right: "0px", easing: 'linear' }, 300);
      if (jQuery(window).width() > 1850) {
        var zoomFactor = 0.78;
      }
      else if (jQuery(window).width() > 992) {
        var zoomFactor = 0.7;
      }

      container.removeClass('properties-close');
      this.propertiesHidden = false;
      if (jQuery(window).width() < 992) {
        minWinWidth = jQuery(window).width() - 20;
      }
      jQuery(".template-section").animate({ width: minWinWidth }, 300);

      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        jQuery("temp-dev").css('transform', 'scale(' + zoomFactor + ')');
      }
      else {
        jQuery("temp-dev").css('zoom', zoomFactor);
      }
    }
    else {
      var minWinWidth = jQuery(window).width() - 275;
      if (jQuery(window).width() > 1850) {
        zoomFactor = 0.97;
      }
      else if (jQuery(window).width() > 992) {
        var zoomFactor = 0.93;
      }

      container.animate({ right: "-300px", easing: 'linear' }, 300);
      container.addClass('properties-close');
      this.propertiesHidden = true;

      /* for canvas horizontal scroll */
      if (jQuery(window).width() < 992) {
        minWinWidth = jQuery(window).width() - 20;
      }
      jQuery(".template-section").animate({ width: minWinWidth }, 300);

      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
        jQuery("temp-dev").css('transform', 'scale(' + zoomFactor + ')');
      else
        jQuery("temp-dev").css('zoom', zoomFactor);
      jQuery(".template-section").css('overflow-x', "hidden");
    }
  }

  openProperties() {
    var container = jQuery('#sidebar');
    var zoomFactor = 1;
    var minWinWidth = jQuery(window).width() - 575;
    if (container.hasClass('properties-close')) {
      container.animate({ right: "0px", easing: 'linear' }, 300);
      if (jQuery(window).width() > 1850) {
        var zoomFactor = 0.78;
      }
      else if (jQuery(window).width() > 992) {
        var zoomFactor = 0.7;
      }

      container.removeClass('properties-close');
      this.propertiesHidden = false;
      if (jQuery(window).width() < 992)
        minWinWidth = jQuery(window).width() - 20;
      jQuery(".template-section").css('width', minWinWidth);
      jQuery(".template-section").animate({ width: minWinWidth }, 300);
      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
        jQuery("temp-dev").css('transform', 'scale(' + zoomFactor + ')');
      else
        jQuery("temp-dev").css('zoom', zoomFactor);
    }
  }

  openGlobalSettings() {
    this._featureAuthService.setSelectedFeature('custom_styling');
    if (this._featureAuthService.features.custom_styling.active)
      this.jsonBuilderHelper.setSelectedModel('Global_Settings');
    else {
      jQuery('.custom_styling').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }

  openMobileProperties() {
    var container = jQuery('#sidebar');
    container.animate({
      right: "0px",
      easing: 'linear'
    }, 300);
    /* for canvas horizontal scroll */
    var minWinWidth = jQuery(window).width() - 20;
    jQuery(".template-section").animate({ width: minWinWidth }, 300);
    jQuery(".template-section").css('overflow-x', "hidden");
    jQuery('.mobile-prop-cross-icon').css('display', 'block');
    jQuery('.properties-modal-backdrop').css('display', 'block').addClass('fade in');
  }

  onPreview() {
    this.assignDefaultValueToOptions();
    this.jsonBuilderHelper.updateGradedFormula();
    let json = this.jsonBuilderHelper.getJSONBuilt();
    localStorage.removeItem('template');
    localStorage.setItem('calc', json._id);
    localStorage.setItem('template', JSON.stringify(json));
    window.open(this._builderService.isDemo ? '/preview-demo' : '/preview', '_blank');
  }

  isPublishable(): boolean {
    const d = this.jsonBuilderHelper.getJSONBuilt().template;
    return (!this._featureAuthService.features.templates[d.split('-').join('_')]) ? false : true;
  }

  premiumPopup() {
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }

  onPublish($event: any) {
    let tempType = this.jsonBuilderHelper.getJSONBuilt().templateType.toLowerCase();
    if (!this._featureAuthService.features.experiences[tempType]) {
      this._featureAuthService.setSelectedFeature('experiences', tempType);
      this.premiumPopup();
      // } else if (tempType == 'Recommendation') {
      //   this._featureAuthService.setSelectedFeature('experiences', tempType.toLowerCase());
      //   this.premiumPopup();
      // } else if (tempType == 'Graded') {
      //   this._featureAuthService.setSelectedFeature('experiences', tempType.toLowerCase());
      //   this.premiumPopup();
      // } else if (tempType == 'Poll') {
      //   this._featureAuthService.setSelectedFeature('experiences', tempType.toLowerCase());
      //   this.premiumPopup();
    } else {
      if (!this.isPublishable()) {
        let ttype = this.jsonBuilderHelper.getJSONBuilt().template.split('-'); //.join('_');
        if (ttype[ttype.length - 1] === 'new' || ttype[ttype.length - 1] === 'v3') { ttype.pop(); }
        let type = ttype.join('_');
        this._featureAuthService.setSelectedFeature('templates', type);
        jQuery('.templates').addClass('activegreen limited-label');
        this.premiumPopup();
        return;
      }
      if (this._builderService.isDemo)
        return;
      /** for grade formula update */
      this.jsonBuilderHelper.updateGradedFormula();
      let that = this;
      let errorResults = '';
      if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical')
        errorResults = this.formulaService.checkIfFormulaWouldGiveSyntaxError();
      switch (true) {
        case (!this.jsonBuilderHelper.getJSONBuilt().url.length): {
          bootbox.dialog({
            closeButton: false,
            message: `
                      <div class="bootbox-body-left">
                          <div class="mat-icon">
                             <i class="material-icons">error</i>
                          </div>
                      </div>
                      <div class="bootbox-body-right">
                         <p>The calculator can't go live without a name!</p>
                         <p>Think of something interesting that would attract attention!</p>
                      </div>
                  `,
            buttons: {
              success: {
                label: "OK",
                className: "btn btn-ok btn-hover",
                callback: function () {
                  jQuery('#myonoffswitch').attr('checked', false);
                }
              }
            }
          });
          break;
        }
        case (!this.checkResultConditions() && this.jsonBuilderHelper.isTempType(['Numerical', 'Graded', 'Poll'])): {
          let html = "";
          for (let key in this.emptyConditions) {
            html = html + "Condition ";
            for (let subKey in this.emptyConditions[key]) {
              html = html + this.emptyConditions[key][subKey] + (((Number(subKey) + 1) == this.emptyConditions[key].length) ? "" : ", ");
            }
            html = html + " of Result " + key + "<br/>";
          }
          bootbox.dialog({
            closeButton: false,
            message: `
                      <div class="bootbox-body-left">
                          <div class="mat-icon">
                             <i class="material-icons">error</i>
                          </div>
                      </div>
                      <div class="bootbox-body-right">
                         <p>Please specify upper bound and lower bound for the result conditions.</p>
                         <p>Empty Conditions:<br/>
                         ` + html + `</p>
                      </div>
                  `,
            buttons: {
              success: {
                label: "OK",
                className: "btn btn-ok btn-hover",
                callback: function () {
                  jQuery('#myonoffswitch').attr('checked', false);
                }
              }
            }
          });
          break;
        }
        case (!this.checkPollQuestions() && this.jsonBuilderHelper.getJSONBuilt().templateType == 'Poll'): {
          bootbox.dialog({
            closeButton: false,
            message: `
                      <div class="bootbox-body-left">
                          <div class="mat-icon">
                             <i class="material-icons">error</i>
                          </div>
                      </div>
                      <div class="bootbox-body-right">
                         <p>Atleast one single select type of question is required for polls.</p>
                      </div>
                  `,
            buttons: {
              success: {
                label: "OK",
                className: "btn btn-ok btn-hover",
                callback: function () {
                  jQuery('#myonoffswitch').attr('checked', false);
                }
              }
            }
          });
          break;
        }
        case (!this.checkResultConditionsValidation() && this.jsonBuilderHelper.isTempType(['Numerical', 'Graded', 'Poll'])): {
          let html = "";
          for (let key in this.invalidConditions) {
            html = html + "Condition ";
            for (let subKey in this.invalidConditions[key]) {
              html = html + this.invalidConditions[key][subKey] + (((Number(subKey) + 1) == this.invalidConditions[key].length) ? "" : ", ");
            }
            html = html + " of Result " + key + "<br/>";
          }
          bootbox.dialog({
            closeButton: false,
            message: `
                      <div class="bootbox-body-left">
                          <div class="mat-icon">
                             <i class="material-icons">error</i>
                          </div>
                      </div>
                      <div class="bootbox-body-right">
                         <p>It looks like some of your result conditions are incorrect. Please fix those to continue.</p>
                         Invalid conditions:
                         <p>` + html + `<p>
                      </div>
                  `,
            buttons: {
              success: {
                label: "OK",
                className: "btn btn-ok btn-hover",
                callback: () => {
                  this.jsonBuilderHelper.setSelectedModel('Page');
                  this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getJSONBuilt().pages[2]);
                  this.scrollIt('.page_2', 'Result');
                  // jQuery('#myonoffswitch').attr('checked', false);
                }
              }
            }
          });
          break;
        }
        case (errorResults != '' && this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical'): {
          bootbox.confirm({
            size: 'small',
            message: `
                      <div class="bootbox-body-left">
                          <div class="mat-icon">
                             <i class="material-icons">error</i>
                          </div>
                      </div>
                      <div class="bootbox-body-right">
                         <p>Since you edited the questions, you should consider <br/> revising the formula with the new updates.</p>
                      </div>
                  `,
            // There are mistakes in ' + errorResults + '
            buttons: {
              'cancel': {
                label: 'Revise Formula',
                className: 'btn btn-cancel btn-cancel-hover'
              },
              'confirm': {
                label: 'Continue Anyway',
                className: 'btn btn-ok btn-hover'
              }
            },
            callback: function (result: any) {
              if (result === true) {
                that.Publish($event);
              }
            }
          });
          break;
        }
        case (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' && this.formulaService.getAllInvalidFormulas() != undefined): {
          this.formulaService.correctAll();
          this.Publish($event);
          break;
        } default:
          this.Publish($event);
      }
    }
  }

  changeTitleDesc() {
    if (this.jsonBuilderHelper.getJSONBuilt().title == 'Outgrow')
      this.jsonBuilderHelper.getJSONBuilt().title = this.jsonBuilderHelper.getLandingPageHeading('main-heading');

    if (this.jsonBuilderHelper.getJSONBuilt().description == 'Default Meta Description')
      this.jsonBuilderHelper.getJSONBuilt().description = this.jsonBuilderHelper.getLandingPageHeading('sub-heading');


    //updating CTA SHARES Default Text for Numerical.
    if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical') {
      let resultPage = this.jsonBuilderHelper.getJSONBuilt().pages.filter((page: any) => page.type == 'Result');
      if (resultPage) {
        let leadformSection = resultPage[0].sections.filter((section: any) => section.type == 'LeadForm');
        if (leadformSection) {
          let ctaShares = leadformSection[0].items.filter((item: any) => item.type == 'cta_shares');
          if (ctaShares.length) {
            ctaShares[0].options.map((option: any) => {
              if (!this._featureAuthService.features.custom_branding.share_text) {
                if (jQuery('<textarea/>').html(option.label.replace(/<(?:.|\n)*?>/gm, '')).text().trim() == this.jsonBuilderHelper.getDefault('lpHeading') + ' | via @outgrowco')
                  option.label = this.jsonBuilderHelper.getLandingPageHeading('main-heading') + ' | via @outgtrowco';
              } else {
                if (jQuery('<textarea/>').html(option.label.replace(/<(?:.|\n)*?>/gm, '')).text().trim() == this.jsonBuilderHelper.getDefault('lpHeading'))
                  option.label = this.jsonBuilderHelper.getLandingPageHeading('main-heading');
              }
              if (jQuery('<textarea/>').html(option.icon.replace(/<(?:.|\n)*?>/gm, '')).text().trim() == this.jsonBuilderHelper.getDefault('lpSubHeading'))
                option.icon = this.jsonBuilderHelper.getLandingPageHeading('sub-heading');
            });
          }
        }
      }
    }
    //updating CTA SHARES Default Text for Recom.
    if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation') {
      this.jsonBuilderHelper.getJSONBuilt().formula.map((formula: any) => {
        if (formula.length) {
          let links = formula.links.filter((link: any) => link.type == 'share');
          if (links.length) {
            links.map((link: any) => {
              if (!this._featureAuthService.features.custom_branding.share_text) {
                if (link.title == 'Outgrow | via @outgrowco' || link.title == '')
                  link.title = this.jsonBuilderHelper.getLandingPageHeading('main-heading') + ' | via @outgrowco';
              } else {
                if (link.title == 'Outgrow' || link.title == '')
                  link.title = this.jsonBuilderHelper.getLandingPageHeading('main-heading');
              }
              if (link.description == 'Default Meta Description' || link.description == '')
                link.description = this.jsonBuilderHelper.getLandingPageHeading('sub-heading');
            });
          }
        }
      });
    }

  }

  Publish($event: any) {
    let self = this;
    this.assignDefaultValueToOptions();
    var button = jQuery($event.target);
    this.beingPublished = true;
    this.jsonBuilderHelper.commonEmitter.emit({ beingPublished: true });
    this.changeTitleDesc();
    this._builderService.publishApp({
      id: this.jsonBuilderHelper.getJSONBuilt()._id,
      url: this.jsonBuilderHelper.getJSONBuilt().url,
      features: { _LJ: this._featureAuthService.features.logic_jump.active },
      unsaved: this._itemTrackService.getUnSavedData()
    })
      .subscribe(
        (response: any) => {
          // FBQ event
          /*fbq('trackCustom', 'Calculator Published');*/
          if (jQuery.isEmptyObject(response)) {
            // this._router.navigate(['/dashboard']);
          } else {
            if (this.jsonBuilderHelper.getJSONBuilt().mode === 'PRIVATE') {
              this.jsonBuilderHelper.getJSONBuilt().mode = 'PUBLIC';
              if (environment.STATIC_DOMAIN)
                this.srcUrl = environment.LIVE_PROTOCOL + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt().url;
              else
                this.srcUrl = environment.LIVE_PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt().url;
              // this.srcUrl = environment.PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt().url;
              this.bootboxText = `Your ${this.publishPopUpText()} Is Now Live`;
              if (this.subscription_status === 'in_trial') {
                this.showCongoMessage = true;
                setTimeout(() => {
                  self.confettiInit();
                }, 1000);
                this.prepareModalData();
                jQuery('#publish-upgrade').modal('show');
              } else {
                this.showCongoMessage = true;

                this.prepareModalData();
                let showCode = (this.fullPageCode + (this.jsonBuilderHelper.getJSONBuilt().fbComments ? this.fbCommentsCode : ''));
                let copyLinkBtn = Clipboard.isSupported() ? `<div class="col-sm-3 cpy-btn preview_copy" id="live-url-container">
              <a class="live-url live-url2">Copy Link</a></div>`: ``;
                let self = this;
                bootbox.dialog({
                  backdrop: 'static',
                  keyboard: false,
                  message: `
                             <div class="text-center live-modal custom-width">
                                  <span class="icon-play-next">
                                    <div class="icon icon--order-success svg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="45px" height="45px">
                                            <g fill="none" stroke="#2ebf27" stroke-width="2">
                                            <circle cx="22" cy="22" r="21" style="stroke-dasharray:220px, 220px; stroke-dashoffset: 480px;"></circle>
                                            <path d="M10.417,24.778 l6.93,5.909 l 16.444 -16.393" style="stroke-dasharray:50px, 50px; stroke-dashoffset: 0px;"></path>
                                            </g>
                                        </svg>
                                    </div>
                                  </span>
                                  <div class="live-head">` + this.bootboxText + `</div>
                                  <img class="img-style hide" src="assets/images/goLivePopup.png"/>
                                  <div class="">
                                      <div class="live-subhead link-style hide">
                                        <div class="col-sm-9 cpy-txt">
                                            <span class="share-head">
                                                Share this URL :
                                            </span>
                                        </div>
                                        `+ copyLinkBtn + `
                                      </div>
                                      <div class="live-subhead selected-link hide">
                                          <span class="hide">Your public calculator can be viewed here:</span>
                                          <div class="live-url url-style">` + this.srcUrl + `</div>
                                      </div>
                                      <div class="promo-tip hide">
                                        <div class="red-bar">
                                            <i class="material-icons">lightbulb_outline</i>
                                        </div>
                                        <span>                                          
                                            TIP: Use our promotional checklist to maximize traffic to your Calculator/Quiz.
                                             <a href="javascript:void(0);" id="promo-link" data-dismiss="modal" class="text-red">Go to Promotion Checklist</a>
                                        </span>
                                       
                                      </div>

                                      <div class="custom-tabs-outer">
                                          <ul class="nav nav-tabs">
                                            <li class="active website1" id="list_website1"><a data-toggle="tab" href="#website1" class="web-icon"><div class="tab-icons">&nbsp;</div>Your Website</a></li>
                                            <li class="hide"><a data-toggle="tab" href="#articles1" class="article-icon"><div class="tab-icons">&nbsp;</div>Instant Articles</a></li>
                                            <li><a data-toggle="tab" href="#amp1" class="amp-icon hide"><div class="tab-icons">&nbsp;</div>Google AMP</a></li>
                                            <li id="list_share1" class="share1"><a data-toggle="tab" href="#share1" class="share-icon"><div class="tab-icons">&nbsp;</div>Share</a></li>
                                          </ul>
                                          <div class="tab-content custom-tab-content">
                                            <div class="head-top">
                                              <h3>Embed this code!</h3>
                                              <div class="help-tip">
                                                <a class="help-link" href="https://support.outgrow.co/docs/embedding-basics" target="_blank"><span>?</span></a>
                                                <div class="help-checktip live-link-help">Help</div>
                                              </div>
                                            </div>
                                            <div id="website1" class="tab-pane fade in active">
                                              <div class="embed-code-outer"></div>
                                            </div>
                                            <div id="articles1" class="tab-pane fade">
                                              <div class="embed-code-outer">
                                                It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English.
                                              </div>
                                            </div>
                                            <div id="amp1" class="tab-pane fade">
                                              <div class="embed-code-outer">
                                                It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout
                                              </div>
                                            </div>
                                            <div id="share1" class="tab-pane fade">
                                              <div class="embed-code-outer">
                                                <div class="live-url url-style">${this.srcUrl}</div>
                                              </div>
                                            </div>
                                          </div>
                                      </div>
                                      <div class="col-sm-3 preview_copy copy-btn-new">
                                        <div class="col-xs-9 np help-outer">
                                        <div class="" id="needMore">Need more options?
                                          <a href="javascript:void(0);" id="redirectToConfig">Click here</a>
                                        </div>
                                        </div>
                                        <div class="copy-new col-xs-3 np">
                                          <a class="live-url live-url1" id="copyUrl" href="javascript:void(0)">Copy</a>
                                        </div>
                                      </div>
                                      <div class="promo-link">
                                        <a class="text-red" data-dismiss="modal" href="javascript:void(0);" id="promo-link">Go to Promotion Checklist</a>
                                      </div>

                                      <div class="col-md-12 np text-right">
                                        <!--<a class="text-cancel" data-dismiss="modal" aria-label="Close">Cancel</a>-->
                                        <!--<a (click)="closeCongoMessage()" class="btn-done" data-dismiss="modal">Done</a>-->
                                      </div>
                                      <!--<img src="assets/images/gocopyPopup.png"/>-->
                                     <!-- <div class="footer-border"></div>
                                      <div class="like-button-outer" >
                                      <div class="small-sec">Like us on Facebook</div>
                                      <div class="small-sec">
                                   <iframe src="https://www.facebook.com/plugins/like.php?href=https%3A%2F%2Ffacebook.com%2Foutgrowco&width=122&layout=button&action=like&size=large&show_faces=false&share=false&height=65&appId" width="122" height="65" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true"></iframe>                                </div>
                                  </div>
                                  </div>-->
                                  <div class="table-responsive hide">
                                      <table class="table">
                                          <thead>
                                              <tr>
                                                  <th>
                                                      <div class="live-subhead link-style">
                                                          <span>
                                                              To preview, open this link in another browser.
                                                          </span>
                                                          <a class="live-url preview_copy">Copy Link</a>
                                                      </div>
                                                  </th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              <tr>
                                                  <td>
                                                      <div class="live-subhead">
                                                          <span class="hide">Your public calculator can be viewed here:</span>
                                                          <div class="live-url url-style">` + this.srcUrl + `</div>
                                                      </div>
                                                  </td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                              `,
                  buttons: {
                    myButton1: {
                      label: "<i class='material-icons'>close</i>",
                      className: "bootbox-close-button close",
                      callback: function () {
                        jQuery('.editor-modal').removeClass('golive-popup');
                        self.showCongoMessage = false;
                      }
                    },
                    // myButton2: {
                    //   label: "Done",
                    //   className: "btn-done",
                    //   callback: function () {
                    //     self.showCongoMessage = false;
                    //   }
                    // }
                  }
                });
                jQuery('.editor-modal').addClass('golive-popup');
                jQuery('.golive-popup').append("<canvas id='canvas'></canvas>");
                setTimeout(() => {
                  self.confettiInit();
                }, 1000);
                jQuery('#website1 .embed-code-outer').text(showCode);
                if (jQuery('#list_website1').hasClass('active')) {
                  jQuery('.tab-content.custom-tab-content .head-top .help-link').removeClass('hide');
                  jQuery('#needMore').removeClass('hide');
                  jQuery('.tab-content.custom-tab-content .head-top h3').text('Embed this code!')
                } else {
                  jQuery('#needMore').addClass('hide');
                  jQuery('.tab-content.custom-tab-content .head-top .help-link').addClass('hide');
                  jQuery('.tab-content.custom-tab-content .head-top h3').text('Share this public URL!')
                }
              }
              /*==== Intercom ====*/
              if (this.interComData) {
                this.interComData.calculators_published++;
                localStorage.setItem('icd', JSON.stringify(this.interComData));
                window.Intercom('update', this.interComData);
              }
              /*=====*/
            } else
              window.toastNotification('Changes Published');

            this.previousJson.liveApp = response;
            this.jsonBuilderHelper.getJSONBuilt().liveApp = response;
            this.previousJson.changed = false;
            this.jsonBuilderHelper.getJSONBuilt().changed = false;
            this.beingPublished = false;
          }
        },
        (error: any) => {
          this.beingPublished = false;
          let message: string = 'Something Went Wrong!';
          if (error.error.code == 'E_APP_CONDITIONS_INVALID')
            message = error.error.err_message;
          //bootbox.alert(message);
          if (error.error.data && error.error.data._array && error.error.data._array.length) {
            error.error.data._array.map((quesId) => {
              let item = this.jsonBuilderHelper.getTemplateQuestionare()[error.error.data.type == 'Question' ? 0 : 1].filter((ques) => ques._id == quesId)
              if (item.length)
                message += '   ' + (error.error.data.type == 'Question' ? item[0].props.title : item[0].title);//question or section title/
            })

          }
          bootbox.dialog({
            closeButton: false,
            message: `
                    <button type="button" (click)="closeCongoMessage()" class="bootbox-close-button close" data-dismiss="modal" aria-hidden="true"><i class='material-icons'>close</i></button>
                    <div class="bootbox-body-left">
                        <div class="mat-icon">
                           <i class="material-icons">error</i>
                        </div>
                    </div>
                    <div class="bootbox-body-right">
                       <p>`+ message + `</p>
                    </div>
                `,
            buttons: {
              success: {
                label: "OK",
                className: "btn btn-ok btn-hover"
              }
            }
          });
        }
      );
  }
  assignDefaultValueToOptions() {
    let questions = this.jsonBuilderHelper.getQuestionsList();
    questions.forEach((item) => {
      item.options = item.options.map((option) => {
        if (option.value === '') {
          option.value = 0;
        }
        return option;
      })
    })
  }
  closeCongoMessage() {
    this.showCongoMessage = false;
    jQuery('.editor-modal').removeClass('golive-popup');
  }

  confettiInit() {
    let canvasEl = document.querySelector('#canvas');

    let width = canvasEl.width = window.innerWidth;
    let height = canvasEl.height = window.innerHeight * 2;

    function loop() {
      requestAnimationFrame(loop);
      ctx.clearRect(0, 0, width, height);

      confs.forEach((conf) => {
        conf.update();
        conf.draw();
      })
    }

    function Confetti() {
      //construct confetti
      let colours = ['#fde132', '#009bde', '#ff6b00'];

      this.x = Math.round(Math.random(10) * width);
      this.y = Math.round(Math.random(10) * height) - (height / 2);
      this.rotation = Math.random(10) * 360;

      let size = Math.random(10) * (width / 60);
      this.size = size < 15 ? 15 : size;

      this.color = colours[Math.round(Math.random(colours.length) * 10 - 1)]

      this.speed = this.size / 7;

      this.opacity = Math.random(10);

      this.shiftDirection = Math.random(10) > 0.5 ? 1 : -1;
    }

    Confetti.prototype.border = function () {
      if (this.y >= height) {
        this.y = height;
      }
    }

    Confetti.prototype.update = function () {
      this.y += this.speed;

      if (this.y <= height) {
        this.x += this.shiftDirection / 5;
        this.rotation += this.shiftDirection * this.speed / 100;
      }

      this.border();
    };

    Confetti.prototype.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, this.rotation, this.rotation + (Math.PI / 2));
      ctx.lineTo(this.x, this.y);
      ctx.closePath();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.fill();
    };

    let ctx = canvasEl.getContext('2d');
    let confNum = Math.floor(width / 5);
    let confs = new Array(confNum).fill(0).map(_ => new Confetti());

    loop();
  }

  // View element Changes
  mobileMenuClicked() {
    jQuery('.editor-sidebar').fadeToggle(400);
    jQuery('.sidebar-modal-backdrop').css('display', 'block').addClass('fade in');
  }

  mobileMenuCrossClicked() {
    jQuery('.editor-sidebar').css('display', 'none');
    jQuery('.sidebar-modal-backdrop').css('display', 'none').addClass('fade out');
  }

  mobilePropCrossClicked() {
    var container = jQuery('#sidebar');
    container.animate({
      right: "-300px",
      easing: 'linear'
    }, 300);
    jQuery('#sidebar').addClass('properties-close');
    this.propertiesHidden = true;
    /* for canvas horizontal scroll */
    if (jQuery(window).width() > 992)
      var minWinWidth = jQuery(window).width() - 289;

    else
      var minWinWidth = jQuery(window).width() - 20;

    jQuery(".template-section").animate({ width: minWinWidth }, 300);
    jQuery("temp-dev").animate({ width: minWinWidth }, 300);
    jQuery(".template-section").css('overflow-x', "hidden");

    jQuery('.mobile-prop-cross-icon').css('display', 'none');
    jQuery('.properties-modal-backdrop').css('display', 'none').addClass('fade out');
    /*end*/
  }

  appNameblured() {
    jQuery('#fname').removeClass('active-text');
  }

  appNameFocused() {
    jQuery('#fname').addClass('active-text');
  }

  onCalcNameChanged() {
    if (this.jsonBuilderHelper.getJSONBuilt().name)
      this.uniqueUrlHandler();
    else {
      window.toastNotification("Calculator name can't be empty");
      this.jsonBuilderHelper.getJSONBuilt().name = this.oldCalcName;
    }
  }

  isUnique(uniqueString: any) {
    if (this.oldCalcName != this.jsonBuilderHelper.getJSONBuilt().name) {
      var that: any = this;
      var url: String = that._builderService.sanitizeUrl(that.jsonBuilderHelper.getJSONBuilt().name);
      url = environment.PROTOCOL + that.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION + '/' + url;
      that.updateName();
    }
  }

  updateName() {
    this._builderService.updateName(this.jsonBuilderHelper.getJSONBuilt()._id, this.jsonBuilderHelper.getJSONBuilt().name)
      .subscribe(
        (response: any) => {
          //console.log('Name: ', this.jsonBuilderHelper.getJSONBuilt().name);
          this._titleService.setTitle('Outgrow | ' + this.jsonBuilderHelper.getJSONBuilt().name);
          if (!this.jsonBuilderHelper.getJSONBuilt().url) {
            this.jsonBuilderHelper.getJSONBuilt().url = response.url;
            window.history.replaceState({}, '', '/builder/' + response.url);
            let url = environment.PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION + '/' + response.url;
            window.toastNotification('Calculator name added successfully');
            bootbox.dialog({
              size: 'small',
              message: `  <div class="bootbox-body-left">
                            <div class="mat-icon">
                                <i class="material-icons">error</i>
                            </div>
                        </div>
                        <div class="bootbox-body-right">
                            <p class="">We have set your calculator\'s url to "` + url + `" , You can always change it in configure section.</p>
                        </div>
                        `,
              buttons: {
                success: {
                  label: "OK",
                  className: "btn btn-ok btn-hover"
                }
              }
            });
          }
          else
            window.toastNotification('Calculator name changed successfully');
          this.oldCalcName = this.jsonBuilderHelper.getJSONBuilt().name;
        },
        (error: any) => {
          console.log(error);
        }
      );
  }

  videoModal() {
    jQuery('#video-modal').modal('show');
    jQuery("i.support_icon").removeClass('bounceIn animated');
  }

  callGA(opt: string) {
    switch (opt) {
      case "GOLIVE":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Publish');
        // _kmq.push(['record', 'Publish Go Live Click']);
        break;
      case "LOGO":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'OGLogo');
        // _kmq.push(['record', 'Back To Dashboard OGLogo Click']);
        break;
      case "PREVIEW":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Preview');
        // _kmq.push(['record', 'Preview Click']);
        break;
    }
  }

  onModeChange() {
    this._dashboardService.changeAppMode(this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe(
        (response: any) =>
          this.jsonBuilderHelper.getJSONBuilt().mode = 'PUBLIC', (error: any) =>
          console.log(error)
      );
  }

  ngDoCheck() {
    if (this.startAutoSave
      && JSON.stringify(this.jsonBuilderHelper.getJSONBuilt()) != JSON.stringify(this.previousJson)) {
      this.previousJson = JSON.parse(JSON.stringify(this.jsonBuilderHelper.getJSONBuilt()));
      let unSavedElements = this._itemTrackService.getUnSavedData();
      if (unSavedElements)
        this.autoSaver(unSavedElements);
    }
    else if (!this.startAutoSave && this.jsonBuilderHelper.getJSONBuilt())
      this.previousJson = JSON.parse(JSON.stringify(this.jsonBuilderHelper.getJSONBuilt()));
  }

  debounce(func: any, wait: number) {
    var timeout: any;
    return function () {
      var context = this, args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  checkAnalytics() {
    this.isAnalyticsAvailable = this._featureAuthService.features.analytics.active;
    if (!this.isAnalyticsAvailable) {
      this._featureAuthService.setSelectedFeature('analytics');
      jQuery('.analytics').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    } else {
      this.onSelect('analytics');
      this.selectedAnalyticComponent = 'overview';
    }
  }

  saveUnsavedData(unSavedElements: any, init: any = false) {
    let app = JSON.parse(JSON.stringify(this.jsonBuilderHelper.getJSONBuilt()));
    delete app.pages;
    unSavedElements.app = app;

    this.jsonBuilderHelper.animInit();
    this._builderService.updateChanges(unSavedElements, init ? 'switch' : this.jsonBuilderHelper.getJSONBuilt().socket_id || 'blank', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe(
        (response: any) => {
          this.jsonBuilderHelper.getJSONBuilt().changed = true;
          this.jsonBuilderHelper.debounce(this.jsonBuilderHelper.animLoad(), 1800);
          this.activeSince = moment(Date.now()).fromNow().replace('ago', '').trim();
        }, (error: any) => console.log(error));
  }

  onSelect(comp: string) {
    this.selectedSec = comp.trim();
    if (comp === 'analytics') {
      localStorage.setItem('tics', 'true');
    } else {
      localStorage.removeItem('tics');
    }
  }


  upload(type: string, isGIF: boolean) {
    // Condition for Crop
    // let transformations: any = {};
    // if (isGIF) {
    //   transformations['crop'] = false;
    // } else {
    //   transformations['crop'] = {};
    //   transformations['crop']['force'] = true;
    //   transformations['crop']['aspectRatio'] = 16 / 9;
    // }
    // Filestack V3
    let self: any = this;
    const apikey = this.filePickerKey;
    const client = filestack.init(apikey);
    client.pick({
      storeTo: {
        location: 's3',
        access: 'public'
      },
      maxSize: 10485760,
      accept: 'image/*',
      // transformations: transformations,
      // imageMax: [1630, 974], /* landing page */
      imageDim: [1630, 974]
    }).then(function (result) {
      let s3URL = 'https://dlvkyia8i4zmz.cloudfront.net/' + result.filesUploaded[0].key;
      self.jsonBuilderHelper.getSelectedPage().bgImage = s3URL;
      self.jsonBuilderHelper.getSelectedPage().bgColor = '';
      self.imageSet(s3URL, result.filesUploaded[0].filename, '');
      self.jsonBuilderHelper.setSelectedModel('Global_Settings');
    });
  }

  addOpen() {
    jQuery('.help-options').addClass('open');
  }

  removeOpen() {
    jQuery('.help-options').removeClass('open');
  }

  ngOnDestroy() {
    // console.log('disconnect called');
    // if (this.socket) {
    //   this.socket.disconnect();
    //   for (let i = 0; i < 1000; i++) {
    //     console.log('');
    //   }
    // }
    // window.Intercom('update', { hide_default_launcher: false });
    this._redoUndoService.initRedoUndoStack();
  }

  applyImage(imgShow: any) {
    this.imageSet(imgShow.url, 'background.jpg', '');
  }

  imageSet(url, filename, bgcolor) {
    var landingPage = this.jsonBuilderHelper.getJSONBuilt().pages.filter((page: any) => page.type == 'Landing');
    if (landingPage) {
      landingPage[0].bgImage = url;
      landingPage[0].bgName = filename;
      landingPage[0].bgColor = bgcolor;
      this._itemTrackService.setUnSavedPage(landingPage[0]);
    }
  }

  helloBarNotify(event) {
    if (event.data) {
      this.helloBar.message = event.data.message;
      this.helloBar.flag = true;
      this.cardStatus = event.data.cardStatus ? event.data.cardStatus : null;
    }
  }

  ccpopop() {
    localStorage.setItem('openpopup', 'true');
    jQuery('#cc-modal-payment').modal('show');
    jQuery('.modal-backdrop').insertAfter('#cc-modal-payment');
    jQuery('#cc-modal-payment').on('hidden.bs.modal', function () {
      localStorage.setItem('openpopup', 'true');
    });
  }

  openModal(event) {
    jQuery('button[id=essentials_m]').trigger('click');
  }

  callPopups(id: string) {
    jQuery('button[id=' + id + '_nd]').trigger('click');
  }
  routeSetting() {
    localStorage.setItem('settings', 'true');
    this._router.navigate(['/settings/membership']);
  }

  copyButton() {
    this.liveSrcGenerate();
    this.previwCopy();
  }

  checkForCustomTheme(app, prev) {
    let themePalettes = this._jsonElementService.gettemplatePalettes(prev);
    themePalettes.pallete = themePalettes.pallete.filter(pal => pal.subType.indexOf(app.templateType) >= 0)
    let themeChanged = !themePalettes.pallete.find((pallete) => {
      return (
        app.theme.componentColor == pallete.components
        &&
        app.theme.textColor == pallete.text
        &&
        app.theme.bgColor == pallete.backGround
      );
    });
    return themeChanged;
  }

  gotoPromotionList() {
    bootbox.hideAll();
    this.showCongoMessage = false;
    jQuery('.editor-modal').removeClass('golive-popup');
    this.selectedSec = 'config';
    this.selectedConfigComponent = 'promotion-checklist';
    // this.showCongoMessage = false;
    // this.selectedSec = 'config';
    // this.selectedConfigComponent = 'embedded-code';
    // this.configOptionals={parent:this.selectedConfigComponent,child:'promotion'}
  }

  checkResultConditions() {
    this.emptyConditions = {};
    let flag = true;
    let resultPage = this.jsonBuilderHelper.getJSONBuilt().pages.find((page: any) => page.type == 'Result');
    let resultSection = resultPage.sections.find((section: any) => section.type == 'Result');
    resultSection.items.map(control => {
      if (control.config.showHelp) {
        control.options.map(option => {
          if (option.attr.class === '' || option.attr.style === '') {
            if (this.emptyConditions[resultSection.items.indexOf(control) + 1]) {
              this.emptyConditions[resultSection.items.indexOf(control) + 1].push(control.options.indexOf(option) + 1);
            } else {
              this.emptyConditions[resultSection.items.indexOf(control) + 1] = [];
              this.emptyConditions[resultSection.items.indexOf(control) + 1].push(control.options.indexOf(option) + 1);
            }
            flag = false;
          }
        });
      }
    });
    return flag;
  }

  checkResultConditionsValidation() {
    this.invalidConditions = {};
    let parsedData = this.formulaService.computeParserData();
    let flag = true;
    try {
      let resultPage = this.jsonBuilderHelper.getJSONBuilt().pages.find((page: any) => page.type == 'Result');
      let resultSection = resultPage.sections.find((section: any) => section.type == 'Result');
      resultSection.items.map(control => {
        if (control.config.showHelp) {
          control.options.map(option => {
            let condition: boolean = true;
            if (option.attr.upper == '==' || option.attr.lower == '==')
              condition = option.attr.upper !== option.attr.lower;
            else
              condition = (Number(this.formulaService.parseText(option.attr.class, parsedData)) >= Number(this.formulaService.parseText(option.attr.style, parsedData)));
            if (condition) {
              if (this.invalidConditions[resultSection.items.indexOf(control) + 1]) {
                this.invalidConditions[resultSection.items.indexOf(control) + 1].push(control.options.indexOf(option) + 1);
              } else {
                this.invalidConditions[resultSection.items.indexOf(control) + 1] = [];
                this.invalidConditions[resultSection.items.indexOf(control) + 1].push(control.options.indexOf(option) + 1);
              }
              flag = false;
              // return false;
            }
            // return true;
          });
        }
      });
      return flag;
    } catch (e) {
      return true;
    }
  }

  checkPollQuestions() {
    let questionPage = this.jsonBuilderHelper.getJSONBuilt().pages.find((page: any) => page.type == 'Questionnaire');
    let flag = false;
    questionPage.sections.map(sec => {
      sec.items.map(item => {
        if (item.type == 'radio_button') flag = true;
      });
    });
    return flag;
  }
  setOptionals() {
    switch (this.selectedConfigComponent) {
      case 'embedded-code':
        this.configOptionals = { parent: this.selectedConfigComponent, child: 'embedpage' };
        break;
      default:
        this.configOptionals = null;
    }
  }

  hellobarCTAclicked(id) {
    const hellobarCTAclicked = this._membershipService.hellobarCTAclicked(id).subscribe(
      (success: any) => { }, (error: any) => { }
    );
  }

  //Builder lock functionality..
  takeOver() {
    // this.socket.emit('takeover', { appId: this.jsonBuilderHelper.getJSONBuilt()._id, userId: this.storage.user._id, userName: this.storage.user.name });
    location.reload(true);
  }

  checkTimeOut(): any {
    if (!this.allowUse) {
      setTimeout(() => {
        location.reload(true);
      }, 300000);
    }
  }

  defaultSetting() {
    if (this.jsonBuilderHelper.getJSONBuilt().user_id == this.storage.user._id) {
      this.selfOpen = true;
    } else {
      this.selfOpen = false;
      this.userName = this.jsonBuilderHelper.getJSONBuilt().user_name;
    }
    this.checkTimeOut();
  }

  setAppLockSetting(data: any) {
    localStorage.setItem('connect', 'set');
    this.jsonBuilderHelper.getJSONBuilt().login = 1;
    this.jsonBuilderHelper.getJSONBuilt().user_id = this.storage.user._id;
    this.jsonBuilderHelper.getJSONBuilt().user_name = this.storage.user.name;
    this.jsonBuilderHelper.getJSONBuilt().socket_id = this.socket.id;

    let appData = JSON.stringify(this.jsonBuilderHelper.getJSONBuilt());
    this._redoUndoService.setUndoStack(appData);
  }

  lockBuilder(data) {
    (data.url === this.jsonBuilderHelper.getJSONBuilt().url) ? this.allowUse = false : this.allowUse = true;
    if (data.user_id === this.jsonBuilderHelper.getJSONBuilt().user_id) {
      this.selfOpen = true;
    } else if (data.user_id != this.jsonBuilderHelper.getJSONBuilt().user_id) {
      this.selfOpen = false;
      this.userName = data.user_name;
    }
    this.checkTimeOut();
  }

  getLockText() {
    if (this.jsonBuilderHelper.isTempType(['Numerical'])) {
      return 'calculator';
    } else if (this.jsonBuilderHelper.isTempType(['Poll'])) {
      return 'poll';
    } else {
      return 'quiz';
    }
  }

  checkFeatures() {
    const features = this._featureAuthService.features;
    const app = this.jsonBuilderHelper.getJSONBuilt();
    this.featuresToDisable = [];
    const self = this;
    const ResultPage = app.pages.filter((page) => {
      if (page.type === 'Result') {
        return page;
      }
    });
    const QuestionnairePage = app.pages.filter((page) => {
      if (page.type === 'Questionnaire') {
        return page;
      }
    });
    const LandingPage = app.pages.filter((page) => {
      if (page.type === 'Landing') {
        return page;
      }
    });
    let LeadFormSection = [];
    let ResultSection = [];
    if (Array.isArray(ResultPage) && ResultPage.length > 0) {
      LeadFormSection = ResultPage[0].sections.filter((section) => {
        if (section.type === 'LeadForm') {
          return section;
        }
      });
      ResultSection = ResultPage[0].sections.filter((section) => {
        if (section.type === 'Result') {
          return section;
        }
      });
    }
    let PageHeaderSection = [];
    if (Array.isArray(LandingPage) && LandingPage.length > 0) {
      PageHeaderSection = LandingPage[0].sections.filter((section) => {
        if (section.type === 'Page_Header') {
          return section;
        }
      });
    }
    let ProdReqSection = [];
    let LeadFormQSection = [];
    if (Array.isArray(QuestionnairePage) && QuestionnairePage.length > 0) {
      ProdReqSection = QuestionnairePage[0].sections.filter((section) => {
        // if (section.type === 'Section heading goes here') {
        return section;
        // }
      });
      LeadFormQSection = QuestionnairePage[0].sections.filter((LeadFormQ) => {
        if (LeadFormQ.type === 'LeadFormQ') {
          return LeadFormQ;
        }
      });
    }

    let CtaShareItem = [], CtaLikeItem = [], ClickBtnItem = [];
    if (Array.isArray(LeadFormSection) && LeadFormSection.length > 0) {
      CtaShareItem = LeadFormSection[0].items.filter((item) => {
        if (item.type === 'cta_shares') {
          return item;
        }
      });
      CtaLikeItem = LeadFormSection[0].items.filter((item) => {
        if (item.type === 'cta_likes') {
          return item;
        }
      });
      ClickBtnItem = LeadFormSection[0].items.filter((item) => {
        if (item.type === 'click_button') {
          return item;
        }
      });
    }
    let PoweredByItem = [];
    if (Array.isArray(PageHeaderSection) && PageHeaderSection.length > 0) {
      PoweredByItem = PageHeaderSection[0].items.filter((item) => {
        if (item.type === 'poweredby') {
          return item;
        }
      });
    }
    let LeadFormQuestionItems = [];
    if (Array.isArray(LeadFormQSection) && LeadFormQSection.length > 0) {
      LeadFormQuestionItems = LeadFormQSection[0].items.filter((LeadFormQuestion) => {
        if (LeadFormQuestion.type === 'leadform_question') {
          return LeadFormQuestion;
        }
      });
    }

    // Lead Generation
    if (LeadFormQuestionItems.length > 0) {
      LeadFormQuestionItems[0].fields.filter((field) => {
        if (field.type === 'email' && field.emailValidator && !self.featuresToDisable.includes('Email Checking')) {
          if (!features.lead_generation.email_check) {
            self.featuresToDisable.push('Email Checking');
          }
        }
        if (!features.lead_generation.restrict_duplicate) {
          if (field.unique && !self.featuresToDisable.includes('Restriction Of Duplicate Leads')) {
            self.featuresToDisable.push('Restriction Of Duplicate Leads');
          }
        }
      });
    }
    // Custom HTML
    if (!features.custom_html.active && QuestionnairePage.length > 0) {
      QuestionnairePage[0].sections.filter((CustomHTML) => {
        if (CustomHTML.type === 'CustomHtml') {
          if (CustomHTML.visible && !self.featuresToDisable.includes('Custom HTML')) {
            self.featuresToDisable.push('Custom HTML');
          }
        }
      });
    }
    // Charts
    app.formula.filter((formula) => {
      if (!features.charts.active) {
        if (formula.visuals.type === 'graph' && formula.visuals.visible && !self.featuresToDisable.includes('Charts')) {
          self.featuresToDisable.push('Charts');
        }
      }
      if (!features.formula_operators.all_operators) {
      }
    });
    // CUSTOM STYLING Background Image
    if (!features.custom_styling.background_image) {
      const LandingPage = app.pages.filter((page) => {
        if (page.type === 'Landing') {
          return page;
        }
      });
      if (LandingPage[0].bgName !== '' && LandingPage[0].bgImageVisible) {
        this.featuresToDisable.push('Custom Background Image');
      }
    }
    // CUSTOM STYLING Custom Tint
    if (!features.custom_styling.custom_tints && app.theme.tintToggle) {
      if (app.theme.tint !== 0 || !(app.theme.tintColor.toLowerCase() === '#fff' || app.theme.tintColor.toLowerCase() === '#ffffff') || !(app.theme.tintRGB === 'rgba(255,255,255,0.45)' || app.theme.tintRGB === 'rgba(255, 255, 255, 0)')) {
        this.featuresToDisable.push('Custom tint');
      }
    }
    // CUSTOM STYLING Predefined color theme
    if (!features.custom_styling.predefined_color_themes && app.themeColor !== 'cp1') {
      this.featuresToDisable.push('Predefined color themes');
    }
    // CUSTOM STYLING Custom theme
    if (!features.custom_styling.custom_themes) {
      if (app.customColor.bgColor !== '' && app.customColor.componentColor !== '' && app.customColor.textColor !== '') {
        if (app.customColor.bgColor.toUpperCase() !== '#FFFFFF' || app.customColor.componentColor.toUpperCase() !== '#FFFFFF' || app.customColor.textColor.toUpperCase() !== '#FFFFFF') {
          this.featuresToDisable.push('Custom Themes');
        }
      }
    }
    // CUSTOM STYLING Fonts
    if (!features.custom_styling.fonts && app.theme.fontFamily !== 'Orkney') {
      this.featuresToDisable.push('Font');
    }
    // Conditional messaging
    if (!features.conditional_messaging.active && ResultSection.length > 0) {
      ResultSection[0].items.filter((item) => {
        if (item.config.showHelp && !self.featuresToDisable.includes('Conditional messaging')) {
          self.featuresToDisable.push('Conditional messaging');
        }
      });
    }
    // Custom call to action
    if (!features.cta.active || !features.cta.shares || !features.cta.like_follow || !features.cta.redirect_url) {
      if (CtaShareItem[0].visible) {
        for (let i = 0; i < CtaShareItem[0].options.length; i++) {
          if (!features.cta.shares && CtaShareItem[0].options[i].selected) {
            this.featuresToDisable.push('Share CTA');
            break;
          }
        }
      }
      if (CtaLikeItem[0].visible) {
        for (let i = 0; i < CtaLikeItem[0].options.length; i++) {
          if (!features.cta.like_follow && CtaLikeItem[0].options[i].selected) {
            this.featuresToDisable.push('Like & Follow CTA');
            break;
          }
        }
      }
      if (!features.cta.redirect_url && ClickBtnItem[0].visible) {
        this.featuresToDisable.push('Redirect Users To URL');
      }
    }
    // Outgrow Branding powered by Outgrow
    if (!features.custom_branding.cta_build_similar_calc && PoweredByItem.length && !PoweredByItem[0].visible) {
      this.featuresToDisable.push('Outgrow Branding');
    }
    // Outgrow Branding powered by Agency
    if (!features.custom_branding.allow_agency_branding && PoweredByItem.length && PoweredByItem[0].showButton) {
      this.featuresToDisable.push('Agency Branding');
    }
    // Logic Jump
    // if (!features.logic_jump.active && Array.isArray(ProdReqSection) && ProdReqSection.length > 0) {
    //   ProdReqSection.forEach((prodReqSection) => {
    //     prodReqSection.items.forEach((item) => {
    //       if (item.condition !== '' && !self.featuresToDisable.includes('Logic Jump')) {
    //         this.featuresToDisable.push('Logic Jump');
    //       }
    //     });
    //   });
    // }
    // Custom CSS
    if (!features.custom_style.active && app.styles.length > 0) {
      this.featuresToDisable.push('Custom CSS');
    }
    // Custom Script
    if (!features.custom_script.active && app.scripts.length > 0) {
      this.featuresToDisable.push('Custom Script');
    }
    // Templates
    const templatesName = {
      'one_page_card_new': 'The Chicago',
      'one_page_card_oldresult': 'The Chicago',
      'one_page_card': 'The Chicago',
      'sound_cloud_new': 'The Londoner',
      'sound_cloud_v3': 'The Londoner',
      'template_seven': 'The Seattle',
      'sound_cloud': 'The Londoner',
      'inline_temp_new': 'The Greek',
      'inline_temp': 'The Greek',
      'experian': 'The Tokyo',
      'template_five': 'The Madrid',
      'template_five_oldresult': 'The Madrid',
      'template_six': 'The Stockholm',
      'template_eight': 'The Venice'
    };
    if (app.mode === 'PUBLIC') {
      const appTemplate = app.template.replace(/-/g, '_');
      for (const template in features.templates) {
        if (features.templates.hasOwnProperty(template) && appTemplate === template && !features.templates[template]) {
          for (const tname in templatesName) {
            if (templatesName.hasOwnProperty(tname) && appTemplate === tname) {
              this.featuresToDisable.push(templatesName[tname] + ' template');
            }
          }
        }
      }
    }
    // Traffic Analytics Fb and Ga
    if (!features.analytics.facebook_pixel && app.fbPixel !== '') {
      this.featuresToDisable.push('Facebook Pixel');
    }
    if (!features.analytics.google_analytics && app.ga !== '') {
      this.featuresToDisable.push('Google Analytics');
    }
    if (this.featuresToDisable.length !== 0) {
      jQuery('#downgrade').modal('show');
    }
    let data = {
      appId: this.jsonBuilderHelper.getJSONBuilt()._id,
      features: this.featuresToDisable
    };
    this._builderService.setUsedPremiumFeature(data).subscribe((success) => { }, (error) => { });
  }

  turnOffFeatures() {
    this.turningOffFeature = true;
    jQuery('#downgrade').modal('hide');
    let data = {
      appId: this.jsonBuilderHelper.getJSONBuilt()._id,
      features: this.featuresToDisable
    };
    this._builderService.turnOffFeatures(data).subscribe((success) => {
      setTimeout(() => {
        this.turningOffFeature = false;
        window.location.reload();
      }, 1000);
    }, (error) => {
      this.turningOffFeature = false;
      window.location.reload();
      console.log('turnOffFeatures error', error);
    });
  }

  //Socket functionality..
  connectionInit(data) {
    this.socketEmiter.emit(true);
  }

  setUser(socketId: any) {
    // console.log('Inside set user', socketId, this.socket);
    this.allowUse = true;
    this.socket.emit('user-details', {
      userId: this.storage.user._id,
      userName: this.storage.user.name,
      appId: this.jsonBuilderHelper.getJSONBuilt()._id,
      socketId: socketId, old_id: this.jsonBuilderHelper.getJSONBuilt().socket_id,
      url: this.jsonBuilderHelper.getJSONBuilt().url
    });
  }

  connectionError() {
    localStorage.setItem('connect', 'disconnect')
    // this.socket = (environment.APP_DOMAIN == 'https://app.outgrow.co') ? io.connect(environment.ROOT, { secure: true }) : io.connect(environment.ROOT);
  }

  //redo undo code
  keypressHandeler(event: any) {
    if (event.keyCode == 90 && event.ctrlKey && this.allowUse) {
      event.preventDefault();
      this._redoUndoService.undoFunction();
    } else if (event.keyCode == 89 && event.ctrlKey && this.allowUse) {
      event.preventDefault();
      this._redoUndoService.redoFunction();
    }
  }

  gifPublished(data) {
    console.log('gif published', data);
    if (this.jsonBuilderHelper.getJSONBuilt()._id === data.app) {
      this.jsonBuilderHelper.getJSONBuilt().gifUrl[data.device] = data.gifUrl;
    }
  }

  getLiveUrl() {
    if (environment.STATIC_DOMAIN) {
      return environment.LIVE_PROTOCOL + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt().url;
    } else {
      return environment.LIVE_PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt().url;
    }
  }
  // removeLogo() {
  //   this.subDomainService.removeLogo('builderLogo', 'builderfileName');
  // }
  isSignupDone(status) {
    this.demoBuilder = false;
    if (status == true) {
      setTimeout(() => window.location.href = environment.PROTOCOL + this.subDomainService.currentCompany.sub_domain + '.' + environment.APP_EXTENSION + '/dashboard?premade=' + this.jsonBuilderHelper.getJSONBuilt().url, 4);
    }
  }
  removeLogo() {
    this.subDomainService.removeLogo('builderLogo', 'builderfileName');
  }

  removeCancellation(sid) {
    this.turningOffFeature = true;
    this._membershipService.removeCancellation(sid).subscribe((success: any) => {
      if (success) {
        this.currentCompany = this.subDomainService.currentCompany = new CurrentCompany(success.company);
        this.subDomainService.subDomain.sub_domain = this.currentCompany.sub_domain;
        this.subDomainService.subDomain.company_id = this.currentCompany.id;
        this.subDomainService.subDomain.name = this.currentCompany.name;
        if (success.hellobar) {
          this._cookieService.createCookie('hellobar', JSON.stringify(success.hellobar), 3);
        } else {
          this._cookieService.eraseCookie('hellobar');
        }
        const membership = JSON.parse(this._cookieService.readCookie('filepicker_token_json'));
        for (let i = 1; i < membership.length; i++) {
          if (membership[i].key === success.company.sub_domain) {
            membership[i].value = success.subscription.status;
          }
        }
        this._cookieService.eraseCookie('filepicker_token_json');
        this._cookieService.createCookie('filepicker_token_json', JSON.stringify(membership), 3);
      }
      this.turningOffFeature = false;
      setTimeout(function () {
        window.location.reload();
      }, 1000);
    }, (error: any) => {
      this.turningOffFeature = false;
      console.log('************************************');
      console.log('error : ', error);
      console.log('************************************');
    });
  }

  checkCnameAccess() {
    if (!this.isCNameAccess) {
      this._featureAuthService.setSelectedFeature('cname');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }


  updateIntercomforPage() {
    let interval = setInterval(function () {
      if (window.Intercom) {
        window.Intercom('update', { 'app_current_page': 'builder' });
        window.Intercom('update', { 'app_current_page_url': window.location.href });
        clearInterval(interval);
      }
    }, 3000);
  }

  openIntercom() {
    window.Intercom('show');
  }

  setPublishUrl() {
    let currentUrl = window.location.href.split('//')[1];
    currentUrl = currentUrl.split('/');
    this.publishUrl = currentUrl[0] + '/';
  }

  redirectToCname(link) {
    let redLoc = environment.PROTOCOL + window.location.hostname + link;
    window.location.href = redLoc;
  }

  prepareModalData() {
    let embedHeader = (this.jsonBuilderHelper.getJSONBuilt().embedHeader) ? 1 : 0;
    let embedFooter = (this.jsonBuilderHelper.getJSONBuilt().embedFooter) ? 1 : 0;
    let queryparam = '';
    if (this.headerVisible()) queryparam = queryparam + '&header=' + embedHeader;
    if (this.footerVisible()) queryparam = queryparam + '&footer=' + embedFooter;
    if (this.jsonBuilderHelper.getJSONBuilt().template === 'template-eight') {
      queryparam = '';
    }
    if (environment.APP_EXTENSION !== 'outgrow.co') {
      this.iloaderJS = '//dyv6f9ner1ir9.cloudfront.net/assets/js/niloader.js';
    }
    if (environment.LIVE_PROTOCOL === 'https://') {
      if (environment.STATIC_DOMAIN) {
        this.csrc = 'https://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?sLead=1' + queryparam;
        this.fsrc = 'https://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      } else {
        this.csrc = 'https://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?sLead=1' + queryparam;
        this.fsrc = 'https://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      }
    } else {
      if (environment.STATIC_DOMAIN) {
        this.csrc = '//' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?sLead=1' + queryparam;
        this.fsrc = 'http://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      } else {
        this.csrc = '//' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?sLead=1' + queryparam;
        this.fsrc = 'http://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      }
    }
    this.fullPageCode = `<div><div class='op-interactive' id='` + this.jsonBuilderHelper.getJSONBuilt()._id + `' data-url='` + this.csrc + `' data-surl='` + this.jsonBuilderHelper.getJSONBuilt().shortUrl + `' data-width='100%'></div><script src='` + this.iloaderJS + `'></script><script>initIframe('` + this.jsonBuilderHelper.getJSONBuilt()._id + `');</script></div>`;
    this.liveSrcGenerate();
  }


  headerVisible() {
    let header_sec = this.jsonBuilderHelper.getJSONBuilt().pages[0].sections.find(sec => sec.type == 'Page_Header');
    if (header_sec) {
      let header = header_sec.items.find(item => item.type == 'header_links');;
      return (header && header.visible);
    } else return false;
  }

  footerVisible() {
    let footer_sec = this.jsonBuilderHelper.getJSONBuilt().pages[2].sections.find(sec => sec.type == 'Page_Footer');
    if (footer_sec) {
      let footer = footer_sec.items.find(item => item.type == 'footer_links');;
      return (footer && footer.visible);
    } else return false;
  }

  redirectToConfig() {
    jQuery('#publish-upgrade').modal('hide');
    jQuery('.editor-modal.bootbox.modal.fade.in').css('display', 'none');
    jQuery('.modal-backdrop.fade.in').css('display', 'none');
    jQuery('div.pyro').css('display', 'none');
    this.onSelect('config');
    this.jsonBuilderHelper.view_embeded_tab.next({ event: 'hh' });
  }

  liveSrcGenerate() {
    if (environment.STATIC_DOMAIN) {
      this.srcUrl = environment.LIVE_PROTOCOL + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt().url;
    } else {
      this.srcUrl = environment.LIVE_PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt().url;
    }
  }


  setFBCommentsURL() {
    if (this.jsonBuilderHelper.getJSONBuilt().fbComments) {
      this.fbCommentsCode = `<div id='fb-root'></div><script>(function(d, s, id){var js, fjs=d.getElementsByTagName(s)[0]; if (d.getElementById(id)) return; js=d.createElement(s); js.id=id; js.src='//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.10'; fjs.parentNode.insertBefore(js, fjs);}(document, 'script', 'facebook-jssdk'));</script><div class='fb-comments' data-href='` + this.fsrc + `' data-width='100%' data-numposts='5'></div>`;
    }
  }

  viewReferal() {
    jQuery('#publish-upgrade').modal('hide');
    this._router.navigate(['/referralCandy']);
  }

  publishPopUpText() {
    if (this.jsonBuilderHelper.getJSONBuilt() && this.jsonBuilderHelper.getJSONBuilt().templateType) {
      return {
        Numerical: 'Calculator',
        Graded: 'Quiz',
        Recommendation: 'Quiz',
        Poll: 'Poll',
        Ecom: 'Ecom'
      }[this.jsonBuilderHelper.getJSONBuilt().templateType];
    }
    return '';
  }

  copyUrl() {
    var textField = document.createElement('textarea');
    if (this.popUpHeading !== 's') {
      textField.innerText = `${this.fullPageCode}${this.jsonBuilderHelper.getJSONBuilt().fbComments ? this.fbCommentsCode : ''}`;
    } else {
      textField.innerText = this.srcUrl;
    }
    document.body.appendChild(textField);
    textField.select();
    textField.focus();
    document.execCommand('copy');
    textField.remove();
    window.toastNotification('Copied to Clipboard');
  }
}