import {Component, EventEmitter, OnInit, Output , AfterViewInit} from "@angular/core";
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
  selector: 'og-campaignmonitor-component',
  templateUrl: './campaignmonitor.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})

export class CampaignMonitorComponent implements OnInit , AfterViewInit {
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[], list_id: string, list_name: string } = { active: false, map_fields: [], list_id: '', list_name: '' };
  pendingLeads: any;
  isLeadsPending: boolean = false;

  campaignmonitorForm: FormGroup;
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
  isMapped: boolean = false;
  isLoading: Boolean = false;
  testEmail: string;
  isLeadGenError : Boolean = false;
  accounts: any = [];
  isAccountSelected: boolean = false;
  isCheckingTestAccount:boolean = false;
  activeAccount:string ='';
  @Output() notify = new EventEmitter();
  constructor(
    private _integrationService: IntegrationService,
    private jsonBuilderHelper: JSONBuilder,
    private _script: Script,
    private fb: FormBuilder,
    private _subdomainService: SubDomainService,
    private _featureAuthService: FeatureAuthService,
    private _cookieService: CookieService) {
    this.company = this._subdomainService.subDomain.company_id;
    this.campaignmonitorForm = this.fb.group({
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

  ngAfterViewInit(){

  }

  openConnectModal() {
    this.isAccountSelected = true;
    if (!this._featureAuthService.features.integrations['campaignmonitor'] && !this._featureAuthService.features.integrations['campaignmonitor_limited']) {
      return;
    }
    if (this.configuration) {
      this.integrations.api_key = this.configuration.api_key;
      this.isConnected = false;
      this.isAccountSelected = false;
      this.isListSelected = false;
      this.isMapped = false;

    }
    jQuery('#campaignmonitor-new').modal('show');
  }
  openNewConnectModal() {
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
    this.integrations.api_key = '';
    this.integrations.account_name = '';
    jQuery('#campaignmonitor-new').modal('show');
  }

  connect() {
    if (!this._featureAuthService.features.integrations['campaignmonitor'] && !this._featureAuthService.features.integrations['campaignmonitor_limited']) {
      return;
    }
    jQuery('#btnCampaignMonitor').html('Please Wait...');
    let data = {
      api_key: this.campaignmonitorForm.value.apiKey,
      company: this.company,
      isCheckingTestAccount : this.isCheckingTestAccount ,
      account_name: this.campaignmonitorForm.value.accountName,
    };
    this._integrationService.authorization(data, 'campaignmonitor')
      .subscribe((response) => {
        console.log(response);
        if (response.Code === 50) {
          this.isError = true;
          jQuery('#btnCampaignMonitor').html('Connect');
          this.errorMsg = 'Invalid Credentials - Please re-enter your CampaignMonitor Api key';
        } else if (response.status === 403) {
          this.isError = true;
          jQuery('#btnCampaignMonitor').html('Connect');
          this.errorMsg = 'This account has been deactivated';
        } else if (response[0].ClientID) {
           if(!this.isCheckingTestAccount){
          jQuery('#btnCampaignMonitor').html('Connect');
          this.isListSelected = false;
          this.isConnected = true;
          window.toastNotification('You have successfully integrated with CampaignMonitor');
          this.getList();

          this.notify.emit({
            action: 'connect'
          });
        }
        else{
          jQuery('#'+this.campaignmonitorForm.value.apiKey).removeClass('hide');
        }
       }
      }, (error) => {
        this.isError = true;
        jQuery('#btnCampaignMonitor').html('Connect');
        if (error.error.code === 'ENOTFOUND') {
          this.errorMsg = 'Invalid Credentials - Please re-enter your Campaignmonitor Api key';
        }
        if (error.error.code === 'E_KEY_EXIST') {
          this.errorMsg = error.error.err_message;
        }
      });
  }

  activate(checked: boolean) {
    this.isMapError = false;
    this.mapError = '';
    jQuery('#campaignmonitor-new').modal('show');
    this.isMapped = false;
    this.isConnected = true;
    this.isListSelected = false;
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.isListSelected = false;
    this.integrations.api_key = this.configuration.api_key;
    this.getList();
  }

  test() {
    let emailMapped = false;
    this.insertFields.forEach(element => {
      if (element.calc === 'email' && element.crm === 'Email') {
        emailMapped = true;
      }
    });
    if (this.selectedListId && emailMapped) {
      this.isError = false;
      jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
      let data = {
        'map_fields': this.insertFields,
        'list_id': this.selectedListId,
        'email': 'integrations@outgrow.co'
      };

      this._integrationService.testSaveLead('campaignmonitor', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response.status.data.success) {
            this.sendMapFields();
            this.isMapped = true;
            window.toastNotification('Connection Test Successful');
            this.ViewMappedData(response.dataSent);
            console.log(this.viewMappedData);
            // this.isListSelected = false;
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
          this.mapError = 'Invalid Credentials - Please re-enter your CampaignMonitor Api key';
        });
    } else if (emailMapped == false) {
      this.isMapError = true;
      this.mapError = 'Email is required for CampaignMonitor';
    }
    else {
      this.isMapError = true;
      this.mapError = 'Please reconfigure & select the list where you want to save leads';
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'campaignmonitor': checked
    };
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to CampaignMonitor';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to CampaignMonitor';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['campaignhmonitor_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['campaignmonitor'];
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
    this._integrationService.getCalcBasicFields('campaignmonitor', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if(!result.calc.find((el)=>{ return el['api_key']==='email'})){
          this.isMapError = true;
          this.isLeadGenError = true;
          this.isLoading = false;
         this.mapError ="Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
          jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
      } else{
        jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', false);
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
            obj['crm_name'] = crmfields[key].name.length >=40 ? crmfields[key].name.slice(0, 40) + '...':crmfields[key].name;
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
       }
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

  getFullMapFields() {

    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this.mapError = '';
    this._integrationService.getCalcMapFields('campaignmonitor', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if(!result.calc.find((el)=>{ return el['api_key']==='email'})){
          this.isMapError = true;
          this.isLeadGenError = true;
          this.isLoading = false;
          this.mapError ="Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
          jQuery('.btn-test').html('Test Connection').attr('disabled', true);
      } if(!this.isMapError)
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
          if (crmfields.hasOwnProperty(key) && crmfields[key].key !== 'Name') {
            let obj = {};
            obj['crm_name'] = crmfields[key].name.length >=40 ? crmfields[key].name.slice(0, 40) + '...':crmfields[key].name;
            obj['crm_key'] = crmfields[key].name;
            let selectedMapFields = this.config.map_fields;
            let mpFiledLength = selectedMapFields.length;
            for (let i = 0; i < mpFiledLength; i++) {
              if (crmfields[key].name === selectedMapFields[i].crm) {
                obj['calc_key'] = selectedMapFields[i].calc;
                let insertObj = {};
                insertObj['calc'] = selectedMapFields[i].calc;
                insertObj['crm'] = crmfields[key].name;
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
          tmp.push(obj);
          break;
        }
      }
    }
    this.insertFields = tmp;
  }

  sendMapFields() {
    jQuery('.btn-test').html('PLEASE WAIT').attr('disabled', false);
    this.crmList.forEach(element => {
      if (element.list_id == this.selectedListId) {
        this.selectedListName = element.list_name
      }
    });
    let data = {
      'map_fields': this.insertFields,
      'list_id': this.selectedListId,
      'list_name': this.selectedListName
    };
    if (this.isLimited) {
      this._integrationService.sendMapFieldsBasic('campaignmonitor', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('campaignmonitor', this.jsonBuilderHelper.getJSONBuilt()._id, data)
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
      if (data.hasOwnProperty(key) && key!='list_id') {
        let obj = {};
        obj['key'] = key;
        obj['value'] = data[key];
        this.viewMappedData.push(obj);
      }
    }
  }

  returnFeatureAccess() {
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['campaignmonitor_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['campaignmonitor'];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }
  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'campaignmonitor');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }
  close() {
    //jQuery('#mapping-int-toAccess').modal('hide');
    jQuery('#campaignmonitor-new').modal('hide');
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    this.isError = false;
    this.isAccountSelected = false;
    this.isMapped = false;
    this.isListSelected = false;
    this.isConnected = false;
  }

  sync() {
    let self = this;
    jQuery('.sync-leads-cm').html('Please Wait..');
    this._integrationService.syncCalcLeads('campaignmonitor', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        // if (result.success) {
        //   self.notify.emit({
        //     action: 'synLeads'
        //   });
        //   jQuery('.sync-leads-cm').html('Sync');
        //   window.toastNotification('Data has been synced with Campaign monitor');
        // }
        if (result.status == 1) {
          jQuery('.sync-leads-cm').html('Sync');
          window.toastNotification('Data will be synced with CampaignMonitor shortly');
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
    jQuery('#campaignmonitor-new').modal('hide');
  }
  addIsfocusedKey() {
    jQuery('#campaignmonitor_apiKey').addClass('is-focused');
    this.isError = false;
    this.errorMsg = '';
  }
  removeIsfocusedKey() {
    jQuery('#campaignmonitor_apiKey').removeClass('is-focused');
  }

  getList() {
    this.isLoading = true;
    this.selectedListId = this.config.list_id;
    this._integrationService.getList('campaignmonitor')
      .subscribe((response) => {
        if (response.total_items !== 0) {
          this.crmList = [];
          this.isListExist = true;
          this.isLoading = false;
          let lists = response;
          for (let key in lists) {
            if (lists.hasOwnProperty(key)) {
              let obj = {};
              obj['list_name'] = lists[key].Name;
              obj['list_id'] = lists[key].ListID;
              this.crmList.push(obj);
            }
          }
        } else {
          this.isListExist = false;
        }
      }, (error) => {
        console.log('error', error);
      });
  }

  selectedList(list_id) {
    this.crmList.forEach(element => {
      if (element.list_id === list_id) {
        this.selectedListName = element.list_name;
      }
    });
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
      jQuery('#btnMailChimpList').html('Please wait...');
      this.isListSelected = true;
      let data = {
        'list_id': this.selectedListId,
        'list_name': this.selectedListName
      };
      this._integrationService.saveList('campaignmonitor', this.jsonBuilderHelper.getJSONBuilt()._id, data)
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
      type: 'campaignmonitor'
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
    this._integrationService.getAccount('campaignmonitor')
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
          
        jQuery('#campaignmonitor-new').modal('show');

      })
  }

  testAccount(account: any) {
    this.campaignmonitorForm.value.apiKey = account;
    this.isCheckingTestAccount  = true;
    this.connect();
    this.isAccountSelected = false
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false
  }

  editAccount(key, name) {
    this.isAccountSelected = true;
    this.integrations.api_key = key;
    this.integrations.account_name = name;
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
    jQuery('#campaignmonitor-new').modal('show');
  }

  setAccount(key: any, name: any, action: any) {
    this.isError = false;
    let data = {
      key: key,
      name: name,
      action: action
    }
    this.activeAccount = key;
    this._integrationService.setAccount(data, 'campaignmonitor')
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
  checkAccountName(event) {
    this.isError = false;
    let data = { ac_name: event.target.value };
    this._integrationService.checckAccount(data, 'campaignmonitor')
      .subscribe((res) => {
        if (res.Exist) {
          this.isError = true;
          this.errorMsg = "Account name is allready use";
        }
      })

  }

}


