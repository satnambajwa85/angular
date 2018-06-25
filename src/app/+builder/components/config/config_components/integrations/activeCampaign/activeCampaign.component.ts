import { Component, EventEmitter, OnInit, Output, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JSONBuilder } from '../../../../../services/JSONBuilder.service';
import { Integrations } from './../../../../../../../shared/models/integrations';
import { IntegrationService } from './../../../../../../../shared/services/integration.service';
import { SubDomainService } from '../../../../../../../shared/services/subdomain.service';
import { FeatureAuthService } from '../../../../../../../shared/services/feature-access.service';
import {CookieService} from "./../../../../../../../shared/services/cookie.service";

// import {ConfigIntegrationsComponent} from './../integrations.component';
declare var jQuery: any;
declare var window: any;

@Component({
    selector: 'og-activecampaign-component',
    templateUrl: './activeCampaign.component.html',
    styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})

export class ActiveCampaignComponent implements OnInit, AfterViewInit {

    activeCampaignForm: FormGroup;
    isDisabled: boolean = true;
    company: any;
    integrations: any = new Integrations({});
    isLoading: boolean = false;
    configuration: Integrations = new Integrations();
    config: { active: boolean, map_fields: any[], list_id: string } = { active: false, map_fields: [], list_id: '' };
    isActiveCampaignError: boolean = false;
    pendingLeads: any = '';
    activeCampaignErrorMsg: string;
    lists: any;
    selectedList: string = '';
    testLeads: any;
    isListExist: boolean = false;
    isError: boolean = false;

    isConfigured: boolean = false;
    isListSelected: boolean = false;
    activeCampaignLead: boolean = false;
    isConnected: Boolean = false;

    selectedListName: string = '';
    maperror: boolean = false;
    calcAllFileds = [];
    crmAllFileds = [];
    mapFields = [];
    isMapped: boolean = false;
    insertFields = [];
    isLeadsPending: boolean = false;
    calcType: String = '';
    accounts: any = [];
    isAccountSelected: boolean = false;
    isCheckingTestAccount : Boolean = false;
    doubleoptin:Boolean = false;
    isDoubleOptin:boolean = false;
    GDPR:Boolean = false;
    activeAccount:string = '';
    @Output() notify = new EventEmitter();
    constructor(
        //public _parent:ConfigIntegrationsComponent,
        public _integrationService: IntegrationService,
        public jsonBuilderHelper: JSONBuilder,
        public _subdomainService: SubDomainService,
        public fb: FormBuilder,
        public _featureAuthService: FeatureAuthService,
        public _cookieService:CookieService) {
        this.GDPR = this._subdomainService.currentCompany.GDPR;        
        this.company = this._subdomainService.subDomain.company_id;
    }

