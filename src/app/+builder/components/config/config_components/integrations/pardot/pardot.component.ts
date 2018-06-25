
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
  selector: 'og-pardot-component',
  templateUrl: './pardot.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})

export class PardotComponent implements OnInit, AfterViewInit {
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[] } = { active: false, map_fields: [] };
  pendingLeads: any;
  isLeadsPending: boolean = false;

  form: FormGroup;
  integrations: any = new Integrations({});
  company: any;

  calcType: string;
  calcAllFileds: any = [];
  crmAllFileds: any = [];
  insertFields: any = [];
  mapFields: any = [];
  viewMappedData: any = [];
  isError: boolean = false;
  errorMsg: string;

  isListExist: boolean = false;
  isConnected: Boolean = false;

  mapError: string = '';
  isMapError: boolean = false;
  isLimited: boolean = false;
  isTokenExpired: boolean = false;
  isMapped: boolean = false;
  isLoading: Boolean = false;
  testEmail: string;
  isLeadGenError: Boolean = false;
  activeAccount:string = '';
  @Output() notify = new EventEmitter();
  GDPR: Boolean = false;
  isAccountSelected: Boolean = false;
  accounts: any = [];
  isCheckingTestAccount: Boolean = false;
  constructor(public _integrationService: IntegrationService,
    public jsonBuilderHelper: JSONBuilder,
    public _script: Script,
    public fb: FormBuilder,
    public _subdomainService: SubDomainService,
    public _featureAuthService: FeatureAuthService,
    public _cookieService: CookieService) {
    this.company = this._subdomainService.subDomain.company_id;
    this.GDPR = this._subdomainService.currentCompany.GDPR;
    this.form = this.fb.group({
      email: ['', Validators.compose([Validators.required])],
      password: ['', Validators.compose([Validators.required])],
      user_key: ['', Validators.compose([Validators.required])],
      accountName: ['', Validators.compose([Validators.required])],
    });
  }

  ngOnInit() {
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

  ngAfterViewInit() {
    let options = ['bold', '|', 'italic', '|', 'underline', '|', 'color', '|', 'fontSize', '|', 'insertLink'];

    jQuery('textarea#froala-editorIntegration').froalaEditor({
      toolbarButtons: options,
      shortcutsEnabled: ['bold', 'italic', 'underline'],
      pastePlain: true,
    });
  }

  openConnectModal() {
    this.isAccountSelected = true;
    if (!this._featureAuthService.features.integrations['pardot'] && !this._featureAuthService.features.integrations['pardot_limited']) {
      return;
    }
    if (this.configuration) {
      this.integrations.access_token = this.configuration.access_token;
      this.integrations.account_name = this.configuration.account_name;
      this.isConnected = false;
      this.isMapped = false;
    }
    jQuery('#pardot-new').modal('show');
  }

  openNewConnectModal() {
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isMapped = false;
    this.integrations.api_key = '';
    this.integrations.account_name = '';
    jQuery('#pardot-new').modal('show');
  }

  apiKeyExpired() {
    if (!this._featureAuthService.features.integrations['pardot'] && !this._featureAuthService.features.integrations['pardot_limited']) {
      return;
    }
    this.isError = true;
    this.errorMsg = 'Your API Key has expired, please login again.';
    this.isAccountSelected = true;
    this.isLoading = false;
    this.isConnected = false;
    if (this.configuration) {
      this.integrations.access_token = this.configuration.access_token;
      this.isMapped = false;
    }
    jQuery('#pardot-new').modal('show');
  }

  connect() {
    if (!this._featureAuthService.features.integrations['pardot'] && !this._featureAuthService.features.integrations['pardot_limited']) {
      return;
    }
    jQuery('#pardot-btn').html('Please Wait ...').attr('disabled', true);
    let data = {
      email: this.form.value.email,
      password: this.form.value.password,
      user_key: this.form.value.user_key,
      company: this.company,
      accountName: this.form.value.accountName,
      isCheckingTestAccount: this.isCheckingTestAccount
    };

    this._integrationService.authorization(data, 'pardot')
      .subscribe((response) => {
        if (response.err) {
          this.isError = true;
          this.isConfigured = this.isCheckingTestAccount ? true : false;
          //jQuery('#btnhubspot').html('Connect');
          this.errorMsg = 'Invalid Credentials';
          jQuery('#pardot-btn').html('Authenticate with Pardot').attr('disabled', false);
        } else {
          this.isError = false;
          this.isMapError = false;
          if (!this.isCheckingTestAccount) {
            this.isConfigured = true;
            this.isConnected = true;
            jQuery('#config_btn').html('Authenticate  with Pardot');
            this.getFields();
            window.toastNotification('You have successfully integrated with Pardot');
            this.notify.emit({
              action: 'connect',
            });
          } else {
            jQuery('#' + this.form.value.apiKey).removeClass('hide');
          }
        }
      }, (error) => {
        this.errorMsg = error.error.message;
        this.isError = true;
        jQuery('#pardot-btn').html('Connect').attr('disabled', false);
        if (error.error.code === 'ENOTFOUND') {
          this.errorMsg = 'Invalid Credentials';
        } if (error.error.code === 'E_KEY_EXIST') {
          this.errorMsg = error.error.err_message;
        }
      });


  }

  activate(checked: boolean) {
    jQuery('#pardot-new').modal('show');
    this.isConnected = true;
    this.isMapped = false;
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.getFields();
  }

  test() {
    jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);

    this.isTokenExpired = false;
    let data = {
      'map_fields': this.insertFields,
      'email': 'integrations@outgrow.co'
    }
    if (data.map_fields.length > 0) {
      this._integrationService.testSaveLead('pardot', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response.status.success) {
            this.sendMapFields();
            this.isMapError = false;
            this.isMapped = true;
            this.ViewMappedData(response.dataSent);
            this.updateIntegrationStatus(true);
            window.toastNotification('Connection Test Successful');
          } else if (response.status.message === 'Invalid prospect email address') {
            this.isMapError = true;
            this.isMapped = false;
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            this.mapError = "Wrong mapped field! Please map email with Pardot email field. ";
          } else {
            this.isMapError = true;
            this.isMapped = false;
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            this.mapError = "Your pardot api key is expired. Please re configure.";
          }
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        }, (error) => {
          this.isMapError = true;
          this.mapError = error.error.err_message;
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      jQuery('.btn-test').html('Test Connection').attr('disabled', false);
      this.isMapError = true;
      this.mapError = 'Minimum 1 field is required for Pardot';
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'pardot': checked
    }
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to Pardot';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Pardot';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['pardot_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['pardot'];
    if (isIntegrationLimited && !isIntegrationFull) {
      this.isLimited = true;
      this.getBasicMapFields();
    } else {
      this.getFullMapFields();
    }
    // this.isLimited = true;
    // this.getBasicMapFields();
  }

  getBasicMapFields() {
    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this._integrationService.getCalcBasicFields('pardot', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {

        if (!result.calc.find((el) => {
          return el['api_key'] === 'email'
        })) {
          this.isLeadGenError = true;
          this.isLoading = false;
          this.isMapError = true;

          this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
          jQuery('.btn-test').html('Test Connection').attr('disabled', true);
        }
        if (!this.isMapError)
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);

        if (result.crm.err) {
          this.apiKeyExpired();
        } else {
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
              if (obj['calc_key'] === 'email') {
                obj['calc_value'] = 'Sample : integrations@outgrow.co';
              } else {
                obj['calc_value'] = 'Sample : ' + calcfiedls[key].value;
              }
              this.calcAllFileds.push(obj);
            }
          }
          for (let key in crmfields) {
            if (crmfields.hasOwnProperty(key) && crmfields[key].id !== 'Name') {
              let obj = {};
              obj['crm_name'] = crmfields[key].name.length >= 40 ? crmfields[key].name.slice(0, 40) + '...' : crmfields[key].name;
              obj['crm_key'] = crmfields[key].id;
              //let selectedMapFields = this.mapFields;
              let selectedMapFields = this.config.map_fields;
              let mpFiledLength = selectedMapFields.length;
              for (let i = 0; i < mpFiledLength; i++) {
                if (crmfields[key].id === selectedMapFields[i].crm) {
                  obj['calc_key'] = selectedMapFields[i].calc;
                  let insertObj = {};
                  insertObj['calc'] = selectedMapFields[i].calc;
                  insertObj['crm'] = crmfields[key].id;
                  this.insertFields.push(insertObj);
                  break;
                } else {
                  obj['calc_key'] = '';
                }
              }
              this.crmAllFileds.push(obj);
            }
          }

        }
      }, (error) => {
        this.isLoading = false;
        if (error.error.err_message === "Cannot read property 'fields' of undefined") {
          this.isLeadGenError = true;
          this.mapError = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
        } else {
          this.mapError = error.error.err_message;
          this.isMapError = true;
        }
      });
  }

  getFullMapFields() {
    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this._integrationService.getCalcMapFields('pardot', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if (result.crm.err) {
          this.apiKeyExpired();
        } else {

          if (!result.calc.find((el) => {
            return el['api_key'] === 'email'
          })) {
            this.isLeadGenError = true;
            this.isLoading = false;
            this.isMapError = true;

            this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
            jQuery('.btn-test').html('Test Connection').attr('disabled', true);

          }
          if (!this.isMapError)
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);

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
              if (obj['calc_key'] === 'email') {
                obj['calc_value'] = 'Sample : integrations@outgrow.co';
              } else {
                obj['calc_value'] = 'Sample : ' + calcfiedls[key].value;
              }
              this.calcAllFileds.push(obj);
            }
          }
          for (let key in crmfields) {
            if (crmfields.hasOwnProperty(key) && crmfields[key].id !== 'Name') {
              let obj = {};
              obj['crm_name'] = crmfields[key].name.length >= 40 ? crmfields[key].name.slice(0, 40) + '...' : crmfields[key].name;
              obj['crm_key'] = crmfields[key].id;
              //let selectedMapFields = this.mapFields;
              let selectedMapFields = this.config.map_fields;
              let mpFiledLength = selectedMapFields.length;
              for (let i = 0; i < mpFiledLength; i++) {
                if (crmfields[key].id === selectedMapFields[i].crm) {
                  obj['calc_key'] = selectedMapFields[i].calc;
                  let insertObj = {};
                  insertObj['calc'] = selectedMapFields[i].calc;
                  insertObj['crm'] = crmfields[key].id;
                  this.insertFields.push(insertObj);
                  break;
                } else {
                  obj['calc_key'] = '';
                }
              }
              this.crmAllFileds.push(obj);
            }
          }

        }
      }, (error) => {
        this.isLoading = false;
        if (error.error.err_message === "Cannot read property 'fields' of undefined") {
          this.isLeadGenError = true;
          this.mapError = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
        } else {
          this.isMapError = true;
          this.mapError = error.error.err_message;
        }
      });
  }

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
      'map_fields': this.insertFields
    }
    if (this.isLimited) {
      this._integrationService.sendMapFieldsBasic('pardot', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('pardot', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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
    //     event.target.value = 'email';
    //     // this.activeCampaignErrorMsg = 'Email Field is required.';
    //     // this.isActiveCampaignError = true;
    //      return;
    // }
    console.log(this.insertFields);
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
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['pardot_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['pardot'];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }

  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'pardot');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }

  close() {
    jQuery('#mapping-int-toAccess').modal('hide');
    jQuery('#pardot-new').modal('hide');
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    this.isMapError = false;
    this.isLoading = false;
    this.isMapped = false;
    this.isAccountSelected = false;
  }

  setAccount(key: any, action: any) {
    let data = {
      key: key,
      action: action
    }
    this.activeAccount = key;
    this._integrationService.setAccount(data, 'pardot')
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

  testAccount(apikey: any, access_token) {

    this.isMapError = false;
    let data = {
      token: {
        api_key: apikey,
        access_token: access_token
      }
    }
    let companyId: string = <string>this._subdomainService.subDomain.company_id
    this._integrationService.testAccount(data, 'pardot', companyId)
      .subscribe((result) => {
        if (result.success) {
          jQuery('#' + apikey).removeClass('hide');
        } else {
          this.isMapError = true;
          this.mapError = 'Invalid_grant: expired access/refresh token';
        }
      }, (error) => {
        jQuery('#pardot-error').modal('show');
      });
  }

  previous(flag: any) {
    if (flag === 'reconfig') {
      this.isAccountSelected = false;
      this.isConnected = false;
      this.isMapped = false;
      this.getAccounts();
    }

  }

  showList() {
    this.isConnected = true;
    this.errorMsg = "";
    this.isError = false;
    this.getFields();
  }

  getAccounts() {
    this.isMapped = false;
    this.isConnected = false;
    this.isLoading = true;
    this.accounts = [];
    this.isAccountSelected = false;
    this.isError = false;
    this.errorMsg = '';
    this._integrationService.getAccount('pardot')
      .subscribe((response: any) => {
        let accounts = response.accounts;
        let cnt: any = 0;
        for (let key in accounts) {
          cnt++;
          if (accounts.hasOwnProperty(key)) {
            let obj = {};
            obj['name'] = accounts[key].account_name ? accounts[key].account_name : '#Account ' + cnt;
            obj['key'] = accounts[key].api_key;
            obj['status'] = accounts[key].active ? accounts[key].active : false;
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
        jQuery('#pardot-new').modal('show');

      })
  }

  editAccount(key: any) {
    this.isAccountSelected = true;
    this.integrations.api_key = key;
    //this.integrations.account_name = name;
    this.isConnected = false;
    this.isMapped = false;
  }

  sync() {
    let self = this;
    jQuery('.sync-leads-pardot').html('Please Wait..');
    this._integrationService.syncCalcLeads('pardot', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if (result.status == 1) {
          jQuery('.sync-leads-pardot').html('Sync');
          window.toastNotification('Data will be synced with Pardot shortly');
        }
        else {
          jQuery('.sync-leads-pardot').html('Sync (' + this.pendingLeads + ')');
          jQuery('#syncError-modal').modal('show');
        }
      }, (error) => {
        jQuery('.sync-leads-pardot').html('Sync (' + this.pendingLeads + ')');
        jQuery('#syncError-modal').modal('show');
      });
  }

  closeMapped() {
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    jQuery('#pardot-new').modal('hide');
  }

  addIsfocusedEmail() {
    jQuery('#email').addClass('is-focused');
  }

  removeIsfocusedEmail() {
    jQuery('#email').removeClass('is-focused');
  }

  addIsfocusedPassword() {
    jQuery('#password').addClass('is-focused');
  }

  removeIsfocusedPassword() {
    jQuery('#password').removeClass('is-focused');
  }

  addIsfocusedidenatity() {
    jQuery('#user_key').addClass('is-focused');
  }

  removeIsfocusedideantity() {
    jQuery('#user_key').removeClass('is-focused');
  }

  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'pardot'
    });
  }

  back() {
    this.isMapped = false;
    this.isConnected = true;
    this.getFields();
  }

}
