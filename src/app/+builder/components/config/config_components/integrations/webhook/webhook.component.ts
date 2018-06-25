import {Component, ViewEncapsulation, OnInit, AfterViewInit} from '@angular/core';
import {Validators, FormBuilder, FormGroup} from '@angular/forms';
import {WebhookService} from './../../../../../../../shared/services/webhook.service';
import {FeatureAuthService} from './../../../../../../../shared/services/feature-access.service';
import {JSONBuilder} from './../../../../../services/JSONBuilder.service';
import {Script} from '../../../../../../../shared/services/script.service';

declare var jQuery: any;
declare var moment: any;

@Component({
  selector: 'config-webhook',
  templateUrl: './assets/html/webhook.component.html',
  styleUrls: ['./assets/css/webhook.component.css', './../../../../../../../../assets/css/sahil-hover.css'],
  encapsulation: ViewEncapsulation.None
})

export class WebhookComponent implements OnInit, AfterViewInit {
  webhookForm: FormGroup;
  webhookRequestHeader: Object;
  webhookRequestBody: Object;
  webhookResponseHeader: Object;
  webhookResponseBody: Object;
  webhookActivate: boolean;
  error: any;
  success: any;
  basicAuth: boolean;
  available: boolean;
  webhookSet: boolean;
  webhookLogs: any;
  webhookLogsOffset: number;
  webhookLogsCount: number;
  webhooklogDetailRequest: any;
  webhooklogDetailResponse: any;
  webhooklogDetailResponseBody: any;
  loadingLogs: boolean;
  date: any;
  JSON: any;
  pageNumber: number;
  startDate: any;
  endDate: any;
  constructor(public fb: FormBuilder,
              public jsonBuilderHelper: JSONBuilder,
              public _webhookService: WebhookService,
              public _featureAuthService: FeatureAuthService,
              private script: Script) {
    this.error = null;
    this.success = null;
    this.basicAuth = false;
    this.available = false;
    this.webhookActivate = false;
    this.webhookSet = false;
    this.webhookRequestHeader = {};
    this.webhookRequestBody = {};
    this.webhookResponseHeader = {};
    this.webhookResponseBody = {};
    this.webhookLogs = [];
    this.webhookLogsOffset = 0;
    this.webhookLogsCount = 0;
    this.date = moment;
    this.JSON = JSON;
    this.webhooklogDetailRequest = null;
    this.webhooklogDetailResponse = null;
    this.webhooklogDetailResponseBody = null;
    this.pageNumber = 1;
    this.startDate = new Date();//.toISOString();
    this.endDate = new Date();//.toISOString();
    this.loadingLogs = false;
  }

