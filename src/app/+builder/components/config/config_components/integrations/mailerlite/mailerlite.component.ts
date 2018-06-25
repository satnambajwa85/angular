import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  AfterViewInit
} from "@angular/core";
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
  selector: "og-mailerlite-component",
  templateUrl: "./mailerlite.component.html",
  styleUrls: [
    "./../../../assets/css/component_config.style.css",
    "./../../../../../../../../assets/css/sahil-hover.css"
  ]
})
export class MailerliteComponent implements OnInit, AfterViewInit {
  i: number = 0;
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: {
    active: boolean;
    map_fields: any[];
    list_id: string;
    list_name: string;
  } = {
    active: false,
    map_fields: [],
    list_id: "",
    list_name: ""
  };
  pendingLeads: any;
  isLeadsPending: boolean = false;
  mailerLiteForm: FormGroup;
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
  selectedListId: any = "";
  selectedInterestgroup: any = "";
  seletedInterest: any = "";
  isinterest: boolean = false;
  isConnected: Boolean = false;

  mapError: string = "";
  isMapError: boolean = false;
  isLimited: boolean = false;
  isMapped: boolean = false;
  isLoading: Boolean = false;
  testEmail: string;
  thirdstage: boolean = false;
  isLeadGenError: Boolean = false;
  accounts: any = [];
  isAccountSelected: boolean = false;
  isCheckingTestAccount: Boolean = false;
  activeAccount:string = '';
  @Output() notify = new EventEmitter();
  constructor(
    public _integrationService: IntegrationService,
    public jsonBuilderHelper: JSONBuilder,
    public _script: Script,
    public fb: FormBuilder,
    public _subdomainService: SubDomainService,
    public _featureAuthService: FeatureAuthService,
    public _cookieService: CookieService
  ) {
    this.company = this._subdomainService.subDomain.company_id;
    this.mailerLiteForm = this.fb.group({
      apiKey: [
        this.integrations.api_key,
        Validators.compose([Validators.required])
      ],
      accountName: [
        this.integrations.account_name,
        Validators.compose([Validators.required])
      ]
    });
  }

  ngOnInit() {
    //console.log(this.isConfigured,'configured/////////');
  }
  ngAfterViewInit() {
    let calc_type = this.jsonBuilderHelper.getJSONBuilt().templateType;
    if (calc_type === "Numerical") {
      this.calcType = "Calculator";
    } else if (calc_type === "Recommendation") {
      this.calcType = "Quiz";
    } else if (calc_type === "Poll") {
      this.calcType = "Poll";
    } else {
      this.calcType = "Graded Quiz";
    }
  }

  openConnectModal() {
    this.isAccountSelected = true;
    if (
      !this._featureAuthService.features.integrations["mailerlite"] &&
      !this._featureAuthService.features.integrations["mailerlite_limited"]
    ) {
      return;
    }
    if (this.configuration) {
      this.integrations.api_key = this.configuration.api_key;
      this.isConnected = false;
      this.isListSelected = false;
      this.isMapped = false;
    }
    jQuery("#mailerlite-new").modal("show");
  }
  openNewConnectModal() {
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
    this.integrations.api_key = "";
    this.integrations.account_name = "";
    jQuery("#mailerlite-new").modal("show");
  }

  connect() {
    this.isError=false
    this.errorMsg=""
    if (
      !this._featureAuthService.features.integrations["mailerlite"] &&
      !this._featureAuthService.features.integrations["mailerlite_limited"]
    ) {
      return;
    }
    jQuery("#btnMailerLite").html("Please Wait...");
    let data = {
      api_key: this.mailerLiteForm.value.apiKey,
      account_name : this.mailerLiteForm.value.accountName,
      company: this.company,
      isCheckingTestAccount : this.isCheckingTestAccount
    };

    this._integrationService.authorization(data, "mailerlite").subscribe(
      response => {
        if (!response.account) {
          this.isError = true;
          jQuery("#btnMailerLite").html("Connect");
          this.errorMsg =
            "Invalid Credentials - Please re-enter your Mailerlite Api key";
        } else if (response.account) {
          jQuery("#btnMailerLite").html("Connect");
          this.errorMsg = "";
          this.isError = false;
          if(!this.isCheckingTestAccount){
          this.isListSelected = false;
          this.isConnected = true;
          window.toastNotification(
            "You have successfully integrated with Mailerlite"
          );
          this.getList();

          this.notify.emit({
            action: "connect"
          });
        }else{
          jQuery('#'+this.mailerLiteForm.value.apiKey).removeClass('hide');
        }
        }
      },
      error => {
        this.isError = true;
        jQuery("#btnMailerLite").html("Connect");
        if (error.error.code === "ENOTFOUND") {
          this.errorMsg =
            "Invalid Credentials - Please re-enter your MailerLite Api key";
        } if (error.error.code === 'E_KEY_EXIST') {
          this.errorMsg = error.error.err_message;
        }
      }
    );
  }

