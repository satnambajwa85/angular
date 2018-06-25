
import { Component, EventEmitter, OnInit, Output , AfterViewInit } from "@angular/core";
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
  selector: 'og-unbounce-component',
  templateUrl: './unbounce.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})

export class UnbounceComponent implements  AfterViewInit {

  listofinterest: any = [];
  i:number = 0;
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[], list_id: string, list_name: string, variant_name : string } = { active: false, map_fields: [], list_id: '', list_name: '', variant_name :''};
  pendingLeads: any;
  isLeadsPending: boolean = false;
  isinterestselected: boolean = false;
  unbounceForm: FormGroup;
  integrations: any = new Integrations({});
  company: any;
  InterestList: any = [];

  calcType: string;
  calcAllFileds: any = [];
  crmAllFileds: any = [];
  insertFields: any = [];
  interestCategories: any = [];
  mapFields: any = [];
  viewMappedData: any = [];
  isError: boolean = false;
  errorMsg: string;

  isListExist: boolean = false;
  crmList: any = [];
  isListSelected: boolean = false;
  isInterestSelected: boolean = false;
  isInterestCategorySelected: boolean = false;
  selectedListName: string;
  selectedListId: any = '';
  selectedInterestgroup: any = '';
  seletedInterest: any = '';
  isinterest: boolean = false;
  isConnected: Boolean = false;

  mapError: string = '';
  isMapError: boolean = false;
  isLimited: boolean = false;
  isMapped: boolean = false;
  isLoading: boolean = false;
  testEmail: string;
  thirdstage:boolean = false;
  variant: string;
  isVariant_error: boolean = false;
  isLeadGenError:boolean = false;
  accounts: any = [];
  isAccountSelected: boolean = false;
  isCheckingTestAccount : boolean = false;
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
    this.unbounceForm = this.fb.group({
      apiKey: [this.integrations.api_key, Validators.compose([Validators.required])],
      accountName : [this.integrations.account_name, Validators.compose([Validators.required])]
    });
    
  }

  ngAfterViewInit(){
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

  openConnectModal() {
    this.isAccountSelected = true;
    if (!this._featureAuthService.features.integrations['unbounce'] && !this._featureAuthService.features.integrations['unbounce_limited']) {
      return;
    }
    if (this.configuration) {
      this.integrations.api_key = this.configuration.api_key;
      this.isConnected = false;
      this.isListSelected = false;
      this.isMapped = false;
    }
    //jQuery('#unbounce').modal('show');
    jQuery('#unbounce-new').modal('show');
  }

  connect() {
    if (!this._featureAuthService.features.integrations['unbounce'] && !this._featureAuthService.features.integrations['unbounce_limited']) {
      return;
    }
    jQuery('#btnunbounce').html('Please Wait...');
    let data = {
      api_key: this.unbounceForm.value.apiKey,
      account_name : this.unbounceForm.value.accountName,
      company: this.company,
      isCheckingTestAccount : this.isCheckingTestAccount
    };

    this._integrationService.authorization(data, 'unbounce')
      .subscribe((response) => {
        if (response.statusCode === 401 || response.statusCode === 403) {
          this.isError = true;
          jQuery('#btnunbounce').html('Connect');
          this.errorMsg = 'Invalid Credentials - Please re-enter your unbounce Api key';
        } else{
          jQuery('#btnunbounce').html('Connect');
          if(!this.isCheckingTestAccount){
            this.isListSelected = false;
            this.isConnected = true;
            this.errorMsg = "";
            this.isError = false;
            window.toastNotification('You have successfully integrated with unbounce');
            this.getList();
            this.notify.emit({
              action: 'connect'
            });
          }else{
            jQuery('#'+this.unbounceForm.value.apiKey).removeClass('hide');
          }
        }
      }, (error) => {
        this.isError = true;
        jQuery('#btnunbounce').html('Connect');
        if (error.error.code === 'ENOTFOUND') {
          this.errorMsg = 'Invalid Credentials - Please re-enter your unbounce Api key';
        }
        if (error.error.code === 'E_KEY_EXIST') {
          this.errorMsg = error.error.err_message;
        }
      });
  }

  activate(checked: boolean) {
    this.isMapError = false;
    this.mapError = '';
    jQuery('#unbounce-new').modal('show');
    this.isMapped = false;
    this.isConnected = true;
    this.isListSelected = false;
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
        'list_id': this.selectedListId,
        'email': 'integrations@outgrow.co'
      }
      this._integrationService.testSaveLead('unbounce', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response.status.success) {
            this.sendMapFields();
            this.isMapped = true;
            window.toastNotification('Connection Test Successful');
            this.ViewMappedData(response.dataSent);
            this.updateIntegrationStatus(true);
            window.toastNotification('Connection Test Successful');
          } else {
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            this.isMapError = true;
            this.mapError = 'Field type mismatch. Please fix & retest';
          }
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
          this.isMapError = true;
          this.mapError = 'Invalid Credentials - Please re-enter your unbounce Api key';
        });
    } else {
      this.isMapError = true;
      this.mapError = 'Please reconfigure & select the list where you want to save leads';
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'unbounce': checked
    }
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to unbounce';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to unbounce';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['unbounce_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['unbounce'];
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
    this.mapError = '';
    this.isLeadGenError = false;
    this._integrationService.getCalcBasicFields('unbounce', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if(!result.calc.find((el)=>{ return el['api_key']==='email'})){
          this.isLeadGenError = true;
          this.isLoading = false;
          this.isMapError = true;

         this.mapError ="Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
          jQuery('.btn-test').html('Test Connection').attr('disabled', true);
      } if(!this.isMapError)
        jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        this.isMapError = false;
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
        this.thirdstage = false;
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
    this.mapError = '';
    this.isLeadGenError = false;
    this._integrationService.getCalcMapFields('unbounce', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if(!result.calc.find((el)=>{ return el['api_key']==='email'})){
          this.isLeadGenError = true;
          this.isLoading = false;
          this.isMapError = true;

         this.mapError ="Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
          jQuery('.btn-test').html('Test Connection').attr('disabled', true);
      } if(!this.isMapError)
        jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        this.isMapError = false;
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
        this.isLeadGenError = true;
        if (error.error.err_message === "Cannot read property 'fields' of undefined") {
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
      this._integrationService.sendMapFieldsBasic('unbounce', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('unbounce', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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
    console.log(data);
    this.viewMappedData = [];
    for (let key in data) {
      if (data.hasOwnProperty(key) && key!='group_categories' && key!="list_id") {
        let obj = {};
        obj['key'] = key;
        obj['value'] = data[key];
        this.viewMappedData.push(obj);
      }
    }
  }

  returnFeatureAccess() {
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['unbounce_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['unbounce'];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }
  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'unbounce');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }
  close() {
    jQuery('#mapping-int-toAccess').modal('hide');
    //jQuery('#unbounce').modal('hide');
    jQuery('#unbounce-new').modal('hide');
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    this.thirdstage = false;
    this.listofinterest = [];
    this.InterestList = [];
    this.isMapError = false;
    this.isLoading = false;
    this.isInterestSelected = false;
    this.isMapped = false;
  }

  sync() {
    let self = this;
    jQuery('.sync-leads-mc').html('Please Wait..');
    this._integrationService.syncCalcLeads('unbounce', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        // if (result.success) {
        //   self.notify.emit({
        //     action: 'synLeads'
        //   });
        //   jQuery('.sync-leads-mc').html('Sync');
        //   window.toastNotification('Data has been synced with unbounce');
        // }
        if (result.status == 1) {
          jQuery('.sync-leads-mc').html('Sync');
          window.toastNotification('Data will be synced with unbounce shortly');
        }
        else {
          jQuery('.sync-leads-mc').html('Sync (' + this.pendingLeads + ')');
          jQuery('#syncError-modal').modal('show');
        }
      }, (error) => {
        jQuery('.sync-leads-mc').html('Sync (' + this.pendingLeads + ')');
        jQuery('#syncError-modal').modal('show');
      });
  }
  closeMapped() {
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    jQuery('#unbounce').modal('hide');
  }
  addIsfocusedKey() {
    jQuery('#unbounce_apiKey').addClass('is-focused');
    this.isError = false;
    this.errorMsg = '';
    this.isVariant_error = false;
  }
  removeIsfocusedKey() {
    jQuery('#unbounce_apiKey').removeClass('is-focused');
    let variant = jQuery('.variant_name').val().trim();
    if(variant.length<=0){
      this.isVariant_error = true;
    }else{
      this.isVariant_error = false;
    }
  }

  getList() {
    this.isLoading = true;
    console.log(this.config.list_id,'listt');
    this.selectedListId = this.config.list_id;
    this._integrationService.getList('unbounce')
      .subscribe((response) => {
        console.log(response,'>>>>>>>>', response.pages);
          this.crmList = [];
          this.isListExist = true;
          this.isLoading = false;
          let lists = response.pages;
          for (let key in lists) {
            if (lists.hasOwnProperty(key)) {
              let obj = {};
              obj['list_name'] = lists[key].name;
              obj['list_id'] = lists[key].id;
              this.crmList.push(obj);
            }
          }
      }, (error) => {
        console.log('error', error);
      });
  }

  selectedList(list_id) {
    this.selectedListName = jQuery('#unbounceList option:selected').text();
    console.log(this.selectedListName,'>>>>>>>&&&');
    if (this.selectedListId != '' || !this.selectedListId) {
      this.selectedListId = '';
      this.selectedListId = list_id;
      this.insertFields.splice(3, 1);
    } else {
      this.selectedListId = list_id;
    }
  }


  saveList() {
    let variant = jQuery('.variant_name').val().trim();
    if (!this.selectedListId || this.selectedListId === '0') {
      this.isError = true;
      this.errorMsg = 'Please select the list where you want to save leads';
    } else if (variant.length<=0){
        this.isVariant_error = true;
    } else {
      this.isVariant_error = false;
      jQuery('#btnunbounceList').html('Please wait...');
      this.variant = jQuery('.variant_name').val();
      let data = {
        'list_id': this.selectedListId,
        'list_name': this.selectedListName,
        'variant_name' : this.variant
      }
      console.log(data,'savelist');
      this._integrationService.saveList('unbounce', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response: any) => {
          this.isListSelected = true;
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
      type: 'unbounce'
    });
  }

  back(){
    this.isMapped = false;
    this.isinterestselected = true;
    this.isListSelected = true;
    this.thirdstage = true;
    this.getFields();
  }

  getAccounts() {
    this.isLoading = true;
    this.isAccountSelected = false;
    this.isConnected = false;
    this.accounts =[];
    this._integrationService.getAccount('unbounce')
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
        jQuery('#unbounce-new').modal('show');
      })
  }

  testAccount(account: any) {
    this.unbounceForm.value.apiKey = account;
    this.isCheckingTestAccount  = true;
    this.connect();
    this.isAccountSelected = false
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false
  }

  setAccount(key: any, action: any) {
    let data = {
      key: key,
      action: action
    };
    this.activeAccount = key;
    this._integrationService.setAccount(data, 'unbounce')
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
    let isListEnabled= this.accounts.filter(
      account => account.status === true);
    if(isListEnabled.length===0){
      this.isMapError = true ;
      this.mapError = 'Please Select the Account.';
    }else{
      this.isListSelected = false;
      this.isConnected = true;
      this.errorMsg = "";
      this.isError = false;
      this.getList();
    }
  }

  openNewConnectModal() {
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
    this.integrations.api_key = '';
    this.integrations.account_name = '';
    jQuery('#unbounce-new').modal('show');
  }

  
}
