import { AuthRedirectComponent } from './../../site/redirectUri/auth-redirect/auth-redirect.component';
import {Routes} from '@angular/router';
import {AuthGuard} from './../../shared/authentication/auth.guard';
import {LoginGuard} from './../../shared/authentication/login.guard';
import {NotFoundComponent} from './../../shared/notfound/notfound.component';
import {LogoutComponent} from './../../shared/logout/logout.component';
import {LoginComponent} from './../../shared/login/index';
import {SetupNewPasswordGuard} from './../../shared/authentication/setupnew-password.guard';
import {
  VerifyUserComponent,
  SetPasswordComponent,
  UserApprovalComponent,
  ForgetPasswordComponent,
  VerifyEmailComponent
} from '../../site/index';
export const SITE_ROUTES: Routes = [

  {
    path: '',
    component: SiteComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        canActivate: [LoginGuard]
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
    path: 'logout',
    component: LogoutComponent
  },
  {
    path: 'dashboard',
    loadChildren: 'app/site/components/+dashboard/dashboard.module#DashboardModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadChildren: 'app/site/+Settings/settings.module#SettingsModule',
    canActivate: [AuthGuard]
  },
  {
    path: 'signup',
    loadChildren: 'app/site/components/+signup/signup.module#SignUpModule',
    canActivate: [LoginGuard]
  },
  {
    path: 'builder',
    loadChildren: 'app/site/+builder/builder.module#BuilderModule',
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