  activate(checked: boolean) {
    this.isMapError = false;
    this.mapError = "";
    this.isError=false;
    this.errorMsg="";
    jQuery("#mailerlite-new").modal("show");
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
    if (this.selectedListId) {
      this.isError = false;
      this.errorMsg=""
      jQuery(".btn-test")
        .html("PLEASE WAIT...")
        .attr("disabled", true);
      console.log(this.insertFields);
      let data = {
        map_fields: this.insertFields,
        list_id: this.selectedListId,
        email: "integrations@outgrow.co"
      };
      if (
        !this.insertFields.find(el => {
          return el["calc"] === "email";
        })
      ) {
        this.mapError = "Warning - Email Field is required.";
        this.isMapError = true;
        jQuery(".btn-test")
          .html("Test Connection")
          .attr("disabled", false);
      } else {
        this.isMapError = false;
        this._integrationService
          .testSaveLead(
            "mailerlite",
            this.jsonBuilderHelper.getJSONBuilt()._id,
            data
          )
          .subscribe(
            response => {
              if (response.status.success) {
                this.sendMapFields();
                this.isMapped = true;
                window.toastNotification("Connection Test Successful");
                this.ViewMappedData(response.dataSent);
                this.updateIntegrationStatus(true);
                window.toastNotification("Connection Test Successful");
              } else {
                jQuery(".btn-test")
                  .html("Test Connection")
                  .attr("disabled", false);
                this.isMapError = true;
                this.mapError = "Field type mismatch. Please fix & retest";
              }
            },
            error => {
              jQuery(".btn-test")
                .html("Test Connection")
                .attr("disabled", false);
              this.isMapError = true;
              this.mapError =
                "Invalid Credentials - Please re-enter your Mailerlite Api key";
            }
          );
      }
    } else {
      this.isMapError = true;
      this.mapError =
        "Please reconfigure & select the list where you want to save leads";
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      mailerlite: checked
    };

    this._integrationService
      .updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe(
        result => {
          this.notify.emit({
            action: "activate"
          });
          let toastText = "";
          if (checked) {
            toastText =
              "Integration Activated !! The leads from this calculator will be sent to MailerLite";
          } else {
            toastText =
              "Integration Deactivated !! The leads from this calculator will not be sent to MailerLite";
          }
          window.toastNotification(toastText);
        },
        error => {
          console.log(error);
        }
      );
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features
      .integrations["mailerlite_limited"];
    let isIntegrationFull: Boolean = this._featureAuthService.features
      .integrations["mailerlite"];
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
    this.mapError = "";
    this.isLeadGenError = false;
    this._integrationService
      .getCalcBasicFields(
        "mailerlite",
        this.jsonBuilderHelper.getJSONBuilt()._id
      )
      .subscribe(
        result => {
          if (
            !result.calc.find(el => {
              return el["api_key"] === "email";
            })
          ) {
            this.isLeadGenError = true;
            this.isLoading = false;
            this.isMapError = true;

            this.mapError =
              "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. ";
            jQuery(".btn-test")
              .html("Test Connection")
              .attr("disabled", true);
          }
          if (!this.isMapError) {
            jQuery(".btn-test")
              .html("Test Connection")
              .attr("disabled", false);
          }
          this.isMapError = false;
          this.isLoading = false;
          let calcfiedls = result.calc;
          let crmfields = result.crm;
          this.calcAllFileds = [];
          this.crmAllFileds = [];
          for (let key in calcfiedls) {
            if (calcfiedls.hasOwnProperty(key)) {
              let obj = {};
              obj["calc_name"] = calcfiedls[key].name;
              obj["calc_key"] = calcfiedls[key].api_key;
              if (obj["calc_key"] === "email") {
                obj["calc_value"] = "Sample : integrations@outgrow.co";
              } else {
                obj["calc_value"] = "Sample : " + calcfiedls[key].value;
              }
              this.calcAllFileds.push(obj);
            }
          }
          for (let key in crmfields) {
            if (
              crmfields.hasOwnProperty(key) &&
              crmfields[key].api_key !== "Name"
            ) {
              let obj = {};
              obj["crm_name"] =
                crmfields[key].name.length >= 40
                  ? crmfields[key].name.slice(0, 40) + "..."
                  : crmfields[key].name;
              obj["crm_key"] = crmfields[key].api_key;
              let selectedMapFields = this.config.map_fields;
              let mpFiledLength = selectedMapFields.length;
              for (let i = 0; i < mpFiledLength; i++) {
                if (crmfields[key].api_key === selectedMapFields[i].crm) {
                  obj["calc_key"] = selectedMapFields[i].calc;
                  let insertObj = {};
                  insertObj["calc"] = selectedMapFields[i].calc;
                  insertObj["crm"] = crmfields[key].api_key;
                  this.insertFields.push(insertObj);
                  break;
                } else {
                  obj["calc_key"] = "";
                }
              }
              this.crmAllFileds.push(obj);
            }
          }
        },
        error => {
          this.isMapError = true;
          this.isLoading = false;
          this.thirdstage = false;
          if (
            error.error.err_message ===
            "Cannot read property 'fields' of undefined"
          ) {
            this.mapError =
              "Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.";
          } else {
            this.mapError = error.error.err_message;
          }
        }
      );
  }

