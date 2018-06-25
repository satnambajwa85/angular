
import { Component, AfterViewInit, OnInit, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { JSONBuilder } from '../../../../../services/JSONBuilder.service';
import { Integrations } from './../../../../../../../shared/models/integrations';
import { IntegrationService } from './../../../../../../../shared/services/integration.service';
import { CookieService } from './../../../../../../../shared/services/cookie.service';
import { ConfigIntegrationsComponent } from './../integrations.component';
import { Script } from './../../../../../../../shared/services/script.service';
import { FeatureAuthService } from '../../../../../../../shared/services/feature-access.service';
import { SubDomainService } from '../../../../../../../shared/services/subdomain.service';

declare var jQuery;
declare var window: any;
@Component({
  selector: 'og-slack-component',
  templateUrl: './slack.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})
export class SlackComponent implements OnInit  {
  isConfigured: boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[] } = { active: false, map_fields: [] };
  pendingLeads: any;
  isLeadsPending: boolean = false;
  calcType: string;
  calcAllFileds: any = [];
  crmAllFileds: any = [];
  insertFields: any = [];
  mapFields: any = [];
  viewMappedData: any = [];
  mapError: string = '';
  isMapError: boolean = false;
  isLimited: boolean = false;
  isTokenExpired: boolean = false;
  isMapped: boolean = false;
  isLoading: Boolean = false;
  isDoubleOptin:Boolean = false;
  accounts: any = [];
  isConnected:boolean = false;
  isAccountSelected: boolean = false;
  activeAccount:string = '';
  @Output() notify = new EventEmitter();
  constructor(
    public _integrationService: IntegrationService,
    public jsonBuilderHelper: JSONBuilder,
    public _script: Script,
    public fb: FormBuilder,
    public _subdomainService: SubDomainService,
    public _featureAuthService: FeatureAuthService,
    public _cookieService: CookieService) {
  }
  ngOnInit() {
  }
  
  openAuthModal() {
    if (!this._featureAuthService.features.integrations['slack'] && !this._featureAuthService.features.integrations['slack_limited']) {
      return;
    }
    jQuery('#slack-new').modal('show');
  }
  connect() {
    if (!this._featureAuthService.features.integrations['slack'] && !this._featureAuthService.features.integrations['slack_limited']) {
      return;
    }
    
    this.isMapped = false;
    jQuery('#slack-new').modal('hide');
    jQuery('#slack-new').modal('hide');
    let data = {};
    this._integrationService.getLink(data, 'slack')
      .subscribe((response) => {
        console.log(response);
        let companyId: string = <string>this._subdomainService.subDomain.company_id;
        this._cookieService.createCookie('comp', companyId, 3);
        let newWindow = window.open(response, 'GoogleWindow', 'width=600, height=500,scrollbars=yes');
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          jQuery('#popup-block').modal('show');
        }
        let self = this;
        let interval = setInterval(function () {
          let cookie = self._cookieService.readCookie('comp');

          if (cookie === 'success') {
            newWindow.close();
            self.notify.emit({
              action: 'connect'
            });
            self.getFields();
            window.toastNotification('You have successfully integrated with Slack');
            clearInterval(interval);
          } else if (cookie === null) {
            clearInterval(interval);
            newWindow.close();
          }
        }, 5000);
      }, (error) => {
        console.log(error);
      });
  }
  activate(checked: boolean) {
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.isMapped = false;
    this.isConfigured = true;
    jQuery('doubleoptin').addClass('hide');
    this.getFields();
    console.log(this.isMapped);
  }
  test() {
    
    jQuery('#btn-test').html('PLEASE WAIT...').attr('disabled', true);
    // this.isTokenExpired = false;
    // this.isMapped = false;
    //this.isDoubleOptin = true;
    
    //jQuery('#doubleoptin').removeClass('hide');
    let data = this.calcAllFileds[0];
     if (data.length > 0) {
      this._integrationService.testSaveLead('slack', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response.status.success) {
            jQuery('#slack-new').modal('hide');
            //this.isDoubleOptin = true;
            this.updateIntegrationStatus(true);
            window.toastNotification('Connection Test Successful');
             jQuery('.btn-test').html('Test Connection').attr('disabled', false);

          } else {
            console.log(response, '>>>>>>>>>>>>>>>');
            this.isMapError = true;
            this.mapError = "please reconfigure this integration";
            let errorCode = response.status.code;
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);

          }
        }, (error) => {
          console.log(error);
          this.isMapError = true;
          this.mapError = error.error.err_message;
          this.isTokenExpired = true;
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      jQuery('.btn-test').html('Test Connection').attr('disabled', false);
      this.isMapError = true;

    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'slack': checked
    }
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        console.log(result);
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to Slack channel';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Slack channel';
        }
        window.toastNotification(toastText);
        this.close();
      }, (error) => {
        console.log(error);
      });
  }

  getFields() {
    this.isLoading = true;
    this.isMapError = false;
    this.isMapped = true;
    this.isConfigured = true;
   
    jQuery('#slack-new').modal('show');
    this._integrationService.getCalcBasicFields('slack', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.isLoading = false;
        console.log(this.isMapped);
        let obj = {};
        let calcfiedls = result.calc;
        this.calcAllFileds.push(calcfiedls);
      }, (error) => {
        this.isMapError = true;
        this.isLoading = false;
        if(error.error.err_message==="Cannot read property 'fields' of undefined"){
             this.mapError ='Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
          }else{
             this.mapError =  error.error.err_message;
          }
      });
      
  }



  returnFeatureAccess() {
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['slack_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['slack'];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }
  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'slack');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }
  close() {
    console.log('close clicked');
    jQuery('#slack-auth').modal('hide');
    jQuery('#slack').modal('hide');
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    this.isMapped = false;
    this.isLoading = false;
    this.mapError = '';
    this.isMapError = false;


  }
  sync() {
      let self = this;
      jQuery('.sync-leads-sf').html('Please Wait..');
        this._integrationService.syncCalcLeads('slack', this.jsonBuilderHelper.getJSONBuilt()._id)
          .subscribe((result) => {
            // if (result.success) {
            //     self.notify.emit({
            //       action:'synLeads'
            //     });
            //     jQuery('.sync-leads-slack').remove();
            //     window.toastNotification('Data has been synced with Slack');
            // }
            if (result.status == 1) {
              jQuery('.sync-leads-slack').html('Sync');
              window.toastNotification('Data will be synced with Slack shortly');
            }
            else {
                jQuery('.sync-leads-slack').html('Sync (' + this.pendingLeads + ')');
                jQuery('#syncError-modal').modal('show');
            }
          }, (error) => {
              jQuery('.sync-leads-slack').html('Sync (' + this.pendingLeads + ')');
              jQuery('#syncError-modal').modal('show');
        });
   }

  closeMapped() {
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    jQuery('#slack').modal('hide');
  }

  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'slack'
    });
  }
 
  back() {
    this.isMapped = false;
    this.isConnected = true;
    this.getFields();
}
getAccounts() {
    this.isLoading = true;
    this.isConnected = true;
    this.accounts = [];
    this.isAccountSelected = false;
    this._integrationService.getAccount('slack')
        .subscribe((response: any) => {
            let accounts = response.accounts;
            console.log(accounts);
            let cnt: any = 0;
            for (let key in accounts) {
                cnt++;
                if (accounts.hasOwnProperty(key)) {
                    let obj = {};
                    obj['name'] = accounts[key].account_name ? accounts[key].account_name : '#Account ' + cnt;
                    obj['key'] = accounts[key].access_token;
                    obj['status'] = accounts[key].active ? accounts[key].active : false;
                    obj['access_token'] = accounts[key].access_token;
                    obj['instance_url'] = accounts[key].instance_url
                    this.accounts.push(obj);
                    this.isLoading = false;
                }
            }
            this.activeAccount = this.accounts.reduce((acc,account)=>{
              if(account.status){
              return account.key;
              }
              return acc;
              });
              
            jQuery('#slack-new').modal('show');

        })
}

