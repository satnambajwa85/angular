
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
    selector: 'og-sendgrid-component',
    templateUrl: './sendgrid.component.html',
    styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})
export class SendgridComponent implements OnInit, AfterViewInit {
    isConfigured: boolean = false;
    configuration: Integrations = new Integrations();
    config: { active: boolean, map_fields: any[] } = { active: false, map_fields: [] };
    pendingLeads: any = '';
    isLeadsPending: boolean = false;

    form: FormGroup;
    integrations: any = new Integrations({});
    company: any;
    isLeadgenError: boolean = false;
    calcType: string;
    calcAllFileds: any = [];
    crmAllFileds: any = [];
    insertFields: any = [];
    mapFields: any = [];
    viewMappedData: any = [];
    isError: boolean = false;
    errorMsg: string;

    isListExist: boolean = false;
    isConnected: boolean = false;

    mapError: string = '';
    isMapError: boolean = false;
    isLimited: boolean = false;
    isMapped: boolean = false;
    isLoading: boolean = false;
    isLeadGenError: boolean = false;
    isDoubleOptin: boolean = false;
    accounts :any =[];
    isAccountSelected:boolean = true;
    isCheckingTestAccount:boolean = false;
    testDiv:boolean = false;
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
            apiKey: [this.integrations.api_key, Validators.compose([Validators.required])],
            accountName :  ['', Validators.compose([Validators.required])]
        });
    }
    ngOnInit() {

    }
    ngAfterViewInit() {
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
        if (!this._featureAuthService.features.integrations['sendgrid'] && !this._featureAuthService.features.integrations['sendgrid_limited']) {
            return;
        }
        if (this.configuration) {
            this.integrations.api_key = this.configuration.api_key;
            this.isConnected = false;
            this.isMapped = false;
            this.isAccountSelected = false;
        }
        jQuery('#sendgrid-new').modal('show');
    }

    openNewConnectModal() {
        this.isAccountSelected = true;
        this.isConnected = false;
        this.isMapped = false;
        this.integrations.api_key='';
        this.integrations.account_name='';
        jQuery('#sendgrid-new').modal('show');
      }
    connect() {
        this.testDiv = false;
        if (!this._featureAuthService.features.integrations['sendgrid'] && !this._featureAuthService.features.integrations['sendgrid_limited']) {
            return;
        }
        jQuery('#sendgrid_btn').html('please Wait...').attr('disabled', true);
        let data = {
            api_key: this.form.value.apiKey,
            company: this.company,
            isCheckingTestAccount : this.isCheckingTestAccount ,
            account_name: this.form.value.accountName,
        };
        this._integrationService.authorization(data, 'sendgrid')
            .subscribe((response) => {
                if (response.hasOwnProperty('errors')) {
                    this.isError = true;
                    jQuery('#sendgrid_btn').html('Connect').attr('disabled', false);

                    this.errorMsg = 'Invalid Credentials - Please re-enter your sendgrid-crm Auth Token ';

                } else {
                    if(!this.isCheckingTestAccount){
                        this.isError = false;
                        this.isConnected = true;
                        this.getFields();
                        this.notify.emit({
                            action: 'connect'
                        });
                        jQuery('#sendgrid_btn').html('Reconfigure').attr('disabled', false);
                        window.toastNotification('You have successfully integrated with sendgrid.');
                      }else{
                          console.log(this.form.value.accountName);
                          jQuery("#"+this.form.value.accountName).removeClass('hide');
                      }
                   

                    
                }
            }, (error) => {
                this.isError = true;
                if (error.error.code === 'E_KEY_EXIST') {
                    this.errorMsg = error.error.err_message;
                  }
                else if (error.error.code === 'ENOTFOUND' || error.error.code === 'E_UNEXPECTED') {
                    this.errorMsg = 'Authentication error - Please check your credential';
                } else {
                    this.errorMsg = error.error.message;
                }
                
                jQuery('#sendgrid_btn').html('Connect').attr('disabled', false);
            });
    }

    activate(checked: boolean) {
        jQuery('#sendgrid-new').modal('show');
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
            email: 'John@outgrow.co'
        }
        console.log(this.insertFields);
        if(!this.insertFields.find((el)=>{ return el['calc']==='Email'})){
            this.mapError = 'Warning - Email Field is required.';
            this.isMapError = true;
            jQuery('#zoho-test').html('Test Connection').attr('disabled', false);
            return;
          }
        
        if (data.map_fields.length > 0) {
            this._integrationService.testSaveLead('sendgrid', this.jsonBuilderHelper.getJSONBuilt()._id, data)
                .subscribe((response) => {
                    console.log(response);
                    if (response.status.data.success) {
                        this.sendMapFields();
                        this.isMapped = true;
                        window.toastNotification('Connection Test Successful');
                        this.ViewMappedData(response.dataSent);
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
            this.mapError = 'Minimum 1 field is required for sendgrid';
        }
    }

    updateIntegrationStatus(checked: boolean) {
        let data = {
            'sendgrid': checked
        }
        this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                this.notify.emit({
                    action: 'activate'
                });
                let toastText = '';
                if (checked) {
                    toastText = 'Integration Activated !! The leads from this calculator will be sent to zoho-crm';
                } else {
                    toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to zoho-crm';
                }
                window.toastNotification(toastText);
            }, (error) => {
                console.log(error);
            });
    }

    getFields() {
        let isIntegrationLimited: boolean = this._featureAuthService.features.integrations['sendgrid_limited'];
        let isIntegrationFull: boolean = this._featureAuthService.features.integrations['sendgrid'];
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
        this.isLeadgenError = false;

        this.mapError = '';
        this._integrationService.getCalcBasicFields('sendgrid', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                console.log(result);
                if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
                    this.isLeadgenError = true;
                    this.isLoading = false;
                    this.isMapError = true;

                    this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
                    jQuery('.btn-test').html('Test Connection').attr('disabled', true);
                } if (!this.isMapError)
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
                        if (crmfields[key].name == 'Last Name') {
                            obj['calc_key'] = 'lastName';
                        }
                        if (crmfields[key].name == 'Email') {
                            obj['calc_key'] = 'Email';
                        }
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
                if (this.insertFields.length == 0)
                this.insertFields.push(
                    { 'calc': 'Email', 'crm': 'Email' }
                );

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
        this.mapError = '';
        this.isLeadgenError = false;


        this._integrationService.getCalcMapFields('sendgrid', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                console.log(result);
                if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
                    this.isMapError = true;
                    this.isLeadgenError = true;
                    this.isLoading = false;
                    this.mapError = "Warning - There is no Email id or Last Name field in your lead generation form. It is recommended to add email id and Last Name field in the lead generation form to proceed with this integration. "
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
                        if (obj['calc_key'] === 'email') {
                            obj['calc_key'] = 'Email';
                            obj['calc_value'] = 'Sample : integrations@outgrow.co';
                        }

                        else {
                            obj['calc_value'] = 'Sample : ' + calcfiedls[key].value;
                        }
                        this.calcAllFileds.push(obj);
                    }
                }
                for (let key in crmfields) {
                    if (crmfields.hasOwnProperty(key) && crmfields[key].key !== 'Name') {
                        let obj = {};
                        if (crmfields[key].name == 'Last Name') {
                            obj['calc_key'] = 'lastName';
                        }
                        if (crmfields[key].name == 'Email') {
                            obj['calc_key'] = 'Email';
                        }

                        obj['crm_name'] = crmfields[key].name.length >= 40 ? crmfields[key].name.slice(0, 40) + '...' : crmfields[key].name;
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
                if (this.insertFields.length == 0)
                    this.insertFields.push(
                        { 'calc': 'Email', 'crm': 'Email' }
                    );

            }, (error) => {
                this.isLoading = false;
                if (error.error.err_message === "Cannot read property 'fields' of undefined") {
                    this.isLeadGenError = false;
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
            this._integrationService.sendMapFieldsBasic('sendgrid', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
                .subscribe((result) => {
                    this.notify.emit({
                        action: 'activate'
                    });
                }, (error) => {
                    jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                });
        } else {
            this.checkExistingField();
            this._integrationService.sendMapFields('sendgrid', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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
        let isIntegrartionLimited: boolean = this._featureAuthService.features.integrations['sendgrid_limited'];
        let isIntegrationFull: boolean = this._featureAuthService.features.integrations['sendgrid'];

        if (isIntegrartionLimited || isIntegrationFull) {
            return true;
        } else if (!isIntegrationFull && !isIntegrartionLimited) {
            return false;
        }
    }
    premiumPopup(feature: string) {
        this._featureAuthService.setSelectedFeature(feature, 'sendgrid');
        jQuery('.' + feature).addClass('activegreen limited-label');
        jQuery('#premiumModal').modal('show');
        jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
    close() {
        jQuery('#sendgrid-new').modal('hide');
        this.crmAllFileds = [];
        this.calcAllFileds = [];
        this.insertFields = [];
        this.isAccountSelected = false;
        this.isMapped = false;
    }

    sync() {
        let self = this;
        jQuery('.sync-leads-zoho').html('Please Wait..');
        this._integrationService.syncCalcLeads('sendgrid', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                if (result.status == 1) {
                    jQuery('.sync-leads-zoho').html('Sync');
                    window.toastNotification('Data will be synced with sendgrid shortly');
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
        jQuery('#sendgrid-new').modal('hide');
    }
    addIsfocusedKey() {
        jQuery('#zoho_apiKey').addClass('is-focused');
        this.isError = false;
        this.errorMsg = '';
    }
    removeIsfocusedKey() {
        jQuery('#zoho_apiKey').removeClass('is-focused');
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
            type: 'sendgrid'
        });
    }

    back() {
        this.isMapped = false;
        this.isConnected = true;
        this.getFields();
    }
    getAccounts(){
        this.isMapped = false;
        this.isConnected = false;
        this.isLoading = true;
        this.accounts =[];
        this.isAccountSelected = false; 
        this._integrationService.getAccount('sendgrid')
        .subscribe((response: any) => {
          let accounts= response.accounts;
          let cnt :any= 0 ;
          for(let key in accounts) {
            cnt++;
            if (accounts.hasOwnProperty(key)) {
              let obj = {};
              obj['name'] = accounts[key].account_name ?accounts[key].account_name : '#Account '+cnt ;
              obj['key'] = accounts[key].api_key;
              obj['status'] = accounts[key].active ? accounts[key].active : false;
              obj['access_token'] =accounts[key].access_token;
              this.accounts.push(obj);
              this.isLoading = false;
            }
          }
          jQuery('#sendgrid-new').modal('show');
          
         })
       }
       testAccount(account:any,accountname:any){
        this.form.value.apiKey = account;
        this.form.value.accountName = accountname;
        this.isCheckingTestAccount  = true;
        this.connect();
        this.isAccountSelected = false
        this.isConnected = false;
        this.isMapped = false
        }
      
       editAccount(key, name){
        this.isAccountSelected = true;
        this.integrations.api_key = key;
        this.integrations.account_name = name;
        this.isConnected = false;
        this.isMapped = false;
        jQuery('#zoho-new').modal('show');
       }
      
       setAccount(key:any,name:any, action:any){
        let data ={
          key :key,
          name :name,
          action: action
        }
        console.log(data);
        this._integrationService.setAccount(data, 'sendgrid')
          .subscribe((response) => {
           
              if(action==='edit'){
                window.toastNotification('You have successfully selected the account');
              }if(action==='delete'){
                window.toastNotification('You have successfully deleted the account');
                
              }
              this.getAccounts();
          }, (error) => {
          });
        }
      
        previous(flag: any){
          if(flag==='reconfig'){
            this.isAccountSelected = false; 
            this.isConnected = false; 
            this.isMapped = false;
            this.getAccounts();
          }
      
        }
      
        showList(){
          this.isConnected = true;
          this.errorMsg = "";
          this.isError = false;
          this.getFields();
        }
        checkAccountName(event) {
            console.log(event.target.value);
            this.isError = false;
            let data = { ac_name: event.target.value };
            this._integrationService.checckAccount(data, 'getresponse')
              .subscribe((res) => {
                if (res.Exist) {
                  this.isError = true;
                  this.errorMsg = "Account name is allready use";
                }
              })
        
          }

}
