import {SendlaneComponent} from './sendlane/sendlane.component';
import {Component, OnInit, ViewChild, ViewEncapsulation} from "@angular/core";
import {FormBuilder} from "@angular/forms";
import {JSONBuilder} from "../../../../services/JSONBuilder.service";
import {IntegrationService} from "./../../../../../../shared/services/integration.service";
import {Integrations} from "./../../../../../../shared/models/integrations";
import {Script} from "../../../../../../shared/services/script.service";
import {CookieService} from "./../../../../../../shared/services/cookie.service";
import {SubDomainService} from "./../../../../../../shared/services/subdomain.service";
import {FeatureAuthService} from "./../../../../../../shared/services/feature-access.service";
import {CompanyService} from "../../../../../../shared/services/company.service";
import {MailchimpComponent} from "./mailchimp/mailchimp.component";
import {GetResponseComponent} from "./getresponse/getresponse.component";
import {ActiveCampaignComponent} from "./activeCampaign/activeCampaign.component";
import {AweberComponent} from "./aweber/aweber.component";
import {SalesforceComponent} from "./salesforce/salesforce.component";
import {HubspotComponent} from "./hubspot/hubspot.component";
import {MarketoComponent} from "./marketo/marketo.component";
import {EmmaComponent} from "./emma/emma.component";
import {DripComponent} from "./drip/drip.component";
import {PardotComponent} from "./pardot/pardot.component";
import {SlackComponent} from "./slack/slack.component";
import {Datatable} from "../../../../../../shared/interfaces/datatable.interface";
import {FacebookChatbotComponent} from './facebookChatbot/facebookChatbot.component';
import {CustomvariableComponent} from './customvariable/customvariable.component';
import {CampaignMonitorComponent} from './campaignmonitor/campaignmonitor.component';
import {IntercomComponent} from './intercom/intercom.component';
import {UnbounceComponent} from './unbounce/unbounce.component';
import {ListrakComponent} from "./listrak/listrak.component";
import {ZohoComponent} from "./zoho/zoho.component";
import { MailerliteComponent } from './mailerlite/mailerlite.component';
import { ConvertkitComponent } from './convertkit/convertkit.component';
import { AutopilotComponent } from './autopilot/autopilot.component';
import { InfusionsoftComponent } from './infusionsoft/infusionsoft.component';
import { ConstantcontactComponent } from './constantcontact/constantcontact.component';
import {SendgridComponent} from './sendgrid/sendgrid.component';

declare var jQuery: any;
declare var window: any;
declare var Clipboard: any;
declare var moment: any;
declare var bootbox: any;

@Component({
  selector: 'config-integrations',
  templateUrl: './assets/html/integrations.template.html',
  styleUrls: ['./../../assets/css/component_config.style.css', './../../../../../../../assets/css/sahil-hover.css', './../../assets/css/selectize.default.css'],
  encapsulation: ViewEncapsulation.None,
})

export class ConfigIntegrationsComponent extends Datatable implements OnInit {

  @ViewChild(MailchimpComponent) mailchimp: MailchimpComponent;
  @ViewChild(GetResponseComponent) getresponse: GetResponseComponent;
  @ViewChild(ActiveCampaignComponent) active_campaign: ActiveCampaignComponent;
  @ViewChild(AweberComponent) aweber: AweberComponent;
  @ViewChild(HubspotComponent) hubspot: HubspotComponent;
  @ViewChild(SalesforceComponent) salesforce: SalesforceComponent;
  @ViewChild(MarketoComponent) marketo: MarketoComponent;
  @ViewChild(EmmaComponent) emma: EmmaComponent;
  @ViewChild(DripComponent) drip: DripComponent;
  @ViewChild(PardotComponent) pardot: PardotComponent;
  @ViewChild(SlackComponent) slack: SlackComponent;
  @ViewChild(CampaignMonitorComponent) campaignmonitor: CampaignMonitorComponent;
  @ViewChild(SendlaneComponent) sendlane: SendlaneComponent;
  @ViewChild(IntercomComponent) intercom: IntercomComponent;
  @ViewChild(UnbounceComponent) unbounce: UnbounceComponent;
  @ViewChild(ListrakComponent) listrak: ListrakComponent;
  @ViewChild(ZohoComponent) zoho: ZohoComponent;
  @ViewChild(MailerliteComponent) mailerlite: MailerliteComponent;
  @ViewChild(ConvertkitComponent) convertkit: ConvertkitComponent;
  // @ViewChild(SendgridComponent) sendgrid: SendgridComponent;
  // @ViewChild(AutopilotComponent) autopilot: AutopilotComponent;
  // @ViewChild(InfusionsoftComponent) infusionsoft: InfusionsoftComponent;
  // @ViewChild(ConstantcontactComponent) constantcontact: ConstantcontactComponent;



  integrations: string[] = ['salesforce', 'marketo', 'aweber', 'mailchimp','mailerlite', 'hubspot', 'active_campaign', 'drip',
    'emma', 'getresponse', 'pardot', 'slack', 'campaignmonitor', 'intercom', 'sendlane', 'unbounce',
    'listrak','zoho','convertkit'];

