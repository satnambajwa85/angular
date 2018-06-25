import { RouterModule, Routes }  from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { SITE_ROUTES , AUTH_PROVIDERS} from './site.routes';
import { CALCULATOR_ROUTES } from './calculator.routes';

const routing: Routes = [
  ...SITE_ROUTES,
  // ...ADMIN_ROUTES,
  // ...BUILDER_ROUTES,
  ...CALCULATOR_ROUTES
];
export const routes: ModuleWithProviders = RouterModule.forRoot(routing);

export const APP_ROUTER_PROVIDERS = [
  AUTH_PROVIDERS,
  // LoggedInService,
  // UserService,
  // CompanyService,
  // HTTP_PROVIDERS
];
