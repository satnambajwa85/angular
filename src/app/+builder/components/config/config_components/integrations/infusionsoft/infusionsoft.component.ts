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
  selector: 'og-infusionsoft-component',
  templateUrl: './infusionsoft.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})
export class InfusionsoftComponent implements AfterViewInit {
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
    activeAccount: string = ""
    
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
        if (!this._featureAuthService.features.integrations['infusionsoft'] && !this._featureAuthService.features.integrations['infusionsoft_limited']) {
            return;
        }
        jQuery('#infusionsoft-new').modal('show');
    }
    connect() {
        if (!this._featureAuthService.features.integrations['infusionsoft'] && !this._featureAuthService.features.integrations['infusionsoft_limited']) {
            return;
        }
        this.isMapped = false;
        jQuery('#infusionsoft-new').modal('hide');
        let data = {};
        this._integrationService.getLink(data,'infusionsoft')
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
                        self.isConnected = true;
                        self.getFields();
                        window.toastNotification('You have successfully integrated with Infusionsoft');
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
    jQuery('#infusionsoft-new').modal('show');
    this.isConnected = true;
    this.isMapped = false;
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.getFields();
  }

    test() {
        jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);

        let data = {
            'map_fields': this.insertFields,
        };
        if (
          !this.insertFields.find(el => {
            return el["calc"] === "email";
          })
        ) {
          this.mapError = "Warning - Email Field is required.";
          this.isMapError = true;
          jQuery(".btn-test")
            .html("Test Connection")
            .attr("disabled", false);
        }else{
            this._integrationService.testSaveLead('infusionsoft', this.jsonBuilderHelper.getJSONBuilt()._id, data)
                .subscribe((response) => {
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
                    else if (response.status.data.code == 400) {
                      this.isMapError = true;
                      this.isMapped = false;
                      this.mapError = "Field type mismatch. Please fix & retest";
                      jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                  }
                    else {
                        this.isMapError = true;
                        this.isMapped = false;
                        this.mapError = 'Configuration error. Seems like your access token has expired. Please Reconfigure';
                        jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                    }
                }, (error) => {
                    this.isMapError = true;
                    this.mapError = error.error.err_message;
                    jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                });
        }

    }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'infusionsoft': checked
    };
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to Infusionsoft';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Infusionsoft';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  getFields() {
    jQuery('#infusionsoft-new').modal('show');
    this.isAccountSelected = true;
    this.isConnected = true;
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['infusionsoft_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['infusionsoft'];
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
    this._integrationService.getCalcBasicFields('infusionsoft', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
          this.isLeadGenError = true;
          this.isLoading = false;
          this.isMapError = true;

          this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
          jQuery('.btn-test').html('Test Connection').attr('disabled', true);

      }
      if(!this.isMapError){
        jQuery('.btn-test').html('Test Connection').attr('disabled', false);

      }
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
          if (crmfields.hasOwnProperty(key) && crmfields[key].api_key !== 'Name') {
            let obj = {};
            obj['crm_name'] = crmfields[key].name.length >= 40 ? crmfields[key].name.slice(0, 40) + '...' : crmfields[key].name;
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
        console.log("eooo",error)
        this.isLoading = false;
        if (error.error.err_message === "Cannot read property 'fields' of undefined") {
          this.isLeadGenError = true;
          this.mapError = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
        } else {
          this.isMapError = true;
          this.mapError = "Seems to be like your access token has been expired. Please reconfigure";
        }

      });
  }

  getFullMapFields() {
    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this._integrationService.getCalcMapFields('infusionsoft', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
          this.isLeadGenError = true;
          this.isMapError = true;
          this.isLoading = false;
          this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
          jQuery('.btn-test').html('Test Connection').attr('disabled', true);

      } if(!this.isMapError){
        jQuery('.btn-test').html('Test Connection').attr('disabled', false);

      }

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
          if (crmfields.hasOwnProperty(key) && crmfields[key].api_key !== 'Name') {
            let obj = {};
            obj['crm_name'] = crmfields[key].name.length >= 40 ? crmfields[key].name.slice(0, 40) + '...' : crmfields[key].name;
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
        if (error.error.err_message === "Cannot read property 'fields' of undefined") {
          this.isLeadGenError = true;
          this.mapError = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
        } else {
          this.isMapError = true;
          this.mapError = "Seems to be like your access token has been expired. Please reconfigure";
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
      this._integrationService.sendMapFieldsBasic('infusionsoft', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('infusionsoft', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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
    let newdata={}
    for (var prop in data){
      for(let i=0;i<this.crmAllFileds.length ; i++){
        if(prop ==this.crmAllFileds[i].crm_key){
          newdata[this.crmAllFileds[i].crm_name] =data[prop]
        }
      }
    }
    this.viewMappedData = [];
    for (let key in newdata) {
      if (newdata.hasOwnProperty(key)) {
        let obj = {};
        obj['key'] = key;
        obj['value'] = newdata[key];
        this.viewMappedData.push(obj);
      }
    }
  }

  returnFeatureAccess() {
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['infusionsoft_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['infusionsoft'];

    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }

  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'infusionsoft');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }

    close() {
        jQuery('#infusionsoft-new').modal('hide');
        //jQuery('#infusionsoft-auth').modal('hide');
        this.crmAllFileds = [];
        this.calcAllFileds = [];
        this.insertFields = [];
        this.isAccountSelected = true;
        this.isMapped = false;
        this.isConnected = false;
    }

    sync() {
        jQuery('.sync-leads-infusionsoft').html('Please Wait..');
        this._integrationService.syncCalcLeads('infusionsoft', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                if (result.status == 1) {
                    jQuery('.sync-leads-infusionsoft').html('Sync');
                    window.toastNotification('Data will be synced with Infusionsoft shortly');
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
        jQuery('#infusionsoft').modal('hide');
    }
    addIsfocusedKey() {
        jQuery('#infusionsoft_apiKey').addClass('is-focused');
        this.isError = false;
        this.errorMsg = '';
    }
    removeIsfocusedKey() {
        jQuery('#infusionsoft_apiKey').removeClass('is-focused');
    }
    addIsfocusedAccount() {
        jQuery('#infusionsoft_accountId').addClass('is-focused');
        this.isError = false;
        this.errorMsg = '';
    }
    removeIsfocusedAccount() {
        jQuery('#infusionsoft_accountId').removeClass('is-focused');
    }

  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'infusionsoft'
    });
  }

    back() {
        this.isMapped = false;
        this.isConnected = true;
        this.getFields();
    }
    getAccounts() {
        this.isError=false;
        this.errorMsg='';    
        this.isMapError=false;
        this.mapError='';
        this.isLoading = true;
        this.isConnected = true;
        this.accounts = [];
        this.isAccountSelected = false;
        this._integrationService.getAccount('infusionsoft')
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
                  },'');
                jQuery('#infusionsoft-new').modal('show');


            })
    }

    testAccount(id:any,account:any) {
            this.isMapError = false;
            let data ={
              token : account
            }
            let companyId: string = <string>this._subdomainService.subDomain.company_id
            this._integrationService.testAccount(data,'infusionsoft',companyId)
            .subscribe((result) => {
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
      this.isError =false
      this.errorMsg='';         
      this.isMapError=false;
      this.mapError='';
     
        let data = {
            key: key,
            name: name,
            action: action
        }
        this.activeAccount=key
        this._integrationService.setAccount(data, 'infusionsoft')
            .subscribe((response) => {
                if (action === 'edit') {
                    window.toastNotification('You have successfully selected the account');
                } if (action === 'delete') {
                this.getAccounts();
                 window.toastNotification('You have successfully deleted the account');
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
