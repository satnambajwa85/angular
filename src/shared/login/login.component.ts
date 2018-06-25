import { Script } from './../services/script.service';
import {SocialSignUp} from './../services/helper-service/signup-helper';
import {Validators, FormBuilder, FormGroup, FormControl} from '@angular/forms';
import {Component, OnInit, AfterViewInit} from '@angular/core';
import {Router, ActivatedRoute, Params} from '@angular/router';
import {EmailValidator} from './../validators/email.validator';
import {environment} from './../../../environments/environment';
import {User, Email} from './user';
import {MarketingService} from '../services/marketing.service';
import {Title} from '@angular/platform-browser';
import {CookieService} from '../services/cookie.service';
import {CompanyService} from '../services/company.service';
import {SubDomainService} from '../services/subdomain.service';
import {LoggedInService} from '../services/logged-in.service';
import {UserService} from '../services/user.service';
import {MembershipService} from '../services/membership.service';

declare var jQuery: any;
declare var ga: any;
declare var window: any;

@Component({
  selector: 'og-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css', './../../../assets/css/sahil-hover.css', './../../../assets/css/custom-material.css'],
})

export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  setupPaymentForm: FormGroup;
  error: Boolean = false;
  isError: Boolean = false;
  co: any;
  ErrorMsg: String;
  userId: any;
  isDomainExist: Boolean = false;
  resendEmailShow: Boolean = false;
  model = new User(new Email('', true), '');

  cardStatus: string = '';
  emailValidation: string = '';
  passwordValidation: string = '';
  cardNum: string;
  card: any;
  loginResponse: any;
  isAutoLogin :Boolean = false;
  autoLoginToken :string='';
  isLoginError :Boolean = false;
  preloader : Boolean = false;
  constructor(public fb: FormBuilder,
              public _userService: UserService,
              public router: Router,
              public loggedInSerivce: LoggedInService,
              public subDomainService: SubDomainService,
              public _companyService: CompanyService,
              public _cookieService: CookieService,
              public _marketingService: MarketingService,
              public titleService: Title,
              public route: ActivatedRoute,
              private _socialSignUp: SocialSignUp,
              private _script:Script,
              private membershipService: MembershipService) {

    this.route.queryParams.subscribe((params: Params) => {

      if (this.validateEmail(params['email'])) {
        if((params['verifyToken'])){
            this.model.emails.email = params['email'];
            this.autoLoginToken = params['verifyToken'];
            this.isAutoLogin = true;
            this.autoLogin();
        }if(!(params['verifyToken']) && params['email']){
           this.model.emails.email = params['email'];
        }
      }
    });
    this.titleService.setTitle("Outgrow Home");
  }

  ngOnInit() {
    this._script.load('zippy').then((data)=>{
      console.log('zippy loaded');
    }).catch((error)=>{
      console.log("zippy not loaded......");
    })
    let link = window.location.hostname.split('.');
    if (link[0] === 'app') {
      this.isDomainExist = true;
    }
    // let userEmail = localStorage.getItem('leads');
    let userEmail = this._cookieService.readCookie('leads');
    if (userEmail) {
      this.model.emails.email = userEmail;
    }
    this.loginForm = this.fb.group({
      email: [this.model.emails.email, Validators.compose([
        Validators.required, EmailValidator.format
      ])],
      password: [this.model.password, Validators.compose([
        Validators.required, Validators.minLength(8)
      ])]
    });
    this.loginForm.controls['email'].valueChanges.subscribe((data) => {
      this.emailValidation = (this.loginForm.controls['email'].valid) ? 'input-success-msg' : 'input-danger-msg';
    });
    this.loginForm.controls['password'].valueChanges.subscribe((data) => {
      this.passwordValidation = (this.loginForm.controls['password'].valid) ? 'input-success-msg' : 'input-danger-msg';
    });
    this.initSetupPaymentForm();
    this._marketingService.initGTM()
      .then(data => this._marketingService.initIntercom())
      .catch(err => console.log(err));

    this._cookieService.setTouchPoints();
  }


  validateEmail(email: any) {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  onSubmit(value?: any) {
    value = this.loginForm.value;
    let self = this;
    jQuery('#loginSubmit').addClass('loading');
    jQuery('#loginSubmit').html('Please wait');
    jQuery('#loginSubmit').attr('disabled', true);
    let link = window.location.hostname;
    let linkArray = link.split('.');
    //this.co = window.location.href.split('.outgrow')[0].split('//')[1];
    this.co = window.location.href.split('//')[1].split('.')[0];
    let companyName: String = null;
    if (linkArray.length === 3 && linkArray[0] !== 'app')
      companyName = linkArray[0];

    this._userService.login(value.email, value.password, companyName)
      .subscribe((response: any) => {
          if (response.token) {
            this.loginResponse = response;
            if (response.user.role !== 'ADMIN' && response.company.is_payment_required) {
              jQuery('#main-login').addClass('hide');
              jQuery('#login-close').addClass('hide');
              jQuery('#paymentFailed-setup-cc').removeClass('hide');
              jQuery('#login-heading').addClass('hide');
            } else {
              this.onLoginSuccess(response);
            }
          }
        },
        (response: any) => {
          self.resendEmailShow = false;
          jQuery('#loginSubmit').removeClass('loading');
          jQuery('#loginSubmit').html('Login');
          jQuery('#loginSubmit').attr('disabled', false);
          jQuery('#loginSubmit').attr('disabled', false);
          this.isLoginError = true;
          //jQuery('#is-Error').removeClass('hide');
          //self.isError = true;
          self.ErrorMsg = response.error.message;
          this.emailValidation = '';
          this.passwordValidation = '';
          if (response.error.code === 'E_USER_NOT_FOUND') {
            self.ErrorMsg = "Something isn't quite right. Please enter a correct email and password..";
          }
          else if (response.error.code === 'E_USER_ACCOUNT_DISABLED') {
            self.userId = response.error.err_errors;
            // if (self.userId !== null) {
            //   self.ErrorMessage = 'Your account has been disabled. Please verify your email to continue using Outgrow.';
            //   // self.resendEmailShow = true;
            // }else {
            self.ErrorMsg = 'Your account has been disabled. Please signup again!';
            // }
          }
          else if (response.error.code === 'E_USER_ACCOUNT_LEFT') {
            self.ErrorMsg = response.error.message;
            self.userId = response.error.err_errors;
          }
          jQuery("#login-error-msg").html(self.ErrorMsg);
        }
      );
  }

  onLoginSuccess(response: any) {
    let storage: any;
    if (response.user.role !== 'ADMIN') {
      this._cookieService.eraseCookie('role');
      this._cookieService.createCookie('role', response.role, 3);
      this.cardStatus = response.subscription.currentplan.customer.card_status;
      this._cookieService.eraseCookie('leads');
      response.company['cost'] = response.plan.price;
      this.subDomainService.setCurrentCompany(response.company);
      const status = {
        cardStatus: this.cardStatus,
        subsStatus: response.subscription.currentplan.subscription.status
      };
      this._cookieService.createCookie('status', JSON.stringify(status), 3);
      storage = {
        'token': response.token,
        'user': response.user,
        'currentCompany': response.company.sub_domain,
        'companyList': response.companyList,
        'showUpgradeModal': false,
      };
      this._cookieService.createCookie('filepicker_token_json', JSON.stringify(response.companyAccess), 3);
      if (response.user.chargebee_plan_id === 'starter') {
        storage.showUpgradeModal = true;
      }
      this.loggedInSerivce.login();
      this._userService.token = response.token;
      //jQuery('#login').modal('hide');
      this.isLoginError = false;
      //jQuery('#is-Error').addClass('hide');
      this._cookieService.createCookie('storage', JSON.stringify(storage), 3);
      if (response.hellobar) {
        this._cookieService.createCookie('hellobar', JSON.stringify(response.hellobar), 3);
      }
      // let sessionData : any = {
      //   'sessionStatus' :'valid'
      // };
      // sessionData = this._cookieService.encrypt(JSON.stringify(sessionData));
      // this._cookieService.createCookie('sessionStatus',sessionData, 3);
      const url = response.company.sub_domain + '.' + environment.APP_EXTENSION + '/dashboard';
      if (!this.subDomainService.subDomain.is_sub_domain_url) {
        jQuery(location).attr('href', environment.PROTOCOL + url);
      } else {
        window.location.href = window.location.origin + '/dashboard';
      }
      ga('markettingteam.send', 'event', 'Login', 'Submit', 'LoginPage');
    }
    else {
      window.location.href = window.location.origin + '/admin/companies';
    }
  }

  paymentSetup() {
    this.isError = false;
    this.ErrorMsg = '';
    jQuery('#login_btnPaymentSetup').text('Please wait...').attr('disabled', true);
    const cardData = {
      'cardNumber': this.cardNum,
      'cvv': this.setupPaymentForm.value.cvv,
      'cardMonth': this.setupPaymentForm.value.cardMonth,
      'cardYear': this.setupPaymentForm.value.cardYear,
    };
    const cardSetup = this.membershipService.resetPayment(cardData, this.loginResponse.company._id, this.loginResponse.token).subscribe(
      (success: any) => {
        this.isError = false;
        this.ErrorMsg = '';
        this.membershipService.setBillingDetail(success);
        cardSetup.unsubscribe();
        this.onLoginSuccess(this.loginResponse);
      },
      (error: any) => {
        this.isError = true;
        this.ErrorMsg = error.error.err_message;
        const start = this.ErrorMsg.indexOf(':');
        const end = this.ErrorMsg.length;
        if (start !== -1) {
          this.ErrorMsg = this.ErrorMsg.substring(start + 1, end);
        }
        jQuery('#login_btnPaymentSetup').text('Save').attr('disabled', false);
        cardSetup.unsubscribe();
      });
  }

  signUp() {
    //jQuery('#leads').addClass('hide');
    //jQuery('#signUp').removeClass('hide');
    this.router.navigate(['/signup']);
  }

  closeLogin() {
    // Redirecting to main home page //
    const link = environment.APP_EXTENSION;
    const protocol = environment.PROTOCOL;
    window.location.href = protocol + link;
    //this.router.navigate(['/']);
  }

  resendEmail() {
    this._userService.resendEmail(this.userId)
      .subscribe(
        (success: any) => {
          jQuery('#sendMail').addClass('hide');
          window.toastNotification('Email has been sent, Please check your email.');
        },
        (error: any) => {
        }
      );
  }

  forgetPassword() {
    this.router.navigate(['/forgetPassword']);
  }

  callGA() {
    // _kmq.push(['record', 'Log In Click']);
  }

  signUpWithAuth(type: string) {
    let link = '';
    (type === 'google') && (link = this._socialSignUp.getGoogleLink());
    (type === 'facebook') && (link = this._socialSignUp.getFacebookLink());
    (type === 'linkedIn') && (link = this._socialSignUp.getLinkedInLink());
    window.location.href = link;
  }

  initSetupPaymentForm() {
    this.isError = false;
    this.ErrorMsg = '';
    this.setupPaymentForm = new FormGroup({
      cardNumber1: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
      cardNumber2: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
      cardNumber3: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
      cardNumber4: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
      nameOnCard: new FormControl('', [Validators.required, Validators.minLength(3)]),
      cvv: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(4), Validators.pattern('^[0-9]*$')]),
      cardMonth: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
      cardYear: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
    });

    this.setupPaymentForm.controls['cardNumber1'].valueChanges.subscribe((value) => {
      this.cardNum = this.setupPaymentForm.controls['cardNumber1'].value;
      this.card = this.getCardType(this.cardNum);
      value || (this.card = null);
      if (value.length === 4) {
        jQuery('input#login_cardNumber2').focus();
      }
    });
    this.setupPaymentForm.controls['cardNumber2'].valueChanges.subscribe((value) => {
      this.cardNum = this.setupPaymentForm.controls['cardNumber1'].value + this.setupPaymentForm.controls['cardNumber2'].value;
      this.card = this.getCardType(this.cardNum);
      value || (this.card = null);
      if (value.length === 4) {
        jQuery('input#login_cardNumber3').focus();
      }
    });
    this.setupPaymentForm.controls['cardNumber3'].valueChanges.subscribe((value) => {
      this.cardNum = this.setupPaymentForm.controls['cardNumber1'].value + this.setupPaymentForm.controls['cardNumber2'].value + this.setupPaymentForm.controls['cardNumber3'].value;
      this.card = this.getCardType(this.cardNum);
      value || (this.card = null);
      if (value.length === 4) {
        jQuery('input#login_cardNumber4').focus();
      }
    });
    this.setupPaymentForm.controls['cardNumber4'].valueChanges.subscribe((value) => {
      this.cardNum = this.setupPaymentForm.controls['cardNumber1'].value + this.setupPaymentForm.controls['cardNumber2'].value + this.setupPaymentForm.controls['cardNumber3'].value + this.setupPaymentForm.controls['cardNumber4'].value;
      this.card = this.getCardType(this.cardNum);
      value || (this.card = null);
    });
  }

  getCardType(number): string {
    if (number.match(new RegExp('^4')) != null) {
      return 'visa';
    }else if (/^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/.test(number)) {
      return 'mastercard';
    }else if (number.match(new RegExp('^3[47]')) != null) {
      return 'amex';
    }else if (number.match(new RegExp('^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)')) != null) {
      return 'discover';
    }else if (number.match(new RegExp('^36')) != null) {
      return 'diners';
    }else if (number.match(new RegExp('^35(2[89]|[3-8][0-9])')) != null) {
      return 'jcb';
    }else {
      return null;
    }
  }

  autoLogin(){
    this.preloader = true;
    this._cookieService.eraseCookie('leads');
    this._userService.autoLogin(this.model.emails.email,this.autoLoginToken)
      .subscribe(
        (response: any) => {
          if (response.token) {
            this.preloader = false;
            this.loginResponse = response;
            this.isLoginError = false;
            if (response.user.role !== 'ADMIN' && response.company.is_payment_required) {
              jQuery('#main-login').addClass('hide');
              jQuery('#login-close').addClass('hide');
              jQuery('#paymentFailed-setup-cc').removeClass('hide');
              jQuery('#login-heading').addClass('hide');
            } else {
              this.onLoginSuccess(response);
            }
          }
        },
        (error: any) => {
          if(error.error.code==='E_INVALID_VERIFY_TOKEN'){
            this.ErrorMsg = error.error.err_message;
          }else{
            this._cookieService.createCookie('leads',this.model.emails.email,3);
            this.ErrorMsg = "User doesn't exist";
          }
          this.preloader = false;
          this.cybermondaySignup();
          this.isAutoLogin = false;
        }
    );
  }

  cybermondaySignup(){
    this.router.navigate(['/cybermonday']);
  }
}
