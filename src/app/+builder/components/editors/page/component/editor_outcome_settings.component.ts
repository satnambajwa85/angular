import { environment } from './../../../../../../../environments/environment';
import { Component, AfterViewInit, OnInit, ViewEncapsulation, OnChanges, OnDestroy } from '@angular/core';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { FormulaService } from '../../../../services/formula.service';
import { BuilderService } from '../../../../services/builder.service';
import { JSONItemTracker } from '../../../../services/JSONUpdateItemTracker.service';
import { Section, Page, App, Item } from '@builder/models';
import { FeatureAuthService } from '../../../../../../shared/services/feature-access.service';
import { RecommendationService } from '../../../../../templates/services/recommendation.service';
import { ShareOutcomeService } from './../../../../services/shareOutcome.service';

declare var jQuery: any;
declare var math: any;
declare var filestack: any;
declare var window: any;
declare var ga: any;
// declare var _kmq: any;
@Component({
  selector: 'editor-outcome-settings',
  templateUrl: './html/editor_outcome_settings.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class EditorOutcomeSettings implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  filePickerKey: any = environment.FILE_PICKER_API;
  page: Page;
  formulaResult: any = {};
  control: any;
  validUrl: boolean = true;
  sectionOrder: any[] = [];
  resultSection: Section;
  leadformSection: Section;
  editorHtml: string;
  QuestionnaireJson: any;
  navigate_url: any;
  editorControl: any = {
    result_header: {},
    section: {},
    leadform: {},
    click_button: {},
    share_links: {},
    result_redo: {},
    backImage: {},
    result_disclaimer: {},
    footer_links: {},
    result_summary: {}
  };
  public isCtaAccessible: Boolean = false;
  public isRealTimeResult: Boolean = false;
  public isDisclaimers: Boolean = false;
  constructor(
    public jsonBuilderHandler: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public formulaService: FormulaService,
    public _featureAuthService: FeatureAuthService,
    public recommendationService: RecommendationService,
    public _outcomeService: ShareOutcomeService
  ) {
    this.page = jsonBuilderHandler.getSelectedPage();
    for (let section in this.page.sections) {
      for (let item in this.page.sections[section].items) {
        // check for result outputs
        if (this.page.sections[section].title === 'Result') {
          this.resultSection = this.page.sections[section];
          this.jsonBuilderHandler.setSelectedControl(this.resultSection.items[0]);
        }
        if (this.page.sections[section].type === 'LeadForm')
          this.leadformSection = this.page.sections[section];
        for (let prop in this.editorControl) {
          if (prop === this.page.sections[section].items[item].type)
            this.editorControl[prop] = this.page.sections[section].items[item];
        }
      }
    }
  }

  ngOnInit() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedPage(this.page);
    this.isRealTimeResult = this._featureAuthService.features.real_time_results.active;
    this.isCtaAccessible = this._featureAuthService.features.cta.active;
    this.isDisclaimers = this._featureAuthService.features.disclaimers.active;
  }

  ngOnChanges() {
    // code
  }

  ngOnDestroy() {
    var rightPanelHeight = jQuery(window).height() - 72;
  }

  togglePrivacy() {
    this.editorControl.footer_links.visible = !this.editorControl.footer_links.visible;
  }

  toggleWysiwig(control: any) {
    control.visible = !control.visible;

  }

  ngAfterViewInit() {
    // code
  }

  accordianOpen(val: any, control: any) {
    this.jsonBuilderHandler.setSelectedControl(control);
    // //if(jQuery("a[href$='"+val+"']").parents('.panel').children('.panel-collapse').hasClass('in')) {
    event.stopPropagation();
    event.preventDefault();
    //}
  }
  validateUrl() {
    var urlregex = /(http(s)?:\\)?([\w-]+\.)+[\w-]+[.com|.in|.org]+(\[\?%&=]*)?/;
    if (urlregex.test(this.jsonBuilderHandler.getJSONBuilt().navigate_Url)) {
      this.validUrl = true;
    } else {
      this.validUrl = false;
    }
  }

  toggleDisclaimer() {
    this.isDisclaimers = this._featureAuthService.features.disclaimers.active;
    if (this.isDisclaimers) {
      this.editorControl.result_disclaimer.visible = !this.editorControl.result_disclaimer.visible;
    } else {
      this._featureAuthService.setSelectedFeature('disclaimers');
      jQuery('.disclaimers').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      this.editorControl.result_disclaimer.visible = false;
    }
  }

  isSocialChecked(socialMedia: any) {
    for (let option in this.editorControl.share_links.options) {
      if (this.editorControl.share_links.options[option].type == socialMedia) {
        return this.editorControl.share_links.options[option].selected;
      }
    }
    return true;
  }

  toggleSocialIcon(socialMedia: any) {
    var flag = false;
    for (let option in this.editorControl.share_links.options) {
      if (this.editorControl.share_links.options[option].type == socialMedia) {
        this.editorControl.share_links.options[option].selected = !this.editorControl.share_links.options[option].selected;
        flag = true;
      }
    }
    if (flag == false) {
      let option = (new Item).getOption();
      option.type = socialMedia;
      option.selected = false;
      this.editorControl.share_links.options.push(option);
    }
  }

  toggleSocialLink() {
    this.editorControl.share_links.visible = !this.editorControl.share_links.visible;
  }

  toggleRedo() {
    this.editorControl.result_redo.visible = !this.editorControl.result_redo.visible;
  }

  toggleSummary() {
    this.editorControl.result_summary.visible = !this.editorControl.result_summary.visible;
    if (this.editorControl.result_summary.visible) {
      this.resultSection.fullWidth = false;
      this.leadformSection.fullWidth = false;
    } else {
      this.resultSection.fullWidth = true;
      this.leadformSection.fullWidth = true;
    }
  }

  onRealTimeChange() {
    this.isRealTimeResult = true;
    if (this.isRealTimeResult) {
      this.jsonBuilderHandler.getJSONBuilt().realTime = !this.jsonBuilderHandler.getJSONBuilt().realTime;
    } else {
      this._featureAuthService.setSelectedFeature('real_time_results');
      jQuery('.real_time_results').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      this.jsonBuilderHandler.getJSONBuilt().realTime = false;
    }
  }

  ctaCheck() {
    this.isCtaAccessible = this._featureAuthService.features.cta.active;
    if (!this.isCtaAccessible) {
      this._featureAuthService.setSelectedFeature('cta');
      jQuery('.cta').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }


  onChangeDisclaimer(editorControl: any) {
  }
  callGA(opt: string) {
    switch (opt) {
      case "REALTIMECHANGE":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ShowResultInReal');
        // _kmq.push(['record', 'Builder Show Result in Realtime Toggle']);
        break;

      case "EDITFORMULA":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'EditResult');
        // _kmq.push(['record', 'Builder Edit Result Click']);
        break;

      case "ADDRESULT":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'AddResult');
        // _kmq.push(['record', 'Builder Add Result Click']);
        break;

      case "SUMMARY":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Summary');
        // _kmq.push(['record', 'Builder Results Summary Toggle']);
        break;

      case "SHARERESULT":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ShareResult');
        // _kmq.push(['record', 'Builder Results Share Toggle']);
        break;

      case "REDOCALC":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'RedoCalculation');
        // _kmq.push(['record', 'Builder Results Redo Calculation Toggle']);
        break;

      case "DISCLAIMER":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'DisclaimerToggle');
        // _kmq.push(['record', 'Builder Results Disclaimer Toggle']);
        break;
    }
  }
  openResult(resultCount: number, index: number) {
    for (let i = 1; i <= resultCount; i++) {
      if (i == index) {
        // jQuery('#collapse' + i).addClass('in');
        // jQuery('#collapse' + i).addClass('bhawna');
      }
      else {
        // jQuery('#collapse' + i).removeClass('in');
        // jQuery('#collapse' + i).removeClass('bhawna');
      }

    }
  }

  upload(index: any) {
    // Filestack V3
    let self: any = this;
    const apikey = this.filePickerKey;
    const client = filestack.init(apikey);
    client.pick({
      storeTo: {
        location: 's3',
        access: 'public'
      },
      onFileSelected: function (file) {
        let fileName = file.filename;
        fileName = fileName.replace(/[^A-Za-z0-9.]/g, "_");
        fileName = fileName.replace(/ /g, "_");
        file.name = fileName;
        return file;
      },
      maxSize: 10485760,
      uploadInBackground: false,
      accept: 'image/*',
      // imageMax: [640, 290], /* result image */
      // imageDim: [640, 290],
      // transformations: {
      //   crop: {
      //     force: true,
      //     aspectRatio: 16 / 7
      //   }
      // },
    }).then(function (result) {
      let s3URL = 'https://dlvkyia8i4zmz.cloudfront.net/' + result.filesUploaded[0].key;
      self._outcomeService.getSelectedFormula().result = s3URL;
    });
    /*filepicker.setKey(this.filePickerKey);
    filepicker.pick(
      {
        mimetypes: ['image/*'],
        imageQuality: 50
      },
      (InkBlob: any) => {
        this._outcomeService.getSelectedFormula().result = InkBlob.url;
        jQuery('#filepicker_dialog_container').find('a').click();
      },
      (FPError: any) => {
        console.log(FPError.toString());
      }
    );*/
  }

  disableSpace(event: any): any {
    this._outcomeService.getSelectedFormula().value = event.target.value.trim().replace(/\s/g, '');
  }
  textAreaAdjust(event: any) {
    jQuery('.big-text').css('height', jQuery('.big-text').prop('scrollHeight'));
  }

}
