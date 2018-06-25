import { SendlaneComponent } from './sendlane/sendlane.component';
import { NgModule} from '@angular/core';
import { SharedModule } from './../../../../../../shared/modules/shared.module';
import { IntegrationService } from './../../../../../../shared/services/integration.service';
import { IntegrationsGuard } from './../../../../../../shared/authentication/integrations.guard';
import { MailchimpComponent} from './mailchimp/mailchimp.component';
import { AweberComponent} from './aweber/aweber.component';
import { GetResponseComponent } from './getresponse/getresponse.component';
import {ActiveCampaignComponent} from './activeCampaign/activeCampaign.component';
import { ConfigIntegrationsComponent} from './integrations.component';
import {HubspotComponent} from './hubspot/hubspot.component';
import {MarketoComponent} from './marketo/marketo.component';
import {EmmaComponent} from './emma/emma.component';
import {SalesforceComponent} from './salesforce/salesforce.component';
import {DripComponent} from './drip/drip.component';
import {PardotComponent} from './pardot/pardot.component';
import {SettingsCommunicationService} from '../../../../../../shared/services/settings.communication.service';
import {CompanyService} from '../../../../../../shared/services/company.service';
import {UtilitiesModule} from "../../../../../../shared/modules/utilities.module";
import {SlackComponent} from './slack/slack.component';
import {WebhookComponent} from "./webhook/webhook.component";
import {PrettyPrintJsonPipe} from "../../../../../../shared/pipes/json.pipe";
import {WebhookService} from "../../../../../../shared/services/webhook.service";
import {FacebookChatbotComponent} from './facebookChatbot/facebookChatbot.component';
import { CustomvariableComponent } from './customvariable/customvariable.component';
import {CampaignMonitorComponent} from './campaignmonitor/campaignmonitor.component';
import {IntercomComponent} from './intercom/intercom.component';
import { ListrakComponent } from './listrak/listrak.component';
import {UnbounceComponent} from './unbounce/unbounce.component';
import {ZohoComponent} from './zoho/zoho.component';
import { MailerliteComponent } from './mailerlite/mailerlite.component';
import { ConvertkitComponent } from './convertkit/convertkit.component';
import { AutopilotComponent } from './autopilot/autopilot.component';
import { InfusionsoftComponent } from './infusionsoft/infusionsoft.component';
import { ConstantcontactComponent } from './constantcontact/constantcontact.component';
import {SendgridComponent} from './sendgrid/sendgrid.component';

@NgModule({
  imports: [SharedModule,UtilitiesModule],
  declarations: [
      ConfigIntegrationsComponent,
      MailchimpComponent,
      GetResponseComponent,
      ActiveCampaignComponent,
      AweberComponent,
      HubspotComponent,
      SalesforceComponent,
      MarketoComponent,
      DripComponent,
      PardotComponent,
      EmmaComponent,
      SlackComponent,
      WebhookComponent,
      PrettyPrintJsonPipe,
      CampaignMonitorComponent,
      FacebookChatbotComponent,
      CustomvariableComponent,
      IntercomComponent,
      SendlaneComponent,
      ListrakComponent,
      SendlaneComponent,
      UnbounceComponent,
      ZohoComponent,
      MailerliteComponent,
      ConvertkitComponent,
      AutopilotComponent,
      InfusionsoftComponent,
      ConstantcontactComponent,
      SendgridComponent
  ],
  providers: [
    SettingsCommunicationService,
    CompanyService,
    IntegrationService,
    IntegrationsGuard,
    WebhookService
  ],
  exports: [ConfigIntegrationsComponent]
})
export class IntegrationModule {}
