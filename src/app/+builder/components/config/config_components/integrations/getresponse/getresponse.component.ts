
import { Component, AfterViewInit, OnInit, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { JSONBuilder } from '../../../../../services/JSONBuilder.service';
import { Integrations } from './../../../../../../../shared/models/integrations';
import { IntegrationService } from './../../../../../../../shared/services/integration.service';
import { SubDomainService } from '../../../../../../../shared/services/subdomain.service';
import { FeatureAuthService } from './../../../../../../../shared/services/feature-access.service';
declare var jQuery: any;
declare var window: any;

@Component({
  selector: 'og-getresponse-component',
  templateUrl: './getresponse.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})

export class GetResponseComponent implements OnInit {
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[], campaign_id: string, list_id: string, isAutoResponder: boolean } = { active: false, map_fields: [], campaign_id: '', list_id: '', isAutoResponder: false };
  isConnected: Boolean = false;
  isMapped: Boolean = false;
  pendingLeads: any = '';
  isLeadsPending: boolean = false;
  getResponseallList: any = [];
  isGetResponseError: boolean = false;
  getResponseForm: FormGroup;
  getResponseErrorMsg: string;
  isLoading: boolean = false;
  isGetResponseListExist: boolean = false;
  isGetresponseConnected: boolean = false;
  integrations: any = new Integrations({});
  company: any;
  listId: any;
  calcAllFields: any = [];
  crmAllFileds: any = [];
  insertFields: any = [];
  maperror: boolean = false;
  maperrorMessage: string;
  selectedList: any;
  isListSelected: boolean = false;
  @Output() notify = new EventEmitter();
  campaignName: string;
  getresponseKey: any;
  isLimited: boolean = false;
  viewMappedData: any = [];
  calcAllFileds: any = [];
  mapError: string = '';
  isMapError: boolean = false;
  calcType: string;
  testEmail: string;
  selectedListName: string;
  isError: boolean = false;
  errorMsg: string;
  isAutoResponder: boolean = false;
  isLeadGenError: Boolean = false;
  isAccountSelected: Boolean = false;
  accounts: any = [];
  isCheckingTestAccount: Boolean = false;
  activeAccount:string = '';
  constructor(
    public _integrationService: IntegrationService,
    public _subdomainService: SubDomainService,
    public jsonBuilderHelper: JSONBuilder,
    public _featureAuthService: FeatureAuthService,
    public fb: FormBuilder, ) {
    this.company = this._subdomainService.subDomain.company_id;
    this.getResponseForm = this.fb.group({
      apiKey: [this.integrations.api_key, Validators.compose([Validators.required])],
      accountName: ['', Validators.compose([Validators.required])]
    });
  }

    ngOnInit() {
      let calc_type = this.jsonBuilderHelper.getJSONBuilt().templateType;
      if (calc_type === 'Numerical') {
        this.calcType = 'Calculator';
      }else if(calc_type==='Recommendation') {
        this.calcType = 'Quiz';
      } else if(calc_type==='Poll'){
        this.calcType = 'Poll';
      } else{
        this.calcType = 'Graded Quiz'
      }
    }
  


   
    openConnectModal(){
      this.isAccountSelected = true;
      if(!this._featureAuthService.features.integrations['get_response'] && !this._featureAuthService.features.integrations['get_response_limited']){
          return;
      }
      if(this.configuration){
        this.integrations.api_key = this.configuration.api_key;
        this.integrations.account_name = this.configuration.account_name;
        this.isConnected = false;
        this.isListSelected = false;
        this.isMapped = false;
        this.isGetResponseError = false;
      }
      console.log(this.isAccountSelected,this.isConnected,this.isMapped,this.isListSelected);
      jQuery('#get-response-new').modal('show');

    }
    

  openNewConnectModal() {
    this.reset();
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isMapped = false;
    this.integrations.api_key = '';
    jQuery('#get-response-new').modal('show');
  }
  connect() {
    jQuery('#btnGetResponse').html('Please Wait...');
    let data = {
      api_key: this.getResponseForm.value.apiKey,
      company: this.company,
      isCheckingTestAccount: this.isCheckingTestAccount,
      account_name: this.getResponseForm.value.accountName,

    };
    this._integrationService.authorization(data, 'getresponse')
      .subscribe((response) => {
        
        if (response.httpStatus === 401) {
          this.isGetResponseError = true;
          jQuery('#btnGetResponse').html('Connect');
          this.getResponseErrorMsg = 'Invalid Credentials - Please re-enter your GetResponse Api key';
        } else if (response.accountId) {
          if(!this.isCheckingTestAccount){
          jQuery('#btnGetResponse').html('Connect');
          this.isGetresponseConnected = true;
          this.isListSelected = false;
          this.getresponseKey = data.api_key;
          this.isConnected = true;
          window.toastNotification('You have successfully integrated with GetResponse.');
          this.getGetResponseList();
          this.notify.emit({
            action: 'connect',
          });
        } else{
          jQuery('#'+this.getResponseForm.value.apiKey).removeClass('hide');
        }
       }
      }, (error) => {
        this.isGetResponseError = true;
        jQuery('#btnGetResponse').html('Authenticate with GetResponse');
        if (error.error.code === 'ENOTFOUND') {
          this.getResponseErrorMsg = 'Invalid Credentials - Please re-enter your GetResponse Api key';
        }
        if (error.error.code === 'E_KEY_EXIST') {
          this.getResponseErrorMsg = error.error.err_message;
        }
      });
  }
    
    getAccounts(){
      this.isMapped = false;
      this.isListSelected = false;
      this.isConnected = false;
      this.isLoading = true;
      this.accounts =[];
      this.isAccountSelected = false;
      this._integrationService.getAccount('getresponse')
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
          })
        jQuery('#get-response-new').modal('show');

      })
  }
  testAccount(account: any, accountname: any) {
    this.isCheckingTestAccount = true;
    this.getResponseForm.value.apiKey = account;
    this.connect();
    
  }

  editAccount(key, name) {
    this.isAccountSelected = true;
    this.integrations.api_key = key;
    this.integrations.account_name = name;
    this.isListSelected = false;
    this.isConnected = false;
    this.isMapped = false;
    jQuery('#get-response-new').modal('show');
  }

  setAccount(key: any, action: any) {
    let data = {
      key: key,
      action: action
    }
    this.activeAccount = key;
    this._integrationService.setAccount(data, 'getresponse')
      .subscribe((response) => {

        if (action === 'edit') {
          window.toastNotification('You have successfully selected the account');
        } if (action === 'delete') {
          window.toastNotification('You have successfully deleted the account');
          this.getAccounts()
          
        }
      }, (error) => {
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
    this.getGetResponseList();
  }
  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'get_response');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }

  getGetResponseList() {
    this.isLoading = true;
    this.isGetresponseConnected = true;
    this.selectedList = this.config.campaign_id;
    this.isAutoResponder = this.config.isAutoResponder;
    if (this.selectedList) this.listId = this.selectedList;
    this._integrationService.getList('getresponse')
      .subscribe((response) => {
        if (response.list.length > 0) {
          this.getResponseallList = [];
          this.isGetResponseListExist = true;
          this.isLoading = false;
          let getresponseLists = response.list;
          this.getresponseKey = response.apiKey;
          let length = getresponseLists.length;
          for (let i = 0; i < length; i++) {
            let obj = {};
            obj['list_name'] = getresponseLists[i].name;
            obj['list_id'] = getresponseLists[i].campaignId;
            //if(getresponseLists[i].campaignId == this.selectedList)
            this.campaignName = getresponseLists[i].name;
            this.getResponseallList.push(obj);
          }
          // this.getCalcMapFields();
        } else {
          this.isGetResponseListExist = false;
          this.isGetResponseError = true;
          this.getResponseErrorMsg = response.list.message;
          this.isLoading = false;
        }
      }, (error) => {
        console.log('error occured', error);
      });
  }

  viewGetResponse() {
    if (this.listId) {
      jQuery('#btnGetResponseList').html('Please wait...');
      this.isListSelected = true;
      this.selectedList = this.listId;
      this.getGetResponseList();
    } else {
      this.isGetResponseError = true;
      this.getResponseErrorMsg = 'Please select the list where you want to save leads';
    }
  }

  addIsfocusedKey(id) {
    jQuery('#' + id).addClass('is-focused');
    this.isGetResponseError = false;
    this.getResponseErrorMsg = '';
  }

  removeIsfocusedKey(id) {
    jQuery('#' + id).removeClass('is-focused');
  }

  testSaveLead() {
    if (this.listId) {
      let data = {
        'map_fields': this.insertFields,
        'list_id': this.listId
      }
      jQuery('#btn-getresponse-test').html('PLEASE WAIT...').attr('disabled', true);
      this._integrationService.testSaveLead('getresponse', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response) {
            jQuery('#get_response').modal('hide');
            this.isListSelected = false;
            this.isGetresponseConnected = true;
            window.toastNotification('Connection Test Successful');
            this.notify.emit({
              action: 'activate',
            });
          } else {
            jQuery('#btn-getresponse-test').html('Test Connection').attr('disabled', false);
          }
        }, (error) => {
          jQuery('#btn-getresponse-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.maperror = true;
      this.maperrorMessage = 'Please select the campaign where you want to save leads';
    }
  }

  activate(checked: boolean) {
    jQuery('#get-response-new').modal('show');
    this.isError = false;
    this.isMapped = false;
    this.isConnected = true;
    this.isListSelected = false;
    this.calcAllFields = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.integrations.api_key = this.configuration.api_key;
    this.getGetResponseList();
  }

  getListID(list_id) {
    this.selectedListName = jQuery('#listName :selected').text();
    if (this.listId != '' || !this.listId) {
      this.listId = list_id;
      this.insertFields.splice(3, 1);
    } else {
      this.listId = list_id;
    }

  }

  getconfig(api_key: any) {
    this.isGetresponseConnected = false;
    this.getresponseKey = api_key;
    this.integrations.api_key = this.getresponseKey;
  }

  getMappedFields(fields: any) {
    this.selectedList = fields.campaign_id;
  }

  testView() {
    this.maperror = false;
    this.listId = this.selectedList;
    this.isGetresponseConnected = true;
    this.isListSelected = false;
    this.getGetResponseList();
  }

  returnFeatureAccess() {
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['get_response_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['get_response'];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'getresponse': checked
    }
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to getResponse';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to getResponse';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  sync() {
    let self = this;
    jQuery('.sync-leads-gr').html('Please Wait..');
    this._integrationService.syncCalcLeads('getresponse', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        // if (result.success) {
        //   self.notify.emit({
        //     action: 'synLeads'
        //   });
        //   jQuery('.sync-leads-gr').html('Sync');
        //   window.toastNotification('Data has been synced with GetResponse');
        // }
        if (result.status == 1) {
          jQuery('.sync-leads-gr').html('Sync');
          window.toastNotification('Data will be synced with GetResponse shortly');
        }
        else {
          jQuery('.sync-leads-gr').html('Sync (' + this.pendingLeads + ')');
          jQuery('#syncError-modal').modal('show');
        }
      }, (error) => {
        jQuery('.sync-leads-gr').html('Sync (' + this.pendingLeads + ')');
        jQuery('#syncError-modal').modal('show');
      });
  }

  saveList() {
    if (!this.listId || this.listId === '0') {
      this.isError = true;
      this.errorMsg = 'Please select the list where you want to save leads';
    } else {
      jQuery('#btnGetResponseList').html('Please wait...');
      this.isListSelected = true;
      let data = {
        'campaign_id': this.listId,
        'list_name': this.selectedListName,
        'autoResponder': this.isAutoResponder
      }
      this._integrationService.saveList('getresponse', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response: any) => {
          this.getFields();
          //this.getCalcMapFields();
        }
          , (error) => {
            this.errorMsg = error;
            this.isError = true;
            jQuery('#btnGetResponseList').attr('disabled', false);
          });
      //this.getCalcMapFields();
    }
  }

  test() {
    if (this.listId) {
      this.isError = false;
      console.log(this.insertFields, ">>>>");
      jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
      let data = {
        'map_fields': this.insertFields,
        'list_id': this.listId
      };
      this._integrationService.testSaveLead('getresponse', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          console.log(response);
          if (response.status.success) {
            this.sendMapFields();
            this.isMapped = true;
            this.ViewMappedData(response.dataSent);
            //this.isListSelected = false;
            this.updateIntegrationStatus(true);
            window.toastNotification('Connection Test Successful');
          } else {
            this.isMapError = true;
            this.mapError = 'Warning - Field type mismatch. Please fix & retest';
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
          }
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
          this.isMapError = true;
          this.mapError = 'Please reconfigure & select the list where you want to save leads';
        });
    } else {
      this.isMapError = true;
      this.mapError = 'Please reconfigure & select the list where you want to save leads';
    }
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['get_response_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['get_response'];
    if (isIntegrationLimited && !isIntegrationFull) {
      this.isLimited = true;
      this.getBasicMapFields();
    } else {
      this.getFullMapFields();
    }
  }


  getBasicMapFields() {
    let calc_type = this.jsonBuilderHelper.getJSONBuilt().templateType;
    if (calc_type === 'Numerical') {
      this.calcType = 'Calculator';
    } else {
      this.calcType = 'Quiz';
    }
    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this._integrationService.getCalcBasicFields('getresponse', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
          this.isMapError = true;
          this.isLeadGenError = true;
          this.isLoading = false;
          this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
          jQuery('.btn-test').html('Test Connection').attr('disabled', true);

        } if (!this.isMapError) {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);

        }
        this.isLoading = false;
        let calcfields = result.calc;
        let crmfields = result.crm;
        this.calcAllFileds = [];
        this.crmAllFileds = [];
        for (let key in calcfields) {
          if (calcfields.hasOwnProperty(key)) {
            let obj = {};
            obj['calc_name'] = calcfields[key].name;
            obj['calc_key'] = calcfields[key].api_key;
            obj['calc_value'] = 'Sample : ' + calcfields[key].value;
            this.calcAllFileds.push(obj);
          }
        }
        let selectedMapFields = this.insertFields.length > 0 ? this.insertFields : this.config.map_fields;
        this.insertFields = [];
        let mpFiledLength = selectedMapFields.length;
        for (let key in crmfields) {
          if (crmfields.hasOwnProperty(key)) {
            let obj = {};
            obj['crm_name'] = crmfields[key].name.length >= 40 ? crmfields[key].name.slice(0, 40) + '...' : crmfields[key].name;
            obj['crm_key'] = crmfields[key].api_key;
            let crmObj = selectedMapFields.find(x => x.crm === crmfields[key].api_key);
            if (crmObj) {
              obj['calc_key'] = crmObj.calc;
              let insertObj = {};
              insertObj['calc'] = crmObj.calc;
              insertObj['crm'] = crmfields[key].api_key;
              insertObj['name'] = crmfields[key].name;
              this.insertFields.push(insertObj);
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
          this.mapError = error.error.err_message;
        }
      });
  }

  getFullMapFields() {
    let calc_type = this.jsonBuilderHelper.getJSONBuilt().templateType;

    if (calc_type === 'Numerical') {
      this.calcType = 'Calculator';
    } else if (calc_type === 'Recommendation') {
      this.calcType = 'Quiz';
    } else {
      this.calcType = 'Poll';
    }
    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this._integrationService.getCalcMapFields('getresponse', this.jsonBuilderHelper.getJSONBuilt()._id)
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
        let calcfields = result.calc;
        let crmfields = result.crm;
        this.calcAllFileds = [];
        this.crmAllFileds = [];
        for (let key in calcfields) {
          if (calcfields.hasOwnProperty(key)) {
            let obj = {};
            obj['calc_name'] = calcfields[key].name;
            obj['calc_key'] = calcfields[key].api_key;
            obj['calc_value'] = 'Sample : ' + calcfields[key].value;
            this.calcAllFileds.push(obj);
          }
        }
        let selectedMapFields = this.insertFields.length > 0 ? this.insertFields : this.config.map_fields;
        this.insertFields = [];
        let mpFiledLength = selectedMapFields.length;
        for (let key in crmfields) {
          if (crmfields.hasOwnProperty(key)) {
            let obj = {};
            obj['crm_name'] = crmfields[key].name.length >= 40 ? crmfields[key].name.slice(0, 40) + '...' : crmfields[key].name;
            obj['crm_key'] = crmfields[key].api_key;
            let crmObj = selectedMapFields.find(x => x.crm === crmfields[key].api_key);
            if (crmObj) {
              obj['calc_key'] = crmObj.calc;
              let insertObj = {};
              insertObj['calc'] = crmObj.calc;
              insertObj['crm'] = crmfields[key].api_key;
              insertObj['name'] = crmfields[key].name;
              this.insertFields.push(insertObj);
            }
            this.crmAllFileds.push(obj);
          }
        }
        console.log(this.crmAllFileds);

      }, (error) => {
        this.isMapError = true;
        this.isLoading = false;
        if (error.error.err_message === "Cannot read property 'fields' of undefined") {
          this.mapError = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
        } else {
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
          obj['name'] = this.insertFields[j]['name'];
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
      this._integrationService.sendMapFieldsBasic('getresponse', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('getresponse', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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
        let crmObj = this.insertFields.find(x => x.crm === key);
        if (!crmObj) break;
        obj['key'] = crmObj.name ? crmObj.name : crmObj.calc;
        obj['value'] = data[key];
        this.viewMappedData.push(obj);
      }
    }
  }

  close() {
    // jQuery('#mapping-int-toAccess').modal('hide');
    jQuery('#get-response-new').modal('hide');
    this.reset();
   
  }
  reset(){
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.isAccountSelected = false;
    this.insertFields = [];
    this.isMapped = false;
    this.isListSelected = false;
    this.accounts = [];
    this.isConnected = false;
    this.isGetResponseError = false;
  }

  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'getresponse'
    });
  }

  saveAutoResponder() {
    if (jQuery('#chkAutoResponder').is(':checked')) {
      this.isAutoResponder = true;
    } else {
      this.isAutoResponder = false;
    }
  }

  back() {
    this.isMapped = false;
    this.isListSelected = true;
    this.getFields();
  }
  checkAccountName(event) {
    this.isGetResponseError = false;
    let data = { ac_name: event.target.value };
    this._integrationService.checckAccount(data, 'getresponse')
      .subscribe((res) => {
        if (res.Exist) {
          this.isGetResponseError = true;
          this.getResponseErrorMsg = "Account name is allready use";
        }
      })

  }
}