    // 'listrak','zoho','convertkit','autopilot','infusionsoft','constantcontact','sendgrid'];

  syncStatus: String;
  currentIntegration: String;
  taskListData: any;
  tasksLeadStatus: any;
  selectedTask: any;
  loader: boolean = true;
  isAppsumoLimited: boolean = false;
  isAppsumoUser: boolean = false;
  isFreeLancerUser: boolean = false;
  isEssentialUser: boolean = false;
  companyApi: string;
  planText: string = '';
  company: any;
  currentCompany: any;
  scriptLoaded: boolean = false;
  keysGetter = Object.keys;
  loading: boolean = false;
  dateFilter: any;
  syncDisable:boolean = false;
  isWebhookAvailable: Boolean = false;
  constructor(private _integrationService: IntegrationService,
              public jsonBuilderHelper: JSONBuilder,
              private _script: Script,
              private fb: FormBuilder,
              private _cookieService: CookieService,
              private _subdomainService: SubDomainService,
              public _featureAuthService: FeatureAuthService,
              private _companyService: CompanyService) {
    super();
    this.company = this._subdomainService.subDomain.company_id;
    this.currentCompany = this._subdomainService.currentCompany;
    // this._script.load('form-steps').then((loaded) => {
    //   console.log('script loaded', loaded);
    // });
  }

  ngOnInit() {
    this.initTaskListFilter();
    this.getConfiguration();
    this.getCalcIntegrations();
    this.getSyncLead();
    this.isWebhookAvailable = this._featureAuthService.features.integrations['webhook'];
    this._script.runScript('zapierIntegration')
      .then((data) => {
        if (data[0].loaded) this.loader = false;
      })
      .catch((error) => {
      });

    this._script.load('daterangepicker', 'datatables', 'selectize')
      .then((data) => {
        this.scriptLoaded = true;
      })
      .catch((error) => {
        //any error
      });

    this.companyApi = this.currentCompany.api;
    if (this.companyApi === null) {
      this.generateApiKey(this.currentCompany.id);
    }
    if (this.currentCompany.is_appsumo_created === true && this.currentCompany.billing.chargebee_plan_id === 'appsumo_d') {
      this.isAppsumoUser = true;
    }
    else if (this.currentCompany.billing.chargebee_plan_id.split('_')[0] === 'freelancer') {
      this.isFreeLancerUser = true;
    }
    else if (this.currentCompany.billing.chargebee_plan_id.split('_')[0] === 'essentials') {
      this.isEssentialUser = true;
    }
    if (this.isAppsumoUser || this.isEssentialUser || this.isFreeLancerUser) {
      this.appSumoFeatureAccess();
    }
    this.switchTab();
    console.log(this._featureAuthService.features.integrations.zapier_limited,this._featureAuthService.features.integrations.zapier_loaded,">>>>>");
  }

  getConfiguration() {
    this._integrationService.getConfiguration()
      .subscribe((result) => {
        console.log(result);
        let self = this;
        this.integrations.forEach((integration) => {
          if (result[integration]) {
            self[integration].isConfigured = result[integration];
          }
          if(result[integration + '_config']) {
            self[integration].configuration = new Integrations(result[integration + '_config']);
          }
        });
      });
  }

