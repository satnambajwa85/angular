import { ConditionalResultService } from './../../../../../services/conditionalResult.service';
import { Util } from './../../../../../../../config/utils';
import { ViewChild, ElementRef } from '@angular/core';
import { FroalaService } from './../../../../../services/froala.service';
import { SubDomainService } from './../../../../../../../shared/services/subdomain.service';
import { Component, OnInit, ViewEncapsulation, OnChanges, AfterViewInit, OnDestroy } from '@angular/core';
import { JSONBuilder } from './../../../../../services/JSONBuilder.service';
import { FeatureAuthService } from './../../../../../../../shared/services/feature-access.service';
import { TemplateRendererService } from './../../../../../../templates/services/templateRenderer.service';
import { environment } from './../../../../../../../../environments/environment';
import { FormulaService } from './../../../../../services/formula.service';
import { EditorService } from './../../../../../services/editor.service';
import { JSONItemTracker } from './../../../../../services/JSONUpdateItemTracker.service';
import { Section, Page, App, Item } from '@builder/models';
import { BuilderService } from './../../../../../services/builder.service';
import { ComponentService } from './../../../../../services/component.service';

declare var filestack: any;
declare var jQuery: any;
declare var bootbox: any;
declare var window: any;
declare var ga: any;

@Component({
  selector: 'editor_numerical',
  templateUrl: './assets/html/editor_numerical.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorNumerical implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  public editorControl: any;
  public filePickerKey: any = environment.FILE_PICKER_API;
  public isCtaAccessible: Boolean = false;
  public wysiwygShareTitleCount: number;
  public wysiwygShareDescCount: number;
  public isDisclaimers: Boolean = false;
  isNew: boolean = false;
  public resultSection: Section;
  public leadformSection: Section;
  public isRealTimeResult: Boolean = false;
  public addLoading: boolean = false;
  tempName: string = '';
  private util: Util;
  froalaHeader: any = {};
  froalaCtaRedirectUrl: any = {};
  froalaCtaSocialTitle: any = {};
  froalaCtaSocialDesc: any = {};
  froalaDisclaimer: any = {};
  froalaFollowUp: any = {};
  realTimeResultList: any = [];
  visibleLeadform: any;
  @ViewChild('froalaDisclaimerDOM') froalaDisclaimerDOM: ElementRef;
  @ViewChild('froalaCtaSocialTitleDOM') froalaCtaSocialTitleDOM: ElementRef;
  @ViewChild('froalaCtaSocialDescDOM') froalaCtaSocialDescDOM: ElementRef;
  @ViewChild('froalaCtaText1') froalaCtaText1: ElementRef;
  @ViewChild('froalaCtaText2') froalaCtaText2: ElementRef;

  constructor(
    public jsonBuilderHandler: JSONBuilder,
    public _featureAuthService: FeatureAuthService,
    public _templateRenderer: TemplateRendererService,
    public formulaService: FormulaService,
    public _editorService: EditorService,
    public _ItemTrackService: JSONItemTracker,
    public _builderService: BuilderService,
    public froalaService: FroalaService,
    public componentService: ComponentService,
    public subDomainService: SubDomainService,
    public conditionalService: ConditionalResultService
  ) {
    this.util = new Util();
    this.emitterHandler();
  }

  emitterHandler() {
    this.froalaService.getEmitter().subscribe(change => {
      change === 'advanceEditor' && this.initWysiwyg()
      if (change.event === 'blur') {
        change.data.id === 'numerical' + this.editorControl.cta_shares._id + 'share-title' && this.onWysiwygBlur('share-title');
        change.data.id === 'numerical' + this.editorControl.cta_shares._id + 'share-desc' && this.onWysiwygBlur('share-desc');
      }
    });
  }

  ngOnChanges() {

  }
  ngOnDestroy() {
    if (this.visibleLeadform.page.length && this.visibleLeadform.page[0].type === 'Result') {

      if (this.visibleLeadform.item[0].config.direction === 'beforeResult') {
        jQuery('.leadform-outer').show();
        if (this.tempName === 'sound-cloud-v3') {
          jQuery('.new-lead-common .result-mid.result-comm').removeClass('showResult');
          jQuery('.result-fixed1').addClass('no-box-shadow');
        } else {
          jQuery('.new-lead-common .result-mid.result-comm').hide();
          jQuery('.leadAsPopup').removeClass('hide');
          jQuery('.lead-popup').removeClass('hide');
          if (this.jsonBuilderHandler.getJSONBuilt().template == 'template-eight')
            jQuery('.t1-result').addClass('LeadBefore');
        }
      }
    }
  }
  ngOnInit() {
    this.isNew = this.jsonBuilderHandler.getJSONBuilt().versioning.resultV2;
    
    this.tempName = this.jsonBuilderHandler.getJSONBuilt().template;
    this.visibleLeadform = this.jsonBuilderHandler.getVisibleLeadForm();
    if (this.visibleLeadform.page.length && this.visibleLeadform.page[0].type === 'Result') {
      if (this.visibleLeadform.item[0].config.direction === 'beforeResult') {
        jQuery('.new-lead-common .result-mid.result-comm').show();
        jQuery('.leadform-outer').hide();
        if (this.tempName === 'sound-cloud-v3') {
          jQuery('.new-lead-common .result-mid.result-comm').addClass('showResult');
          jQuery('.result-fixed1').removeClass('no-box-shadow');
        } else {
          jQuery('.leadAsPopup').addClass('hide');
          jQuery('.lead-popup').addClass('hide');
          if (this.jsonBuilderHandler.getJSONBuilt().template == 'template-eight')
            jQuery('.t1-result').removeClass('LeadBefore');
        }
      }
    }
    this.initRealTimeResult();
    const editorObj: any = this._editorService.setEditorControl();
    this.leadformSection = editorObj.leadform;
    this.resultSection = editorObj.result;
    this.editorControl = editorObj.staticControl;
    if (this.isNew && this.isLeadInResult()) {
      this.editorControl.click_button.visible = false;
    }
    this.updateCondInitialVisibility();

    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedPage(this.jsonBuilderHandler.getSelectedPage());
    this.isRealTimeResult = this._featureAuthService.features.real_time_results.active;
    this.isCtaAccessible = this._featureAuthService.features.cta.active;
    this.isDisclaimers = this._featureAuthService.features.disclaimers.active;
    if (!this._editorService.isEmpty(this.editorControl.cta_shares) && !this._editorService.isEmpty(this.editorControl.cta_likes))
      this.editorControl.cta_shares.options[0].title = this.editorControl.cta_likes.options[0].title = this.editorControl.click_button.props.unit;

    let calcUrl = environment.LIVE_PROTOCOL + (environment.STATIC_DOMAIN ? 'livec' : this.subDomainService.subDomain.sub_domain)
      + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHandler.getJSONBuilt().url;
    this.editorControl.cta_shares.options[0].description = this.editorControl.cta_shares.options[0].description || calcUrl;
    
    this.conditionalService.loadInitialConditions();    
    this.initWysiwyg();
  }
  setPrimaryAction(event: any, type: string) {
    if (type == 'cta_shares') {
      if (event.target.checked) {
        this.editorControl.cta_shares.props.followUpText = 'true';
      } else {
        this.editorControl.cta_shares.props.followUpText = 'false';
      }
    }
    if (type == 'cta_likes') {
      if (event.target.checked) {
        this.editorControl.cta_likes.props.followUpText = 'true';
      } else {
        this.editorControl.cta_likes.props.followUpText = 'false';
      }
    }
    if (type == 'click_button') {
      if (event.target.checked) {
        this.editorControl.click_button.props.followUpText = 'true';
      } else {
        this.editorControl.click_button.props.followUpText = 'false';
      }
    }

  }
  ngAfterViewInit() {
    this.handleNameEdit();
    jQuery('.footer-tab').on('click', function (event) {
      jQuery('.footer-tab').parent().toggleClass('tab-collapse');
    });
    jQuery('.type-details-head').on('click', function (event) {
      event.stopImmediatePropagation();
    });
  }

  updateCondInitialVisibility() {
    let resultPage = this.jsonBuilderHandler.getJSONBuilt().pages.filter((page: any) => page.type == 'Result');
    if (resultPage) {
      let resultSection = resultPage[0].sections.filter((section: any) => section.type == 'Result');
      if (resultSection) resultSection[0].items.map((item: any) => item.isIconPresent = true);
    }
  }


  conditionalChanged(i: any, control: any) {
    if (this._featureAuthService.features.conditional_messaging.active) {
      this.jsonBuilderHandler.getJSONBuilt().formula[i].range.status = false;
      control.config.showHelp = !control.config.showHelp;
      this.jsonBuilderHandler.conditional.conditionalVar = false;
      control.optionImageVisible = false;
      if (control.config.showHelp) {
        this.conditionalService.loadInitialConditions();
        if (control.options.filter((option) => option.visuals.visible == true).length) control.imageVisible = true;
        else control.imageVisible = false;
        this.componentService.isConditonalVisual = control.options[0].visuals.visible;
        this.componentService.conditionalVisuals = control.options[0].visuals;
      }
    } else {
      this._featureAuthService.setSelectedFeature('conditional_messaging');
      jQuery('.conditional_messaging').addClass('activegreen limited-label');
      this._editorService.showPremiumPopup();
    }
  }

  conditionalToggleClick(i: any) {
    if (this.jsonBuilderHandler.getJSONBuilt().formula[i].result.toString().trim() == '') {
      bootbox.dialog({
        // closeButton: false,
        message: `
                    <div class="bootbox-body-left">
                        <div class="mat-icon">
                           <i class="material-icons">error</i>
                        </div>
                    </div>
                    <div class="bootbox-body-right">
                       <p>To use conditional messaging, please set up your formula first.</p>
                    </div>
                `,
        buttons: {
          success: {
            label: "OK",
            className: "btn btn-ok btn-hover",
            callback: function () { }
          }
        }
      });
    }
  }

  onWysiwygBlur(froalaName?: string) {
    if (this.editorControl.cta_shares) {
      let defaultTitle = this.editorControl.cta_shares.options[0].label;
      if (!this._featureAuthService.features.custom_branding.share_text && !(new RegExp("\\| via @outgrowco\\b")).test(defaultTitle)) {
        defaultTitle += ' | via @outgrowco';
        this.editorControl.cta_shares.options[0].label = defaultTitle;
        this.editorControl.cta_shares.options[1].label = defaultTitle;
        this.editorControl.cta_shares.options[2].label = defaultTitle;
        this.editorControl.cta_shares.options[3].label = defaultTitle;
        jQuery('.wysiwyg-share-title').froalaEditor('html.set', `<p>${defaultTitle}</p>`);
      }

      switch (froalaName) {
        case 'share-title': {
          let value = this.editorControl.cta_shares.options[0].label;
          let decoded = value.replace(/<(?:.|\n)*?>/gm, '');
          let { text, gText } = this._editorService.getShareTitle(decoded, defaultTitle, false);
          defaultTitle = gText ? gText : defaultTitle;
          this.editorControl.cta_shares.options[0].label = text;
          this.editorControl.cta_shares.options[1].label = text;
          this.editorControl.cta_shares.options[2].label = text;
          this.editorControl.cta_shares.options[3].label = text;
          break;
        }
        case 'share-desc': {
          let value = this.editorControl.cta_shares.options[0].icon;
          let decoded = value.replace(/<(?:.|\n)*?>/gm, '');
          let text = decoded;
          this.editorControl.cta_shares.options[0].icon = text;
          this.editorControl.cta_shares.options[1].icon = text;
          this.editorControl.cta_shares.options[2].icon = text;
          this.editorControl.cta_shares.options[3].icon = text;
          break;
        }
      }
    }
  }


  initWysiwyg() {
    this.froalaHeader.options = this.froalaFollowUp.options = this.froalaCtaRedirectUrl.options = this.froalaCtaSocialTitle.options = this.froalaCtaSocialDesc.options = this.froalaDisclaimer.options = false;
    setTimeout(() => {
      this.froalaHeader.options = this.froalaService.getOptions({ handler: this.froalaHeader, isAddVariable: false });
      this.froalaFollowUp.options = this.froalaService.getOptions({ handler: this.froalaFollowUp, isAddVariable: false });
      this.froalaCtaRedirectUrl.options = this.froalaService.getOptions({ handler: this.froalaCtaRedirectUrl, isOnlyAddVariable: true });
      this.froalaCtaSocialTitle.options = this.froalaService.getOptions({ handler: this.froalaCtaSocialTitle, isOnlyAddVariable: true, id: 'numerical' + this.editorControl.cta_shares._id + 'share-title' });
      this.froalaCtaSocialDesc.options = this.froalaService.getOptions({ handler: this.froalaCtaSocialDesc, isOnlyAddVariable: true, id: 'numerical' + this.editorControl.cta_shares._id + 'share-desc' });
      this.froalaDisclaimer.options = this.froalaService.getOptions({ handler: this.froalaDisclaimer });
    });

    setTimeout(() => {
      if (!this.isDisclaimers)
        this.froalaDisclaimerDOM && this.util.jQueryWrap(this.froalaDisclaimerDOM).froalaEditor('edit.off');
    }, 1000);

    this.onWysiwygBlur();
  }


  getResultOutput(index: number) {
    return this.jsonBuilderHandler.getJSONBuilt().pages.find((page: any) => page.type == 'Result').sections
      .find((section) => section.type == 'Result').items[index];
  }

  handleNameEdit() {
    jQuery(document).on("click", ".edit_name_link", function () {
      if ((jQuery(this).parent().parent().parent().find('.edit-name').hasClass('hide'))) {
        jQuery(this).parent().parent().parent().find('.result_text').addClass('hide');
        jQuery(this).parent().parent().parent().find('.edit-name').removeClass('hide');
        jQuery(this).parent().parent().parent().find('.edit-name').focus();
      }
    });

    jQuery(document).on("focusout", ".edit-name", function () {
      jQuery(this).parent().parent().find('.index-span').removeClass('hide');
      jQuery(this).parent().parent().find('.result_text').removeClass('hide');
      jQuery(this).parent().parent().find('.edit-name').addClass('hide');
    });

    jQuery(document).on("focus", ".edit-name", function () {
      jQuery(this).parent().parent().find('.index-span').addClass('hide');
    });

    jQuery(document).on("keyup", ".edit-name", function (e: any) {
      jQuery(this).parent().parent().find('.index-span').addClass('hide');
      jQuery(this).parent().find('.result_text').addClass('hide');
      if (e.which == 13) jQuery(this).focusout();
    });
  }

  addNewSection(control: any) {
    setTimeout(function () {
      control.delLoading = false;
      control.addLoading = false;
    }, 500);

    this.addItemResult();
  }

  duplicateResult(control: any, i: any) {
    setTimeout(function () {
      control.delLoading = false;
      control.addLoading = false;
    }, 500);
    if (this.jsonBuilderHandler.getJSONBuilt().formula.length <= this.resultSection.items.length) this.jsonBuilderHandler.duplicateFormula(this.jsonBuilderHandler.getJSONBuilt().formula[i]);
    this.jsonBuilderHandler.animInit();
    let ItemResult: any = this.jsonBuilderHandler.duplicateResultItem(this.resultSection, control);

    // save result output item in resultPage
    this._builderService.addItem(this.resultSection._id, ItemResult.item, this.resultSection.items.length - 1).subscribe((response: any) => {
      this.resultSection.items[ItemResult.index] = new Item().deserialize(response);
      this.jsonBuilderHandler.debounce(this.jsonBuilderHandler.animLoad(), 1800);
      this.jsonBuilderHandler.setSelectedControl(this.resultSection.items[this.resultSection.items.length - 1]);
      this.updateCondInitialVisibility();
    }, (error: any) => { });
  }

  deleteResult(formulaIndex: any, resultControl: any) {
    if (this.jsonBuilderHandler.getJSONBuilt().realTimeResult == formulaIndex)
      this.jsonBuilderHandler.getJSONBuilt().realTimeResult = '0';
    if (this.resultSection.items.length > 1) {
      this._builderService.deleteItem(resultControl._id, this.resultSection._id)
        .subscribe((response: any) => {
          if (response.title != 'Not Deleted') {
            this.jsonBuilderHandler.deleteResultSection(this.resultSection, formulaIndex);
            this.jsonBuilderHandler.getJSONBuilt().formula.splice(formulaIndex, 1);
            formulaIndex = (formulaIndex) ? formulaIndex - 1 : 0;
            this.jsonBuilderHandler.setSelectedControl(this.resultSection.items[formulaIndex]);
            this.initRealTimeResult();
            if (this.resultSection.items.length <= 3) jQuery('.result-comm').slimScroll({ destroy: true });
            // this.showPopup(formulaIndex);
            bootbox.dialog({
              message: `
                            <div class="bootbox-body-left">
                                <div class="mat-icon">
                                   <i class="material-icons">error</i>
                                </div>
                            </div>
                            <div class="bootbox-body-right new-des">
                              <h5>Result Deleted Successfully.</h5>
                              <p>Check the text of result and description as deleted result may have been used as a variable.</p>
                            </div>
                        `,
              buttons: {
                success: {
                  label: "OK",
                  className: "btn btn-ok btn-hover",
                  callback: function () { }
                }
              }
            });
            // window.toastNotification('Result Deleted Successfully.');
          }
          resultControl.delLoading = false;
        }, (error: any) => {
          console.log(error);
        });
    }
  }
  showPopup(index: any) {
    bootbox.dialog({
      message: `
                    <div class="bootbox-body-left">
                        <div class="mat-icon">
                           <i class="material-icons">error</i>
                        </div>
                    </div>
                    <div class="bootbox-body-right">
                       <p>Please check for any text which has the tag {R${index + 1}}
                                  an now Result ${index + 1} doesnt exist.</p>
                    </div>
                `,
      buttons: {
        success: {
          label: "OK",
          className: "btn btn-ok btn-hover",
          callback: function () { }
        }
      }
    });
  }
  addItemResult() {
    if (this.jsonBuilderHandler.getJSONBuilt().formula.length <= this.resultSection.items.length) this.jsonBuilderHandler.addFormula();
    this.jsonBuilderHandler.animInit();
    let ItemResult: any = this.jsonBuilderHandler.addResultSection(this.resultSection);
    // /* save result output item in resultPage */
    this._builderService.addItem(this.resultSection._id, ItemResult.item, this.resultSection.items.length - 1).subscribe((response: any) => {
      this.resultSection.items[ItemResult.index] = new Item().deserialize(response);
      this.jsonBuilderHandler.debounce(this.jsonBuilderHandler.animLoad(), 1800);
      this.jsonBuilderHandler.setSelectedControl(this.resultSection.items[this.resultSection.items.length - 1]);
      this.initRealTimeResult();
    }, (error: any) => {
      //
    });
  }
  optionToggle(type: any, option: any) {
    if (type == "cta_shares") {
      if (option == "facebook") {
        this.editorControl.cta_shares.options[0].selected = !this.editorControl.cta_shares.options[0].selected;
      } else if (option == "twitter") {
        this.editorControl.cta_shares.options[1].selected = !this.editorControl.cta_shares.options[1].selected;
      } else if (option == "linkedin") {
        this.editorControl.cta_shares.options[2].selected = !this.editorControl.cta_shares.options[2].selected;
      } else if (option == "vKontakte") {
        this.editorControl.cta_shares.options[3].selected = !this.editorControl.cta_shares.options[3].selected;
      } else if (option == "whatsapp") {
        this.editorControl.cta_shares.options[4].selected = !this.editorControl.cta_shares.options[4].selected;
      } else if (option == "mail") {
        this.editorControl.cta_shares.options[5].selected = !this.editorControl.cta_shares.options[5].selected;
      } else if (option == "messenger") {
        this.editorControl.cta_shares.options[6].selected = !this.editorControl.cta_shares.options[6].selected;
      }
    } else if (type == "cta_likes") {
      if (option == "facebook") {
        this.editorControl.cta_likes.options[0].selected = !this.editorControl.cta_likes.options[0].selected;
      } else if (option == "twitter") {
        this.editorControl.cta_likes.options[1].selected = !this.editorControl.cta_likes.options[1].selected;
      } else if (option == "vKontakte") {
        this.editorControl.cta_likes.options[2].selected = !this.editorControl.cta_likes.options[2].selected;
      }
    }
  }

  toggleFormula(index: any) {
    this.jsonBuilderHandler.updateTemplateQuestionare();
    jQuery('.formula-final').data('formula', index);
  }

  toggleGraph(index: any) {
    this.jsonBuilderHandler.updateTemplateQuestionare();
    this.componentService.graph.graphPop = true;
    this.componentService.graph.conditionalIndex = undefined;
    this.componentService.graph.formulaIndex = index;
  }

  unitsChanged(index: number, value: any) {
    this.jsonBuilderHandler.getJSONBuilt().formula[index].units.postfix = (value == 'Suffix') ? true : false;
  }

  onRealTimeChange() {
    this.isRealTimeResult = true;
    if (this.isRealTimeResult) {
      this.jsonBuilderHandler.getJSONBuilt().realTime = !this.jsonBuilderHandler.getJSONBuilt().realTime;
    } else {
      this._featureAuthService.setSelectedFeature('real_time_results');
      jQuery('.real_time_results').addClass('activegreen limited-label');

      this._editorService.showPremiumPopup();
      this.jsonBuilderHandler.getJSONBuilt().realTime = false;
    }
  }

  callGA(opt: string) {
    switch (opt) {
      case "REALTIMECHANGE":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ShowResultInReal');
        break;

      case "EDITFORMULA":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'EditResult');
        break;

      case "ADDRESULT":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'AddResult');
        break;

      case "SUMMARY":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Summary');
        break;

      case "SHARERESULT":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ShareResult');
        break;

      case "REDOCALC":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'RedoCalculation');
        break;

      case "DISCLAIMER":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'DisclaimerToggle');
        break;
    }
  }

  uploadNumerical(control: any) {
    // Filestack V3
    let self: any = this;
    const apikey = this.filePickerKey;
    const client = filestack.init(apikey);
    client.pick({
      storeTo: {
        location: 's3',
        access: 'public'
      },
      maxSize: 10485760,
      accept: 'image/*',
    }).then(function (result) {
      let s3URL = 'https://dlvkyia8i4zmz.cloudfront.net/' + result.filesUploaded[0].key;
      control.imageURL = s3URL;
    });
  }
  t27ConditionForLead() {
    let leadItem = this.jsonBuilderHandler.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items.find((it) => it.type == 'leadform');
    return this.jsonBuilderHandler.isTempName(['sound-cloud-v3', 'template-seven']) && leadItem.visible;
  }
  toggleConditionalCta(control: any) {
    if (this._featureAuthService.features.variable_cta.active) {
      control.optionImageVisible = !control.optionImageVisible;
      this.jsonBuilderHandler.conditional.conditionalVar = false;
      if (!control.optionImageVisible) {
        this.editorControl.click_button.visible = true;
        this.editorControl.cta_shares.visible = false;
        this.editorControl.cta_likes.visible = false;
        this.initWysiwyg();
      } else {
        this.editorControl.click_button.visible = false;
        this.editorControl.cta_shares.visible = false;
        this.editorControl.cta_likes.visible = false;
      }
    } else {
      this._featureAuthService.setSelectedFeature('disclaimers');
      jQuery('.disclaimers').addClass('activegreen limited-label');
      this._editorService.showPremiumPopup();
      control.optionImageVisible = false;
    }
  }

  showMessage() {
    bootbox.dialog({
      closeButton: false, message: `
                      <div class="bootbox-body-left">
                          <div class="mat-icon">
                            <i class="material-icons">error</i>
                          </div>
                      </div>
                      <div class="bootbox-body-right">
                        <p>Social Sharing buttons are disabled as the lead generation form is on the results page!</p>
                      </div>
                  `, buttons: {
        success: {
          label: "OK", className: "btn btn-ok btn-hover", callback: function () { }
        }
      }
    });
  }


  updateHeading() {
    this.editorControl.cta_shares.options[0].title = this.editorControl.cta_likes.options[0].title = this.editorControl.click_button.props.unit;
  }

  toggleCTA(event: any) {
    let leadItem = this.jsonBuilderHandler.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items[0];
    if (leadItem.visible && leadItem.config.direction == 'withResult')
      return;
    console.log('insideeee')
    if (event.target.checked) {
      this._editorService.toggleCta('cta_button', this.isCtaAccessible);
      jQuery('.cta-tab').removeClass('tab-collapse');
    } else {
      this._editorService.toggleCta('nothing', true);
      jQuery('.cta-tab').addClass('tab-collapse');
    }
    this.initWysiwyg();
  }
  toggleCTANew(event: any) {
    let leadItem = this.jsonBuilderHandler.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items[0];
    console.log('insideeee')
    if (event.target.checked) {
      if (leadItem.config.direction == 'withResult')
        this._editorService.toggleCta('cta_likes', this.isCtaAccessible);
      else
        this._editorService.toggleCta('cta_button', this.isCtaAccessible);
      jQuery('.cta-tab').removeClass('tab-collapse');
    } else {
      this._editorService.toggleCta('nothing', true);
      jQuery('.cta-tab').addClass('tab-collapse');
    }
    this.initWysiwyg();
  }

  isLeadInResult() {
    let leadItem = this.jsonBuilderHandler.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items.find((it) => it.type == 'leadform');
    // if(this.jsonBuilderHandler.isTempName(['template-seven'])) {
    //   return leadItem.visible;
    // }else {
      return leadItem.visible && leadItem.config.direction == 'withResult';
    // }
  }

  realTimeDelete(event) {
    const a = event.target;
    if (jQuery(a).is('a') || jQuery(a).is('img')) {
      if (jQuery(event.target).hasClass('tag_delete')) {
        let txt = '<span class="fr-deletable var-tag" contenteditable="false">' +
          jQuery(event.target).parent().html() + '</span>';
        this.jsonBuilderHandler.getJSONBuilt().realTimeResult =
          this.jsonBuilderHandler.getJSONBuilt().realTimeResult.replace(txt, '');
        jQuery(jQuery(event.target).parent()).remove();
      } else {
        if (jQuery(event.target).parent().hasClass('tag_delete')) {
          let txt = '<span class="fr-deletable var-tag" contenteditable="false">'
            + jQuery(event.target).parent().parent().html() + '</span>';
          this.jsonBuilderHandler.getJSONBuilt().realTimeResult =
            this.jsonBuilderHandler.getJSONBuilt().realTimeResult.replace(txt, '');
          jQuery(jQuery(event.target).parent().parent()).remove();
        }
      }
      const lastTxt = this.jsonBuilderHandler.getJSONBuilt().realTimeResult.replace(/<p>|<\/p>|&nbsp;/g, '');
      if (lastTxt.trim() == '')
        this.jsonBuilderHandler.getJSONBuilt().realTimeResult = '';
    }
  }

  selectRealTime(value) {
    this.jsonBuilderHandler.getJSONBuilt().realTimeResult = value;
  }
  initRealTimeResult() {
    this.realTimeResultList = [];
    let self = this;
    this.jsonBuilderHandler.getJSONBuilt().formula.map((d, i) => self.realTimeResultList.push(' R' + (i + 1)));
  }

  resultSet(i: any) {
    if (!this.jsonBuilderHandler.getJSONBuilt().formula[i]) {
      this.jsonBuilderHandler.addFormula();
      this._builderService.addItem(this.resultSection._id, this.jsonBuilderHandler.getJSONBuilt().formula[i], i).subscribe(response => {
        this.resultSection.items[i] = new Item().deserialize(response);
        this.jsonBuilderHandler.getJSONBuilt().formula[i] = new Item().deserialize(response);
      }, err => console.log('Add error'));
    }
    if (!this.jsonBuilderHandler.getJSONBuilt().formula[i].name) {
      this.jsonBuilderHandler.getJSONBuilt().formula[i].name = '';
    }
  }

  resultDeleteConfirmation(formulaIndex: any, resultControl: any) {
    let self = this;
    bootbox.dialog({
      message: `
                    <div class="bootbox-body-left">
                        <div class="mat-icon">
                           <i class="material-icons">error</i>
                        </div>
                    </div>
                    <div class="bootbox-body-right new-des">
                      <h5>Are you sure you want to delete this result?</h5>
                    </div>
                `,
      buttons: {
        cancel: {
        label: "CANCEL",
        className: "btn-cancel btn-cancel-hover",
        callback: function () { 
          resultControl.delLoading = false;
        }
        },
        success: {
          label: "CONFIRM",
          className: "btn btn-ok btn-hover",
          callback: function () { 
            self.deleteResult(formulaIndex,resultControl);
          }
        }
      }
    });
  }

  isSharePopupAllowed() {
    let leadItem = this.jsonBuilderHandler.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items.find((it) => it.type == 'leadform');
    return this.jsonBuilderHandler.getJSONBuilt().versioning.resultV2 && !(leadItem.visible && leadItem.config.direction == 'beforeResult');
  }

  toggleSharePopup(ev, type) {
    this.editorControl[type].showButton = ev.target.checked;
  }

}