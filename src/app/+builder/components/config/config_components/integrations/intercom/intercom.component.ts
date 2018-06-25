import {Component, EventEmitter, OnInit, Output, AfterViewInit} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {JSONBuilder} from "../../../../../services/JSONBuilder.service";
import {Integrations} from "./../../../../../../../shared/models/integrations";
import {IntegrationService} from "./../../../../../../../shared/services/integration.service";
import {CookieService} from "./../../../../../../../shared/services/cookie.service";
import {Script} from "./../../../../../../../shared/services/script.service";
import {FeatureAuthService} from "../../../../../../../shared/services/feature-access.service";
import {SubDomainService} from "../../../../../../../shared/services/subdomain.service";

declare var jQuery;
declare var window: any;

@Component({
  selector: 'og-intercom-component',
  templateUrl: './intercom.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})
export class IntercomComponent implements AfterViewInit {
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[] } = {active: false, map_fields: []};
  pendingLeads: any = '';
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
    isMapped: boolean = false;
    isLoading: Boolean = false;
    isLeadGenError: Boolean = false;
    isDoubleOptin: Boolean = false;
    accounts: any = [];
    isAccountSelected: boolean = true;
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
        this.company = this._subdomainService.subDomain.company_id;
        this.form = this.fb.group({
            apiKey: [this.integrations.api_key, Validators.compose([Validators.required])]
        });
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
        if (!this._featureAuthService.features.integrations['intercom'] && !this._featureAuthService.features.integrations['intercom_limited']) {
            return;
        }
        jQuery('#intercom-new').modal('show');
    }
    connect() {
        if (!this._featureAuthService.features.integrations['intercom'] && !this._featureAuthService.features.integrations['intercom_limited']) {
            return;
        }
        this.isMapped = false;
        jQuery('#intercom-new').modal('hide');
        jQuery('#intercom').modal('hide');
        let data = {};
        this._integrationService.getLink(data, 'intercom')
            .subscribe((response) => {
                console.log(response);
                let companyId: string = <string>this._subdomainService.subDomain.company_id;
                console.log(companyId, "?????????????");
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
                        self.isConnected = true;
                        self.getFields();
                        window.toastNotification('You have successfully integrated with Intercom');
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
    jQuery('#intercom').modal('show');
    this.isConnected = true;
    this.isMapped = false;
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.getFields();
  }

    test() {
        jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
        console.log(this.insertFields);

        let data = {
            'map_fields': this.insertFields,
            email: 'John@outgrow.co'
        };
        if (data.map_fields.length != 0) {
            this._integrationService.testSaveLead('intercom', this.jsonBuilderHelper.getJSONBuilt()._id, data)
                .subscribe((response) => {
                    console.log(response);
                    if (response.status.data.success) {
                        this.sendMapFields();
                        this.isMapped = true;
                        this.ViewMappedData(response.dataSent);
                        this.updateIntegrationStatus(true);
                        window.toastNotification('Connection Test Successful');
                    }
                    else if (response.status.data.code == 401) {
                        this.isMapError = true;
                        this.isMapped = false;
                        this.mapError = 'Configuration error. Seems like your access token has expired. Please Reconfigure';
                        jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                    }
                    else {
                        this.isMapError = true;
                        this.isMapped = false;
                        this.mapError = response.status.data.message;
                        jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                    }
                }, (error) => {
                    this.isMapError = true;
                    this.mapError = error.error.err_message;
                    jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                });
        } else {
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            this.isMapError = true;
            this.mapError = 'Minimum 1 field is required for intercom';
        }

    }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'intercom': checked
    };
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to intercom';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to intercom';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

    getFields() {
        this.isAccountSelected = true;
        this.isConnected = true;
        jQuery('#intercom-new').modal('show');
        let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['intercom_limited'];
        let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['intercom'];
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
        this.isLeadGenError = false;
        this.calcAllFileds = [];
        this._integrationService.getCalcBasicFields('intercom', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
                    this.isMapError = true;
                    this.isLeadGenError = true;
                    this.isLoading = false;
                    this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
                    jQuery('.btn-test').html('Test Connection').attr('disabled', true);
                } if (!this.isMapError)
                    jQuery('.btn-test').html('Test Connection').attr('disabled', false);

                this.isLoading = false;
                let calcfiedls = result.calc;

                let selectedMapFields = this.config.map_fields;
                let mapFiledLength = selectedMapFields.length;
                for (let key in calcfiedls) {
                    if (calcfiedls.hasOwnProperty(key)) {
                        let obj = {};
                        let insertObj = {};
                        obj['calc_name'] = calcfiedls[key].name;
                        obj['calc_key'] = calcfiedls[key].api_key;
                        if (obj['calc_key'] === 'email') {
                            obj['calc_value'] = 'Sample : integrations@outgrow.co';
                        } else {
                            obj['calc_value'] = 'Sample : ' + calcfiedls[key].value;
                        }
                        if (obj['calc_key'] === 'email' && mapFiledLength == 0) {
                            obj['crm_key'] = 'email';
                            insertObj['calc'] = obj['calc_key'];
                            insertObj['crm'] = obj['crm_key'];
                            this.insertFields.push(insertObj);
                        } else if (mapFiledLength > 0) {
                            for (let i = 0; i < mapFiledLength; i++) {
                                if (obj['calc_key'] === selectedMapFields[i].calc) {
                                    obj['crm_key'] = selectedMapFields[i].crm ? selectedMapFields[i].crm : '';
                                    insertObj['calc'] = selectedMapFields[i].calc ? selectedMapFields[i].calc : '';
                                    insertObj['crm'] = selectedMapFields[i].crm ? selectedMapFields[i].crm : '';
                                    this.insertFields.push(insertObj);
                                    break;
                                } else {
                                    obj['crm_key'] = '';
                                }
                            }
                        } else {
                            obj['crm_key'] = '';
                        }
                        this.calcAllFileds.push(obj);
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

    getFullMapFields() {
        this.isLoading = true;
        this.isMapError = false;
        this.isLeadGenError = false;
        this.calcAllFileds = [];
        this._integrationService.getCalcMapFields('intercom', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {

                if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
                    this.isMapError = true;
                    this.isLeadGenError = true;
                    this.isLoading = false;
                    this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
                    jQuery('.btn-test').html('Test Connection').attr('disabled', true);
                }
                if (!this.isMapError)
                    jQuery('.btn-test').html('Test Connection').attr('disabled', false);

                this.isLoading = false;
                let calcfiedls = result.calc;
                let selectedMapFields = this.config.map_fields;
                let mapFiledLength = selectedMapFields.length;
                for (let key in calcfiedls) {
                    if (calcfiedls.hasOwnProperty(key)) {
                        let obj = {};
                        let insertObj = {};
                        obj['calc_name'] = calcfiedls[key].name;
                        obj['calc_key'] = calcfiedls[key].api_key;
                        if (obj['calc_key'] === 'email') {
                            obj['calc_value'] = 'Sample : integrations@outgrow.co';
                        } else {
                            obj['calc_value'] = 'Sample : ' + calcfiedls[key].value;
                        }
                        if (obj['calc_key'] === 'email' && mapFiledLength == 0) {
                            obj['crm_key'] = 'email';
                            insertObj['calc'] = obj['calc_key'];
                            insertObj['crm'] = obj['crm_key'];
                            this.insertFields.push(insertObj);
                        } else if (obj['calc_key'] === 'fullName' && mapFiledLength == 0) {
                            obj['crm_key'] = 'name';
                            insertObj['calc'] = obj['calc_key'];
                            insertObj['crm'] = obj['crm_key'];
                            this.insertFields.push(insertObj);
                        }
                        else if (mapFiledLength > 0) {
                            for (let i = 0; i < mapFiledLength; i++) {
                                if (obj['calc_key'] === selectedMapFields[i].calc) {
                                    obj['crm_key'] = selectedMapFields[i].crm ? selectedMapFields[i].crm : '';
                                    insertObj['calc'] = selectedMapFields[i].calc ? selectedMapFields[i].calc : '';
                                    insertObj['crm'] = selectedMapFields[i].crm ? selectedMapFields[i].crm : '';
                                    this.insertFields.push(insertObj);
                                    break;
                                } else {
                                    obj['crm_key'] = '';
                                }
                            }
                            //this.calcAllFileds.push(obj);
                        } else {
                            obj['crm_key'] = '';
                        }
                        this.calcAllFileds.push(obj);
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
      this._integrationService.sendMapFieldsBasic('intercom', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('intercom', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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
    let obj = {};
    obj['calc'] = calcKey;
    obj['crm'] = event.target.value;
    let fieldslength = this.insertFields.length;
    if (fieldslength > 0) {
      let flagPush = true;
      for (let i = 0; i < fieldslength; i++) {
        if (calcKey === this.insertFields[i].calc) {
          this.insertFields[i]['crm'] = event.target.value;
          flagPush = false;
          if (this.insertFields[i]['crm'] == '0') {
            this.insertFields.splice(i, 1);
            return;
          }
          break;
        }
      }
      if (flagPush) {
        this.insertFields.push(obj);
      }
    } else {
      this.insertFields.push(obj);
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
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['intercom_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['intercom'];

    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }

  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'intercom');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }

    close() {
        jQuery('#intercom-new').modal('hide');
        //jQuery('#intercom-auth').modal('hide');
        this.crmAllFileds = [];
        this.calcAllFileds = [];
        this.insertFields = [];
        this.isAccountSelected = true;
        this.isMapped = false;
        this.isConnected = false;
    }

    sync() {
        jQuery('.sync-leads-intercom').html('Please Wait..');
        this._integrationService.syncCalcLeads('intercom', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                if (result.status == 1) {
                    jQuery('.sync-leads-intercom').html('Sync');
                    window.toastNotification('Data will be synced with Intercom shortly');
                }
                else {
                    jQuery('.sync-leads-cm').html('Sync (' + this.pendingLeads + ')');
                    jQuery('#syncError-modal').modal('show');
                }
            }, (error) => {
                jQuery('.sync-leads-cm').html('Sync (' + this.pendingLeads + ')');
                jQuery('#syncError-modal').modal('show');
            });
    }
    closeMapped() {
        this.crmAllFileds = [];
        this.calcAllFileds = [];
        this.insertFields = [];
        jQuery('#intercom').modal('hide');
    }
    addIsfocusedKey() {
        jQuery('#intercom_apiKey').addClass('is-focused');
        this.isError = false;
        this.errorMsg = '';
    }
    removeIsfocusedKey() {
        jQuery('#intercom_apiKey').removeClass('is-focused');
    }
    addIsfocusedAccount() {
        jQuery('#intercom_accountId').addClass('is-focused');
        this.isError = false;
        this.errorMsg = '';
    }
    removeIsfocusedAccount() {
        jQuery('#intercom_accountId').removeClass('is-focused');
    }

  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'intercom'
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
        this._integrationService.getAccount('intercom')
            .subscribe((response: any) => {
                let accounts = response.accounts;
                let cnt: any = 0;
                for (let key in accounts) {
                    cnt++;
                    if (accounts.hasOwnProperty(key)) {
                        let obj = {};
                        obj['name'] = accounts[key].account_name ? accounts[key].account_name : '#Account ' + cnt;
                        obj['key'] = accounts[key].access_token;
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
                jQuery('#intercom-new').modal('show');

            })
    }

    testAccount(id:any,account:any) {
        console.log(account,"<<<<<<<<<<<<<<<>>>>>>>");
            this.isMapError = false;
            let data ={
              token : account
            }
            let companyId: string = <string>this._subdomainService.subDomain.company_id
            this._integrationService.testAccount(data,'intercom',companyId)
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
        };
        this.activeAccount = key;
        this._integrationService.setAccount(data, 'intercom')
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
