import { FeatureAuthService } from './../../../../../../../shared/services/feature-access.service';
import { SubDomainService } from './../../../../../../../shared/services/subdomain.service';
import { JSONBuilder } from './../../../../../services/JSONBuilder.service';
import { IntegrationService } from './../../../../../../../shared/services/integration.service';
import { Integrations } from './../../../../../../../shared/models/integrations';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, EventEmitter, Output, AfterViewInit } from '@angular/core';

declare var window: any;
declare var jQuery: any;
@Component({
    selector: 'og-sendlane',
    templateUrl: './sendlane.component.html'
})
export class SendlaneComponent implements OnInit, AfterViewInit {
    isdomainExist: boolean = false;
    company: String;
    viewMappedData: any[];
    isLimited: boolean;
    calcType: string;
    mapError: string;
    isMapError: boolean = false;
    crmList: any[];
    selectedListId: string;
    sendLaneErrorMsg: string;
    isSendLaneError: boolean = false;

    sendLaneForm: FormGroup;
    sendLaneDomain: FormGroup
    isDisabled: boolean = true;
    isLoading: boolean = false;
    configuration: Integrations;
    config: { active: boolean, map_fields: any[], list_id: string, list_name: string } = { active: false, map_fields: [], list_id: '', list_name: '' };
    pendingLeads: any = '';
    lists: any;
    testLeads: any;
    isListExist: boolean = false;
    integrations: any = new Integrations({});

    isConfigured: boolean = false;
    isListSelected: boolean = false;
    sendlaneLead: boolean = false;
    isConnected: boolean = false;

    selectedListName: string = '';
    maperror: boolean = false;
    calcAllFileds = [];
    crmAllFileds = [];
    mapFields = [];
    isMapped: boolean = false;
    insertFields = [];
    isLeadsPending: boolean = false;
    domainName: string;
    isLeadGenError: Boolean = false;
    accounts: any = [];
    isAccountSelected: boolean = false;
    isCheckingTestAccount : Boolean = false;
    activeAccount:string = '';
    @Output() notify = new EventEmitter();
    constructor(
        //public _parent:ConfigIntegrationsComponent,
        public _integrationService: IntegrationService,
        public jsonBuilderHelper: JSONBuilder,
        public _subdomainService: SubDomainService,
        public fb: FormBuilder,
        public _featureAuthService: FeatureAuthService) {
        this.company = this._subdomainService.subDomain.company_id;
        this.sendLaneForm = this.fb.group({
            domain: [this.integrations.instance_url, Validators.required],
            email: ['', Validators.compose([Validators.required, Validators.email])],
            password: ['', Validators.compose([Validators.required])],
            accountName: ['', Validators.compose([Validators.required])]

        });
    }

    ngOnInit() {
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
    openConnectModal() {
        this.isAccountSelected = true;
        if (!this._featureAuthService.features.integrations['sendlane'] && !this._featureAuthService.features.integrations['sendlane_limited']) {
            return;
        }
        if (this.configuration) {
            this.integrations.instance_url = this.configuration.instance_url;
            this.isConnected = false;
            this.isListSelected = false;
            this.isMapped = false;
            this.sendlaneLead = false;
        }
        jQuery('#sendlane-new').modal('show');
    }

    openNewConnectModal() {
        this.isAccountSelected = true;
        this.isConnected = false;
        this.isListSelected = false;
        this.isMapped = false;
        this.configuration.account = '';
        this.configuration.api_key = '';
        jQuery('#sendlane-new').modal('show');
    }

    connect() {
        this.isSendLaneError = false;
        jQuery('#btn-add-credentials').html('please Wait...').attr('disabled', true);
        let data = {
            domain: this.sendLaneForm.value.domain,
            email: this.sendLaneForm.value.email,
            password: this.sendLaneForm.value.password,
            account_name: this.sendLaneForm.value.accountName,

        };
        this._integrationService.authorization(data, 'sendlane')
            .subscribe((response) => {
                if(!this.isCheckingTestAccount){
                this.testLeads = null;
                this.notify.emit({
                    action: 'connect',
                });
                this.isListSelected = false;
                this.isConnected = true;
                this.getList('sendlane');
                window.toastNotification('You have successfully integrated with Sendlane');
             } else{
                 jQuery("#"+this.sendLaneForm.value.apiKey).removeClass('hide')

             }
            },
                (error) => {


                    if (error.error.code === 'E_SENDLANE_DOMAIN_NOT_EXIST') {
                        this.isdomainExist = false;
                        this.sendLaneErrorMsg = error.error.err_message;
                    } else if (error.error.code === 'E_KEY_EXIST') {
                        this.sendLaneErrorMsg = error.error.err_message;
                    }
                    else {
                        this.sendLaneErrorMsg = 'Invalid Credentials - Please re-enter your Sendlane Email or Password';
                    }
                    this.isSendLaneError = true;
                    jQuery('#btn-add-credentials').html('Connect').attr('disabled', false);
                })
    }

    getList(type = null) {
        this.isSendLaneError = false;
        this.isLoading = true;
        this.selectedListId = this.config.list_id;
        this._integrationService.getList(type)
            .subscribe((data: any) => {
                if (data.length >= 1) {
                    this.isListExist = true;
                    this.crmList = [];
                    this.crmList = data.map((obj) => {
                        return { list_id: obj.list_id, list_name: obj.list_name };
                    });
                }
                else {
                    this.isListExist = false
                }
                this.isLoading = false;
            },
                (error) => {
                    this.isSendLaneError = true;
                    this.sendLaneErrorMsg = 'We ran into some problem with the fetching list from Sendlane. Please Re-configure';
                    this.isLoading = false;
                })
    }



    addIsfocusedKey(id) {
        jQuery('#' + id).addClass('is-focused');
        this.isSendLaneError = false;
        this.sendLaneErrorMsg = '';
    }

    removeIsfocusedKey(id, data) {

        if (data == '' || data == null) {
            console.log(data, id, "<<<<<<<<<<<<<<");
            jQuery('#' + id).removeClass('is-focused');
        }
    }


    modalClose(type) {
        switch (type) {
            case "success":
                // this.updateIntegrationStatus(true);
                jQuery('#sendlane-new').modal('hide');
                this.isConfigured = true;
                this.isMapped = false;
                break;

            default:
                // code...
                break;
        }
    }
    selectedList(list_id) {
        this.selectedListName = jQuery('#sendlaneList :selected').text();
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
            this.isSendLaneError = true;
            this.sendLaneErrorMsg = 'Please select the list where you want to save leads';
        } else {
            jQuery('#btnSendlaneList').html('Please wait...');
            this.isListSelected = true;
            let data = {
                'list_id': this.selectedListId,
                'list_name': this.selectedListName
            }
            this._integrationService.saveList('sendlane', this.jsonBuilderHelper.getJSONBuilt()._id, data)
                .subscribe((response: any) => {
                    this.getFields();
                }, (error) => {
                    console.log('error', error);
                });
        }
    }

