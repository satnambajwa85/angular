import { EcomModule } from './../components/+ecomProducts/ecom.module';
import { OpinionEmailComponent } from './components/config/config_components/opinion-email/opinion-email.component';
import { directiveModule } from './../templates/components/directive.module';
import { FroalaService } from './services/froala.service';
import { NgModule } from '@angular/core';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import { SharedModule } from '../../shared/modules/shared.module';
import { BuilderParentComponent } from './builderParent.component';
import { RouterModule } from '@angular/router';
import { BuilderComponent } from './builder.component';
import { ControlsModule } from '../templates/controls/controls.module';
import { FormulaPopComponent } from './formula/formula_pop.component';
import { DashboardService } from '../../shared/services/dashboard.service';
import { JSONItemTracker } from './services/JSONUpdateItemTracker.service';
import { DefaultJSON } from '../templates/services/DefaultJSON.service';
import { AnalyticService } from '../templates/services/analytic.service';
import { BuilderService } from './services/builder.service';
import { ShareOutcomeService } from './services/shareOutcome.service';
import { JSONElement } from './services/JSONElement.service';
import { JSONBuilder } from './services/JSONBuilder.service';
import { TemplateSwitching } from './services/templateSwitching.service';
import { FormulaService } from './services/formula.service';
import { UrlShortner } from './services/UrlShortner.service';
import { CalcAnalyticsManagerComponent } from './components/calc_analytics_manager/calc_analytics_manager.component';
import { CalcAnalyticsComponent } from './components/calc_analytics/calc_analytics.component';
import { ConfigComponent } from './components/config/config.component';
import { ComponentConfigManagerComponent } from './components/component_config_manager/component_config_manager.component';
import { ComponentManagerComponent } from './components/component_manager/component_manager.component';
import { Switch } from './components/switch.component';
import { ToolbarModule } from './../components/toolbar/toolbar.module';
import { IntegrationModule } from './components/config/config_components/integrations/integration.module';
import { ConfigLaunchPopupComponent } from './components/config/config_components/launch_popup/launch_popup.component';
import { ConfigSettingsComponent } from './components/config/config_components/settings/settings.component';
import { ConfigShareCalculatorComponent } from './components/config/config_components/share_calculator/share_calculator.component';
import { ConfigEmailComponent } from './components/config/config_components/email/email.component';
import { ConfigEmbeddedCodeComponent } from './components/config/config_components/embedded_code/embedded_code.component';
// import { ConfigIntegrationsComponent } from './components/config/config_components/integrations/integrations.component';
import { TrafficDetailsComponent } from '../components/+analytics/components/traffic_details/traffic_details.component';
import { UserDetailsComponent } from '../components/+analytics/components/user_details/user_details.component';
import { OverviewComponent } from '../components/+analytics/components/overview/overview.component';
import { CalculatorAnalytics } from '../components/+analytics/services/calculator-analytics.service';
import { UserDetailsPopupComponent } from '../components/+analytics/components/user_details_popup/user_details_popup.component';
import { TemplateModule } from '../templates/templateAll/template.module';
import { EditorModule } from './components/editors/editor.module';
import { PipesModule } from '../templates/pipes/pipes.module';
//child routes for module
import { BUILDER_ROUTES } from '../../config/routes/builder.routes';
import { AnalyticsModule } from '../components/+analytics/analytics.module';
import { RecommendationService } from '../templates/services/recommendation.service';
import { AnalyticsChildModule } from '../components/+analytics/analyticsChild.module';
import { VideoModalModule } from '../../shared/videoPopup/videoPopup.module';
import { PaymentModalModule } from '../../shared/paymentModal/paymentModal.module';
/*import {cardPlanModalComponent} from './../../shared/cardPlanModal/cardPlanModal.component';*/
import { ThemingService } from '../templates/services/theming.service';
import { ConditionalResultService } from './services/conditionalResult.service';
import { GraphPopComponent } from './popups/graph_pop/graph_pop.component';
import { AppConditionService } from './services/AppCondition.service';
import { ComponentService } from './services/component.service';
import { LogicJumpComponent } from './logic_jump/logic_Jump.component';
import { TablePopComponent } from './popups/table_pop/table_pop.component';
import { CustomJSCodeComponent } from './components/config/config_components/custom-js-code/custom-js-code.component';
import { CustomCSSCodeComponent } from './components/config/config_components/custom-css-code/custom-css-code.component';
import { WebhookService } from "../../shared/services/webhook.service";
// import {PrettyPrintJsonPipe} from "../../shared/pipes/json.pipe";
import { PromotionChecklistComponent } from './components/config/config_components/promotion-checklist/promotion-checklist.component';
import { PromotionChecklistService } from './../../shared/services/promotion-checklist.service';
import { InstantArticlesComponent } from './components/config/config_components/instant-articles/instant-articles.component';
import { SignupBeforeDemoBuilderComponent } from './components/signup-before-demo-builder/signup-before-demo-builder.component';
import { BuilderSignupComponent } from './components/builder-signup/builder-signup.component';
import { UndoRedo } from './services/undoRedoBuilder.service';
import { BuilderErrorHandleModule, BuilderErrorHandleService } from './../../shared/services/builderErrorHandle.service';

@NgModule({
  imports: [
    FroalaEditorModule.forRoot(), FroalaViewModule.forRoot(),
    SharedModule, AnalyticsChildModule, RouterModule.forChild(BUILDER_ROUTES), ControlsModule,
    TemplateModule, ToolbarModule, EditorModule, PipesModule, VideoModalModule, IntegrationModule,
    PaymentModalModule, BuilderErrorHandleModule, directiveModule, EcomModule],
  declarations: [
    // Core builder components
    BuilderParentComponent, BuilderComponent, FormulaPopComponent,
    ComponentManagerComponent, GraphPopComponent, LogicJumpComponent, TablePopComponent,
    // Configure Section in builder.
    ComponentConfigManagerComponent, ConfigComponent, PromotionChecklistComponent,
    ConfigShareCalculatorComponent, ConfigSettingsComponent, ConfigLaunchPopupComponent,
    ConfigEmbeddedCodeComponent, ConfigEmailComponent, OpinionEmailComponent,

    // All the analytics component.

    CalcAnalyticsManagerComponent, CalcAnalyticsComponent, CustomJSCodeComponent, CustomCSSCodeComponent, InstantArticlesComponent, SignupBeforeDemoBuilderComponent, BuilderSignupComponent,
  ],
  providers: [
    CalculatorAnalytics, FormulaService, JSONBuilder, TemplateSwitching, JSONElement,
    ShareOutcomeService, ConditionalResultService, BuilderService, AnalyticService,
    DefaultJSON, JSONItemTracker, DashboardService, UrlShortner, RecommendationService,
    ThemingService, AppConditionService, ComponentService, PromotionChecklistService, FroalaService, BuilderErrorHandleService, UndoRedo
  ],
  entryComponents: [BuilderSignupComponent]
})
export class BuilderModule { }