  getFullMapFields() {
    this.isLoading = true;
    this.isMapError = false;
    this.mapError = "";
    this.isLeadGenError = false;
    this._integrationService
      .getCalcMapFields("mailerlite", this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe(
        result => {
          if (
            !result.calc.find(el => {
              return el["api_key"] === "email";
            })
          ) {
            console.log("lead gene error");
            this.isLeadGenError = true;
            this.isLoading = false;
            this.mapError =
              "Warning - There is no Email id field in your lead generation form. It is recommended to add email id field in the lead generation form to proceed with this integration. ";
            jQuery(".btn-test")
              .html("Test Connection")
              .attr("disabled", true);
          }
          if (!this.isLeadGenError) {
            jQuery(".btn-test")
              .html("Test Connection")
              .attr("disabled", false);
          }
          this.isLoading = false;
          let calcfiedls = result.calc;
          let crmfields = result.crm;
          this.calcAllFileds = [];
          this.crmAllFileds = [];
          for (let key in calcfiedls) {
            if (calcfiedls.hasOwnProperty(key)) {
              let obj = {};
              obj["calc_name"] = calcfiedls[key].name;
              obj["calc_key"] = calcfiedls[key].api_key;
              if (obj["calc_key"] === "email") {
                obj["calc_value"] = "Sample : integrations@outgrow.co";
              } else {
                obj["calc_value"] = "Sample : " + calcfiedls[key].value;
              }
              this.calcAllFileds.push(obj);
            }
          }
          for (let key in crmfields) {
            if (
              crmfields.hasOwnProperty(key) &&
              crmfields[key].api_key !== "Name"
            ) {
              let obj = {};
              obj["crm_name"] =
                crmfields[key].name.length >= 40
                  ? crmfields[key].name.slice(0, 40) + "..."
                  : crmfields[key].name;
              obj["crm_key"] = crmfields[key].api_key;
              let selectedMapFields = this.config.map_fields;
              let mpFiledLength = selectedMapFields.length;
              for (let i = 0; i < mpFiledLength; i++) {
                if (crmfields[key].api_key === selectedMapFields[i].crm) {
                  obj["calc_key"] = selectedMapFields[i].calc;
                  let insertObj = {};
                  insertObj["calc"] = selectedMapFields[i].calc;
                  insertObj["crm"] = crmfields[key].api_key;
                  this.insertFields.push(insertObj);
                  break;
                } else {
                  obj["calc_key"] = "";
                }
              }
              this.crmAllFileds.push(obj);
            }
          }
        },
        error => {
          this.isMapError = true;
          this.isLoading = false;
          if (
            error.error.err_message ===
            "Cannot read property 'fields' of undefined"
          ) {
            this.mapError =
              "Warning - There is no lead generation form in this calculator. It is recommended to add the lead generation form to proceed with this integration.";
          } else {
            this.mapError = error.error.err_message;
          }
        }
      );
  }

  checkExistingField() {
    let tmp = [];
    for (let i in this.calcAllFileds) {
      for (let j in this.insertFields) {
        if (this.insertFields[j]["calc"] == this.calcAllFileds[i]["calc_key"]) {
          let obj = {};
          obj["calc"] = this.insertFields[j]["calc"];
          obj["crm"] = this.insertFields[j]["crm"];
          tmp.push(obj);
          break;
        }
      }
    }
    this.insertFields = tmp;
  }

  sendMapFields() {
    jQuery(".btn-test")
      .html("PLEASE WAIT")
      .attr("disabled", false);
    let data = {
      map_fields: this.insertFields
    };
    if (this.isLimited) {
      this._integrationService
        .sendMapFieldsBasic(
          "mailerlite",
          this.jsonBuilderHelper.getJSONBuilt()._id,
          data
        )
        .subscribe(
          result => {
            this.notify.emit({
              action: "activate"
            });
          },
          error => {
            jQuery(".btn-test")
              .html("Test Connection")
              .attr("disabled", false);
          }
        );
    } else {
      this.checkExistingField();
      this._integrationService
        .sendMapFields(
          "mailerlite",
          this.jsonBuilderHelper.getJSONBuilt()._id,
          this.insertFields
        )
        .subscribe(
          result => {
            this.notify.emit({
              action: "activate"
            });
          },
          error => {
            jQuery(".btn-test")
              .html("Test Connection")
              .attr("disabled", false);
          }
        );
    }
  }

  selectedMapFields(calcKey: string, event: any) {
    this.isMapError = false;
    this.mapError = "";
    let obj = {};
    obj["calc"] = calcKey;
    obj["crm"] = event.target.value;
    let fieldslength = this.insertFields.length;
    if (fieldslength > 0) {
      let flagPush = true;
      for (let i = 0; i < fieldslength; i++) {
        if (calcKey === this.insertFields[i].calc) {
          this.insertFields[i]["crm"] = event.target.value;
          flagPush = false;
          if (this.insertFields[i]["crm"] == "0") {
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
      if (data.hasOwnProperty(key) && key != "list_id") {
        let obj = {};
        obj["key"] = key;
        obj["value"] = data[key];
        this.viewMappedData.push(obj);
      }
    }
  }

  returnFeatureAccess() {
    let isIntegrartionLimited: Boolean = this._featureAuthService.features
      .integrations["mailerlite_limited"];
    let isIntegrationFull: Boolean = this._featureAuthService.features
      .integrations["mailerlite"];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }

  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, "mailerlite");
    jQuery("." + feature).addClass("activegreen limited-label");
    jQuery("#premiumModal").modal("show");
    jQuery(".modal-backdrop").insertAfter("#premiumModal");
  }

  close() {
    jQuery("#mapping-int-toAccess").modal("hide");
    jQuery("#mailerlite-new").modal("hide");
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    this.thirdstage = false;
    this.isMapError = false;
    this.isListSelected = false;
    this.isLoading = false;
    this.isMapped = false;
    this.isError = false;
    this.isAccountSelected = false;
    this.isConnected = false;
  }

  sync() {
    let self = this;
    jQuery(".sync-leads-mc").html("Please Wait..");
    this._integrationService
      .syncCalcLeads("mailerlite", this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe(
        result => {
          if (result.status == 1) {
            jQuery(".sync-leads-mc").html("Sync");
            window.toastNotification(
              "Data will be synced with mailerlite shortly"
            );
          } else {
            jQuery(".sync-leads-mc").html("Sync (" + this.pendingLeads + ")");
            jQuery("#syncError-modal").modal("show");
          }
        },
        error => {
          jQuery(".sync-leads-mc").html("Sync (" + this.pendingLeads + ")");
          jQuery("#syncError-modal").modal("show");
        }
      );
  }

  closeMapped() {
    this.crmAllFileds = [];
    this.calcAllFileds = [];
    this.insertFields = [];
    jQuery("#mailerlite-new").modal("hide");
  }

  addIsfocusedKey() {
    jQuery("#mailerLite_apiKey").addClass("is-focused");
    this.isError = false;
    this.errorMsg = "";
  }

  removeIsfocusedKey() {
    jQuery("#mailerLite_apiKey").removeClass("is-focused");
  }

  getList() {
    this.isLoading = true;
    this.selectedListId = this.config.list_id;
    this._integrationService.getList("mailerlite").subscribe(
      response => {
        if (response.total_items !== 0) {
          this.crmList = [];
          this.isListExist = true;
          this.isLoading = false;
          let lists = response;
          for (let key in lists) {
            if (lists.hasOwnProperty(key)) {
              let obj = {};
              obj["name"] = lists[key].name;
              obj["id"] = lists[key].id;
              this.crmList.push(obj);
            }
          }
        } else {
          this.isListExist = false;
        }
      },
      error => {
        console.log("error", error);
      }
    );
  }

  selectedList(id) {
    // let item = this.crmList.find(obj=>obj['id']===id);
    // this.selectedListName = item?item['name']:'';
    this.selectedListName = jQuery("#mlt option:selected").text();
    console.log("this.selectedListName", this.selectedListName);
    if (this.selectedListId != "" || !this.selectedListId) {
      this.selectedListId = "";
      this.selectedListId = id;
      this.insertFields.splice(3, 1);
    } else {
      this.selectedListId = id;
    }
  }

  saveList() {
    if (!this.selectedListId || this.selectedListId === "0") {
      this.isError = true;
      this.errorMsg = "Please select the list where you want to save leads";
    } else {
      jQuery("#btnMailerLiteList").html("Please wait...");
      let data = {
        list_id: this.selectedListId,
        list_name: this.selectedListName
      };

      this._integrationService
        .saveList("mailerlite", this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe(
          (response: any) => {
            console.log("success", response);
            //this.getFields();
            this.isListSelected = true;
            this.getFields();
          },
          error => {
            console.log("error", error);
          }
        );
    }
  }

  syncTask() {
    jQuery("#task").removeClass("hide");
    jQuery("#integration-main").addClass("hide");
    this.notify.emit({
      action: "taskList",
      type: "mailerlite"
    });
  }

  back() {
    this.isMapped = false;
    this.isListSelected = true;
    this.thirdstage = true;
    this.getFields();
  }

  getAccounts() {
    this.isLoading = true;
    this.isMapped = false;
    this.isConnected = false;
    this.accounts = [];
    this.isError=false;
    this.errorMsg=""
    this.isListSelected=false
    this.isMapError = false;
    this.mapError = ""
  this.isAccountSelected = false;
    this._integrationService.getAccount('mailerlite')
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
        jQuery('#mailerlite-new').modal('show');
      })
  }

  testAccount(account: any) {
    this.mailerLiteForm.value.apiKey = account;
    this.isCheckingTestAccount  = true;
    this.connect();
    this.isAccountSelected = false
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false
  }

  // editAccount(key) {
  //   this.isAccountSelected = true;
  //   this.integrations.api_key = key;
  //   //this.integrations.account_name = name;
  //   this.isConnected = false;
  //   this.isListSelected = false;
  //   this.isMapped = false;
  //   jQuery('#mailchimp-new').modal('show');
  // }

  setAccount(key: any, action: any) {
    let data = {
      key: key,
      action: action
    };
    this.activeAccount = key;
    this._integrationService.setAccount(data, 'mailerlite')
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

  addfocus() {
    jQuery(".label-text").addClass("active");
  }
  removefocus() {
    jQuery(".label-text").removeClass("active");
  }
}
