import { SocialSignUp } from './../../../../shared/services/helper-service/signup-helper';
import { MarketingService } from './../../../../shared/services/marketing.service';
import { environment } from './../../../../../environments/environment';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit, Output, EventEmitter, ViewChild, Input, ElementRef } from '@angular/core';
import { EmailValidator } from '../../../../shared/validators/email.validator';
import { CookieService, UserService, SubDomainService, LoggedInService } from '../../../../shared/services/index';
declare var window: any;
declare var fbq: any;
declare var qp: any;
declare var ga: any;


@Component({
  selector: 'builder-signup',
  templateUrl: './builder-signup.component.html',
  styleUrls: ['./builder-signup.component.css']
})
export class BuilderSignupComponent implements OnInit {
  signupFormDetail: FormGroup;
  logInForm: FormGroup;
  validationClass = {};
  logInValidation = {};
  suggestions = [];
  temp_name: String = 'template';
  @ViewChild('logInButton',{read:ElementRef}) logInButton;
  domainExtension = '.' + environment.APP_EXTENSION;
  errorMsg = '';
  isLogin = false;
  @Input() isSignup?: string;
  //@Input() isOAuth;
  @Output() signupStatus: EventEmitter<any> = new EventEmitter<any>();
  constructor(public _fb: FormBuilder,
    public _cookieService: CookieService,
    public _userService: UserService,
    public _subDomainService: SubDomainService,
    public _marketingService: MarketingService,
  public _loggedInSerivce:LoggedInService,
public _socialSignUp:SocialSignUp) { }

  ngOnInit() {
    let email = this._cookieService.readCookie('leads')
    this.signupFormDetail = this._fb.group(this.getSignupFields(email));
    Object.keys(this.signupFormDetail.value).forEach(key => {
      this.signupFormDetail.get(key).valueChanges.subscribe((data) => {
        console.log(data);
        this.validationClass[key] = this.signupFormDetail.get(key).valid ? 'input-success-msg' : 'input-danger-msg';
      })
    });
    this.logInForm = this._fb.group(this.getLogInFields(email));
    Object.keys(this.logInForm.value).forEach(key => {
      this.logInForm.get(key).valueChanges.subscribe((data) => {
        console.log(data);
        this.logInValidation[key] = this.logInForm.get(key).valid ? 'input-success-msg' : 'input-danger-msg';
      })
    });
    email && this.populateForm(email);

  }
  ngOnChanges(){
   // this.isOAuth && this.oAuthLogin();
  }
  
