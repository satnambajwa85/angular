import { Component, EventEmitter, OnInit, Output, AfterViewInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { JSONBuilder } from "../../../../../services/JSONBuilder.service";
import { Integrations } from "./../../../../../../../shared/models/integrations";
import { IntegrationService } from "./../../../../../../../shared/services/integration.service";
import { CookieService } from "./../../../../../../../shared/services/cookie.service";
import { Script } from "./../../../../../../../shared/services/script.service";
import { FeatureAuthService } from "../../../../../../../shared/services/feature-access.service";
import { SubDomainService } from "../../../../../../../shared/services/subdomain.service";

declare var jQuery;
declare var window: any;

@Component({
  selector: 'og-salesforce-component',
  templateUrl: './salesforce.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})

export class SalesforceComponent implements OnInit, AfterViewInit {
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[] } = { active: false, map_fields: [] };
  pendingLeads: any;
  isLeadsPending: boolean = false;
  isListSelected: boolean = false;
  list: String = '';
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
  isLeadGenError: Boolean = false;
  isDoubleOptin: Boolean = false;
  accounts: any = [];
  isAccountSelected: boolean = false;
  isConnected :Boolean = false;
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
  ngAfterViewInit() {
    let calc_type = this.jsonBuilderHelper.getJSONBuilt().templateType;
    if (calc_type === 'Numerical') {
      this.calcType = 'Calculator';
    } else if (calc_type === 'Recommendation') {
      this.calcType = 'Quiz';
    } else if (calc_type === 'Poll') {
      this.calcType = 'Poll';
    } else {
      this.calcType = 'Graded Quiz'
    }
  }
  openAuthModal() {
    this.isAccountSelected = true;
    if (!this._featureAuthService.features.integrations['salesforce'] && !this._featureAuthService.features.integrations['salesforce_limited']) {
      return;
    }
    //jQuery('#salesforce-auth').modal('show');
    jQuery('#salesforce-new').modal('show');
  }

  connect() {
    if (!this._featureAuthService.features.integrations['salesforce'] && !this._featureAuthService.features.integrations['salesforce_limited']) {
      return;
    }
    jQuery('#salesforce-new').modal('hide');
    let data = {};
    this._integrationService.getLink(data, 'salesforce')
      .subscribe((response) => {
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
            self.activate(true);
            //self.getFields();
            window.toastNotification('You have successfully integrated with Salesforce');
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
    jQuery('select option[value="0"]').attr("selected", true);
    // let interval = setInterval(function(){
    //     jQuery('.listName').selectize();
    //     clearInterval(interval);
    // }, 100);
    jQuery('#salesforce-new').modal('show');
    this.isListSelected = false;
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.isMapped = false;
    this.isConfigured = true;
    this.isAccountSelected = true;
  }

  test() {
    jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
    this.isTokenExpired = false;
    let data = {
      'map_fields': this.insertFields,
      'sobject': this.list,
    }
    if (data.map_fields.length > 0) {
      this._integrationService.testSaveLead('salesforce', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response.status.success) {
            if (response.status.item_skipped >= 1) {
              this.isMapError = true;
              this.mapError = response.status;
              jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            } else {
              this.sendMapFields();
              this.isMapped = true;
              this.ViewMappedData(response.dataSent);
              this.updateIntegrationStatus(true);
              window.toastNotification('Connection Test Successful');
            }
          } else {
            this.isMapError = true;
            let errorCode = response.status.code;
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            if (response.status.fields) {
              let inValidField = response.status.fields[0];
              if (inValidField) {
                this.mapError = 'Invalid value for field ' + inValidField;
              } else {
                this.mapError = 'Error in one or more of your mappings. Please map fields again.';
              }
            }
          }
        }, (error) => {
          this.isMapError = true;
          this.mapError = error.error.err_message;
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      jQuery('.btn-test').html('Test Connection').attr('disabled', false);
      this.isMapError = true;
      this.mapError = 'Company & Last Name are required for Salesforce';
    }
  }

  saveList() {
    console.log(this.list, 'list >>>>>>>>>>>>>>>');
    if (this.list !== "") {
      this.isListSelected = true;
      this.getFields();
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'salesforce': checked
    };
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to Salesforce';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Salesforce';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['salesforce_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['salesforce'];
    if (isIntegrationLimited && !isIntegrationFull) {
      this.isLimited = true;
      this.getBasicMapFields();
    } else {
      this.getFullMapFields();
    }
  }

  getBasicMapFields() {
    this.isLoading = true;
    this.isMapError = false;
    let data = { listName: this.list };
    this._integrationService.getCalcBasicFields('salesforce', this.jsonBuilderHelper.getJSONBuilt()._id, data)
      .subscribe((result) => {
        this.isLoading = false;
        let calcfiedls = result.calc;
        let crmfields = result.crm;
        this.calcAllFileds = [];
        this.crmAllFileds = [];
        for (let key in calcfiedls) {
          if (calcfiedls.hasOwnProperty(key)) {
            let obj = {};
            obj['calc_name'] = calcfiedls[key].name;
            obj['calc_key'] = calcfiedls[key].api_key;
            obj['calc_value'] = 'Sample : ' + calcfiedls[key].value;
            this.calcAllFileds.push(obj);
          }
        }
        for (let key in crmfields) {
          if (crmfields.hasOwnProperty(key) && crmfields[key].api_key !== 'Name') {
            let obj = {};
            obj['crm_name'] = crmfields[key].name;
            obj['crm_key'] = crmfields[key].api_key;
            let selectedMapFields = this.config.map_fields;
            let mpFiledLength = selectedMapFields.length;
            for (let i = 0; i < mpFiledLength; i++) {
              if (crmfields[key].api_key === selectedMapFields[i].crm) {
                obj['calc_key'] = selectedMapFields[i].calc;
                let insertObj = {};
                insertObj['calc'] = selectedMapFields[i].calc;
                insertObj['crm'] = crmfields[key].api_key;
                this.insertFields.push(insertObj);
                break;
              } else {
                obj['calc_key'] = '';
              }
            }
            this.crmAllFileds.push(obj);
          }
        }
      }, (error) => {
        this.isLoading = false;
        if (error.error.err_message === 'Invalid_grant: expired access/refresh token') {
          this.isTokenExpired = true;
          this.isMapError = true;
          this.mapError = 'Configuration error. Seems like your access token has expired. Please';
        } else if (error.error.err_message === 'The REST API is not enabled for this Organization.') {
          this.isTokenExpired = true;
          this.isMapError = true;
          this.mapError = 'REST API not enabled for your Aweber account. You require Enterprise edition of Aweber for Integration. Please';
        } else if (error.error.err_message === "Cannot read property 'fields' of undefined") {
          this.isLeadGenError = true;
          this.mapError = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
        } else {
          this.isMapError = true;
          this.mapError = error.error.err_message;
        }
      });
  }

  getFullMapFields() {
    console.log(this.isConfigured, '=======================', this.isMapped);

    this.isLoading = true;
    this.isMapError = false;
    let data = { listName: this.list };
    this._integrationService.getCalcMapFields('salesforce', this.jsonBuilderHelper.getJSONBuilt()._id, data)
      .subscribe((result) => {
        this.isLoading = false;
        let calcfiedls = result.calc;
        let crmfields = result.crm;
        this.calcAllFileds = [];
        this.crmAllFileds = [];
        for (let key in calcfiedls) {
          if (calcfiedls.hasOwnProperty(key)) {
            let obj = {};
            obj['calc_name'] = calcfiedls[key].name;
            obj['calc_key'] = calcfiedls[key].api_key;
            obj['calc_value'] = 'Sample : ' + calcfiedls[key].value;
            this.calcAllFileds.push(obj);
          }
        }
        for (let key in crmfields) {
          if (crmfields.hasOwnProperty(key) && crmfields[key].api_key !== 'Name') {
            let obj = {};
            obj['crm_name'] = crmfields[key].name;
            obj['crm_key'] = crmfields[key].api_key;
            //let selectedMapFields = this.mapFields;
            let selectedMapFields = this.config.map_fields;
            let mpFiledLength = selectedMapFields.length;
            for (let i = 0; i < mpFiledLength; i++) {
              if (crmfields[key].api_key === selectedMapFields[i].crm) {
                obj['calc_key'] = selectedMapFields[i].calc;
                let insertObj = {};
                insertObj['calc'] = selectedMapFields[i].calc;
                insertObj['crm'] = crmfields[key].api_key;
                this.insertFields.push(insertObj);
                break;
              } else {
                obj['calc_key'] = '';
              }
            }
            this.crmAllFileds.push(obj);
          }
        }
      }, (error) => {
        this.isLoading = false;
        if (error.error.err_message === 'invalid_grant: expired access/refresh token') {
          this.isTokenExpired = true;
          this.isMapError = true;
          this.mapError = 'Configuration error. Seems like your access token has expired. Please';
        } else if (error.error.err_message === "Cannot read property 'fields' of undefined") {
          this.isLeadGenError = true;
          this.mapError = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
        } else {
          this.isMapError = true;
          this.mapError = error.error.err_message;
        }
      });
  }


  // initializeSelectize() {
  //     let calcfiedls :any = this.calcAllFileds;
  //     let self= this;
  //     for (let key in calcfiedls) {
  //             let interval = setInterval(function(){
  //                 self.isMapError = false;
  //                 //jQuery('#'+calcfiedls[key].calc_key).selectize();
  //                 jQuery('#'+calcfiedls[key].calc_key).selectize({
  //                   onChange: function(value) {
  //                     self.selectedMapFields(calcfiedls[key].calc_key, value); // for selctize
  //                   }
  //                 });
  //                 clearInterval(interval);
  //                 self.isLoading = false;
  //            }, 100);
  //     }

  // }
  checkExistingField() {
    let tmp = [];
    for (let i in this.calcAllFileds) {
      for (let j in this.insertFields) {
        if (this.insertFields[j]['calc'] == this.calcAllFileds[i]['calc_key']) {
          let obj = {};
          obj['calc'] = this.insertFields[j]['calc'];
          obj['crm'] = this.insertFields[j]['crm'];
          tmp.push(obj);
          break;
        }
      }
    }
    this.insertFields = tmp;
  }

  sendMapFields() {
    jQuery('.btn-test').html('PLEASE WAIT').attr('disabled', false);
    let data = {
      'map_fields': this.insertFields,
      'sobject': this.list
    }
    if (this.isLimited) {
      this._integrationService.sendMapFieldsBasic('salesforce', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('salesforce', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    }
  }

  selectedMapFields(calcKey: string, event: any) {
    this.isMapError = false;
    let obj = {};
    // if (calcKey == 'email') {
    //   event.target.value = 'email';
    //   // this.activeCampaignErrorMsg = 'Email Field is required.';
    //   // this.isActiveCampaignError = true;
    //    return;
    //  }

    obj['calc'] = calcKey;
    obj['crm'] = event.target.value;
    obj['name'] = event.target.options[event.target.options.selectedIndex].label;
    let crmObj = this.insertFields.find(x => x.crm === obj['crm']);
    if (!crmObj) {
      let newObj = this.insertFields.find(x => x.calc === calcKey);
      let index = this.insertFields.indexOf(newObj);
      if (index > -1) {
        if (obj['crm'] != 0) this.insertFields.fill(newObj.crm = obj['crm'], index, index++);
        else this.insertFields.splice(index, 1);
      }
      else
        this.insertFields.push(obj);
    }
    else {
      event.target.value = 0;
      this.isMapError = true;
      this.mapError = 'This Crm key ' + obj['name'] + ' already used';
    }
  }

  ViewMappedData(data: any) {
    this.viewMappedData = [];
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        let obj = {};
        obj['key'] = key;
        obj['value'] = data[key];
        this.viewMappedData.push(obj);
      }
    }
  }

  returnFeatureAccess() {
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['salesforce_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['salesforce'];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }
  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'salesforce');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }
  close() {
    //jQuery('#salesforce-auth').modal('hide');
    jQuery('#salesforce-new').modal('hide');
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
  }

  sync() {
    jQuery('.sync-leads-sf').html('Please Wait..');
    this._integrationService.syncCalcLeads('salesforce', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        // if (result.success) {
        //     self.notify.emit({
        //       action:'synLeads'
        //     });
        //     jQuery('.sync-leads-sf').html('Sync');
        //     window.toastNotification('Data has been synced with Salesforce');
        // }
        if (result.status == 1) {
          jQuery('.sync-leads-sf').html('Sync');
          window.toastNotification('Data will be synced with Salesforce shortly');
        }
        else {
          jQuery('.sync-leads-sf').html('Sync (' + this.pendingLeads + ')');
          jQuery('#syncError-modal').modal('show');
        }
      }, (error) => {
        jQuery('.sync-leads-sf').html('Sync (' + this.pendingLeads + ')');
        jQuery('#syncError-modal').modal('show');
      });
  }
  closeMapped() {
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    jQuery('#salesforce').modal('hide');
  }

  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'salesforce'
    });
  }

  back() {
    this.isMapped = false;
    this.isListSelected = true;
    this.isConfigured = true;
    this.getFields();
  }

  selectedList(list_id) {
    jQuery('select option[value="0"]').attr("selected", false);
    let list = jQuery('.listName option:selected').val();
    if (list !== 'Select') {
      this.list = list;
    }
  }

  getAccounts() {
    this.isConnected = false;
    this.isLoading = true;
    this.accounts = [];
    this.isAccountSelected = false;
    this.mapError ='';
    this.isMapError = false;
    jQuery('.after-test').addClass('hide');
    this._integrationService.getAccount('salesforce')
      .subscribe((response: any) => {
        let accounts = response.accounts;
        let cnt: any = 0;
        for (let key in accounts) {
          cnt++;
          if (accounts.hasOwnProperty(key)) {
            let obj = {};
            obj['name'] = accounts[key].account_name ? accounts[key].account_name : 'Account#' + cnt;
            obj['key'] = accounts[key].api_key;
            obj['status'] = accounts[key].active ? accounts[key].active : false;
            obj['refresh_token'] = accounts[key].refresh_token;
            obj['access_token'] = accounts[key].access_token;
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
        
        jQuery('#salesforce-new').modal('show');

      })
  }

  testAccount(deleteId : any,account: any) {
    
    this.isMapError = false;
    let data ={
      token : account
    }
    let companyId: string = <string>this._subdomainService.subDomain.company_id
    this._integrationService.testAccount(data,'salesforce',companyId)
    .subscribe((result) => {
        if(result.success){
          console.log('%%%%%%%%%%%%%%');
          jQuery('#'+deleteId).removeClass('hide');
        }else{
          this.isMapError = true;
          this.mapError = 'Invalid_grant: expired access/refresh token';
        }
    }, (error) => {
        jQuery('#salesforce-error').modal('show');
    });
  }

  editAccount(key) {
    jQuery('#salesforce-new').modal('hide');
    this.connect();
  }

  setAccount(key: any, action: any) {
    this.isMapError = false;
    let data = {
      key: key,
      action: action
    }
    this.activeAccount=key;
    this._integrationService.setAccount(data, 'salesforce')
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
      this.isListSelected = false;
      this.isMapped = false;
      this.getAccounts();
    }

  }

  showList() {
    let isListEnabled= this.accounts.filter(
      account => account.status === true);
    if(isListEnabled.length===0){
      this.isMapError = true ;
      this.mapError = 'Please Select the Account.';
    }else{
      this.isListSelected = false;
      this.isConfigured = true;
      this.isConnected = true;
      this.isAccountSelected = true;
    }
  }

}