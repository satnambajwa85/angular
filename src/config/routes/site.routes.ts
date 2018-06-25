import { AuthRedirectComponent } from './../../site/redirectUri/auth-redirect/auth-redirect.component';
import {Routes} from '@angular/router';
import {SiteComponent, HomeComponent} from './../../site/index';
import {AuthGuard} from '../../shared/authentication/auth.guard';
import {LoginGuard} from '../../shared/authentication/login.guard';
import {SubdomainGuard} from '../../shared/authentication/subdomain.guard';
import {AnalyticsGuard} from '../../shared/authentication/analytics.guard';
import {FeatureAuthService} from '../../shared/services/feature-access.service';
import {HomeRouteGuard} from '../../shared/authentication/home-route.guard';
import {CompanyProfileRouteGuard} from '../../shared/authentication/company-profile-route.guard';
import {NotFoundComponent} from '../../shared/notfound/notfound.component';
import {LogoutComponent} from '../../shared/logout/logout.component';
import {ReferralCandyComponent} from '../../shared/referralCandy/referralCandy.component';
import {LoginComponent} from '../../shared/login/index';
import {FreemiumGuard} from '../../shared/authentication/freemium.guard';
import {SetupNewPasswordGuard} from '../../shared/authentication/setupnew-password.guard';
import {
  VerifyUserComponent,
  SetPasswordComponent,
  UserApprovalComponent,
  ForgetPasswordComponent,
  VerifyEmailComponent
} from '../../site/index';
import {SalesforceRedirectComponent} from './../../site/redirectUri/salesforce/salesforce-redirect.component';
import {AweberRedirectComponent} from './../../site/redirectUri/aweber/aweber-redirect.component';
import {SlackRedirectComponent} from './../../site/redirectUri/slack/slack-redirect.component';
import {FacebookChatbotRedirectComponent} from './../../site/redirectUri/facebookChatbot/facebookChatbot-redirect.component';
import {IntercomRedirectComponent} from './../../site/redirectUri/intercom/intercom-redirect.component';
import { FbRedirectComponent } from '../../site/redirectUri/fb-redirect/fb-redirect.component';
import { InfusionsoftRedirectComponent } from './../../site/redirectUri/infusionsoft-redirect/infusionsoft-redirect.component';
import { ConstantcontactRedirectComponent } from './../../site/redirectUri/constantcontact-redirect/constantcontact-redirect.component';
import {IntegrationEmailSubscription} from '../../site/redirectUri/integrationsubscription/integrationEmail.component';
export const SITE_ROUTES: Routes = [

  {
    path: '',
    component: SiteComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        canActivate: [LoginGuard]
      },
      {
        path: 'verify/:token',
        component: VerifyUserComponent
      },
      {
        path: 'verifyEmail/:token',
        component: VerifyEmailComponent
      },
      {
        path: 'authorize/salesforce',
        component: SalesforceRedirectComponent
      },
      {
        path: 'authorize/slack',
        component: SlackRedirectComponent
      },
      {
        path: 'authorize/aweber',
        component: AweberRedirectComponent
      },
      {
        path: 'authorize/chatbot',
        component: FacebookChatbotRedirectComponent
      },
      {
        path:'authorize/intercom',
        component:IntercomRedirectComponent
      },
      {
        path:'authorize/infusionsoft',
        component:InfusionsoftRedirectComponent
      },
      {
        path:'authorize/constantcontact',
        component:ConstantcontactRedirectComponent
      },
      {
        path:'integration/leadSubscription',
        component:IntegrationEmailSubscription

      },
      {
        path: 'setNewPassword',
        component: SetPasswordComponent,
        canActivate: [SetupNewPasswordGuard]
      },
      {
        path: 'setNewPassword/forgetPassword',
        component: SetPasswordComponent,
        canActivate: [SetupNewPasswordGuard]
      },
      {
        path: 'userApproval',
        component: UserApprovalComponent
      },
      // {
      //   path:'company-profile',
      //   component: CompanyProfileComponent,
      //   canActivate:[CompanyProfileRouteGuard]
      // },
      {
        path: 'forgetPassword',
        component: ForgetPasswordComponent
      },
      {
        path: 'referralCandy',
        component: ReferralCandyComponent
      },
      {
        path: 'authorize/instant_articles',
        component: FbRedirectComponent
      },
      {
        path:'demo-builder/auth-redirect',
        component:AuthRedirectComponent
      }
    ]
  },
  {
    path: 'analytics',
    loadChildren: 'app/site/components/+analytics/analytics.module#AnalyticsModule',
    canActivate: [FreemiumGuard, AuthGuard, AnalyticsGuard]
  },
  {
    path: 'templates',
    loadChildren: 'app/site/components/+templates/templates.module#TemplatesModule'
  },
  {
    path: 'login/:email',
    component: LoginComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'login/:verifyDeal',
    component: LoginComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'logout',
    component: LogoutComponent
  },
  {
    path: 'dashboard',
    loadChildren: 'app/site/components/+dashboard/dashboard.module#DashboardModule',
    canActivate: [AuthGuard, FreemiumGuard]
  },
  {
    path: 'settings',
    loadChildren: 'app/site/+Settings/settings.module#SettingsModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'appsumo',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'jvzoo',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'paykickstart',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'dealfuel',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'affiliates',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'appsumo_black',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'webmaster',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'ltd',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'signup',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'signup-1',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'signup-2',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'cybermonday',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'builder',
    loadChildren: 'app/site/+builder/builder.module#BuilderModule',
    canActivate: [AuthGuard, FreemiumGuard]
  },
  {
    path: 'builder-demo',
    loadChildren: 'app/site/+builder/builder.module#BuilderModule',
  },
  {
    path: 'preview',
    loadChildren: 'app/site/templates/templateAll/preview.module#PreviewModule',
    canActivate: [AuthGuard, FreemiumGuard]
  },
  {
    path: 'preview-demo',
    loadChildren: 'app/site/templates/templateAll/preview.module#PreviewModule',
  },
  {
    path: 'samplecode',
    loadChildren: 'app/site/templates/templateAll/sampleCode.module#SampleCodeModule',
    canActivate: [AuthGuard, FreemiumGuard]
  },
  {
    path: 'Error',
    component: NotFoundComponent
  },
];
export const AUTH_PROVIDERS = [
  AuthGuard, LoginGuard, HomeRouteGuard,
  SubdomainGuard, CompanyProfileRouteGuard,
  AnalyticsGuard,
  FreemiumGuard, SetupNewPasswordGuard
];