  getLogInFields(email) {
    return {
      email: [email || '', Validators.compose([Validators.required, EmailValidator.format])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
    }
  }
  getSignupFields(email) {
    return {
      name: ['', Validators.compose([Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z0-9,. \\-\\s]+$')])],
      email: [email || '', Validators.compose([Validators.required, EmailValidator.format])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
      companyname: [email ? email.split('@')[1].split('.')[0] : '', Validators.compose([Validators.required, Validators.minLength(4), Validators.pattern('^[a-zA-Z0-9,. \\-\\s]+$')])],
      domain: [email ? email.split('@')[1].split('.')[0] : '', Validators.compose([
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('^[a-zA-Z0-9]*$')
      ])],
    }
  }
  populateForm(data: any) {
    let sub_domain = this._cookieService.readCookie("claim_sub_domain");
    if (sub_domain) {
      this.signupFormDetail.get('domain').setValue(sub_domain);
    }
    if (window.location.href.indexOf('outgrow.co') >= 0 && window.location.href.indexOf('outgrow.co.in') < 0 && window.fbq) {
      fbq('track', 'Lead', { 'value': '0.01', 'currency': 'USD' });
    }
  }
  login(data,logInButton=null,auth=false) {
    this.logInButton.nativeElement.textContent = 'Please wait...';
    this.logInButton.nativeElement.disabled = true;
    this._userService.login(data.email, data.password, null,auth)
    .subscribe((response: any) => {
      this.onLoginSuccess(response);
      this.logInButton.nativeElement.textContent = 'Get Started';
      this.logInButton.nativeElement.disabled = false;
      //redirect
      this.errorMsg='no_error';
      this.signupStatus.emit(true);
    },error=>{
      if (error.error.code === 'E_USER_NOT_FOUND') {
        this.errorMsg = "Something isn't quite right. Please enter a correct email and password..";
      }
      else if (error.error.code === 'E_USER_ACCOUNT_DISABLED') {
        this.errorMsg = 'Your account has been disabled. Please signup again!';
        // }
      }
      else if (error.error.code === 'E_USER_ACCOUNT_LEFT') {
        this.errorMsg = error.error.message;
      }
      this.logInButton.nativeElement.textContent = 'Get Started';
      this.logInButton.nativeElement.disabled = false;
      this.logInForm.get('password').setValue('');
    });
  }
  onLoginSuccess(response: any) {
    let storage: any;
    if (response.user.role !== 'ADMIN') {
      this._cookieService.eraseCookie('leads');
      response.company['cost'] = response.plan.price;
      this._subDomainService.setCurrentCompany(response.company);
      const status = {
        cardStatus: response.subscription.currentplan.customer.card_status,
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
      this._loggedInSerivce.login();
      this._userService.token = response.token;
      this._cookieService.createCookie('storage', JSON.stringify(storage), 3);
      if (response.hellobar) {
        this._cookieService.createCookie('hellobar', JSON.stringify(response.hellobar), 3);
      }
      ga('markettingteam.send', 'event', 'Login', 'Submit', 'LoginPage');
      
    }
  }


  userSignUp(user, saveButton) {
    saveButton.textContent = 'Please wait...';
    saveButton.disabled = true;
    let signupSubscription = this._userService.register(user).subscribe(async (response: any) => {
      this._subDomainService.setCurrentCompany(response.company);
      this._subDomainService.subDomain.company_id = response.company._id;
      let storage = {
        'token': response.token,
        'user': response.user,
        'currentCompany': response.company.sub_domain,
        'temp_name': this.temp_name,
        'companyList': response.companyList,
      };
      this._cookieService.createCookie('filepicker_token_json', JSON.stringify(response.companyAccess), 3);
      this._cookieService.createCookie('storage', JSON.stringify(storage), 3);
      this._cookieService.createCookie('message', 'On', 3);
      if (response.hellobar) {
        this._cookieService.createCookie('hellobar', JSON.stringify(response.hellobar), 3);
      }
      localStorage.setItem('domain', user.domain);
      this._cookieService.eraseCookie('leads');
      if (response.user.role !== 'ADMIN') {
        let status = {
          cardStatus: response.subscription.result.customer.card_status,
          subsStatus: response.subscription.result.subscription.status
        };
        this._cookieService.createCookie('status', JSON.stringify(status), 3);
      }

      this._marketingService.bootIntercomUser();
      /*=== Tracking snippet ===*/
      this._cookieService.createCookie('og-signedup', 'true', 365);
      let utmRef = this._cookieService.readCookie('utm_ref');
      if (utmRef) {
        utmRef = JSON.parse(utmRef);
        window.Intercom('update', utmRef);
      }
      window.Intercom('update', {
        'email': user.email,
        'ISLEAD': false,
        'SIGNUP_WITH_PAYMENT': false
      });
      /*========================*/

      /*----- Analytics Tracking code here -------*/
      if (window.google_trackConversion) {
        this.setWindowTrackingCode({ id: 876549213, color: 'ffffff', label: 'GzbsCLPJonQQ3aj8oQM', email: user.email })
        this.setWindowTrackingCode({ id: 822035833, color: '000000', label: 'ZiwhCN-hhXsQ-Yr9hwM', email: user.email })
      }
      ga('markettingteam.send', 'event', 'Signup', 'Submit', 'SignUpPage');
      if (window.location.href.indexOf('outgrow.co') >= 0) {
        fbq('track', 'CompleteRegistration');
        if ('undefined' !== typeof (qp)) qp('track', 'Generic')
      }

      try {
        await this._marketingService.createGrowsumoSignup(user.name, user.email);
      } catch (err) { console.log(err); }
      this.errorMsg = 'no_error';
      saveButton.textContent = 'Get Started';
      saveButton.disabled = false;
      //redirect
      this.signupStatus.emit(true);
    },
      (error: any) => {
        let error_code = error.error.code;
        if (error_code === 'E_UNIQUE_USERNAME_VALIDATION' ||
          error_code === 'E_UNIQUE_EMAIL_VALIDATION' ||
          error_code === 'E_UNIQUE_UNIDENTIFIED_VALIDATION'
        ) {
          this.errorMsg = ' Email is already registered with us! Please Log in';
        } else if (error.error.err_errors['sub_domain']) {
          this.errorMsg = error.error.err_errors['sub_domain'].message;
        } else if (error_code === 'E_UNEXPECTED' && error.error.err_message === 'id : The size should not be more than 50') {
          this.errorMsg = 'The size should not be more than 50 characters';
        } else {
          this.errorMsg = error.error.err_errors['emails.0.email'] ?
            error.error.err_errors['emails.0.email'].message : error.error.err_message;
        }
        let start = this.errorMsg.indexOf(':');
        let end = this.errorMsg.length;
        if (start != -1 && end != 0) {
          start++;
          this.errorMsg = this.errorMsg.substring(start, end);
        }
        saveButton.textContent = 'Get Started';
        saveButton.disabled = false;
        signupSubscription.unsubscribe();
      });
  }
  domainsuggestion(data) {
    data = data.split('.');
    this.suggestions = data.join().split(/\s|,/).filter(Boolean);
  }
  changeDomain(domain) {
    this.signupFormDetail.controls['domain'].setValue(domain);
  }
  setWindowTrackingCode(obj) {
    window.google_trackConversion({
      google_conversion_id: obj.id || 876549213,
      google_conversion_language: obj.language || 'en',
      google_conversion_format: obj.format || '3',
      google_conversion_color: obj.color || 'ffffff',
      google_conversion_label: obj.label || 'GzbsCLPJonQQ3aj8oQM',
      google_custom_params: {
        email: obj.email
      },
      google_remarketing_only: false
    });
  }
  signUpWithAuth(type){
    let link = '';
    (type == 'google') && (link = this._socialSignUp.getGoogleLink({redirect_uri:`${environment.APP_DOMAIN}/demo-builder/auth-redirect`}));
    (type == 'facebook') && (link = this._socialSignUp.getFacebookLink("email",{redirect_uri:`${environment.APP_DOMAIN}/demo-builder/auth-redirect`}));
    (type == 'linkedIn') && (link = this._socialSignUp.getLinkedInLink({redirect_uri:`${environment.APP_DOMAIN}/demo-builder/auth-redirect`}));
    let newWindow = window.open(link, 'FacebookWindow', 'width=600, height=500,scrollbars=yes');
    if(!newWindow || newWindow.closed || typeof newWindow.closed=='undefined') {
   //   jQuery('#popup-block').modal('show');
      console.log("Popup Blocked..");
    }else{
      let _interval=setInterval(()=>{
        let email=this._cookieService.readCookie('auth_email');
        if(email){
          newWindow.close();
          this._cookieService.eraseCookie('auth_email');
          clearInterval(_interval);
          this.logInForm.get('email').setValue(email);
          this.logInForm.get('password').setValue('gdgddgggggggggggggggggggggggggggggggggggggggggsdsgs');
          this.login({email,password:'defaultPassword'},null,true)
        }
      },1000);
    }
  }
  // handleOauth(email){
    //this.saveLead({email},'',true);
  // }
  // oAuthLogin(){
  //   let email = this._cookieService.readCookie('leads');
  //   this._userService.login(email,'defaultPassword' , null,true)
  //   .subscribe((data)=>{
  //     this.onLoginSuccess(data);      
  //     this.isSignupDone.emit(true);
  //   })
  // }
}