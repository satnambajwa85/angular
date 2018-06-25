import { CompanyService } from './../../../../../../../shared/services/company.service';
import { CookieService } from './../../../../../../../shared/services/cookie.service';
import { FroalaService } from './../../../../../services/froala.service';
import { Component, AfterViewInit, OnInit, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { JSONBuilder } from '../../../../../services/JSONBuilder.service';
import { Integrations } from './../../../../../../../shared/models/integrations';
import { IntegrationService } from './../../../../../../../shared/services/integration.service';
import { ConfigIntegrationsComponent } from './../integrations.component';
import { SubDomainService } from '../../../../../../../shared/services/subdomain.service';
import { FeatureAuthService } from '../../../../../../../shared/services/feature-access.service';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
declare var jQuery: any;
declare var window: any;

@Component({
  selector: 'og-hubspot-component',
  templateUrl: './hubspot.component.html',
  styleUrls: ['./../../../../../../../../assets/css/sahil-hover.css', './../../email/assets/css/wysiwyg.css']
})

export class HubspotComponent implements OnInit, AfterViewInit {
  isConfigured: Boolean = false;
  isConnected: Boolean = false;
  configuration: Integrations = new Integrations();
  config: { active: boolean, map_fields: any[], doubleOptin: boolean } = { active: false, map_fields: [], doubleOptin: false };
  pendingLeads: any;
  isLeadsPending: boolean = false;
  company: String;
  calcType: string;
  calcAllFileds: any = [];
  crmAllFileds: any = [];
  insertFields: any = [];
  mapFields: any = [];
  viewMappedData: any = [];
  integrations: any = new Integrations({})
  hubspotForm: FormGroup;
  mapError: string = '';
  isMapError: boolean = false;
  isLimited: boolean = false;
  isTokenExpired: boolean = false;
  isMapped: boolean = false;
  isLoading: Boolean = false;
  isError: boolean = false;

  errorMsg: string = '';
  isLeadGenError :Boolean = false;
  isDoubleopt:Boolean = false;
  emailBody:String = '';
  isDoubleOptin:Boolean = false;
  doubleoptin:Boolean = false;
  GDPR:Boolean = false;
  accounts :any =[];
  isAccountSelected:Boolean = false;
  isCheckingTestAccount : Boolean = false;
  activeAccount: string = '';
  @Output() notify = new EventEmitter();
  constructor(
    public _integrationService: IntegrationService,
    public jsonBuilderHelper: JSONBuilder,
    public fb: FormBuilder,
    public _subdomainService: SubDomainService,
    public _featureAuthService: FeatureAuthService,
    public _cookieService: CookieService,
    public _companyService: CompanyService
  ) {
    this.company = this._subdomainService.subDomain.company_id;
    this.GDPR = this._subdomainService.currentCompany.GDPR;
    this.hubspotForm = this.fb.group({
      apiKey: [this.integrations.api_key, Validators.compose([Validators.required])],
      accountName : [this.integrations.account_name, Validators.compose([Validators.required])]
    });
  }
  ngAfterViewInit() {

   
    
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

  // initFroala(){
  //   let calc_type = this.jsonBuilderHelper.getJSONBuilt().templateType;
  //   let options = ['bold', '|', 'italic', '|', 'underline', '|', 'color', '|', 'fontSize', '|', 'insertLink'];

  //   jQuery('textarea#froala-editorIntegration').froalaEditor({
  //     toolbarButtons: options,
  //     shortcutsEnabled: ['bold', 'italic', 'underline'],
  //     pastePlain: true,
  //   });
  // }


  openConnectModal() {
    this.isAccountSelected = true;
    if (!this._featureAuthService.features.integrations['hubspot'] && !this._featureAuthService.features.integrations['hubspot_limited']) {
      return;
    }
    if (this.configuration) {
      this.integrations.api_key = this.configuration.api_key;
      this.integrations.account_name = this.configuration.account_name;
      this.isConnected = false;
      this.isMapped = false;
    }
    jQuery('#hubspot-new').modal('show');
  }
  openNewConnectModal() {
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isMapped = false;
    this.integrations.api_key='';
    this.integrations.account_name='';
    jQuery('#hubspot-new').modal('show');
  }
  connect() {
    if (!this._featureAuthService.features.integrations['hubspot'] && !this._featureAuthService.features.integrations['hubspot_limited']) {
      return;
    }
    jQuery('#config_btn').html('Please Wait ...');
    let data = {
      api_key: this.hubspotForm.value.apiKey,
      account_name : this.hubspotForm.value.accountName,
      company: this.company,
      isCheckingTestAccount : this.isCheckingTestAccount
    };

    this._integrationService.authorization(data, 'hubspot')
      .subscribe((response) => {
        if (response.status === 'error') {
          this.isError = true;
          this.isConfigured = this.isCheckingTestAccount ? true :false;
          //jQuery('#btnhubspot').html('Connect');
          this.errorMsg = 'Invalid Credentials - Please re-enter your Hubspot Api key';
          jQuery('#config_btn').html('Authenticate with Hubspot');
        } else {
          this.isError = false;
          if(!this.isCheckingTestAccount){
            this.isConfigured = true;
            this.isConnected = true;
            jQuery('#config_btn').html('Authenticate with Hubspot');
            this.getFields();
            window.toastNotification('You have successfully integrated with HubSpot');
            this.notify.emit({
              action: 'connect',
            });
          }else{
            jQuery('#'+this.hubspotForm.value.apiKey).removeClass('hide');
          }
        }
      }, (error) => {
        this.isError = true;
        jQuery('#btnhubspot').html('Connect');
        if (error.error.code === 'ENOTFOUND') {
          this.errorMsg = 'Invalid Credentials - Please re-enter your Hubspot Api key';
        }if(error.error.code==='E_KEY_EXIST'){
          this.errorMsg = error.error.err_message;
        }
      });

  }

  activate(checked: boolean) {
    jQuery('#hubspot-new').modal('show');
    this.isConnected = true;
    this.isMapped = false;
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.getFields();
  }

  test() {
    jQuery('.btn-test').html('PLEASE WAIT...').attr('disabled', true);
    this.isTokenExpired = false;
    let data = {
      'map_fields': this.insertFields,
      'email': 'integrations@outgrow.co'
    }
    if (data.map_fields.length > 0) {
      this._integrationService.testSaveLead('hubspot', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response.status.success) {
            if (response.status.item_skipped >= 1) {
              this.isMapError = true;
              this.mapError = response.status;
              jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            } else {
              this.sendMapFields();
              this.isMapped = true;
              this.ViewMappedData(response.dataSent);
              this.updateIntegrationStatus(true);
              window.toastNotification('Connection Test Successful');
            }
          } else {
            this.isMapError = true;
            let errorCode = response.status.code;
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            if (response.status.fields) {
              let inValidField = response.status.fields[0];
              if (inValidField) {
                this.mapError = 'Invalid value for field ' + inValidField;
              } else {
                this.mapError = 'Error in one or more of your mappings. Please map fields again.';
              }
            }
            if (errorCode === 'error') {
              this.mapError = 'Err! Field type mismatch between Outgrow and Hubspot field. Please map accordingly';
            }
          }
        }, (error) => {
          this.isMapError = true;
          this.mapError = error.error.err_message;
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      jQuery('.btn-test').html('Test Connection').attr('disabled', false);
      this.isMapError = true;
      this.mapError = 'Err! Field type mismatch between Outgrow and Hubspot field. Please map accordingly';
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'hubspot': checked
    }
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to Hubspot';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Hubspot';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['hubspot_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['hubspot'];
    if (isIntegrationLimited && !isIntegrationFull) {
      this.isLimited = true;
      this.getBasicMapFields();
      console.log('basic');
    } else {
      this.getFullMapFields();
      console.log('full');
    }
    this.setemailBody();
  }

  getBasicMapFields() {
    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this._integrationService.getCalcBasicFields('hubspot', this.jsonBuilderHelper.getJSONBuilt()._id)
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
    this._integrationService.getCalcMapFields('hubspot', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        console.log(result);
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
    jQuery('.btn-test-SF').html('PLEASE WAIT').attr('disabled', false);
    let data = {
      'map_fields': this.insertFields
    }
    if (this.isLimited) {
      this._integrationService.sendMapFieldsBasic('hubspot', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test-SF').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('hubspot', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test-SF').html('Test Connection').attr('disabled', false);
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
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['hubspot_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['hubspot'];

    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }
  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'hubspot');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }
  close() {
    jQuery('#mapping-int-toAccess').modal('hide');
    jQuery('#hubspot-new').modal('hide');
    this.isDoubleOptin = false;
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    this.isMapError = false;
    this.isLoading = false;
    this.isMapped = false;
    this.isAccountSelected = false;
  }

  sync() {
    jQuery('.sync-leads-hs').html('Please Wait..');
    this._integrationService.syncCalcLeads('hubspot', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        // if (result.success) {
        //   self.notify.emit({
        //     action: 'synLeads'
        //   });
        //   jQuery('.sync-leads-hs').html('Sync');
        //   window.toastNotification('Leads will be synced to connected Hubspot for this calculator');
        // }
        if (result.status == 1) {
          jQuery('.sync-leads-hs').html('Sync');
          window.toastNotification('Data will be synced with Hubspot shortly');
        }
        else {
          jQuery('.sync-leads-hs').html('Sync (' + this.pendingLeads + ')');
          jQuery('#syncError-modal').modal('show');
        }
      }, (error) => {
        jQuery('.sync-leads-hs').html('Sync (' + this.pendingLeads + ')');
        jQuery('#syncError-modal').modal('show');
      });
  }
  closeMapped() {
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    jQuery('#hubspot').modal('hide');
  }

  syncTask() {

    console.log('aaa');
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'hubspot'
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
    this.isError = false;
    this.errorMsg ='';
    this._integrationService.getAccount('hubspot')
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
      this.activeAccount = this.accounts.reduce((acc,account)=>{
        if(account.status){
        return account.key;
        }
        return acc;
        });
        
      
      jQuery('#hubspot-new').modal('show');

     })
   }
   testAccount(account:any){
    this.hubspotForm.value.apiKey = account;
    this.isCheckingTestAccount = true;
    this.connect();
   }

   editAccount(key:any){
    this.isAccountSelected = true;
    this.integrations.api_key = key;
    //this.integrations.account_name = name;
    this.isConnected = false;
    this.isMapped = false;
   }

   setAccount(key:any, action:any){
    let data ={
      key :key,
      action: action
    }
    this.activeAccount=key;
    this._integrationService.setAccount(data, 'hubspot')
      .subscribe((response) => {
          if(action==='edit'){
            window.toastNotification('You have successfully selected the account');
          }if(action==='delete'){
            window.toastNotification('You have successfully deleted the account');
          this.getAccounts();
          }
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
    this._integrationService.sendTestmail(data, this.jsonBuilderHelper.getJSONBuilt()._id, 'hubspot').subscribe((res) => {
      if (Object.keys(res).length != 0) {
        jQuery('.saveEmail1').html('Save');
        window.toastNotification('Email saved successfully');
        this.doubleoptin = true;
        // jQuery('.red-btn').html('Save');
      } else {
        window.toastNotification('Test Email sent to ' + email + '.');
      }
    })


  }
  setDoubleoptin(active){
    if(active) this.sendTestMail('save');
    this._integrationService.setDoubleOpt(this.jsonBuilderHelper.getJSONBuilt()._id,'hubspot',active)
             .subscribe((res)=>{
              if(res['doubleOptin'])
              window.toastNotification("Double optin set successfully");
              else  window.toastNotification('Double optin removed');

             });
    jQuery('#hubspot-new').modal('hide');
    this.isDoubleOptin = false;
  }

  enabledoubleoptin() {
    this.isDoubleOptin = true;
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


