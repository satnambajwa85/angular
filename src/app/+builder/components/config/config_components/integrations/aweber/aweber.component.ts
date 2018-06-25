import {Component, EventEmitter, OnInit, Output,AfterViewInit} from "@angular/core";
import {FormBuilder, FormGroup} from "@angular/forms";
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
  selector: 'og-aweber-component',
  templateUrl: './aweber.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})

export class AweberComponent implements OnInit , AfterViewInit {
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[], list_id: string, account_id: string, list_name: string, tags: string } = { active: false, map_fields: [], list_id: '', account_id: '', list_name: '', tags: '' };
  pendingLeads: any;
  isLeadsPending: boolean = false;
  integrations: any = new Integrations({});
  aweberForm: FormGroup;
  calcType: string;
  calcAllFileds: any = [];
  crmAllFileds: any = [];
  insertFields: any = [];
  mapFields: any = [];
  viewMappedData: any = [];
  isError: Boolean = false;
  errorMsg: string;

  crmList = [];
  crmAccount = [];
  mapError: string = '';
  isMapError: Boolean = false;
  isLimited: Boolean = false;
  isTokenExpired: Boolean = false;

  isAccountExist: Boolean = false;
  isListExist: Boolean = false;
  isListSelected: Boolean = false;
  selectedAccountId: any = '';
  selectedListId: any = '';
  selectedListName: string;
  isMapped: Boolean = false;
  isLoading: Boolean = false;
  isLoadMoreList :Boolean = false;
  offset :any;
  isResetList :Boolean = false;
  isLeadGenError : Boolean = false;
  isDoubleOptin: Boolean = false;
  isConnected : Boolean = false;
  accounts: any = [];
  isAccountSelected: Boolean = false;
  isCheckingTestAccount : Boolean = false;
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
    this.aweberForm = this.fb.group({
      tagName: this.integrations.tags
    });
  }

  ngOnInit() {
    this.offset =0;
    this.isLoadMoreList= false;
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

  openAuthModal() {
    this.isAccountSelected = true;
    if (!this._featureAuthService.features.integrations['aweber'] && !this._featureAuthService.features.integrations['aweber_limited']) {
      return;
    }
    //jQuery('#aweber-auth').modal('show');
    jQuery('#aweber-new').modal('show');
  }

  connect() {
    if (!this._featureAuthService.features.integrations['aweber'] && !this._featureAuthService.features.integrations['aweber_limited']) {
      return;
    }
    //jQuery('#aweber-auth').modal('hide');
    jQuery('#aweber-new').modal('hide');
    let data = {};
    this._integrationService.getLink(data, 'aweber')
      .subscribe((response) => {
        let companyId: string = <string>this._subdomainService.subDomain.company_id;
        this._cookieService.createCookie('comp', companyId, 3);
        let newWindow = window.open(response, 'GoogleWindow', 'width=600, height=500,scrollbars=yes');
        if(!newWindow || newWindow.closed || typeof newWindow.closed=='undefined') {
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

            window.toastNotification('You have successfully integrated with Aweber');
            self.getListAccount();
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
    this.isMapped = false;
    this.isListSelected = false;
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.getListAccount();
  }

  test() {
    if (this.selectedListId) {
      let tags = [];
      tags = this.integrations.tags ? this.integrations.tags : this.aweberForm.value.tagName.split(',');
      this.isMapError = false;
      let data = {
        'map_fields': this.insertFields,
        'list_id': this.selectedListId,
        'account': this.selectedAccountId,
        'tags': tags
      }
      jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
      this._integrationService.testSaveLead('aweber', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response.status.success) {
            this.sendMapFields();
            this.isMapped = true;
            this.ViewMappedData(response.dataSent);
            this.updateIntegrationStatus(true);
            window.toastNotification('Connection Test Successful');
          } else {
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            this.isMapError = true;
            this.mapError = response.status.message  ? response.status.message : 'Error in one of your primary key mapping. Please map fields again.';
          }
        }, (error) => {
          jQuery('.btn-test').html('Test').attr('disabled', false);
        });
    } else {
      this.isMapError = true;
      this.mapError = 'Please reconfigure & select the list where you want to save leads';
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'aweber': checked
    }
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to Aweber';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Aweber';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  getListAccount() {
    jQuery('#aweber-new').modal('show');
    this.isLoading = true;
    this.selectedAccountId = this.config.account_id;
    this.selectedListId = this.config.list_id ? this.config.list_id : '0';
    // if (this.config.list_id) {
    //   this.isListExist = true;
    // } else {
    //   this.isListExist = false;
    // }
    this._integrationService.getListAccount('aweber')
      .subscribe((response: any) => {
        if (response.total_size !== 0) {
          this.crmAccount = [];
          this.crmList = [];
          this.isAccountExist = true;
          this.isLoading = false;
          let aweberList = response.entries;
          for (let key in aweberList) {
            if (aweberList.hasOwnProperty(key)) {
              let obj = {};
              //obj['account_id'] = aweberList[key].id;
              this.selectedAccountId = aweberList[key].id;
              //this.crmAccount.push(obj);
            }
          }
          if (this.selectedListId) {
            this.getList(this.selectedAccountId);
          }
        } else {
          //this.isAccountExist = false;
        }
        this.isConnected = false;
        this.isListSelected = false;
        this.isAccountSelected = true;
      }, (error) => {
        console.log('error>>>>>>>>>>', error);
      });
  }

  getList(account_id) {
    jQuery('#aweberList').attr('disabled', false);
    this.isLoading = true;
    if (account_id === '0') {
      this.isError = true;
      jQuery('#btnAweberList').attr('disabled', true);
      this.errorMsg = 'Please select the account where you want to save leads';
    } else {
      jQuery('#btnAweberList').attr('disabled', false);
      let data = {
        "id": account_id,
        "offset": this.offset
      }
      this.isError = false;
      this.selectedAccountId = account_id;
      this.integrations.tags = this.config.tags;
      this._integrationService.getList('aweber', data)
        .subscribe((response: any) => {
          if(response.error){
            if(response.error.status == 401){
              this.errorMsg = "Your access token has expired, you'll have to reconfigure." ;
              this.isError = true;
            }else{
              this.errorMsg = response.error.message ;
              this.isError = true;
            }
            jQuery('#aweberList').attr('disabled', 'disabled');
          }
          this.isListExist = true;
          this.crmList = [];
          this.isLoading = false;
          let aweberLists = response.entries;
          // if(aweberLists.length===0){
          //     console.log(aweberLists.length,'lnnnnnn');
          //   jQuery('#aweber-no-list').modal('show');
          //   //jQuery('#aweber-nolist').modal('show');
          //   //this.resetList();
          // }
          if(response.total_size >=100){
            this.isResetList = true;
            if(aweberLists.length>=100){
              this.isLoadMoreList = true;
            }else{
              this.isLoadMoreList = false;
            }
          }else{
            this.isResetList = false;
          }
            for (let key in aweberLists) {
              if (aweberLists.hasOwnProperty(key)) {
                let obj = {};
                obj['list_name'] = aweberLists[key].name;
                obj['list_id'] = aweberLists[key].id;
                this.crmList.push(obj);
              }
            }
        }, (error) => {
          console.log('error',error);
        });
    }
  }

  selectedList(list_id) {
    this.selectedListName = jQuery('#aweberList :selected').text();
    if (this.selectedListId != '' || !this.selectedListId) {
      this.selectedListId = '';
      this.selectedListId = list_id;
      this.insertFields.splice(3, 1);
    } else {
      this.selectedListId = list_id;
    }
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['aweber_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['aweber'];
    if (isIntegrationLimited && !isIntegrationFull) {
      this.isLimited = true;
      this.isListExist = true;
      this.getBasicMapFields();
    } else {
      this.getFullMapFields();
    }
  }

  getBasicMapFields() {
    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this._integrationService.getCalcBasicFields('aweber', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if(!result.calc.find((el)=>{ return el['api_key']==='email'})){
          this.isMapError = true;
          this.isLeadGenError = true;
          this.isLoading = false;
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
            obj['calc_value'] = 'Sample : ' + calcfiedls[key].value;
            this.calcAllFileds.push(obj);
          }
        }
        for (let key in crmfields) {
          let obj = {};
          obj['crm_name'] = crmfields[key].api_key;
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

      }, (error) => {
        this.isLoading = false;
        if (error.error.err_message === 'invalid_grant: expired access/refresh token') {
            this.isTokenExpired = true ;
            this.isMapError = true;
            this.mapError = 'Configuration error. Seems like your access token has expired. Please';
          } else if (error.error.err_message === 'The REST API is not enabled for this Organization.') {
            this.isTokenExpired = true ;
            this.isMapError = true;
            this.mapError = 'REST API not enabled for your Aweber account. You require Enterprise edition of Aweber for Integration. Please';
          }else  if(error.error.err_message==="Cannot read property 'fields' of undefined"){
            this.isLeadGenError = true;
            this.mapError =  'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
          }else {
            this.isMapError = true;
            this.mapError = error.error.err_message;
          }
      });
  }

  getFullMapFields() {
    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this._integrationService.getCalcMapFields('aweber', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if(!result.calc.find((el)=>{ return el['api_key']==='email'})){
          this.isMapError = true;
          this.isLeadGenError = true;
          this.isLoading = false;
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
            obj['calc_value'] = 'Sample : ' + calcfiedls[key].value;
            this.calcAllFileds.push(obj);
          }
        }
        for (let key in crmfields) {
          let obj = {};
          obj['crm_name'] = crmfields[key].api_key;
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

      }, (error) => {
        this.isTokenExpired = true;
        this.isLoading = false;
        if (error.error.err_message === 'invalid_grant: expired access/refresh token') {
          this.isMapError = true;
          this.mapError = 'Configuration error. Seems like your access token has expired. Please';
        } else if (error.error.err_message === 'The REST API is not enabled for this Organization.') {
          this.isMapError = true;
          this.mapError = 'REST API not enabled for your Aweber account. You require Enterprise edition of Aweber for Integration. Please';
        }else  if(error.error.err_message==="Cannot read property 'fields' of undefined"){
            this.isLeadGenError = true;
            this.mapError =  'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
          }
          else {
          this.isMapError = true;
          this.mapError = error.error.err_message;
        }
      });
  }

  checkExistingField(){
       let tmp = [];
       for(let i in this.calcAllFileds){
           for(let j in this.insertFields){
             if(this.insertFields[j]['calc'] == this.calcAllFileds[i]['calc_key']){
               let obj = {};
               obj['calc'] =  this.insertFields[j]['calc'];
               obj['crm'] =  this.insertFields[j]['crm'];
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
      this._integrationService.sendMapFieldsBasic('aweber', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('aweber', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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

  saveList() {
    this.isMapError = false;
    if (!this.selectedListId || this.selectedListId === '0') {
      this.isError = true;
      this.errorMsg = 'Please select the list where you want to save leads';
    } else {
      this.isError = false;
      jQuery('#btnAweberList').html('Please wait...');
      this.isListSelected = true;
      let tags = [];
      tags = this.integrations.tags ? this.integrations.tags : this.aweberForm.value.tagName.split(',');
      let data = {
        'account_id': this.selectedAccountId,
        'list_id': this.selectedListId,
        'list_name': this.selectedListName,
        'tags': tags
      }
      this._integrationService.saveList('aweber', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response: any) => {
          this.getFields();
        }
        , (error) => {
          console.log('error', error);
        });
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
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['aweber_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['aweber'];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }
  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'aweber');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }
  close() {
    jQuery('#aweber-new').modal('hide');
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
  }

  sync() {
    let self = this;
    jQuery('.sync-leads-aweber').html('Please Wait..');
    this._integrationService.syncCalcLeads('aweber', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        // if (result.success) {
        //   self.notify.emit({
        //     action: 'synLeads'
        //   });
        //   jQuery('.sync-leads-aweber').html('Sync');
        //   window.toastNotification('Data has been synced with Aweber');
        // }
        if (result.status == 1) {
          jQuery('.sync-leads-aweber').html('Sync');
          window.toastNotification('Data will be synced with Aweber shortly');
        }
        else {
          jQuery('.sync-leads-aweber').html('Sync (' + this.pendingLeads + ')');
          jQuery('#syncError-modal').modal('show');
        }
      }, (error) => {
        jQuery('.sync-leads-aweber').html('Sync (' + this.pendingLeads + ')');
        jQuery('#syncError-modal').modal('show');
      });
  }
  closeMapped() {
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    jQuery('#aweber').modal('hide');
  }
   addIsfocusedKey() {
        jQuery('#tagName').addClass('is-focused');
        //this.isError = false;
        //this.errorMsg = '';
    }
    removeIsfocusedKey() {
        jQuery('#tagName').removeClass('is-focused');
    }

  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'aweber'
    });
  }

  back(){
    this.isMapped = false;
    this.isListSelected = true;
    this.getFields();
  }

  fetchList(){
    this.offset = this.offset +100;
    this.getList(this.selectedAccountId);

  }
  resetList(){
    this.offset =0;
    this.getList(this.selectedAccountId);
  }

  getAccounts() {
    this.isConnected = false;
    this.isLoading = true;
    this.isMapped = false;
    this.accounts = [];
    this.isAccountSelected = false;
    this.mapError ='';
    this.isMapError = false;
    this.isError = false;
    this.errorMsg ='';
    jQuery('.after-test').addClass('hide');
    this._integrationService.getAccount('aweber')
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
          return account.access_token;
          }
          return acc;
          });
        jQuery('#aweber-new').modal('show');

      })
  }

  testAccount(deleteId :any , account: any) {
    this.isMapError = false;
    let data ={
      token : account
    }
    let companyId: string = <string>this._subdomainService.subDomain.company_id
    this._integrationService.testAccount(data,'aweber',companyId)
    .subscribe((response: any) => {
     if(response.error){
      this.isError = true;
      this.errorMsg = 'Invalid_grant: expired access/refresh token';
     }else{
      jQuery('#'+deleteId).removeClass('hide');
     }
    this.isConnected = false;
    this.isListSelected = false;
    this.isAccountSelected = false
    }, (error) => {
      console.log('error>>>>>>>>>>', error);
    });
  }

  editAccount(key) {
    jQuery('#aweber-new').modal('hide');
    this.connect();
  }

  setAccount(key: any, action: any) {
    this.isMapError = false;
    let data = {
      key: key,
      action: action
    }
    this.activeAccount = key;
    this._integrationService.setAccount(data, 'aweber')
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
      this.getListAccount();
    }
  }

}