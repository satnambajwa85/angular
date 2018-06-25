import {Component,EventEmitter,OnInit,Output, AfterViewInit} from "@angular/core";
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
  selector: "og-convertkit-component",
  templateUrl: "./convertkit.component.html",
  styleUrls: [
    "./../../../assets/css/component_config.style.css",
    "./../../../../../../../../assets/css/sahil-hover.css"
  ]
})
export class ConvertkitComponent implements OnInit, AfterViewInit {
  i: number = 0;
  isConfigured: Boolean = false;
  configuration: Integrations;
  config: {
    active: boolean;
    map_fields: any[];
    list_id: string;
    list_name: string;
    list_type: string;
  } = {
    active: false,
    map_fields: [],
    list_id: "",
    list_name: "",
    list_type: ""
  };
  pendingLeads: any;
  isLeadsPending: boolean = false;
  convertKitForm: FormGroup;
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
  listType: string = "";
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
    this.convertKitForm = this.fb.group({
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

  ngOnInit() {}
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
      !this._featureAuthService.features.integrations["convertkit"] &&
      !this._featureAuthService.features.integrations["convertkit_limited"]
    ) {
      return;
    }
    if (this.configuration) {
      this.integrations.api_key = this.configuration.api_key;
      this.isConnected = false;
      this.isListSelected = false;
      this.isMapped = false;
    }
    jQuery("#convertkit-new").modal("show");
  }
  openNewConnectModal() {
    this.isAccountSelected = true;
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
    this.integrations.api_key = "";
    this.integrations.account_name = "";
    jQuery("#convertkit-new").modal("show");
  }
  connect() {
    this.isError=false;
    this.errorMsg="";
    if (
      !this._featureAuthService.features.integrations["convertkit"] &&
      !this._featureAuthService.features.integrations["convertkit_limited"]
    ) {
      return;
    }
    jQuery("#btnConvertKit").html("Please Wait...");
    let data = {
      api_key: this.convertKitForm.value.apiKey,
      account_name: this.convertKitForm.value.accountName,
      isCheckingTestAccount: this.isCheckingTestAccount,
      company: this.company
    };

    this._integrationService.authorization(data, "convertkit").subscribe(
      response => {
        if (!response.forms) {
          this.isError = true;
          jQuery("#btnConvertKit").html("Connect");
          this.errorMsg = "Invalid Credentials - Please re-enter your Convertkit Api key";
        } else if (response.forms) {
          jQuery("#btnConvertKit").html("Connect");
          this.errorMsg = "";
          this.isError = false;
          if (!this.isCheckingTestAccount) {
            this.isListSelected = false;
            this.isConnected = true;
            window.toastNotification( "You have successfully integrated with Convertkit" );
            if (this.config.list_type != "") {
              this.setListType(this.config.list_type);
            }
            this.notify.emit({
              action: "connect"
            });
          } else {
            jQuery("#" + this.convertKitForm.value.apiKey).removeClass("hide");
          }
      }
      },
      error => {
        this.isError = true;
        jQuery("#btnConvertKit").html("Connect");
        if (error.error.code === "ENOTFOUND") {
          this.errorMsg = "Invalid Credentials - Please re-enter your convertkit Api key";
        }
        if (error.error.code === "E_KEY_EXIST") {
          this.errorMsg = error.error.err_message;
        }
      }
    );
  }

  activate(checked: boolean) {
    this.isMapError = false;
    this.mapError = "";
    jQuery("#convertkit-new").modal("show");
    this.isMapped = false;
    this.isConnected = true;
    this.isListSelected = false;
    this.calcAllFileds = [];
    this.crmAllFileds = [];
    this.insertFields = [];
    this.isListSelected = false;
    this.integrations.api_key = this.configuration.api_key;
    if (this.config.list_type != "") {
      this.setListType(this.config.list_type);
    }
  }

  test() {
    if (this.selectedListId) {
      this.isError = false;
      jQuery(".btn-test")
        .html("PLEASE WAIT...")
        .attr("disabled", true);
      let data = {
        map_fields: this.insertFields,
        list_id: this.selectedListId
      };
      if (
        !this.insertFields.find(el => {
          return el["calc"] === "email";
        })
      ) {
        this.mapError = "Warning - Email Field is required.";
        this.isMapError = true;
        jQuery(".btn-test").html("Test Connection").attr("disabled", false);
      } else {
        this.isMapError = false;
        this._integrationService
          .testSaveLead("convertkit",this.jsonBuilderHelper.getJSONBuilt()._id, data)
          .subscribe(
            response => {
              console.log("response", response);
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
              jQuery(".btn-test").html("Test Connection").attr("disabled", false);
              this.isMapError = true;
              this.mapError ="Invalid Credentials - Please re-enter your convertkit Api key";
            }
          );
      }
    } else {
      this.isMapError = true;
      this.mapError =  "Please reconfigure & select the list where you want to save leads";
    }
  }