  ngOnInit() {
    this.webhookForm = this.fb.group({
      webhookUrl: ['', Validators.compose([Validators.required])]
    });
    this.getCalcWebhook();
    this.initWebhookLog();
    this.available = this._featureAuthService.features.integrations['webhook'];
    jQuery('body').addClass('webhook-datepicker');
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.script.load('daterangepicker').then((data) => {
        this.initDatePicker();
      }).catch((error) => {});
    }, 3000);
  }

  initDatePicker() {
    const self = this;
    jQuery('#webhookLogDate').daterangepicker({
      buttonClasses: ['btn', 'btn-sm'],
      applyClass: 'btn-danger',
      cancelClass: 'btn-inverse',
      startDate: moment(self.startDate).format('MM/DD/YYYY'),
      endDate: moment(self.endDate).format('MM/DD/YYYY')
    });
    jQuery('#webhookLogDate').on('apply.daterangepicker', function(ev, picker) {
      const startEndDate = ev.currentTarget.value.split('-');
      self.startDate = new Date(startEndDate[0].trim());
      self.endDate = new Date(startEndDate[1].trim());
      self.webhookLogsOffset = 0;
      self.pageNumber = 1;
      self.initWebhookLog();
    });
  }

  testWebhook() {
    const self = this;
    this.available = this._featureAuthService.features.integrations['webhook'];
    if (this.available) {
      self.error = {
        code: null,
        err_message: null
      };
      self.success = null;
      const data = this.webhookForm.value;
      data.webhookName = data.webhookUrl;
      data.company = window.location.href.split('.')[0].split('//')[1];
      data.calc_id = this.jsonBuilderHelper.getJSONBuilt()._id;
      jQuery('#testNsave').html('Please wait...').attr('disabled', true);
      const testWebhook = self._webhookService.testWebhook(data)
        .subscribe(
          (success: any) => {
            if (success.response.statusCode >= 400 && success.response.statusCode <= 511) {
              self.error['code'] = success.response.statusCode;
              self.error['err_message'] = null;
            } else {
              self.success = success.response.statusCode;
              self.webhookRequestHeader = success.response.request.headers;
              self.webhookRequestHeader['host'] = success.response.request.uri.host;
              self.webhookRequestHeader['path'] = success.response.request.uri.path;
              self.webhookRequestHeader['port'] = success.response.request.uri.port;
              self.webhookRequestHeader['protocol'] = success.response.request.uri.protocol;
              self.webhookRequestBody = success.request;
              self.webhookResponseHeader = success.response.headers;
              self.webhookResponseBody = success.response.body;
              self.saveWebhook(data, success);
            }
            jQuery('#testNsave').html('Send Test JSON & Save').attr('disabled', false);
            testWebhook.unsubscribe();
          }, (error: any) => {
            jQuery('#testNsave').html('Send Test JSON & Save').attr('disabled', false);
            self.error = error.error;
            testWebhook.unsubscribe();
          }
        );
    } else {
      jQuery('div:not(#premiumModal)').modal('hide');
      this._featureAuthService.setSelectedFeature('integrations', 'webhook');
      jQuery('.integrations').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('#analyticsRef').attr('active', false);
    }
  }

  saveWebhook(data: any, testsuccess: any) {
    const self = this;
    jQuery('#testNsave').html('Please wait...').attr('disabled', true);
    const saveWebhook = self._webhookService.saveWebhook({wh: data, testsuccess: testsuccess})
      .subscribe(
        (success: any) => {
          this.startDate = new Date();
          this.endDate = new Date();
          self.webhookLogsOffset = 0;
          self.initWebhookLog();
          if (success.webhook_url) {
            self.basicAuth = success.basicAuth;
            self.showHideField();
            self.webhookActivate = success.status === 'ACTIVE';
            self.webhookForm.controls['webhookUrl'].setValue(success.webhook_url);
            if (success.basicAuth) {
              self.webhookForm.controls['webhookUname'].setValue(success.basicAuthUname);
              self.webhookForm.controls['webhookPassword'].setValue(success.basicAuthPassword);
            }
            self.webhookSet = true;
          }
          jQuery('#testNsave').html('Send Test JSON & Save').attr('disabled', false);
          saveWebhook.unsubscribe();
        }, (error: any) => {
          jQuery('#testNsave').html('Send Test JSON & Save').attr('disabled', false);
          saveWebhook.unsubscribe();
        }
      );
  }

  getCalcWebhook() {
    const self = this;
    const getCalcWebhook = self._webhookService.getCalcWebhook(this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe(
        (success: any) => {
          if (success.webhook_url) {
            self.basicAuth = success.basicAuth;
            self.showHideField();
            self.webhookActivate = success.status === 'ACTIVE';
            self.webhookForm.controls['webhookUrl'].setValue(success.webhook_url);
            if (success.basicAuth) {
              self.webhookForm.controls['webhookUname'].setValue(success.basicAuthUname);
              self.webhookForm.controls['webhookPassword'].setValue(success.basicAuthPassword);
            }
            self.webhookSet = true;
          }
          getCalcWebhook.unsubscribe();
        },
        (error: any) => {
          getCalcWebhook.unsubscribe();
        }
      );
  }

  activeWebhook() {
    const self = this;
    this.available = this._featureAuthService.features.integrations['webhook'];
    if (this.available) {
      jQuery('#activateWebhook').attr('disabled', true);
      const activateWebhook = self._webhookService.activateWebhook(this.jsonBuilderHelper.getJSONBuilt()._id, !this.webhookActivate)
        .subscribe(
          (success: any) => {
            if (success.webhook_url) {
              self.basicAuth = success.basicAuth;
              self.showHideField();
              self.webhookActivate = success.status === 'ACTIVE';
              self.webhookForm.controls['webhookUrl'].setValue(success.webhook_url);
              if (success.basicAuth) {
                self.webhookForm.controls['webhookUname'].setValue(success.basicAuthUname);
                self.webhookForm.controls['webhookPassword'].setValue(success.basicAuthPassword);
              }
              self.webhookSet = true;
            }
            jQuery('#activateWebhook').attr('disabled', false);
            activateWebhook.unsubscribe();
          },
          (error: any) => {
            self.error = error.error;
            this.webhookActivate = false;
            jQuery('#activateWebhook').attr('checked', this.webhookActivate);
            jQuery('#activateWebhook').attr('disabled', false);
            activateWebhook.unsubscribe();
            jQuery('#activateWebhook').attr('checked', this.webhookActivate);
            jQuery('#activateWebhook').attr('disabled', false);
          }
        );
    } else {
      jQuery('div:not(#premiumModal)').modal('hide');
      this._featureAuthService.setSelectedFeature('integrations', 'webhook');
      jQuery('.integrations').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('#analyticsRef').attr('active', false);
      jQuery('#activateWebhook').attr('disabled', false);
      this.webhookActivate = false;
      jQuery('#activateWebhook').attr('checked', this.webhookActivate);
    }
  }

  basicAuthChange() {
    this.basicAuth = !this.basicAuth;
    this.showHideField();
  }

  showHideField() {
    if (this.basicAuth) {
      this.webhookForm = this.fb.group({
        webhookUrl: [this.webhookForm.value.webhookUrl, Validators.compose([Validators.required])],
        webhookUname: ['', Validators.compose([Validators.required])],
        webhookPassword: ['', Validators.compose([Validators.required])]
      });
    } else {
      this.webhookForm = this.fb.group({
        webhookUrl: [this.webhookForm.value.webhookUrl, Validators.compose([Validators.required])]
      });
    }
  }


  initWebhookLog() {
    let sdate = new Date(this.startDate);
    sdate.setDate(sdate.getDate() - 1);
    this.loadingLogs = true;
    const webhookLog = this._webhookService.getCalcWebhookLeadlog(this.jsonBuilderHelper.getJSONBuilt()._id, this.webhookLogsOffset, sdate, this.endDate).subscribe(
      (webhooklogs: any) => {
        console.log(this.webhookLogs.log, "@@@@@@");
        if (this.webhookLogs.log) {
        this.webhookLogs = webhooklogs.logs;
        this.webhookLogsCount = webhooklogs.count;
        } else {
          this.webhookLogs = [];
          this.webhookLogsCount = 0;
        }
        this.loadingLogs = false;
        webhookLog.unsubscribe();
        this.success = null;
      },
      (error: any) => {
        console.error('initWebhookLog error', error);
        webhookLog.unsubscribe();
      }
    );
  }

  oldWLog() {
    jQuery('#oldLog').attr('disabled', true).text('Please wait...');
    jQuery('#newLog').attr('disabled', true);
    this.webhookLogsOffset -= 5;
    this.initWebhookLog();
    this.pageNumber--;
  }

  newWLog() {
    jQuery('#oldLog').attr('disabled', true);
    jQuery('#newLog').attr('disabled', true).text('Please wait...');
    this.webhookLogsOffset += 5;
    this.initWebhookLog();
    this.pageNumber++;
  }

  showWebhookDetail(webhooklog) {
    this.webhooklogDetailRequest = JSON.parse(webhooklog.request);
    this.webhooklogDetailResponse = JSON.parse(webhooklog.response);
    this.webhooklogDetailResponseBody = this.webhooklogDetailResponse.body;
    jQuery('#view-webhook-req').modal('show');
  }
  addfocus() {
    jQuery('.webhookUrl').addClass('is-focused');
  }
  addfocus1() {
    jQuery('.webhookUserName').addClass('is-focused');
  }
  addfocus2() {
    jQuery('.webhookUserPassword').addClass('is-focused');
  }
  ngOnDestroy() {
    jQuery('body').removeClass('webhook-datepicker');
  }

}