    activate(checked: boolean) {
        this.isMapError = false;
        this.mapError = '';
        jQuery('#sendlane-new').modal('show');
        this.isMapped = false;
        this.isConnected = true;
        this.isListSelected = false;
        this.calcAllFileds = [];
        this.crmAllFileds = [];
        this.insertFields = [];
        this.isListSelected = false;
        //this.integrations.api_key = this.configuration.api_key;
        this.getList('sendlane');
    }
    getFields() {
        let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['sendlane_limited'];
        let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['sendlane'];
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
        this.calcAllFileds = [];
        this.isLeadGenError = false;
        this._integrationService.getCalcBasicFields('sendlane', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                console.log(result);
                if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
                    this.isLeadGenError = true;
                    this.isLoading = false;
                    this.isMapError = true;

                    this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
                    jQuery('.btn-test').html('Test Connection').attr('disabled', true);
                }
                if (!this.isMapError)
                    jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                this.isMapError = false;
                this.isLoading = false;
                let calcfiedls = result.calc;
                let crmfields = result.crm;
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
                        } else if (obj['calc_key'] === "fullName") {
                            obj['crm_key'] = 'full name';
                            insertObj['calc'] = obj['calc_key'];
                            insertObj['crm'] = obj['crm_key'];
                            this.insertFields.push(insertObj);
                        }
                        // else if(obj['calc_key'] ==="fName" ){
                        // obj['crm_key'] = 'First Name'; 
                        // insertObj['calc'] = obj['calc_key'];
                        // insertObj['crm'] = obj['crm_key'];
                        // this.insertFields.push(insertObj);
                        // } 
                        // else if(obj['calc_key'] === "lName"){
                        // obj['crm_key'] = 'Last Name';
                        // insertObj['calc'] = obj['calc_key'];
                        // insertObj['crm'] = obj['crm_key'];
                        // this.insertFields.push(insertObj);
                        // } 
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
        this.calcAllFileds = [];
        this.isLeadGenError = false;
        this._integrationService.getCalcMapFields('sendlane', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                console.log(result);
                if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
                    this.isLeadGenError = true;
                    this.isLoading = false;
                    this.isMapError = true;

                    this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. "
                    jQuery('.btn-test').html('Test Connetion').attr('disabled', true);
                }
                if (!this.isMapError)
                    jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                this.isMapError = false;
                this.isLoading = false;
                let calcfiedls = result.calc;
                let crmfields = result.crm;
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
                        }
                        else if (obj['calc_key'] === "fullName") {
                            obj['crm_key'] = 'full name';
                            insertObj['calc'] = obj['calc_key'];
                            insertObj['crm'] = obj['crm_key'];
                            this.insertFields.push(insertObj);
                        }
                        // }else if(obj['calc_key'] ==="fName" ){
                        // obj['crm_key'] = 'First Name';
                        // insertObj['calc'] = obj['calc_key'];
                        // insertObj['crm'] = obj['crm_key'];
                        // this.insertFields.push(insertObj);
                        // } 
                        // else if(obj['calc_key'] === "lName"){
                        // obj['crm_key'] = 'Last Name';
                        // insertObj['calc'] = obj['calc_key'];
                        // insertObj['crm'] = obj['crm_key'];
                        // this.insertFields.push(insertObj);
                        // } 
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

    returnFeatureAccess() {
        let isIntegrartionLimited: boolean = this._featureAuthService.features.integrations['sendlane_limited'];
        let isIntegrationFull: boolean = this._featureAuthService.features.integrations['sendlane'];
        if (isIntegrartionLimited || isIntegrationFull) {
            return true;
        } else if (!isIntegrationFull && !isIntegrartionLimited) {
            return false;
        }
    }

    premiumPopup(feature: string) {
        this._featureAuthService.setSelectedFeature(feature, 'sendlane');
        jQuery('.' + feature).addClass('activegreen limited-label');
        jQuery('#pr emiumModal').modal('show');
        jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }

    test() {
        console.log(this.insertFields);
        jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
        let data = {
            'map_fields': this.insertFields,
            'list_id': this.selectedListId,
            'email': 'prahllad.roy@venturepact.com'
        }
        if (data.map_fields.length > 0) {
            this._integrationService.testSaveLead('sendlane', this.jsonBuilderHelper.getJSONBuilt()._id, data)
                .subscribe((response) => {
                    if (response.status.success) {
                        this.sendMapFields();
                        this.isMapped = true;
                        window.toastNotification('Connection Test Successful');
                        this.ViewMappedData(response.dataSent);
                        this.updateIntegrationStatus(true);
                        window.toastNotification('Connection Test Successful');
                    } else {
                        this.isMapError = true;
                        this.isMapped = false;
                        this.mapError = response.status.message;
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
            this.mapError = 'Minimum 1 field is required for Sendlane';
        }
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
            this._integrationService.sendMapFieldsBasic('sendlane', this.jsonBuilderHelper.getJSONBuilt()._id, data)
                .subscribe((result) => {
                    this.notify.emit({
                        action: 'activate'
                    });
                }, (error) => {
                    jQuery('.btn-test').html('Test Connection').attr('disabled', false);
                });
        } else {
            this.checkExistingField();
            this._integrationService.sendMapFields('sendlane', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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
        if (event.target.value === '') {
            return;
        }
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
            if (data.hasOwnProperty(key) && key !== 'list_id') {
                let obj = {};
                obj['key'] = key;
                obj['value'] = data[key];
                this.viewMappedData.push(obj);
            }
        }
    }

    updateIntegrationStatus(checked: boolean) {
        let data = {
            'sendlane': checked
        };
        this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                this.notify.emit({
                    action: 'activate'
                });
                let toastText = '';
                if (checked) {
                    toastText = 'Integration Activated !! The leads from this calculator will be sent to Sendlane';
                } else {
                    toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Sendlane';
                }
                window.toastNotification(toastText);
            }, (error) => {
                console.log(error);
            });
    }

    sync() {
        let self = this;
        jQuery('.sync-leads-sd').html('Please Wait..');
        this._integrationService.syncCalcLeads('sendlane', this.jsonBuilderHelper.getJSONBuilt()._id)
            .subscribe((result) => {
                if (result.status == 1) {
                    jQuery('.sync-leads-sd').html('Sync');
                    window.toastNotification('Data will be synced with Sendlane shortly');
                } else {
                    jQuery('.sync-leads-sd').html('Sync (' + this.pendingLeads + ')');
                    jQuery('#syncError-modal').modal('show');
                }
            }, (error) => {
                jQuery('.sync-leads-sd').html('Sync (' + this.pendingLeads + ')');
                jQuery('#syncError-modal').modal('show');
            });
    }

    syncTask() {
        jQuery('#task').removeClass('hide');
        jQuery('#integration-main').addClass('hide');
        this.notify.emit({
            action: 'taskList',
            type: 'sendlane'
        });
    }

    close() {
        jQuery('#sendlane-new').modal('hide');
        this.crmAllFileds = [];
        this.calcAllFileds = [];
        this.insertFields = [];
        this.isSendLaneError = false;
    }

    back() {
        this.isMapped = false;
        this.isListSelected = true;
        this.getFields();
    }
    getAccounts() {
        this.isLoading = true;
        this.accounts = [];
        this.isAccountSelected = false;
        this._integrationService.getAccount('sendlane')
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
                jQuery('#sendlane-new').modal('show');

            })
    }

    testAccount(account: any) {
        this.isCheckingTestAccount = true;
        this.sendLaneForm.value.apiKey = account;
        this.connect();
    }

    editAccount(key, name) {
        this.isAccountSelected = true;
        this.integrations.api_key = key;
        this.integrations.account_name = name;
        this.isConnected = false;
        this.isListSelected = false;
        this.isMapped = false;
        jQuery('#sendlane-new').modal('show');
    }

    setAccount(key: any, name: any, action: any) {
        let data = {
            key: key,
            name: name,
            action: action
        }
        this.activeAccount = '';
        this._integrationService.setAccount(data, 'sendlane')
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
        this.sendLaneErrorMsg = "";
        this.getList();
    }

}
