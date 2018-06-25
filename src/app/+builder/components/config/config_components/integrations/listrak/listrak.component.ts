import { Component, EventEmitter, OnInit, Output, AfterViewInit } from '@angular/core';
import {Integrations} from "../../../../../../../shared/models/integrations";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {SubDomainService} from "../../../../../../../shared/services/subdomain.service";
import {FeatureAuthService} from "../../../../../../../shared/services/feature-access.service";
import {IntegrationService} from "../../../../../../../shared/services/integration.service";
import {JSONBuilder} from "../../../../../services/JSONBuilder.service";

declare var jQuery;
declare var window;

@Component({
  selector: 'og-listrak-component',
  templateUrl: './listrak.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css',
    './../../../../../../../../assets/css/sahil-hover.css']
})
export class ListrakComponent implements OnInit, AfterViewInit {
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[] } = {active: false, map_fields: []};
  pendingLeads: any;
  isLeadsPending: boolean = false;

  form: FormGroup;
  integrations: any = new Integrations({});
  company: any;
  accounts = [];

  calcType: string;
  calcAllFields: any = [];
  crmAllFields: any = [];
  insertFields: any = [];
  mapFields: any = [];
  mappedData: any = [];
  isError: boolean = false;
  errorMsg: string;
  selectedListId: string = '0';

  crmList: any = [];
  isListExist: boolean = false;
  isConnected: Boolean = false;
  thirdStage: Boolean = false;

  mapError: string = '';
  isMapError: boolean = false;
  isLimited: boolean = false;
  isMapped: boolean = false;
  isLoading: Boolean = false;
  isListSelected: boolean = false;
  isLeadgenError:boolean = false;
  isAccountSelected: boolean = false;
  @Output() notify = new EventEmitter();

  constructor(private _subdomainService: SubDomainService,
              private _featureAuthService: FeatureAuthService,
              private fb: FormBuilder,
              private jsonBuilderHelper: JSONBuilder,
              private _integrationService: IntegrationService) {
    this.company = this._subdomainService.subDomain.company_id;

    this.form = this.fb.group({
      username: ['', Validators.compose([Validators.required])],
      password: ['', Validators.compose([Validators.required])]
    })
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

  ngAfterViewInit() {

  }

  returnFeatureAccess() {

    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['listrak_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['listrak'];

    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }

  openConnectModal() {
    this.isAccountSelected = true;
    if (!this._featureAuthService.features.integrations['listrak'] &&
      !this._featureAuthService.features.integrations['listrak_limited']) {
      return;
    }
    this.isError = false;
    this.isConnected = false;
    this.isMapped = false;
    this.isListSelected = false;
    this.isListSelected = false;
    this.thirdStage = false;
    this.isListExist = false;
    this.crmList = [];

    if (this.configuration) {
      this.integrations.username = this.configuration.username;
      this.integrations.password = this.configuration.password;
    }
    jQuery('#listrak-new').modal('show');
  }

  openNewConnectModal() {
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
    this.integrations.api_key = '';
    this.integrations.account_name = '';
    jQuery('#listrak-new').modal('show');
  }

  connect() {
    if (!this._featureAuthService.features.integrations['listrak'] &&
      !this._featureAuthService.features.integrations['listrak_limited']) {
      return;
    }
    let data = {
      username: this.form.value.username,
      password: this.form.value.password,
      company: this.company
    };
    jQuery('.btn-connect-listrak').html('Please Wait...').attr('disabled', true);
    this._integrationService.authorization(data, 'listrak')
      .subscribe((response) => {
        if (Array.isArray(response)) {
          this.isError = false;
          this.isConnected = true;
          this.notify.emit({
            action: 'connect'
          });
          jQuery('.btn-connect-listrak').html('Reconfigure Listrak').attr('disabled', false);
          response.forEach(list => {
            let obj = {};
            obj['list_name'] = list.ListName;
            obj['list_id'] = list.ListID;
            this.crmList.push(obj);
          });
          window.toastNotification('You have successfully integrated with Listrak.');
        } else {
          this.isError = true;
          this.errorMsg = 'Invalid Credentials - Please Enter correct Username/Password';
          jQuery('.btn-connect-listrak').html('Connect Listrak').attr('disabled', false);
        }

      }, (error) => {
        if (error.error.code === 'ENOTFOUND' || error.error.code === 'E_UNEXPECTED') {
          this.errorMsg = error.error.err_message;
        } else {
          this.errorMsg = error.error.message;
        }
        this.isError = true;
        jQuery('.btn-connect-listrak').html('Connect').attr('disabled', false);
      });
  }

  close() {
    jQuery('#listrak-new').modal('hide');
    this.crmAllFields = [];
    this.calcAllFields = [];
    this.insertFields = [];
    this.isMapError = false;
    this.isLoading = false;
    this.isMapped = false;
    this.isAccountSelected = false;
    this.isConnected = false;
    this.isListSelected = false;
  }

  activate(checked: boolean) {
    this.isMapError = false;
    this.mapError = '';
    this.isError = false;
    jQuery('#listrak-new').modal('show');
    this.isMapped = false;
    this.isConnected = true;
    this.calcAllFields = [];
    this.crmAllFields = [];
    this.insertFields = [];
    this.isListSelected = false;
    this.integrations.username = this.configuration.username;
    this.integrations.password = this.configuration.password;
    this.getList();
    this.getFields();
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

  getList(credentials?: any) {
    this.isLoading = true;
    // this.selectedListId = this.config.list_id;
    this._integrationService.getList('listrak', credentials)
      .subscribe((response) => {
        this.crmList = [];
        this.isListExist = true;
        this.isLoading = false;
        this.crmList = [];
        response.forEach(list => {
          let obj = {};
          obj['list_name'] = list.ListName;
          obj['list_id'] = list.ListID;
          this.crmList.push(obj);
        });
      }, (error) => {
        console.log('error', error);
        this.isError = true;
        this.errorMsg = 'Error while fetching list';
      });
  }

  saveList() {
    if (!this.selectedListId || this.selectedListId === '0') {
      this.isError = true;
      this.errorMsg = 'Please select the list where you want to save leads';
    } else {
      this.isListSelected = true;
      jQuery('#btnListrakList').html('Please wait...');
      let data = {
        list_id: this.selectedListId
      };
      this._integrationService.saveList('listrak', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response: any) => {
          this.thirdStage = true;
          this.getFields();
        }, (error) => {
          console.log('error', error);
        });
    }
  }

  getAccounts() {
    this.isLoading = true;
    this.accounts = [];
    this.isAccountSelected = false;
    this._integrationService.getAccount('listrak')
      .subscribe((response: any) => {
        let accounts = response.accounts;
        let cnt: any = 0;
        for (let key in accounts) {
          cnt++;
          if (accounts.hasOwnProperty(key)) {
            let obj = {};
            // obj['name'] = accounts[key].username ? accounts[key].username : 'Account#' + cnt;
            // obj['key'] = accounts[key].api_key;
            // obj['status'] = accounts[key].active ? accounts[key].active : false;
            // obj['access_token'] = accounts[key].access_token;

            obj['name'] = accounts[key].username ? accounts[key].username : 'Account#' + cnt;
            obj['username'] = accounts[key].username ? accounts[key].username : 'Account#' + cnt;
            obj['password'] = accounts[key].password;
            obj['status'] = accounts[key].active ? accounts[key].active : false;
            this.accounts.push(obj);
            this.isLoading = false;
          }
        }
        jQuery('#listrak-new').modal('show');
      })
  }

  getFields() {

    this.isLoading = true;
    this.isMapError = false;
    this.isLeadgenError = false;
    this.mapError = '';
    this.calcAllFields = [];

    this._integrationService.getCalcMapFields('listrak', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if(!result.calc.find((el)=>{ return el['api_key']==='email'})){
          this.isLeadgenError = true;
          this.isLoading = false;
          this.isMapError = true;

         this.mapError ="Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "

      } else{
        this.isLoading = false;
        let calcfields = result.calc;
        let selectedMapFields = this.config.map_fields;
        let mapFieldLength = selectedMapFields.length;
        for (let key in calcfields) {
          if (calcfields.hasOwnProperty(key)) {
            let obj = {};
            let insertObj = {};
            obj['calc_name'] = calcfields[key].name;
            obj['calc_key'] = calcfields[key].api_key;
            if (obj['calc_key'] === 'email') {
              obj['calc_value'] = 'Sample : integrations@outgrow.co';
            } else {
              obj['calc_value'] = 'Sample : ' + calcfields[key].value;
            }

            if (obj['calc_key'] === 'email' && mapFieldLength == 0) {
              obj['crm_key'] = 'email';
              insertObj['calc'] = obj['calc_key'];
              insertObj['crm'] = obj['crm_key'];
              this.insertFields.push(insertObj);
            } else if (obj['calc_key'] === 'fullName' && mapFieldLength == 0) {
              obj['crm_key'] = 'name';
              insertObj['calc'] = obj['calc_key'];
              insertObj['crm'] = obj['crm_key'];
              this.insertFields.push(insertObj);
            }
            else if (mapFieldLength > 0) {
              for (let i = 0; i < mapFieldLength; i++) {
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
            this.calcAllFields.push(obj);
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

  checkExistingField() {
    let tmp = [];
    for (let i in this.calcAllFields) {
      for (let j in this.insertFields) {
        if (this.insertFields[j]['calc'] == this.calcAllFields[i]['calc_key']) {
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
    };
    if (this.isLimited) {
      this._integrationService.sendMapFieldsBasic('listrak', this.jsonBuilderHelper.getJSONBuilt()._id,
        this.insertFields).subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
      }, (error) => {
        jQuery('.btn-test').html('Test Connection').attr('disabled', false);
      });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('listrak', this.jsonBuilderHelper.getJSONBuilt()._id,
        this.insertFields).subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
      }, (error) => {
        jQuery('.btn-test').html('Test Connection').attr('disabled', false);
      });
    }
  }

  test() {
    jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
    let data = {
      'map_fields': this.insertFields,
      email: 'John@outgrow.co'
    };
    if (data.map_fields.length > 0) {
      this._integrationService.testSaveLead('listrak', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response.status.success) {
            this.sendMapFields();
            this.isMapped = true;
            this.viewMappedData(response.dataSent);
            this.updateIntegrationStatus(true);
            window.toastNotification('Connection Test Successful');
          } else {
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
      this.mapError = 'Minimum 1 field is required for Listrak';
    }
  }

  viewMappedData(data: any) {
    this.mappedData = [];
    for (let key in data) {
      if (data.hasOwnProperty(key) && key !== 'list_id') {
        let obj = {};
        obj['key'] = key;
        obj['value'] = data[key];
        this.mappedData.push(obj);
      }
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'listrak': checked
    };
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to Listrak';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Listrak';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  back() {
    this.isMapped = false;
    this.isConnected = true;
    this.getFields();
  }

  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'listrak'
    });
  }

  testAccount(account: any) {
    this.form.value.apiKey = account;
    this.connect();
    this.isAccountSelected = false
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false
  }

  editAccount(key) {
    this.isAccountSelected = true;
    this.integrations.api_key = key;
    //this.integrations.account_name = name;
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
    jQuery('#listrak-new').modal('show');
  }

  showList() {
    let isListEnabled = this.accounts.filter(
      account => account.status === true);
    if (isListEnabled.length === 0) {
      this.isMapError = true;
      this.mapError = 'Please Select the Account.';
    } else {
      this.isListSelected = false;
      this.isConnected = true;
      this.errorMsg = "";
      this.isError = false;
      this.getList(isListEnabled[0]);
    }
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

  setAccount(key: any, action: any) {
    let data = {
      username: key,
      action: action
    };
    this._integrationService.setAccount(data, 'listrak')
      .subscribe((response) => {
        if (action === 'edit') {
          window.toastNotification('You have successfully selected the account');
        }
        if (action === 'delete') {
          window.toastNotification('You have successfully deleted the account');
        }
        this.getAccounts();
      }, (error) => {
      });
  }

  addIsfocusedUsername() {
    jQuery('#username').addClass('is-focused');
  }

  removeIsfocusedUsername() {
    jQuery('#username').removeClass('is-focused');
  }

  addIsfocusedPassword() {
    console.log('fhfghfghfjhjfhhfj')
    jQuery('.password').addClass('is-focused');
    jQuery('.control-label').addClass('active');
  }

  removeIsfocusedPassword() {
    jQuery('.password').removeClass('is-focused');
    jQuery('.control-label').removeClass('active');
  }
  premiumPopup(feature:string){
    this._featureAuthService.setSelectedFeature(feature,'listrak');
    jQuery('.'+feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }

}