  ngOnInit() {
    this.initializeActiveCampingForm();
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

  initializeActiveCampingForm() {
        this.activeCampaignForm = null;
        this.activeCampaignForm = this.fb.group({
            apiKey: [this.configuration.api_key, Validators.compose([Validators.required])],
            account: [this.configuration.account, Validators.compose([Validators.required])],
            accountName: ['', Validators.compose([Validators.required])]
        });
    }
    ngAfterViewInit() {

    }

    openConnectModal() {
        this.isAccountSelected = true;
        if (!this._featureAuthService.features.integrations['active_campaign'] && !this._featureAuthService.features.integrations['active_campaign_limited']) {
            return;
        }
        if (this.configuration) {
            this.integrations.api_key = this.configuration.api_key;
            this.integrations.account_name = this.configuration.account_name;
            // this.integrations.api_key = this.configuration.api_key;
            this.isConnected = false;
            this.isListSelected = false;
            this.isMapped = false;
            this.activeCampaignLead = false;
            this.initializeActiveCampingForm();
        }
        jQuery('#activecampaign-new').modal('show');
    }
    openNewConnectModal() {
        this.isAccountSelected = true;
        this.isConnected = false;
        this.isListSelected = false;
        this.isMapped = false;
        this.configuration.api_key = '';
        this.integrations.account_name = '';
        this.configuration.account = '';
        jQuery('#activecampaign-new').modal('show');
    }

    connectActiveCampaign() {
        this.isActiveCampaignError = false;
        jQuery('#btnmActiveCampaign').html('please Wait...').attr('disabled', true);
        let data = {
            key: this.activeCampaignForm.value.apiKey,
            account: this.activeCampaignForm.value.account,
            account_name: this.activeCampaignForm.value.accountName,
            company: this.company,
            isCheckingTestAccount : this.isCheckingTestAccount

        };
        this._integrationService.authorization(data, 'active_campaign')
            .subscribe((response) => {
                console.log(response);
                if (response.success) {
                    if(!this.isCheckingTestAccount){
                    this.testLeads = null;
                    this.notify.emit({
                        flag: true,
                        action: 'connect',
                        type: 'active_campaign',
                        data: response
                    });
                    this.isListSelected = false;
                    this.isConnected = true;
                    this.getList('active_campaign');
                    window.toastNotification('You have successfully integrated with Active Campaign');
                  }else{
                      jQuery("#"+this.activeCampaignForm.value.apiKey).removeClass('hide');
                  }
                }
                else {
                    this.activeCampaignErrorMsg = 'Please Enter Your Correct API Key or Account Url ';
                    this.isActiveCampaignError = true;
                    jQuery('#btnmActiveCampaign').html('Authenticate with Active Campaign').attr('disabled', false);
                }
                this.isCheckingTestAccount = false;
            },
                (error) => {
                    console.log("erurrrrrrrrrrrrr", error)
                    if (error.error.code === 'E_KEY_EXIST') {
                        this.activeCampaignErrorMsg = error.error.err_message;
                        this.isActiveCampaignError = true;
                        jQuery('#btnmActiveCampaign').html('Connect').attr('disabled', false);
                    } else {
                        this.activeCampaignErrorMsg = 'Please Enter Your Correct API Key or Account Url';
                        this.isActiveCampaignError = true;
                        jQuery('#btnmActiveCampaign').html('Connect').attr('disabled', false);
                    }
                })
    }

    getList(type = null) {
        this.isActiveCampaignError = false;
        this.isListExist = false;
        this.isLoading = true;
        this._integrationService.getList(type)
            .subscribe((data: any) => {
                this.lists = Object.keys(data).map(function (key) { return data[key]; });
                console.log(this.lists);
                if (this.selectedList !== '') this.listSelected(this.selectedList);

                if (this.lists.length > 0) {
                    this.isListExist = true;
                    this.isDisabled = this.selectedList != '' ? false : true;
                }
                this.calcAllFileds = [];
                this.crmAllFileds = [];
                this.isLoading = false;
            },
                (error) => {
                    this.isActiveCampaignError = true;
                    this.activeCampaignErrorMsg = 'We ran some problem with the fetching list from Active Campaign.Please Re-configure';
                    this.isLoading = false;
                })
    }

    getMapFields(type: string) {
        this.isListSelected = true;
        this.activeCampaignLead = true;
        this.isLoading = true;
        let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['active_campaign_limited'];
        let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['active_campaign'];
        if (isIntegrationLimited && !isIntegrationFull) {
            this.getLimitedMapFields(type);
        } else {
            this.getFullMapFields(type);
        }
    }

    getFullMapFields(type) {
        this._integrationService.getCalcMapFields(type, this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((response) => {
                this.makeFields(response);
            }, (error) => {
                this.isLoading = false;
                this.isActiveCampaignError = true;
                if (error.error.err_message === "Cannot read property 'fields' of undefined") {
                    this.activeCampaignErrorMsg = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
                } else {
                    this.activeCampaignErrorMsg = ' We ran into some problems while fetching fields from your Active campaign account. Please reconfigure.';
                }
            });
    }

    getLimitedMapFields(type) {
        this._integrationService.getCalcBasicFields(type, this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((response) => {
                this.makeFields(response);
            }, (error) => {
                this.isLoading = false;
                this.isActiveCampaignError = true;
                if (error.error.err_message === "Cannot read property 'fields' of undefined") {
                    this.activeCampaignErrorMsg = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
                } else {
                    this.activeCampaignErrorMsg = 'We ran into some problems while fetching fields from your Active campaign account. Please reconfigure.';
                }
            });
    }

    makeFields(response) {
        let calcfields = response.calc;
        let crmfields = response.crm;
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
                obj['crm_name'] = crmfields[key].name;
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
        this.emailShift();

        if (this.insertFields.length === 0)
            //this.insertFields.push({ calc: 'email', crm: 'email' });
            this.checkExistingField();
        jQuery('#btnmActiveCampaign').html('Connect').attr('disabled', false);
        this.isLoading = false;
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

    emailShift() {
        let obj = this.calcAllFileds.find(x => x.calc_key === 'email');
        let emailIndex = this.calcAllFileds.indexOf(obj);
        if (obj) {
            this.calcAllFileds.splice(emailIndex, 1);
            this.calcAllFileds.splice(0, 0, obj);
            this.maperror = false;
        } else {
            this.maperror = true;
            this.isDisabled = true;
            this.isActiveCampaignError = true;
            this.activeCampaignErrorMsg = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration."
        }
    }

    insertMapData(calcKey: string, event: any) {
        let obj = {};
        this.isActiveCampaignError = false;
        // if (calcKey == 'email') {
        // event.target.value = 'email';
        // this.activeCampaignErrorMsg = 'Email Field is required.';
        // // this.isActiveCampaignError = true;
        // return;
        // }
        obj['calc'] = calcKey;
        obj['crm'] = event.target.value;
        obj['name'] = event.target.options[event.target.options.selectedIndex].label;
        let crmObj = this.insertFields.find(x => x.crm === obj['crm']);
        console.log(crmObj, '=============', obj, 'inserted', this.insertFields);
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
            this.isActiveCampaignError = true;
            this.activeCampaignErrorMsg = 'This Crm key ' + obj['name'] + ' already used';
        }
        this.isDisabled = this.insertFields.length > 0 ? false : true;
    }


    configure() {
        jQuery('#activeCampaignLead').html('please Wait...').attr('disabled', true);
        this.isListSelected = false;
        this.activeCampaignLead = true;
    }

    sendTestLeads() {

        this.isActiveCampaignError = false;
        jQuery('#btn-ac').html('please Wait...').attr('disabled', true);
        let data = {
            'map_fields': this.insertFields,
            'list_id': this.selectedList
        }
        console.log(data);
        this._integrationService.testSaveLead('active_campaign', this.jsonBuilderHelper.getJSONBuilt()._id, data)
            .subscribe((response: any) => {
                console.log(response);
                if (response.status.success) {
                    this.getCalTestData(response.dataSent);
                    this.activeCampaignLead = false;
                    this.isMapped = true;
                    window.toastNotification('Connection Test Successful');
                    this.saveMapFields();
                }
                else {
                    this.isActiveCampaignError = true;
                    this.activeCampaignErrorMsg = response.status.message;
                    jQuery('#btn-ac').html('TEST CONNECTION').attr('disabled', false);
                }
            },
                (error) => {
                    this.isActiveCampaignError = true;
                    this.activeCampaignErrorMsg = 'We get some problem with the sending leads to Active Campaign.Please Re-configure';
                    jQuery('#btn-ac').html('TEST CONNECTION').attr('disabled', false);
                })
    }

    saveMapFields() {
        this.isActiveCampaignError = false;
        let data = {
            'map_fields': this.insertFields,
            'list_id': this.selectedList
        }
        this._integrationService.sendMapFields('active_campaign', this.jsonBuilderHelper.getJSONBuilt()._id, data)
            .subscribe((response) => {
                this.notify.emit({
                    flag: true,
                    action: 'activate',
                    type: 'active_campaign',
                });
                jQuery('#btn-activeCampaign-test').html('TEST CONNECTION').attr('disabled', false);
            },
                (error) => {
                    this.isActiveCampaignError = true;
                    this.activeCampaignErrorMsg = 'Error';
                    jQuery('#btn-activeCampaign-test').html('TEST CONNECTION').attr('disabled', false);
                })
    }

    getCalTestData(data: any) {
        this.testLeads = [];
        let regex = /\[(.*?)\]/;
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                let obj = {};
                let crmObj = this.insertFields.find(x => x.crm === key);
                if (!crmObj)
                    break;
                obj['key'] = crmObj.name ? crmObj.name : crmObj.calc;
                obj['value'] = data[key];
                this.testLeads.push(obj);
            }
        }
    }


    updateIntegrationStatus(checked: boolean) {
        let data = {
            'active_campaign': checked
        }
        this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                this.notify.emit({
                    action: 'activate'
                });
                let toastText = '';
                if (checked) {
                    toastText = 'Integration Activated !! The leads from this calculator will be sent to Active Campaign';
                } else {
                    toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Active Campaign';
                }
                window.toastNotification(toastText);
            }, (error) => {
                console.log(error);
            });
    }

    activate(checked: boolean) {
        this.isConnected = true;
        this.isMapped = false;
        this.activeCampaignLead = false;
        this.isListSelected = false;
        this.selectedList = this.config.list_id ? this.config.list_id : '';
        jQuery('#activecampaign-new').modal('show');
        this.getList('active_campaign');

    }

    requestList(value) {
        this.selectedList = value;
        this.listSelected(value);
        //console.log(this.selectedListName);
        if (value == 0) this.isDisabled = true;
        else this.isDisabled = false
    }

    addIsfocusedKey(id) {
        jQuery('#' + id).addClass('is-focused');
        this.isActiveCampaignError = false;
        this.activeCampaignErrorMsg = '';
    }

    removeIsfocusedKey(id) {
        jQuery('#' + id).removeClass('is-focused');
    }

    getMappedFields(fields: any) {
        this.selectedList = fields.list_id;
    }

    listSelected(listId) {
        this.lists.forEach((list, index) => {
            if (list.id == listId)
                this.selectedListName = list.name;
        })
    }

    modalClose(type) {
        switch (type) {
            case "success":
                this.updateIntegrationStatus(true);
                jQuery('#active-campaign').modal('hide');
                this.isConfigured = true;
                this.isMapped = false;
                break;

            default:
                // code...
                break;
        }
    }

    returnFeatureAccess() {
        let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['active_campaign_limited'];
        let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['active_campaign'];
        if (isIntegrartionLimited || isIntegrationFull) {
            return true;
        } else if (!isIntegrationFull && !isIntegrartionLimited) {
            return false;
        }
    }

    premiumPopup(feature: string) {
        this._featureAuthService.setSelectedFeature(feature, 'active_campaign');
        jQuery('.' + feature).addClass('activegreen limited-label');
        jQuery('#premiumModal').modal('show');
        jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }

    sync() {
        let self = this;
        jQuery('.sync-leads-ac').html('Please Wait..');
        this._integrationService.syncCalcLeads('active_campaign', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                // if (result.success) {
                // self.notify.emit({
                // action: 'synLeads'
                // });
                // jQuery('.sync-leads-ac').html('Sync');
                // window.toastNotification('Data has been synced with Active Campaign');
                // }
                if (result.status == 1) {
                    jQuery('.sync-leads-ac').html('Sync');
                    window.toastNotification('Data will be synced with Active Campaign shortly');
                }
                else {
                    jQuery('.sync-leads-ac').html('Sync (' + this.pendingLeads + ')');
                    jQuery('#syncError-modal').modal('show');
                }
            }, (error) => {
                jQuery('.sync-leads-ac').html('Sync (' + this.pendingLeads + ')');
                jQuery('#syncError-modal').modal('show');
            });
    }

    syncTask() {
        jQuery('#task').removeClass('hide');
        jQuery('#integration-main').addClass('hide');
        this.notify.emit({
            action: 'taskList',
            type: 'active_campaign'
        });
    }
    close() {
        jQuery('#activecampaign-new').modal('hide');
        this.calcAllFileds = [];
        this.crmAllFileds = [];
        this.mapFields = [];
        this.isAccountSelected = false;
        this.isMapped = false;
        this.isListSelected = false;
        this.isConnected = false;
        this.accounts = [];
        this.activeCampaignForm.value.apiKey='';
        this.activeCampaignForm.value.account='';
        this.isCheckingTestAccount = false;
        

        

    }
    back() {
        this.isMapped = false;
        this.isListSelected = true;
        this.getMapFields('active_campaign');
    }
    getAccounts() {
        this.isLoading = true;
        this.accounts = [];
        this.isAccountSelected = false;
        this._integrationService.getAccount('active_campaign')
            .subscribe((response: any) => {
                console.log("========", response.accounts)
                let accounts = response.accounts;
                let cnt: any = 0;
                for (let key in accounts) {
                    cnt++;
                    if (accounts.hasOwnProperty(key)) {
                        let obj = {};
                        obj['name'] = accounts[key].account_name ? accounts[key].account_name : '#Account ' + cnt;
                        obj['key'] = accounts[key].api_key;
                        obj['instanceurl'] = accounts[key].instance_url;
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
                jQuery('#activecampaign-new').modal('show');

            })
    }

    testAccount(account: any,instanceurl:any) {
        this.isCheckingTestAccount = true;
        this.activeCampaignForm.value.apiKey = account;
        this.activeCampaignForm.value.account = instanceurl;
        this.activeCampaignForm.value 
        this.connectActiveCampaign();
    }

    editAccount(key, name, url) {
        this.isAccountSelected = true;
        this.integrations.api_key = key;
        this.integrations.account_name = name;
        this.integrations.account = url;
        this.isConnected = false;
        this.isListSelected = false;
        this.isMapped = false;
        jQuery('#activecampaign-new').modal('show');
    }

    setAccount(key: any, action: any) {
        let data = {
            key:key,
            action: action
        };
        this.activeAccount = key;
        this._integrationService.setAccount(data, 'active_campaign')
            .subscribe((response) => {
                if (action === 'edit') {
                    this.configuration.api_key = key;
                    this.initializeActiveCampingForm();
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
        this.activeCampaignErrorMsg = "";
        this.isError = false;
        this.getList('active_campaign');
        this.accounts.forEach((account) => {
            if (account.status) {
                this.configuration.api_key = account.key;
                this.configuration.account = account.instanceurl;
            }
        });
        this.initializeActiveCampingForm();
    }
    checkAccountName(event) {
        console.log(event.target.value);
        this.isActiveCampaignError = false;
        let data = { ac_name: event.target.value };
        this._integrationService.checckAccount(data, 'active_campaign')
          .subscribe((res) => {
            if (res.Exist) {
              this.isActiveCampaignError = true;
              this.activeCampaignErrorMsg = "Account name is allready use";
            }
          })
    
      }
      sendTestMail(text){
        if(text==='save'){
          jQuery('.saveEmail1').html('Saving...');
        }
        let message = jQuery('textarea#froala-editorIntegration').froalaEditor('html.get');
        let htmldoc = jQuery(message);
    
        let buttonText = '';
        let email_array = [];
         for(let i = 0;i<htmldoc.length ;i++){
           if(htmldoc[i].className==='b-outer'){
             buttonText =  htmldoc[i].innerText;
           }
           else{
              email_array.push(htmldoc[i].innerText);
           }
         };
    
        let storage = this._cookieService.readCookie('storage');
        let storageDetail = JSON.parse(storage);
        let email = storageDetail.user.emails[0].email;
        //console.log(this.jsonBuilderHelper.getJSONBuilt(),"<<<<<<<<<<<<");
    
        //console.log(companyname,"_______________");
        let emailText = { 'header': email_array[0], 'button': buttonText, 'body1': email_array[1], 'body2': email_array[2], 'footer1': email_array[3], 'footer2': email_array[4] };
        let data = { 'emailBody': emailText, 'email': email, type: text };
        console.log(data);
        this._integrationService.sendTestmail(data, this.jsonBuilderHelper.getJSONBuilt()._id, 'aweber').subscribe((res) => {
          if (Object.keys(res).length != 0) {
            jQuery('.saveEmail1').html('Save');
            window.toastNotification('Email saved successfully');
            this.doubleoptin = true;
            // jQuery('.red-btn').html('Save');
          } else {``
            window.toastNotification('Test Email sent to ' + email + '.');
          }
        })
    
    
      }
      setDoubleoptin(active){
        if(active) this.sendTestMail('save');
        this._integrationService.setDoubleOpt(this.jsonBuilderHelper.getJSONBuilt()._id,'aweber',active)
                 .subscribe((res)=>{
                  if(res['doubleOptin'])
                  window.toastNotification("Double optin set successfully");
                  else  window.toastNotification('Double optin removed');
    
                 });
        jQuery('#salesforce-new').modal('hide');
        this.isDoubleOptin = false;
      }
      setemailBody(reset = null) {
        let storage: any = this._cookieService.readCookie('storage');
        storage = JSON.parse(storage);
        let email = storage.user.emails[0].email;
        let emailBody = '';
        if(reset) this.config['emailBody']='';
            if(this.config['emailBody']!=''){
                let  data = JSON.parse(this.config['emailBody']);
                emailBody = `<p>`+data.header+`</p>`+`<p>`+data.body1+`</p>
                <div class="b-outer"><button class = "button-view" > `+data.button+`</button></div>
                 <p>`+data.body2+`</p>
                <p>`+data.footer1+`</p><p>`+data.footer2+`</p>`;
              }
              else{
                  emailBody = `<p>Dear {{fname}},</p>
                      <p> Please confirm your subscription to updates from `+this.jsonBuilderHelper.getJSONBuilt().name.split('-')[0]+` by clicking on the button here</p>
                      
                      <div class="b-outer"><button class = "button-view" >Confirm Subscription</button></div>
                      <P>If you have received this email by mistake, please ignore it. If at any point in time, you wish to receive or delete all your information held by `+this.jsonBuilderHelper.getJSONBuilt().name.split('-')[0]+`, contact us at `+email+`</p>
                      <p>Cheers</p>
                      <p readOnly=true>`+this.jsonBuilderHelper.getJSONBuilt().name.split('-')[0];+`</p>`;
                      
              }
    
          jQuery('textarea#froala-editorIntegration').froalaEditor('html.set', (emailBody));
     }
    

}
