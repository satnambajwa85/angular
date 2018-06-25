import { Util } from './../../../../../../../config/utils';
import { FroalaService } from './../../../../../services/froala.service';
import { SubDomainService } from './../../../../../../../shared/services/subdomain.service';
import { Component, OnInit, ViewEncapsulation, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { JSONBuilder } from './../../../../../services/JSONBuilder.service';
import { FeatureAuthService } from './../../../../../../../shared/services/feature-access.service';
import { ShareOutcomeService } from './../../../../../services/shareOutcome.service';
import { RecommendationService } from './../../../../../../templates/services/recommendation.service';
import { TemplateRendererService } from './../../../../../../templates/services/templateRenderer.service';
import { environment } from './../../../../../../../../environments/environment';
import { FormulaService } from './../../../../../services/formula.service';
import { EditorService } from './../../../../../services/editor.service';
import { JSONItemTracker } from './../../../../../services/JSONUpdateItemTracker.service';
import { Script } from '../../../../../../../shared/services/index';

declare var filestack: any;
declare var jQuery: any;
declare var bootbox: any;
declare var window: any;

@Component({
  selector: 'editor_outcome',
  templateUrl: './assets/html/editor_outcome.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorOutcome implements OnInit, AfterViewInit, OnDestroy {
  public editorControl: any;
  public filePickerKey: any = environment.FILE_PICKER_API;
  public videoLink: string;
  public isCtaAccessible: Boolean = false;
  public shareLinks: any;
  isNew: boolean = false;
  public wysiwygShareTitleCount: number;
  public wysiwygShareDescCount: number;
  public isDisclaimers: Boolean = false;
  private util: Util;
  titleCount: number = 0;
  HTMLeditor: Boolean = false;
  visibleLeadform: any;

  froalaOutcome: any = {};
  froalaCtaRedirectUrl: any = {};
  @ViewChild('froalaCtaRedirectUrlDOM') froalaCtaRedirectUrlDOM: ElementRef;
  @ViewChild('froalaCtaRedirectUrlLeadformDOM') froalaCtaRedirectUrlLeadformDOM: ElementRef;
  froalaCtaSocialTitle: any = {};
  @ViewChild('froalaCtaSocialTitleDOM') froalaCtaSocialTitleDOM: ElementRef;
  froalaCtaSocialDesc: any = {};
  @ViewChild('froalaCtaSocialDescDOM') froalaCtaSocialDescDOM: ElementRef;
  froalaDisclaimer: any = {};
  @ViewChild('froalaDisclaimerDOM') froalaDisclaimerDOM: ElementRef;

  constructor(
    public jsonBuilderHandler: JSONBuilder,
    public _featureAuthService: FeatureAuthService,
    public recommendationService: RecommendationService,
    public _outcomeService: ShareOutcomeService,
    public _templateRenderer: TemplateRendererService,
    public formulaService: FormulaService,
    public _editorService: EditorService,
    public _ItemTrackService: JSONItemTracker,
    public subDomainService: SubDomainService,
    public froalaService: FroalaService,
    public _script: Script
  ) {
    this.util = new Util();
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    this._outcomeService.getEmitter().subscribe(change => change === 'Formula selected' && this.setVideoLinks());
  }

  ngOnInit() {
    this.isNew = this.jsonBuilderHandler.getJSONBuilt().versioning.resultV2;
    if (this.isNew && this.isLeadInResult()) {
      this.jsonBuilderHandler.getJSONBuilt().formula.map((formula: any) => formula.isValid = false);
    }
    console.log('Editor outcome');
    let editorObj: any = this._editorService.setEditorControl();
    this.editorControl = editorObj.staticControl;

    this.shareLinks = this._outcomeService.getSharelinks();
    if (this._outcomeService.getSelectedFormula().visuals.youtubeLink)
      this.videoLink = this._outcomeService.getSelectedFormula().visuals.youtubeLink;
    else if (this._outcomeService.getSelectedFormula().visuals.videoWistiaLink)
      this.videoLink = this._outcomeService.getSelectedFormula().visuals.videoWistiaLink;
    else
      this.videoLink = this._outcomeService.getSelectedFormula().visuals.videoLink;

    // hide lead popup
    this.visibleLeadform = this.jsonBuilderHandler.getVisibleLeadForm();
    if (this.visibleLeadform.page.length && this.visibleLeadform.page[0].type === 'Result') {
      if (this.visibleLeadform.item[0].config.direction === 'beforeResult') {
        jQuery('.new-lead-common .result-mid.result-comm').show();
        // jQuery('.leadform-outer').hide();
        jQuery('.leadAsPopup').addClass('hide');
        jQuery('.lead-popup').addClass('hide');
        if (this.jsonBuilderHandler.getJSONBuilt().template == 'template-eight')
          jQuery('.t1-result').removeClass('LeadBefore');
      }
    }

    /*intialize variables*/
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedPage(this.jsonBuilderHandler.getSelectedPage());
    this.isCtaAccessible = this._featureAuthService.features.cta.active;
    this.isDisclaimers = this._featureAuthService.features.disclaimers.active;
    this.HTMLeditor = this._featureAuthService.features.custom_styling.html_editor;
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
    let self = this;
    jQuery('.details-area').on('click', function () {
      if (self.isNew && self.jsonBuilderHandler.getJSONBuilt().recomBased.multipleOutcome) {
        self._outcomeService.setSelectedFormula(self.jsonBuilderHandler.getJSONBuilt().formula[0])
      }
    })
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
  changeOutcomeType(type: string) {
    this.isCtaAccessible = this._featureAuthService.features.cta.active;
    if (this.isCtaAccessible || type == 'Button') {
      if (type == 'Button' && !this._featureAuthService.features.cta.redirect_url) {
        this._featureAuthService.setSelectedFeature('cta', 'redirect_url');
        jQuery('.cta').addClass('activegreen limited-label');
        this._editorService.showPremiumPopup();
        return;
      }
      else if (type == 'Share' && !this._featureAuthService.features.cta.shares) {
        this._featureAuthService.setSelectedFeature('cta', 'shares');
        jQuery('.cta').addClass('activegreen limited-label');
        this._editorService.showPremiumPopup();
        return;
      }
      else if (type == 'Like' && !this._featureAuthService.features.cta.like_follow) {
        this._featureAuthService.setSelectedFeature('cta', 'like_follow');
        jQuery('.cta').addClass('activegreen limited-label');
        this._editorService.showPremiumPopup();
        return;
      }
      if (!this.isNew || type == 'nothing') {
        this._outcomeService.getSelectedFormula().units.prefix = false;
        this._outcomeService.getSelectedFormula().isValid = false;
        this._outcomeService.getSelectedFormula().units.postfix = false;
      }
      if (this.isNew && this.isLeadInResult()) {
        this._outcomeService.getSelectedFormula().isValid = false;
      }
      if (type == 'Button')
        this._outcomeService.getSelectedFormula().isValid = !this._outcomeService.getSelectedFormula().isValid;
      else if (type == 'Like')
        this._outcomeService.getSelectedFormula().units.prefix = !this._outcomeService.getSelectedFormula().units.prefix;
      else if (type == 'Share')
        this._outcomeService.getSelectedFormula().units.postfix = !this._outcomeService.getSelectedFormula().units.postfix;
      this.updateAllOutcomeCta();
    } else {
      this._featureAuthService.setSelectedFeature('cta');
      jQuery('.cta').addClass('activegreen limited-label');

      this._editorService.showPremiumPopup();
      this.editorControl.cta_shares.visible = false;
      this.editorControl.cta_likes.visible = false;
      this.editorControl.click_button.visible = this.isNew ? false : true;
    }
  }

  addOutcome() {
    let length: string = (this.jsonBuilderHandler.getJSONBuilt().formula.length + 1).toString();
    this.jsonBuilderHandler.getJSONBuilt().addformula('<p>New Outcome</p>',
      'outcome_' + ((Math.floor((Math.random() * 1000) + 1)) * parseInt(length)),
      'https://dlvkyia8i4zmz.cloudfront.net/DcgzVVEJTPaZYy1WF9s5_img.gif', 'Outcome description will come here',
      '', 'Button Text', environment.PROTOCOL + environment.APP_EXTENSION, 'true');

    let outcomeIndex: number = this.jsonBuilderHandler.getJSONBuilt().formula.length - 1;
    this._outcomeService.setSelectedFormula(this.jsonBuilderHandler.getJSONBuilt().formula[outcomeIndex]);
    this.initWysiwyg();
  }


  duplicateOutcome(currentOutcome: any, index: any) {
    //add new formula
    this.jsonBuilderHandler.getJSONBuilt().addformula(
      currentOutcome.name,
      currentOutcome.value + '_' + (Math.floor((Math.random() * Math.random() * 1000) + 1)),
      currentOutcome.result,
      currentOutcome.html,
      currentOutcome.decimal,
      currentOutcome.units.preValue,
      currentOutcome.units.postValue,
      currentOutcome.range.status,
      currentOutcome.units.prefix,
      currentOutcome.units.postfix,
      currentOutcome.isValid,
      currentOutcome.heading,
      currentOutcome.links,
      currentOutcome.visuals,
      currentOutcome.units.open_in_tab
    );
    //remove newly added formula and add it adjacent to current
    let removed = this.jsonBuilderHandler.getJSONBuilt().formula.splice(this.jsonBuilderHandler.getJSONBuilt().formula.length - 1, 1);
    this.jsonBuilderHandler.getJSONBuilt().formula.splice(index + 1, 0, removed[0]);
    this._outcomeService.setSelectedFormula(this.jsonBuilderHandler.getJSONBuilt().formula[index + 1]);
    this.initWysiwyg();
  }


  deleteOutcome(formulaIndex: any) {
    let self: any = this;
    bootbox.dialog({
      size: 'small',
      message: `
                    <div class="bootbox-body-left">
                        <div class="mat-icon">
                            <i class="material-icons">error</i>
                        </div>
                    </div>
                    <div class="bootbox-body-right">
                        <p class="">Are you sure you want to delete this outcome?</p>
                    </div>
            `,
      buttons: {
        cancel: {
          label: "No",
          className: "btn-cancel btn-cancel-hover"
        },

        success: {
          label: "Yes",
          className: "btn btn-ok btn-hover",
          callback: function () {
            let formulaValue: string = self.jsonBuilderHandler.getJSONBuilt().formula[formulaIndex].value;
            self.jsonBuilderHandler.getTemplateQuestionare()[0].forEach(function (item: any) {
              if (item.type == 'selectbox' || item.type == 'radio_button' || item.type == 'checkbox') {
                item.options.forEach(function (option: any) {
                  let type: any = option.value;
                  if (type && type != '') {
                    let typeArray = type.split(',');
                    let valueIndex = typeArray.indexOf(formulaValue);
                    if (valueIndex != (-1)) {
                      typeArray.splice(valueIndex, 1);
                      option.value = typeArray.toString();
                      self._ItemTrackService.setUnSavedItems(item);
                    }
                  }
                });
              }
            });

            self.jsonBuilderHandler.getJSONBuilt().formula.splice(formulaIndex, 1);
            if (self.jsonBuilderHandler.getJSONBuilt().recomBased.noOfOutcome > self.jsonBuilderHandler.getJSONBuilt().formula.length)
              self.jsonBuilderHandler.getJSONBuilt().recomBased.noOfOutcome = self.jsonBuilderHandler.getJSONBuilt().formula.length;
            /* select another model after delete*/
            if (self.jsonBuilderHandler.getJSONBuilt().formula.length == 0) {
              self._outcomeService.setSelectedFormula(undefined);
            }
            else
              self._outcomeService.setSelectedFormula(self.jsonBuilderHandler.getJSONBuilt().formula[formulaIndex - 1]);

            self.initWysiwyg();
          }
        }
      }
    });
  }

  copyToAll(type: string) {
    let text: string;
    if (type == 'header') {
      text = this._outcomeService.getSelectedFormula().decimal;
      this.jsonBuilderHandler.getJSONBuilt().formula.map((formula: any) => {
        formula.decimal = text;
        return formula;
      });
      window.toastNotification('Header has been applied to all outcomes');
    } else if (type == 'button') {
      text = this._outcomeService.getSelectedFormula().units.preValue;
      this.jsonBuilderHandler.getJSONBuilt().formula.map((formula: any) => {
        formula.units.preValue = text;
        return formula;
      });
      window.toastNotification('Button CTA has been applied to all outcomes');
    } else if (type == 'url') {
      text = this._outcomeService.getSelectedFormula().units.postValue;
      this.jsonBuilderHandler.getJSONBuilt().formula.map((formula: any) => {
        formula.units.postValue = text;
        return formula;
      });
      window.toastNotification('URL has been applied to all outcomes');
    } else if (type == 'button_heading') {
      text = this._outcomeService.getSelectedFormula().heading;
      this.jsonBuilderHandler.getJSONBuilt().formula.map((formula: any) => {
        formula.heading = text;
        return formula;
      });
      window.toastNotification('Button Heading has been applied to all outcomes');
    } else if (type == 'sharelinks') {
      this.jsonBuilderHandler.getJSONBuilt().formula.map((formula: any) => {
        formula.visuals.seoImage = this._outcomeService.getSelectedFormula().visuals.seoImage
        formula.links.map((link: any) => {
          if (link.type == 'share') {
            link.description = this.shareLinks.share.twitter.description;
            link.title = this.shareLinks.share.twitter.title;
            link.url = this.shareLinks.share.twitter.url;
          }
        });
        return formula;
      });
      window.toastNotification('Share title and description has been applied to all outcomes');
    }
  }

  toggleVariableCtaOutcome() {
    if (this._featureAuthService.features.variable_cta.active) {
      this.jsonBuilderHandler.getJSONBuilt().isVariableCta = !this.jsonBuilderHandler.getJSONBuilt().isVariableCta;
    } else {
      if (this.jsonBuilderHandler.getJSONBuilt().isVariableCta)
        this.jsonBuilderHandler.getJSONBuilt().isVariableCta = false;
      jQuery('.variable_cta').addClass('activegreen limited-label');
      this._featureAuthService.setSelectedFeature('variable_cta');
      this._editorService.showPremiumPopup();
    }
  }

  updateAllOutcomeCta() {
    if (!this.jsonBuilderHandler.getJSONBuilt().isVariableCta) {
      let index = this.jsonBuilderHandler.getJSONBuilt().formula.indexOf(this._outcomeService.getSelectedFormula());
      this.jsonBuilderHandler.getJSONBuilt().formula.map((formula: any) => {
        //formula.links = this.jsonBuilderHandler.getJSONBuilt().formula[index].links;
        formula.units.postfix = this.jsonBuilderHandler.getJSONBuilt().formula[index].units.postfix;
        formula.units.prefix = this.jsonBuilderHandler.getJSONBuilt().formula[index].units.prefix;
        formula.units.preValue = this.jsonBuilderHandler.getJSONBuilt().formula[index].units.preValue;
        formula.units.postValue = this.jsonBuilderHandler.getJSONBuilt().formula[index].units.postValue;
        formula.isValid = this.jsonBuilderHandler.getJSONBuilt().formula[index].isValid;
        formula.heading = this.jsonBuilderHandler.getJSONBuilt().formula[index].heading;
        return formula;
      });
    }
  }

  editOutcome(event: any) {
    let formulaValue: string = this._outcomeService.getSelectedFormula().value;
    this.jsonBuilderHandler.getTemplateQuestionare()[0].forEach(function (item: any) {
      if (item.type == 'selectbox' || item.type == 'radio_button') {
        item.options.forEach(function (option: any) {
          let type: any = option.value;
          if (type && type != '') {
            let typeArray = type.split(',');
            let valueIndex = typeArray.indexOf(formulaValue);
            if (valueIndex != (-1)) {
              typeArray[valueIndex] = event.target.value.trim();
              option.value = typeArray.toString();
            }
          }
        });
      }
    });
    this._outcomeService.getSelectedFormula().value = event.target.value.trim();
  }

  // updateHeading() {
  //   for (let linktype in this.shareLinks) {
  //     for (let socialType in this.shareLinks[linktype]) {
  //       this.shareLinks[linktype][socialType].heading = this._outcomeService.getSelectedFormula().heading;
  //     }
  //   }
  // }

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
      self._outcomeService.getSelectedFormula().imageName = result.filesUploaded[0].filename;
      setTimeout(function () {
        jQuery('.page_2').click();
      }, 500);
    });
  }

  onWysiwygChange(froalaName?: string, value?: any) {
    let defaultTitle = this.shareLinks.share.facebook.title;
    if (!this._featureAuthService.features.custom_branding.share_text && !(new RegExp("\\| via @outgrowco\\b")).test(defaultTitle)) {
      defaultTitle += ' | via @outgrowco';
      this.shareLinks.share.twitter.title = defaultTitle;
      this.shareLinks.share.facebook.title = defaultTitle;
      this.shareLinks.share.linkedin.title = defaultTitle;
      this.shareLinks.share.vkontakte.title = defaultTitle;
    }

    switch (froalaName) {
      case 'share-title': {
        let { text, gText } = this._editorService.getShareTitle(this.froalaCtaSocialTitle.decodedText, defaultTitle, this.froalaCtaSocialTitleDOM);
        defaultTitle = gText || defaultTitle;
        this.shareLinks.share.twitter.title = text;
        this.shareLinks.share.facebook.title = text;
        this.shareLinks.share.linkedin.title = text;
        this.shareLinks.share.vkontakte.title = text;
        this.wysiwygShareTitleCount = text.trim().length;
        this.updateAllOutcomeCta();
        break;
      }
      case 'share-desc': {
        let text = this.froalaCtaSocialDesc.decodedText;
        this.shareLinks.share.twitter.description = text;
        this.shareLinks.share.facebook.description = text;
        this.shareLinks.share.linkedin.description = text;
        this.shareLinks.share.vkontakte.description = text;
        this.wysiwygShareDescCount = text.trim().length;
        this.updateAllOutcomeCta();
        break;
      }
    }
  }

  initWysiwyg() {
    // this._editorService.initRedirectsWysiwyg();
    let self = this;
    this.froalaOutcome.options = this.froalaCtaRedirectUrl.options = this.froalaCtaSocialTitle.options = this.froalaCtaSocialDesc.options = this.froalaDisclaimer.options = false;
    setTimeout(() => {
      this.froalaOutcome.options = this.froalaService.getOptions({ handler: this.froalaOutcome, isAddVariable: true });
      this.froalaCtaRedirectUrl.options = this.froalaService.getOptions({ handler: undefined, isAddVariable: true, isOnlyAddVariable: true });
      this.froalaCtaSocialTitle.options = this.froalaService.getOptions({ handler: this.froalaCtaSocialTitle, isOnlyAddVariable: true });
      this.froalaCtaSocialDesc.options = this.froalaService.getOptions({ handler: this.froalaCtaSocialDesc, isOnlyAddVariable: true });
      this.froalaDisclaimer.options = this.froalaService.getOptions(this.froalaDisclaimer);
    });

    setTimeout(() => {
      if (!this._featureAuthService.features.custom_branding.edit_cta_text) {
        this.froalaCtaRedirectUrlDOM && this.util.jQueryWrap(this.froalaCtaRedirectUrlDOM).froalaEditor('edit.off');
        this.froalaCtaRedirectUrlLeadformDOM && this.util.jQueryWrap(this.froalaCtaRedirectUrlLeadformDOM).froalaEditor('edit.off');
      }
      if (!this.isDisclaimers)
        this.froalaDisclaimerDOM && this.util.jQueryWrap(this.froalaDisclaimerDOM).froalaEditor('edit.off');
    }, 1000);

    let calcUrl = environment.LIVE_PROTOCOL + (environment.STATIC_DOMAIN ? 'livec' : this.subDomainService.subDomain.sub_domain)
      + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHandler.getJSONBuilt().url;
    this.shareLinks.share.twitter.url = this.shareLinks.share.twitter.url || calcUrl;
    this.onWysiwygChange();
  }

  getUpdatedVideoVisuals(): any {
    let visuals: any = this._outcomeService.getSelectedFormula().visuals;
    visuals.youtubeLink = visuals.videoLink = "";

    // CHECKS FOR YOUTUBE LINK
    if ((this.videoLink.split('/')[2] == 'youtube.com' || this.videoLink.split('/')[2] == 'www.youtube.com') && this.videoLink.includes('embed'))
      visuals.youtubeLink = this.videoLink;
    else if (this.videoLink.split('/')[2] == 'youtube.com' || this.videoLink.split('/')[2] == 'www.youtube.com')
      visuals.youtubeLink = "https://www.youtube.com/embed/" + this.videoLink.split('watch?v=')[1];
    else if (this.videoLink.split('/')[2] == 'youtu.be')
      visuals.youtubeLink = "https://www.youtube.com/embed/" + this.videoLink.split('youtu.be/')[1];

    // CHECK FOR VIMEO LINK   https://vimeo.com/223768305 --> https://player.vimeo.com/video/223768305
    else if (this.videoLink.split('/')[2] == 'vimeo.com' || this.videoLink.split('/')[2] == 'www.vimeo.com')
      visuals.youtubeLink = "https://player.vimeo.com/video/" + this.videoLink.split('vimeo.com/')[1];

    // CHECK FOR WISTIA LINK https://venturepact.wistia.com/medias/smyu6n7e4v --> smyu6n7e4v
    else if (this.videoLink.split('/')[2] && this.videoLink.split('/')[2].includes('wistia.com') && this.videoLink.split('/')[4]) {
      visuals.videoWistiaLink = this.videoLink.split('/')[4].split('?')[0];
      this._script.loadScriptFromSrc(`https://fast.wistia.com/embed/medias/${visuals.videoWistiaLink}.jsonp`).then(data => { });
      this._script.loadScriptFromSrc("https://fast.wistia.com/assets/external/E-v1.js").then(data => { });
    }

    else if (/(.mp4|.ogg|.WebM)/.test(this.videoLink))
      visuals.videoLink = this.videoLink;

    if (visuals.youtubeLink || visuals.videoLink)
      visuals.videoWistiaLink = '';
  }

  onRecomNavigateURLChange($event: any) {
    let url = $event.target.value;
    if (/^(tel:)/i.test(url)) {
      this._outcomeService.getSelectedFormula().units.postValue = url;
      return;
    }
    if (/^(mailto:)/i.test(url)) {
      this._outcomeService.getSelectedFormula().units.postValue = url;
      return;
    }
    if (!/^(f|ht)tps?:\/\//i.test(url)) {
      url = "http://" + url;
    }
    this._outcomeService.getSelectedFormula().units.postValue = url;
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

  ngOnDestroy() {
    jQuery('.wysiwyg-share-desc').froalaEditor('destroy');
    jQuery('.wysiwyg-share-title').froalaEditor('destroy');
    jQuery('.outcome-title').froalaEditor('destroy');
    jQuery('.wysiwyg-redirect-url').froalaEditor('destroy');
    if (this.visibleLeadform.page.length && this.visibleLeadform.page[0].type === 'Result') {
      if (this.visibleLeadform.item[0].config.direction === 'beforeResult') {
        // jQuery('.leadform-outer').show();
        jQuery('.leadAsPopup').removeClass('hide');
        jQuery('.lead-popup').removeClass('hide');
        if (this.jsonBuilderHandler.getJSONBuilt().template == 'template-eight')
          jQuery('.t1-result').addClass('LeadBefore');
      }
    }
  }

  uploadSeoImage() {
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
    }).then(function (result) {
      self._outcomeService.getSelectedFormula().visuals.seoImage = result.filesUploaded[0].url;
    });
  }

  isLeadInResult() {
    let leadItem = this.jsonBuilderHandler.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items.find((it) => it.type == 'leadform');
    return leadItem.visible && leadItem.config.direction == 'withResult';
  }

  callGA(str: any) {
    // console.log('//////');
  }

  setVideoLinks() {
    if (this._outcomeService.getSelectedFormula().visuals.youtubeLink)
      this.videoLink = this._outcomeService.getSelectedFormula().visuals.youtubeLink;
    else if (this._outcomeService.getSelectedFormula().visuals.videoWistiaLink)
      this.videoLink = this._outcomeService.getSelectedFormula().visuals.videoWistiaLink;
    else
      this.videoLink = this._outcomeService.getSelectedFormula().visuals.videoLink;

  }

  toggleMultipleOutcome() {
    this.jsonBuilderHandler.getJSONBuilt().recomBased.multipleOutcome = !this.jsonBuilderHandler.getJSONBuilt().recomBased.multipleOutcome;
    this._outcomeService.setSelectedFormula(this.jsonBuilderHandler.getJSONBuilt().formula[0]);
    // if (this.jsonBuilderHandler.getJSONBuilt().recomBased.multipleOutcome) {
    //   this.resetOutcomes(this.jsonBuilderHandler.getJSONBuilt().formula[0]);
    // }
  }
  resetOutcomes(formula: any) {
    let index = this.jsonBuilderHandler.getJSONBuilt().formula.indexOf(formula);
    this.jsonBuilderHandler.getJSONBuilt().formula.map((formula: any) => {
      //formula.links = this.jsonBuilderHandler.getJSONBuilt().formula[index].links;
      formula.units.postfix = this.jsonBuilderHandler.getJSONBuilt().formula[index].units.postfix;
      formula.units.prefix = this.jsonBuilderHandler.getJSONBuilt().formula[index].units.prefix;
      // formula.units.preValue = this.jsonBuilderHandler.getJSONBuilt().formula[index].units.preValue;
      // formula.units.postValue = this.jsonBuilderHandler.getJSONBuilt().formula[index].units.postValue;
      // formula.isValid = this.jsonBuilderHandler.getJSONBuilt().formula[index].isValid;
      formula.heading = this.jsonBuilderHandler.getJSONBuilt().formula[index].heading;
      return formula;
    });
  }

  isSharePopupAllowed() {
    let leadItem = this.jsonBuilderHandler.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items.find((it) => it.type == 'leadform');
    return this.jsonBuilderHandler.getJSONBuilt().versioning.resultV2 && !(leadItem.visible && leadItem.config.direction == 'beforeResult');
  }

  toggleSharePopup(ev, type) {
    if(type == 'cta_shares') {
      this._outcomeService.getSelectedFormula().units.sharePopupShare = ev.target.checked;
    } else if(type == 'cta_likes') {
      this._outcomeService.getSelectedFormula().units.sharePopupLike = ev.target.checked;
    }
  }
  
}