  updateIntegrationStatus(checked: boolean) {
    let data = {
      convertkit: checked
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
              "Integration Activated !! The leads from this calculator will be sent to convertkit";
          } else {
            toastText =
              "Integration Deactivated !! The leads from this calculator will not be sent to convertkit";
          }
          window.toastNotification(toastText);
        },
        error => {
          console.log(error);
        }
      );
  }

  getFields() {
    let isIntegrationLimited: Boolean = this._featureAuthService.features .integrations["convertkit_limited"];
    let isIntegrationFull: Boolean = this._featureAuthService.features .integrations["convertkit"];
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
        "convertkit",
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
      .getCalcMapFields("convertkit", this.jsonBuilderHelper.getJSONBuilt()._id)
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
          console.log("RESULT", result);
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
          "convertkit",
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
          "convertkit",
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
      if (data.hasOwnProperty(key) && key != "list_id" && key != "list_type") {
        let obj = {};
        obj["key"] = key;
        obj["value"] = data[key];
        this.viewMappedData.push(obj);
      }
    }
  }

  returnFeatureAccess() {
    let isIntegrartionLimited: Boolean = this._featureAuthService.features
      .integrations["convertkit_limited"];
    let isIntegrationFull: Boolean = this._featureAuthService.features
      .integrations["convertkit"];
    if (isIntegrartionLimited || isIntegrationFull) {
      return true;
    } else if (!isIntegrationFull && !isIntegrartionLimited) {
      return false;
    }
  }

  premiumPopup(feature: string) {
    this._featureAuthService.setSelectedFeature(feature, "convertkit");
    jQuery("." + feature).addClass("activegreen limited-label");
    jQuery("#premiumModal").modal("show");
    jQuery(".modal-backdrop").insertAfter("#premiumModal");
  }

  close() {
    jQuery("#mapping-int-toAccess").modal("hide");
    jQuery("#convertkit-new").modal("hide");
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
      .syncCalcLeads("convertkit", this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe(
        result => {
          if (result.status == 1) {
            jQuery(".sync-leads-mc").html("Sync");
            window.toastNotification(
              "Data will be synced with convertkit shortly"
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
    jQuery("#convertkit-new").modal("hide");
  }

  addIsfocusedKey() {
    jQuery("#convertkit_apiKey").addClass("is-focused");
    this.isError = false;
    this.errorMsg = "";
  }

  removeIsfocusedKey() {
    jQuery("#convertkit_apiKey").removeClass("is-focused");
  }

  getList() {
    this.isLoading = true;
    this.selectedListId = this.config.list_id;
    let data = {
      listType: this.listType
    };
    this._integrationService.getList("convertkit", data).subscribe(
      response => {
        if (response.total_items !== 0) {
          this.crmList = [];
          this.isListExist = true;
          this.isLoading = false;
          let lists: any;
          if (response.forms) {
            lists = response.forms;
          } else if (response.courses) {
            lists = response.courses;
          } else if (response.tags) {
            lists = response.tags;
          }else{
            this.isError=true
            this.errorMsg="Something went Wrong .Please Reconfigure"
          }
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


  setListType(type: any) {
    this.isError=false
    this.errorMsg=''
    this.listType = type;
    this.getList();
  }

  selectedList(id) {
    this.errorMsg=""
    this.isError=false
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
    if (!this.selectedListId ||jQuery("#mlt option:selected").val()=="0") {
      this.isError = true;
      this.errorMsg = "Please select " + this.listType.slice(0,-1) + " where you want to save leads";
    } else {
      jQuery("#btnConvertKitList").html("Please wait...");
      let data = {
        list_id: this.selectedListId,
        list_name: this.selectedListName,
        list_type: this.listType
      };

      this._integrationService
        .saveList("convertkit", this.jsonBuilderHelper.getJSONBuilt()._id, data)
        .subscribe(
          (response: any) => {
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
      type: "convertkit"
    });
  }

  back() {
    this.isMapped = false;
    this.isListSelected = true;
    this.thirdstage = true;
    this.getFields();
  }

  addfocus() {
    jQuery(".label-text").addClass("active");
  }
  removefocus() {
    jQuery(".label-text").removeClass("active");
  }

  getAccounts() {
    this.isLoading = true;
    this.isMapped = false;
    this.accounts = [];
    this.isConnected = false;
    this.isError=false;
    this.errorMsg=""
    this.isAccountSelected = false;
    this._integrationService
      .getAccount("convertkit")
      .subscribe((response: any) => {
        let accounts = response.accounts;
        let cnt: any = 0;
        for (let key in accounts) {
          cnt++;
          if (accounts.hasOwnProperty(key)) {
            let obj = {};
            obj["name"] = accounts[key].account_name
              ? accounts[key].account_name
              : "Account#" + cnt;
            obj["key"] = accounts[key].api_key;
            obj["status"] = accounts[key].active ? accounts[key].active : false;
            obj["access_token"] = accounts[key].access_token;
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
        jQuery("#convertkit-new").modal("show");
      });
  }

  testAccount(account: any) {
    this.convertKitForm.value.apiKey = account;
    this.isCheckingTestAccount = true;
    this.connect();
    this.isAccountSelected = false;
    this.isConnected = false;
    this.isListSelected = false;
    this.isMapped = false;
  }

  setAccount(key: any, action: any) {
    let data = {
      key: key,
      action: action
    };
    this.activeAccount = key;
    this._integrationService.setAccount(data, "convertkit").subscribe(
      response => {
        if (action === "edit") {
          window.toastNotification(
            "You have successfully selected the account"
          );
        }
        if (action === "delete") {
          window.toastNotification("You have successfully deleted the account");
          this.getAccounts();
        }
       
      },
      error => {}
    );
  }

  previous(flag: any) {
    if (flag === "reconfig") {
      this.isAccountSelected = false;
      this.isConnected = false;
      this.isListSelected = false;
      this.isMapped = false;
      this.getAccounts();
    }
  }

  showList() {
    let isListEnabled = this.accounts.filter(
      account => account.status === true
    );
    if (isListEnabled.length === 0) {
      this.isMapError = true;
      this.mapError = "Please Select the Account.";
    } else {
      this.isListSelected = false;
      this.isConnected = true;
      this.errorMsg = "";
      this.isError = false;
      if (this.config.list_type != "") {
        this.setListType(this.config.list_type);
      }
    }
  }
}