testAccount(id:any,account:any) {
  this.isMapError = false;
  let data ={
    token : account
  }
  let companyId: string = <string>this._subdomainService.subDomain.company_id
  this._integrationService.testAccount(data,'slack',companyId)
  .subscribe((result) => {
      console.log(result);
      if(result.success){
        jQuery('#'+id).removeClass('hide');
      }else{
        this.isMapError = true;
        this.mapError = 'Invalid_grant: expired access/refresh token';
      }
  }, (error) => {
      jQuery('#salesforce-error').modal('show');
  });
}

editAccount(key, name) {
    // this.isAccountSelected = true;
    // this.isConfigured = false;
    // this.isMapped = false;
    this.connect();
}

setAccount(key: any, name: any, action: any) {
    let data = {
        key: key,
        name: name,
        action: action
    }
    this.activeAccount = key;
    this._integrationService.setAccount(data, 'slack')
        .subscribe((response) => {
            if (action === 'edit') {
                window.toastNotification('You have successfully selected the account');
            } if (action === 'delete') {
                window.toastNotification('You have successfully deleted the account');
                this.getAccounts();
                   
            }
        }, (error) => {
        });
}

previous(flag: any) {
    if (flag === 'reconfig') {
        this.isAccountSelected = false;
        this.isConfigured = false;
        this.isMapped = false;
        this.getAccounts();
    }

} 
  

}
