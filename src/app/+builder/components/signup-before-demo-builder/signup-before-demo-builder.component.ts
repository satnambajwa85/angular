import { LoggedInService } from './../../../../shared/services/logged-in.service';
import { SubDomainService } from './../../../../shared/services/subdomain.service';
import { environment } from './../../../../../environments/environment';
import { SocialSignUp } from './../../../../shared/services/helper-service/signup-helper';
import { CookieService } from './../../../../shared/services/cookie.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit,EventEmitter,Output,ElementRef , ComponentFactoryResolver,ViewContainerRef,ComponentFactory,ViewChild } from '@angular/core';
import { UserService } from '../../../../shared/services/user.service';
import { BuilderSignupComponent } from '../builder-signup/builder-signup.component';
import { EmailValidator } from 'app/shared/validators/email.validator';
declare var window:any;
declare var ga:any;
@Component({
  selector: 'signup-before-demo-builder',
  templateUrl: './signup-before-demo-builder.component.html',
  styleUrls: ['./signup-before-demo-builder.component.css']
})
export class SignupBeforeDemoBuilderComponent implements OnInit {
  @ViewChild('container',{read:ViewContainerRef}) container;
  @ViewChild('saveButton',{read:ElementRef}) saveButton;
  @Output() isSignupDone:EventEmitter<any>=new EventEmitter<any>();
  leadForm:FormGroup;
  addValidationClass='';
  // signup=false;
  signUpStatus='lead';
  isOAuth=false;
  componentRef;
  constructor(public _fb:FormBuilder,
    public _cookieService:CookieService,
    public _userService:UserService,
    public resolver:ComponentFactoryResolver,
    public _socialSignUp:SocialSignUp,
  public _subDomainService:SubDomainService,
public _loggedInSerivce:LoggedInService) { }

  ngOnInit() {
    // this._cookieService.readCookie('leads') && this.initSignUpComponent();
    this.leadForm = this._fb.group({
      email:['',Validators.compose([Validators.required,EmailValidator.format])]
    });

    this.leadForm.valueChanges.subscribe((data)=>{
      this.addValidationClass = this.leadForm.get('email').valid ? 'input-success-msg' : 'input-danger-msg';
    })
  }
  saveLead(form,saveButton='',isOAuth=false){
    // this.addLoading();
    this.saveButton.nativeElement.textContent='Please wait...';
    this.saveButton.nativeElement.disabled=true;
    let email = form['email'].toLowerCase();
    this._cookieService.createCookie('leads',email,3);
    let leadSubmitRef = this._userService.leads(email)
    .subscribe(
      (response :any )=> {
        if(response._id !== null ) {
          //jQuery('#leads').addClass('hide');
          /*=== Tracking snippet ===*/
          window.Intercom('update', { 'email': email, 'ISLEAD': true });
          /*========================*/
          this.initSignUpComponent();
        }
        this.saveButton.nativeElement.textContent='Get Started';
        this.saveButton.nativeElement.disabled=false;
        this.signUpStatus='sign_up';
      },
       (error: any ) => {
          const error_code = error.error.code;
          if ( error_code === 'E_UNEXPECTED' && error.error.err_message === 'Email is already registered with us, please log in!') {
            // this.login();
            this.openLogin(isOAuth);
          } else {
              //  this.errorMsg = (error.error.err_errors !=='' ) ? error.error.err_errors.email.message :
              //          error.error.err_message ;
              // this.removeLoading();
          }
          // this.error = this.errorMsg ;
          leadSubmitRef.unsubscribe();
          this.saveButton.nativeElement.textContent='Get Started';
          this.saveButton.nativeElement.disabled=false;
      });
  }
  callGA() {
    ga('markettingteam.send', 'event', 'Signup', 'Click', 'Landingpage');
    // _kmq.push(['record', 'Sign Up Click']);
  }
  initSignUpComponent(){
    // this.signup=true;
    this.signUpStatus='sign_up';
    // this.container.clear(); 
    // const factory= this.resolver.resolveComponentFactory(BuilderSignupComponent);
    // this.componentRef= this.container.createComponent(factory);
    // this.componentRef.instance.input = 'djdjdd';
    // this.componentRef.instance.signupStatus.subscribe((status)=>{
  //     this.isSignupDone.emit(status);
    // })
  }
  openLogin(isOAuth=false){
    this.signUpStatus='log_in';
    isOAuth && this.oAuthLogin();
  }
  signupStatus(status){
    this.isSignupDone.emit(status);
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
          this.leadForm.get('email').setValue(email);
          this.handleOauth(email);
        }
      },1000);
    }
  }
  handleOauth(email){
    this.saveLead({email},'',true);
  }
  oAuthLogin(){
    let email = this._cookieService.readCookie('leads');
    this._userService.login(email,'defaultPassword' , null,true)
    .subscribe((data)=>{
      this.onLoginSuccess(data);      
      this.isSignupDone.emit(true);
    })
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
}