  getCalcIntegrations() {
    this._integrationService.getCalcIntegrations(this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        let self = this;
        this.integrations.forEach((integration) => {
          if (result[integration]) {
            self[integration].config = result[integration];
          }
        });
      }, (error) => {
        console.log(error);
      });
  }

  childListener(event) {
    switch (event.action) {
      case "connect":
        this.getConfiguration();
        break;
      case "activate":
        this.getCalcIntegrations();
        break;
      case "synLeads":
        this.getSyncLead();
        break;
      case "taskList":
        this.currentIntegration = event.type;
        this.initTaskListFilter();
        this.getTasksList();
        break;
    }
  }

  getSyncLead() {
    this._integrationService.getCalcSyncLeads(this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        let self = this;

        this.integrations.forEach((integration,index) => {

          if (result[integration] > 0) {
          ​self[integration].pendingLeads = result[integration] + (result[integration] === 1 ? ' item' : ' items');
            self[integration].isLeadsPending = true;
          } else {
            self[integration].isLeadsPending = false;
          }
        });

      }, (error) => {
        console.log(error);
      });
  }

  getTasksList() {
    if(this.currentCompany.GDPR){
      if(this.currentIntegration=='marketo'|| this.currentIntegration=='hubspot'){
        this.syncDisable = true;
      }
    }
    this.loading = true;
    this._integrationService.getTasksList(this.getTasksListParams()).subscribe(data => {
      this.searchData();
      this.total_pages = Math.ceil(data.count / this.current_limit);
      this.taskListData = data.tasks;
      this.taskListData.forEach(value => {
        value['date'] = moment(value.updatedAt).format('YYYY/MM/DD');
        value['time'] = moment(value.updatedAt).format('h:mm:ss a');
      });
      this.loading = false;
    }, err => {
      this.loading = false;
    });

    this._integrationService.getTasksLeadStatus({
      integration: this.currentIntegration,
      app_id: this.jsonBuilderHelper.getJSONBuilt()._id
    }).subscribe(data => {
      this.tasksLeadStatus = data;
    });
  }

  getTasksListParams(): any {
    return {
      integration: this.currentIntegration,
      app_id: this.jsonBuilderHelper.getJSONBuilt()._id,
      sync_status: this.syncStatus,
      date_filter: this.dateFilter,
      limit: this.current_limit,
      page: this.current_page - 1
    }
  }

  syncTask(task: any) {
    task.loading = true;
    this._integrationService.syncLeadByLogId(this.currentIntegration
      , this.jsonBuilderHelper.getJSONBuilt()._id, task._id).subscribe(data => {
      task.loading = false;
      if (data.success) {
        this.getTasksList();
        window.toastNotification('Data has been synced with ' + this.currentIntegration);
      } else {
        this.getTasksList();
        jQuery('#syncError-modal').modal('show');
      }
    });
  }

  appSumoFeatureAccess() {
    let integrations_type: any = ['salesforce', 'marketo', 'mailchimp', 'aweber', 'get_response', 'active_campaign', 'hubspot', 'pardot', 'drip', 'emma', 'campaignmonitor', 'intercom', 'chatbot'];

    for (let i = 0; i < integrations_type.length; i++) {
      let isIntegrationLimited: boolean = this._featureAuthService.features.integrations[integrations_type[i] + '_limited'];
      let isIntegrationFull: boolean = this._featureAuthService.features.integrations[integrations_type[i]];
      if (isIntegrationLimited || isIntegrationFull) {
        this.isAppsumoLimited = true;
        break;
      } else if (!isIntegrationFull && !isIntegrationLimited) {
        this.isAppsumoLimited = false;
      }
    }
  }

  generateApiKey(compId) {
    let self = this;
    let generateApiKey = self._companyService.generateApiKey(compId)
      .subscribe(
        (success: any) => {
          this.companyApi = success.api;
        },
        (error: any) => {
          generateApiKey.unsubscribe();
        }
      );
  }

  copyApi() {
    // clipboard.copy(jQuery('#zapier-key').text());
    new Clipboard('.btn-copy', {
      text: function(trigger) {
          return jQuery('#zapier-key').text();
      }
    });
    window.toastNotification('API Key Copied');
  }

  switchTab() {
    let self = this;
    jQuery(".email-tabs li").on("click", function () {
      jQuery('#task').addClass('hide');
      jQuery('#integration-main').removeClass('hide');
      jQuery(this).addClass('active').siblings(".email-tabs li").removeClass('active');
      if (jQuery(this).hasClass('zapier')) {
        jQuery('.tab-zapier').removeClass('hide').siblings('.integration-tab').addClass('hide');
      } else if (jQuery(this).hasClass('webhook')) {
        if(self.isWebhookAvailable) {
          jQuery('.tab-webhook').removeClass('hide').siblings('.integration-tab').addClass('hide');
        } else {
          jQuery('div:not(#premiumModal)').modal('hide');
          self._featureAuthService.setSelectedFeature('integrations', 'webhook');
          jQuery('.integrations').addClass('activegreen limited-label');
          jQuery('#premiumModal').modal('show');
          jQuery('.modal-backdrop').insertAfter('#premiumModal');
        }
      } else if (jQuery(this).hasClass('customvarriable')) {
        jQuery('.tab-CustomVarriable').removeClass('hide').siblings('.integration-tab').addClass('hide');
      } else if (jQuery(this).hasClass('messageApp')) {
        jQuery('.tab-messageApp').removeClass('hide').siblings('.integration-tab').addClass('hide');

      }
      else {
        jQuery('.tab-content-one').removeClass('hide').siblings('.integration-tab').addClass('hide');
      }
    });
  }

  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, '');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }

  checkFeatureAccess(type: string) {
    let self = this;
    let available: boolean = this._featureAuthService.features.integrations[type];
    if (!available) {
      jQuery('div:not(#premiumModal)').modal('hide');
      self._featureAuthService.setSelectedFeature('integrations', type);
      jQuery('.integrations').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('#analyticsRef').attr('active', false);
    }
  }

  goBack() {
    jQuery('#integration-main').removeClass('hide');
    jQuery('#task').addClass('hide');
  }

  onDateSelect(date: any) {
    this.dateFilter.start_date = date.start_date;
    this.dateFilter.end_date = date.end_date;
    this.getTasksList();
  }

  initTaskListFilter() {
    this.dateFilter = {
      start_date: moment('1970-01-01').format('YYYY-MM-DD'),
      end_date: moment().add(1, 'day').format('YYYY-MM-DD')
    };
    this.syncStatus = 'all';
  }

  paging(num: number) {
    super.paging(num);
    this.getTasksList();
  }

  limitChange(event: any) {
    super.limitChange(event);
    this.getTasksList();
  }

  previous() {
    super.previous();
    this.getTasksList()
  }

  next() {
    super.next();
    this.getTasksList();
  }

}
