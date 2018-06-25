import { Component, EventEmitter, OnInit, Output, AfterViewInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
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
  selector: 'og-emma-component',
  templateUrl: './emma.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css',
    './../../../../../../../../assets/css/sahil-hover.css']
})

export class EmmaComponent implements OnInit, AfterViewInit {
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[], group_id: string, list_name: string } =
    { active: false, map_fields: [], group_id: '', list_name: '' };
  pendingLeads: any;
  isLeadsPending: boolean = false;

  emmaForm: FormGroup;
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
  crmList: any = [];
  isListSelected: boolean = false;
  selectedListName: string;
  selectedListId: any = '';
  isConnected: Boolean = false;

  mapError: string = '';
  isMapError: boolean = false;
  isLimited: boolean = false;
  isTokenExpired: boolean = false;
  isMapped: boolean = false;
  isLoading: Boolean = false;
  isLeadGenError: Boolean = false;
  accounts: any = [];
  isAccountSelected: Boolean = false;
  isCheckingTestAccount:Boolean = false;
  activeAccount: string = '';
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
    this.emmaForm = this.fb.group({

      publicKey: [this.integrations.refresh_token, Validators.compose([Validators.required])],
      privateKey: [this.integrations.access_token, Validators.compose([Validators.required])],
      accountId: [this.integrations.client_id, Validators.compose([Validators.required])],
      accountName :  ['', Validators.compose([Validators.required])]

    });
    console.log(this.configuration);
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

  ngAfterViewInit(){

  }

  openConnectModal() {
    this.isAccountSelected = true;
    if (!this._featureAuthService.features.integrations['emma'] && !this._featureAuthService.features.integrations['emma_limited']) {
      return;
    }
    if (this.configuration) {
      this.isAccountSelected = false;
      this.integrations = this.configuration;
      this.isConnected = false;
      this.isListSelected = false;
      this.isMapped = false;
    }
    jQuery('#emma-new').modal('show');
  }
  openNewConnectModal() {
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
    this.integrations.api_key = '';
    this.integrations.account_name = '';
    jQuery('#emma-new').modal('show');
  }

  connect() {
    if (!this._featureAuthService.features.integrations['emma'] && !this._featureAuthService.features.integrations['emma_limited']) {
      return;
    }
    jQuery('#btnmEmma').html('Please Wait...').attr('disabled', true);;
    let data = {
      public_key: this.emmaForm.value.publicKey,
      private_key: this.emmaForm.value.privateKey,
      account_id: this.emmaForm.value.accountId,
      company: this.company,
      account_name: this.emmaForm.value.accountName,
      isCheckingTestAccount:this.isCheckingTestAccount

    };
    this._integrationService.authorization(data, 'emma')
      .subscribe((response) => {
        if(!this.isCheckingTestAccount){
        jQuery('#btnEmma').html('Authenticate with Emma').attr('disabled', false);
        this.isListSelected = false;
        this.isConnected = true;
        window.toastNotification('You have successfully integrated with Emma');
        this.getList();
        this.notify.emit({
          action: 'connect'
        });
       } else{
         jQuery("#"+this.emmaForm.value.apiKey).removeClass('hide');
       }
      }, (error) => {
        this.isError = true;
        jQuery('#btnmEmma').html('Authenticate with Emma').attr('disabled', false);
        if (error.error.code) {
          this.errorMsg = 'Invalid Credentials - Please re-enter your Emma Credentials';
        }
        if (error.error.code === 'E_KEY_EXIST') {
          this.errorMsg = error.error.err_message;
        }
      });
  }

  activate(checked: boolean) {
    jQuery('#emma-new').modal('show');
    console.log(this.emmaForm);
    this.isConnected = true;
    this.isMapped = false;
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.integrations.api_key = this.configuration.api_key;
    this.getList();
  }

  test() {
    if (this.selectedListId) {
      this.isError = false;
      jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
      let data = {
        'map_fields': this.insertFields,
        'list_id': this.selectedListId
      }
      console.log(this.insertFields);
      this._integrationService.testSaveLead('emma', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          console.log(response,'>>>>>>>>>>');
          if (response.status.success) {
            this.sendMapFields();
            this.isMapped = true;
            this.ViewMappedData(response.dataSent);
            //this.isListSelected = false;
            this.updateIntegrationStatus(true);
            window.toastNotification('Connection Test Successful');
          } else {
            this.isMapError = true;
            this.mapError = 'Warning - Email Field is required';
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
          }
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
          this.isMapError = true;
          this.mapError = 'Invalid Credentials - Please re-enter your Emma Api key';
        });
    } else {
      this.isMapError = true;
      this.mapError = 'Please reconfigure & select the list where you want to save leads';
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'emma': checked
    }
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to Emma';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Emma';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['emma_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['emma'];
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
    this._integrationService.getCalcBasicFields('emma', this.jsonBuilderHelper.getJSONBuilt()._id)
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
            obj['crm_name'] = crmfields[key].name.length >= 40 ? crmfields[key].name.slice(0, 40) + '...' : crmfields[key].name;
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
    this._integrationService.getCalcMapFields('emma', this.jsonBuilderHelper.getJSONBuilt()._id)
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
            obj['crm_name'] = crmfields[key].name.length >= 40 ? crmfields[key].name.slice(0, 40) + '...' : crmfields[key].name;
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
      this._integrationService.sendMapFieldsBasic('emma', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('emma', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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
      if (data.hasOwnProperty(key) && key != 'group_id') {
        let obj = {};
        obj['key'] = key;
        obj['value'] = data[key];
        this.viewMappedData.push(obj);
      }
    }
  }

  returnFeatureAccess() {
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['emma_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['emma'];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }
  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'emma');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }
  close() {
    //jQuery('#mapping-int-toAccess').modal('hide');
    jQuery('#emma-new').modal('hide');
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    this.isAccountSelected = false;
    this.isConnected = false;
    this.isMapped = false;
    this.isListSelected = false;
  }

  sync() {
    let self = this;
    jQuery('.sync-leads-emma').html('Please Wait..');
    this._integrationService.syncCalcLeads('emma', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        // if (result.import_id) {
        // self.notify.emit({
        // action: 'synLeads'
        // });
        // jQuery('.sync-leads-emma').html('Sync');
        // window.toastNotification('Data has been synced with Emma');
        // }
        if (result.status == 1) {
          jQuery('.sync-leads-emma').html('Sync');
          window.toastNotification('Data will be synced with Emma shortly');
        }
        else {
          jQuery('.sync-leads-emma').html('Sync (' + this.pendingLeads + ')');
          jQuery('#syncError-modal').modal('show');
        }
      }, (error) => {
        jQuery('.sync-leads-emma').html('Sync (' + this.pendingLeads + ')');
        jQuery('#syncError-modal').modal('show');
      });
  }
  closeMapped() {
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    jQuery('#emma').modal('hide');
  }
  addIsfocusedKey(id) {
    jQuery('#' + id).addClass('is-focused');
    this.isError = false;
    this.errorMsg = '';
  }
  removeIsfocusedKey(id) {
    jQuery('#' + id).removeClass('is-focused');
  }

  getList() {
    this.isLoading = true;
    this.selectedListId = this.config.group_id;
    this.isError = false;
    this.errorMsg ='';
    this._integrationService.getList('emma')
      .subscribe((response) => {
        if (response.total_items !== 0) {
          this.crmList = [];
          this.isListExist = true;
          this.isLoading = false;
          let lists = response;
          for (let key in lists) {
            let obj = {};
            obj['list_name'] = lists[key].group_name;
            obj['list_id'] = lists[key].member_group_id;
            this.crmList.push(obj);
          }
        } else {
          this.isListExist = false;
        }
      }, (error) => {
        console.log('error', error);
      });
  }

  selectedList(list_id) {
    this.selectedListName = jQuery('#listName :selected').text();
    if (this.selectedListId != '' || !this.selectedListId) {
      this.selectedListId = '';
      this.selectedListId = list_id;
      this.insertFields.splice(3, 1);
    } else {
      this.selectedListId = list_id;
    }
  }

  saveList() {
    if (!this.selectedListId || this.selectedListId === '0') {
      this.isError = true;
      this.errorMsg = 'Please select the list where you want to save leads';
    } else {
      jQuery('#btnEmmaList').html('Please wait...');
      this.isListSelected = true;
      let data = {
        'group_id': this.selectedListId,
        'group_name': this.selectedListName
      }
      this._integrationService.saveList('emma', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response: any) => {
          this.getFields();
        }
        , (error) => {
          console.log('error', error);
        });
    }
  }
  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'emma'
    });
  }

  back(){
    this.isMapped = false;
    this.isListSelected = true;
    this.getFields();
  }

  addfocus() {
    jQuery('.label-text').addClass('active');
  }
  removefocus() {
    jQuery('.label-text').removeClass('active');
  }

  getAccounts() {
    this.isLoading = true;
    this.accounts = [];
    this.isAccountSelected = false;
    this._integrationService.getAccount('emma')
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
            obj['refresh_token'] = accounts[key].refresh_token;
            obj['client_id'] = accounts[key].client_id;


            this.accounts.push(obj);
            this.isLoading = false;
          }
        }
        this.activeAccount = this.accounts.reduce((acc,account)=>{
          if(account.status){
          return account.access_token;
          }
          return acc;
          })
        jQuery('#emma-new').modal('show');

      })
  }

  testAccount(account: any) {
    console.log(account);
    this.isCheckingTestAccount = true;
    this.emmaForm.value.privateKey = account.access_token;
    this.emmaForm.value.publicKey = account.refresh_token;
    this.emmaForm.value.accountId = account.client_id;
    this.connect();
  }

  editAccount(name, access_token, refresh_token, client_id) {
    this.isAccountSelected = true;
    this.integrations.refresh_token = refresh_token;
    this.integrations.account_name = name;
    this.integrations.access_token = access_token;
    this.integrations.client_id = client_id;


    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
    jQuery('#emma-new').modal('show');
  }

  setAccount(key: any, action: any) {
    let data = {
      key: key,
      action: action
    }
    this.activeAccount = key;
    this._integrationService.setAccount(data, 'emma')
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
      this.isConnected = false;
      this.isListSelected = false;
      this.isMapped = false;
      this.getAccounts();
    }

  }

  showList() {
    this.isListSelected = false;
    this.isConnected = true;
    this.errorMsg = "";
    this.isError = false;
    this.getList();
  }


}
