import { Component, EventEmitter, OnInit, Output, AfterViewInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { JSONBuilder } from "../../../../../services/JSONBuilder.service";
import { Integrations } from "./../../../../../../../shared/models/integrations";
import { IntegrationService } from "./../../../../../../../shared/services/integration.service";
import { CookieService } from "./../../../../../../../shared/services/cookie.service";
import { Script } from "./../../../../../../../shared/services/script.service";
import { FeatureAuthService } from "../../../../../../../shared/services/feature-access.service";
import { SubDomainService } from "../../../../../../../shared/services/subdomain.service";
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
// import { AfterViewInit } from "@angular/core/src/metadata/lifecycle_hooks";

declare var jQuery;
declare var window: any;

@Component({
  selector: 'og-marketo-component',
  templateUrl: './marketo.component.html',
  styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
})

export class MarketoComponent implements OnInit, AfterViewInit {
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: { active: boolean, map_fields: any[], doubleOptin: boolean } = { active: false, map_fields: [], doubleOptin: false };
  pendingLeads: any;
  isLeadsPending: boolean = false;

  form: FormGroup;
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
  isConnected: Boolean = false;

  mapError: string = '';
  isMapError: boolean = false;
  isLimited: boolean = false;
  isTokenExpired: boolean = false;
  isMapped: boolean = false;
  isLoading: Boolean = false;
  isLeadGenError: Boolean = false;
  isDoubleOptin: Boolean = false;
  doubleoptinButton: Boolean = false;
  accounts: any = [];
  isAccountSelected: Boolean = false;
  GDPR: Boolean = false;
  isCheckingTestAccount: Boolean = false;
  activeAccount:string='';
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
    this.GDPR = this._subdomainService.currentCompany.GDPR;
    this.form = this.fb.group({
      client_id: ['', Validators.compose([Validators.required])],
      client_secret: ['', Validators.compose([Validators.required])],
      ideantity: ['', Validators.compose([Validators.required])],
      accountName: ['', Validators.compose([Validators.required])]
    });
  }

  ngOnInit() {
    //console.log(this.isConfigured,'.....===========');
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
    // let options = ['bold', '|', 'italic', '|', 'underline', '|', 'color', '|', 'fontSize', '|', 'insertLink'];
    // jQuery('textarea#froala-editorMarketo').froalaEditor({
    //   toolbarButtons: options,
    //   shortcutsEnabled: ['bold', 'italic', 'underline'],
    //   pastePlain: true,
    // });

//     let emailBody = `<p>Dear {{fname}},</p>
//  <p>Please click on bellow to get notification from client company</p>
//  <button class = "btn" style="color:red;margin-left:142px;">Confirm Subscription</button>
//  <p>Cheers</p>
//  <p>{{Company name}}</p>`;
//     jQuery('textarea#froala-editorMarketo').froalaEditor('html.set', (emailBody));
  }

  openConnectModal() {
    this.isAccountSelected = true;
    if (!this._featureAuthService.features.integrations['marketo'] && !this._featureAuthService.features.integrations['marketo_limited']) {
      return;
    }
    if (this.configuration) {
      this.integrations.client_id = this.configuration.client_id;
      this.integrations.client_secret = this.configuration.client_secret;
      this.integrations.ideantity = this.configuration.instance_url;
      this.isConnected = false;
      this.isMapped = false;
    }
    jQuery('#marketo-new').modal('show');
  }
  openNewConnectModal() {
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isMapped = false;
    this.isError = false;
    this.integrations.client_id = '',
      this.integrations.client_secret = '',
      this.integrations.ideantity = '',
      this.integrations.account_name = '';
    jQuery('#marketo-new').modal('show');
  }

  connect() {
    if (!this._featureAuthService.features.integrations['marketo'] && !this._featureAuthService.features.integrations['marketo_limited']) {
      return;
    }
    jQuery('.btn-connect-marketo').html('please Wait...').attr('disabled', true);
    let data = {
      client_id: this.form.value.client_id,
      client_secret: this.form.value.client_secret,
      restEndpoint: this.form.value.ideantity,
      company: this.company,
      account_name: this.form.value.accountName,
      isCheckingTestAccount: this.isCheckingTestAccount
    };
    let restValidate = data.restEndpoint.split('/')[3];
    if (restValidate && restValidate === 'rest') {
      this.errorMsg = 'Incorrect Endpoints.Your endpoints should be something like this - https://500-ABC-165.mktorest.com. If you have added "/rest" at the end of the link, try removing it.​​​​​​​';
      this.isError = true;
      jQuery('.btn-connect-marketo').html('Connect Marketo').attr('disabled', false);
    } else {
      this._integrationService.authorization(data, 'marketo')
        .subscribe((response) => {
          if (response.errors) {
            this.errorMsg = 'Incorrect Endpoints. Please re-enter correct endpoint for Marketo.';
            this.isError = true;
            jQuery('.btn-connect-marketo').html('Connect Marketo').attr('disabled', false);
          } else if (response.error) {
            if (response.error === 'unauthorized') {
              this.errorMsg = 'Invalid Credentials - Please re-enter your Marketo Client Id';
            } else if (response.error === 'invalid_client') {
              this.errorMsg = 'Invalid Credentials - Please re-enter your Marketo Client Secret';
            } else {
              this.errorMsg = response.error_description;
            }
            this.isError = true;
            jQuery('.btn-connect-marketo').html('Connect Marketo').attr('disabled', false);
          } else {
            if (!this.isCheckingTestAccount) {
              this.isError = false;
              this.isConnected = true;
              this.getFields();
              this.notify.emit({
                action: 'connect'
              });
              jQuery('.btn-connect-marketo').html('Reconfigure Marketo').attr('disabled', false);
              window.toastNotification('You have successfully integrated with Marketo.');
            } else {
              jQuery('#' + this.form.value.client_id).removeClass('hide');
            }
          }
        }, (error) => {
          if (error.error.code === 'ENOTFOUND' || error.error.code === 'E_UNEXPECTED') {
            this.errorMsg = 'Authentication error - Please re-enter the end points';
          } else if (error.error.code === 'E_KEY_EXIST') {
            this.errorMsg = error.error.err_message;
          } else {
            this.errorMsg = error.error.message;
          }
          this.isError = true;
          jQuery('.btn-connect-marketo').html('Connect Marketo').attr('disabled', false);
        });
    }
  }

  activate(checked: boolean) {
    //jQuery('#marketo').modal('show');
    jQuery('#marketo-new').modal('show');
    jQuery('#step2').addClass('active');
    this.isConnected = true;
    this.isMapped = false;
    this.isDoubleOptin = false;
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
      this._integrationService.testSaveLead('marketo', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((response) => {
          if (response.status.success) {
            if (response.status.item_skipped >= 1) {
              let code = response.status.response[0][0] ? response.status.response[0][0].code : '';
              if (code === '1003') {
                this.mapError = response.status.response[0][0].message;
              } else {
                this.mapError = response.status.response[0];
              }
              this.isMapError = true;
              this.isMapped = false;
              jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            } else {
              this.sendMapFields();
              this.isMapped = true;
              window.toastNotification('Connection Test Successful');
              this.ViewMappedData(response.dataSent);
              this.updateIntegrationStatus(true);
            }
          } else {
            this.isMapError = true;
            this.isMapped = false;
            let errorCode = response.status.code;
            jQuery('.btn-test').html('Test Connection').attr('disabled', false);
            if (errorCode === '609') {
              this.mapError = 'Error in one of your primary key mapping. Please map fields again.';
            } else {
              this.mapError = response.status.message;
            }
          }
        }, (error) => {
          this.isMapError = true;
          this.mapError = error.error.err_message;
          //this.getCalTestData(type);
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      jQuery('.btn-test').html('Test Connection').attr('disabled', false);
      this.isMapError = true;
      this.mapError = 'Minimum 1 field is required for Marketo';
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      'marketo': checked
    }
    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        this.notify.emit({
          action: 'activate'
        });
        let toastText = '';
        if (checked) {
          toastText = 'Integration Activated !! The leads from this calculator will be sent to Marketo';
        } else {
          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Marketo';
        }
        window.toastNotification(toastText);
      }, (error) => {
        console.log(error);
      });
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features.integrations['marketo_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['marketo'];
    if (isIntegrationLimited && !isIntegrationFull) {
      this.isLimited = true;
      this.getBasicMapFields();
    } else {
      this.getFullMapFields();
    }
    this.setEmailBody();
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

  getBasicMapFields() {

    this.isLoading = true;
    this.isMapError = false;
    this.isLeadGenError = false;
    this._integrationService.getCalcBasicFields('marketo', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
          this.isLeadGenError = true;
          this.isLoading = false;
          //this.isMapError = true;
          this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. ";
          jQuery('.btn-test').html('Test Connection').attr('disabled', true);

        }
        if (this.isLeadGenError) {
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
        if (error.error.err_message === 'invalid_grant: expired access/refresh token') {
          this.isTokenExpired = true;
          this.isMapError = true;
          this.mapError = 'Configuration error. Seems like your access token has expired. Please';
        } else if (error.error.err_message === 'The REST API is not enabled for this Organization.') {
          this.isTokenExpired = true;
          this.isMapError = true;
          this.mapError = 'REST API not enabled for your Marketo account. You require Enterprise edition of Marketo for Integration. Please';
        } else if (error.error.err_message === "Cannot read property 'fields' of undefined") {
          this.isLeadGenError = true;
          this.mapError = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
        }
        else {
          this.isMapError = true;
          this.mapError = error.error.err_message;
        }
      });
  }

  getFullMapFields() {

    this.isLoading = true;
    this.isMapError = false;
    this._integrationService.getCalcMapFields('marketo', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        if (!result.calc.find((el) => { return el['api_key'] === 'email' })) {
          this.isLeadGenError = true;
          this.isLoading = false;
          this.mapError = "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. ";
          jQuery('.btn-test').html('Test Connection').attr('disabled', true);

        }
        if (this.isLeadGenError) {
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
        this.isTokenExpired = true;
        this.isLoading = false;
        if (error.error.err_message === 'invalid_grant: expired access/refresh token') {
          this.isMapError = true;
          this.mapError = 'Configuration error. Seems like your access token has expired. Please';
        } else if (error.error.err_message === 'The REST API is not enabled for this Organization.') {
          this.isMapError = true;
          this.mapError = 'REST API not enabled for your Aweber account. You require Enterprise edition of Aweber for Integration. Please';
        } else if (error.error.err_message === "Cannot read property 'fields' of undefined") {
          this.isLeadGenError = true;
          this.mapError = 'Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.';
        }
        else {
          this.isMapError = true;
          this.mapError = error.error.err_message;
        }
      });
  }

  sendMapFields() {
    jQuery('.btn-test').html('PLEASE WAIT').attr('disabled', false);
    let data = {
      'map_fields': this.insertFields
    }
    if (this.isLimited) {
      this._integrationService.sendMapFieldsBasic('marketo', this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe((result) => {
          this.notify.emit({
            action: 'activate'
          });
        }, (error) => {
          jQuery('.btn-test').html('Test Connection').attr('disabled', false);
        });
    } else {
      this.checkExistingField();
      this._integrationService.sendMapFields('marketo', this.jsonBuilderHelper.getJSONBuilt()._id, this.insertFields)
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
    // event.target.value = 'email';
    // // this.activeCampaignErrorMsg = 'Email Field is required.';
    // // this.isActiveCampaignError = true;
    // return;
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
    let isIntegrartionLimited: Boolean = this._featureAuthService.features.integrations['marketo_limited'];
    let isIntegrationFull: Boolean = this._featureAuthService.features.integrations['marketo'];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }
  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, 'marketo');
    jQuery('.' + feature).addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }
  close() {
    jQuery('#marketo-new').modal('hide');
    this.isDoubleOptin = false;
    this.isMapped = false;
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
  }

  sync() {
    let self = this;
    jQuery('.sync-leads-marketo').html('Please Wait..');
    this._integrationService.syncCalcLeads('marketo', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((result) => {
        // if (result.success) {
        // self.notify.emit({
        // action: 'synLeads'
        // });
        // jQuery('.sync-leads-marketo').html('Sync');
        // window.toastNotification('Data has been synced with Marketo');
        // }
        if (result.status == 1) {
          jQuery('.sync-leads-marketo').html('Sync');
          window.toastNotification('Data will be synced with Marketo shortly');
        }
        else {
          jQuery('.sync-leads-marketo').html('Sync (' + this.pendingLeads + ')');
          jQuery('#syncError-modal').modal('show');
        }
      }, (error) => {
        jQuery('.sync-leads-marketo').html('Sync (' + this.pendingLeads + ')');
        jQuery('#syncError-modal').modal('show');
      });
  }
  closeMapped() {
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    jQuery('#marketo').modal('hide');
  }
  addIsfocusedClientID() {
    jQuery('#clientID').addClass('is-focused');
  }
  removeIsfocusedClientID() {
    jQuery('#clientID').removeClass('is-focused');
  }
  addIsfocusedSecret() {
    jQuery('#clientSecret').addClass('is-focused');
  }

  removeIsfocusedSecret() {
    jQuery('#clientSecret').removeClass('is-focused');
  }
  addIsfocusedidenatity() {
    jQuery('#ideantity').addClass('is-focused');
  }

  removeIsfocusedideantity() {
    jQuery('#ideantity').removeClass('is-focused');
  }

  syncTask() {
    jQuery('#task').removeClass('hide');
    jQuery('#integration-main').addClass('hide');
    this.notify.emit({
      action: 'taskList',
      type: 'marketo'
    });
  }

  back() {
    this.isMapped = false;
    this.isConnected = true;
    this.getFields();
  }

  doubeOptin() {
    jQuery('#doubleOptin').removeClass('hide');
    this.isDoubleOptin = true;
  }

  setEmailBody(reset = null) {
    let emailBody = '';
    let storage: any = this._cookieService.readCookie('storage');
    storage = JSON.parse(storage);
    let email = storage.user.emails[0].email;
    if (reset) this.config['emailBody'] = '';
    if (this.config['emailBody'] != '') {
      let data = JSON.parse(this.config['emailBody']);
      emailBody = `<p>` + data.header + `</p>` + `<p>` + data.body1 + `</p>` +
        `<div class="b-outer"><button class="button-view">` + data.button + `</button></div>
 <p>`+ data.body2 + `</p>
 <p>`+ data.footer1 + `</p><p>` + data.footer2 + `</p>`;

    }
    else {
      emailBody = `<p>Dear {{fname}},</p>
      <p> Please confirm your subscription to updates from `+ this.jsonBuilderHelper.getJSONBuilt().name.split('-')[0] + ` by clicking on the button here</p>
      
      <div class="b-outer"><button class = "button-view" >Confirm Subscription</button></div>
      <P>If you have received this email by mistake, please ignore it. If at any point in time, you wish to receive or delete all your information held by `+ this.jsonBuilderHelper.getJSONBuilt().name.split('-')[0] + `, contact us at ` + email + `</p>
      <p>Cheers</p>
      <p readOnly=true>`+ this.jsonBuilderHelper.getJSONBuilt().name.split('-')[0]; +`</p>`;

    }
    jQuery('textarea#froala-editorIntegration').froalaEditor('html.set', (emailBody));
  }


  sendTestMail(text) {
    if (text === 'save') {
      jQuery('.saveEmail').html('Saving...');
    }
    let message = jQuery('textarea#froala-editorIntegration').froalaEditor('html.get');
    let htmldoc = jQuery(message);

    let buttonText = '';
    let email_data = [];
    for (let i = 0; i < htmldoc.length; i++) {
      if (htmldoc[i].className === 'b-outer') {
        buttonText = htmldoc[i].innerText;
      }
      else {
        email_data.push(htmldoc[i].innerText);
      }
    };

    let storage: any = this._cookieService.readCookie('storage');
    storage = JSON.parse(storage);
    let email = storage.user.emails[0].email;
    let emailText = { 'header': email_data[0], 'button': buttonText, 'body1': email_data[1], 'body2': email_data[2], 'footer1': email_data[3], 'footer2': email_data[4] };
    let data = { 'emailBody': emailText, 'email': email, type: text };
    this._integrationService.sendTestmail(data, this.jsonBuilderHelper.getJSONBuilt()._id, 'marketo').subscribe((res) => {
      if (Object.keys(res).length != 0) {
        window.toastNotification('Email saved successfully');
        jQuery('.saveEmail').html('Save');
        this.doubleoptinButton = true;
      } else {
        window.toastNotification('Test Email sent to ' + email + '.');
      }
    })

  }

  setDoubleoptin(active) {
    if (active) this.sendTestMail('save');
    this._integrationService.setDoubleOpt(this.jsonBuilderHelper.getJSONBuilt()._id, 'marketo', active)
      .subscribe((res) => {
        if (res['doubleOptin'])
          window.toastNotification("Double optin set successfully");
        else window.toastNotification('Double optin removed');

      });
    jQuery('#marketo-new').modal('hide');
  }

  getAccounts() {
    this.isMapped = false;
    this.isConnected = false;
    this.isLoading = true;
    this.accounts = [];
    this.isError = false;
    this.isAccountSelected = false;
    this._integrationService.getAccount('marketo')
      .subscribe((response: any) => {
        let accounts = response.accounts;
        let cnt: any = 0;
        for (let key in accounts) {
          cnt++;
          if (accounts.hasOwnProperty(key)) {
            let obj = {};
            obj['name'] = accounts[key].account_name ? accounts[key].account_name : '#Account ' + cnt;
            obj['status'] = accounts[key].active ? accounts[key].active : false;
            obj['access_token'] = accounts[key].access_token;
            obj['client_id'] = accounts[key].client_id;
            obj['client_secret'] = accounts[key].client_secret;
            obj['instance_url'] = accounts[key].instance_url;
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
        jQuery('#marketo-new').modal('show');
      })
  }
  testAccount(account: any) {
    this.form.value.client_id = account.client_id;
    this.form.value.client_secret = account.client_secret;
    this.form.value.ideantity = account.instance_url;
    this.isCheckingTestAccount = true;
    this.connect();
  }

  editAccount(name, client_id, client_secret, instance_url) {
    this.isAccountSelected = true;
    this.integrations.account_name = name;
    this.integrations.client_id = client_id;
    this.integrations.client_secret = client_secret;
    this.integrations.ideantity = instance_url;

    this.isConnected = false;
    this.isMapped = false;
    jQuery('#marketo-new').modal('show');

  }

  setAccount(key: any, action: any) {
    let data = {
      key: key,
      action: action
    }
    this.activeAccount=key;    
    this._integrationService.setAccount(data, 'marketo')
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
      this.isMapped = false;
      this.getAccounts();
    }

  }

  showList() {
    this.isConnected = true;
    this.errorMsg = "";
    this.isError = false;
    this.getFields();
  }
}
