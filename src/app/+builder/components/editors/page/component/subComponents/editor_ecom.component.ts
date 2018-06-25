import { EcomService } from './../../../../../../templates/services/ecom.service';
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
  selector: 'editor_ecom',
  templateUrl: './assets/html/editor_ecom.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorEcom implements OnInit, OnDestroy {
  ecomPopup: Boolean = false;
  searchingTags: string[] = [];
  public isCtaAccessible: boolean;
  public editorControl: any;
  private util: Util;
  froalaCtaSocialTitle: any = {};
  froalaCtaSocialDesc: any = {};
  visibleLeadform: any;
  froalaHeader: any = {};
  froalaDisclaimer: any = {};
  public isDisclaimers: Boolean = false;
  @ViewChild('froalaDisclaimerDOM') froalaDisclaimerDOM: ElementRef;
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
    public conditionalService: ConditionalResultService,
    public _ecomService: EcomService
  ) {
    // this.util = new Util();
    this.emitterHandler();
  }

  emitterHandler() {
    this.froalaService.getEmitter().subscribe(change => {
      change === 'advanceEditor' && this.initWysiwyg();
      if (change.event === 'blur') {
        change.data.id === 'numerical' + this.editorControl.cta_shares._id + 'share-title' && this.onWysiwygBlur('share-title');
        change.data.id === 'numerical' + this.editorControl.cta_shares._id + 'share-desc' && this.onWysiwygBlur('share-desc');
      }
    });
  }

  initWysiwyg() {
    this.froalaHeader.options = this.froalaCtaSocialTitle.options = this.froalaCtaSocialDesc.options = false;
    setTimeout(() => {
      this.froalaHeader.options = this.froalaService.getOptions({ handler: this.froalaHeader, isAddVariable: false });
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

  ngOnInit() {
    this.visibleLeadform = this.jsonBuilderHandler.getVisibleLeadForm();
    if (this.visibleLeadform.page.length && this.visibleLeadform.page[0].type === 'Result') {
      if (this.visibleLeadform.item[0].config.direction === 'beforeResult') {
        jQuery('.new-lead-common .result-mid.result-comm').show();
        jQuery('.leadform-outer').hide();
        jQuery('.leadAsPopup').addClass('hide');
        jQuery('.lead-popup').addClass('hide');
      }
    }

    this.isCtaAccessible = this._featureAuthService.features.cta.active;
    this.isDisclaimers = this._featureAuthService.features.disclaimers.active;
    const editorObj: any = this._editorService.setEditorControl();
    this.editorControl = editorObj.staticControl;
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedPage(this.jsonBuilderHandler.getSelectedPage());
    this.initWysiwyg();
  }

  ngOnDestroy() {
    if (this.visibleLeadform.page.length && this.visibleLeadform.page[0].type === 'Result') {
      if (this.visibleLeadform.item[0].config.direction === 'beforeResult') {
        jQuery('.leadform-outer').show();
        jQuery('.new-lead-common .result-mid.result-comm').hide();
        jQuery('.leadAsPopup').removeClass('hide');
        jQuery('.lead-popup').removeClass('hide');
      }
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
  openEcomMapPopup() {
    this.ecomPopup = true;
    setTimeout(() => {
      jQuery('#productEcomMapping').modal('toggle');
      jQuery('.modal-backdrop').addClass('hide');
      jQuery('.navbar-default').addClass('navbar-zindex');
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

  isSharePopupAllowed() {
    let leadItem = this.jsonBuilderHandler.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items.find((it) => it.type == 'leadform');
    return this.jsonBuilderHandler.getJSONBuilt().versioning.resultV2 && !(leadItem.visible && leadItem.config.direction == 'beforeResult');
  }

  toggleSharePopup(ev, type) {
    this.editorControl[type].showButton = ev.target.checked;
  }

  updateHeading() {
    this.editorControl.cta_shares.options[0].title = this.editorControl.cta_likes.options[0].title = this.editorControl.click_button.props.unit;
  }

  toggleSimilarRecommendations(ev) {
    if (this.jsonBuilderHandler.getJSONBuilt().recomBased.noOfOutcome >= this._ecomService.getallProduct().length)
      ev.target.checked = false;
    else {
      this.jsonBuilderHandler.getJSONBuilt().recomBased.multipleOutcome = ev.target.checked;
      if(this.jsonBuilderHandler.getJSONBuilt().recomBased.multipleOutcome) {
        this.jsonBuilderHandler.getJSONBuilt().progressBar['perc'] = this._ecomService.getallProduct().length - this.jsonBuilderHandler.getJSONBuilt().recomBased.noOfOutcome;
        this.jsonBuilderHandler.commonEmitter.emit({type : 'noOfRecomChange'})
      }
    }
  }

  recommendationToggle() {
    if (this.jsonBuilderHandler.getJSONBuilt().recomBased.noOfOutcome >= this._ecomService.getallProduct().length)
      this.jsonBuilderHandler.getJSONBuilt().recomBased.multipleOutcome = false;
    
    if((Number(this.jsonBuilderHandler.getJSONBuilt().progressBar['perc']) + Number(this.jsonBuilderHandler.getJSONBuilt().recomBased.noOfOutcome)) > this._ecomService.getallProduct().length) {
      this.jsonBuilderHandler.getJSONBuilt().progressBar['perc'] = this._ecomService.getallProduct().length - this.jsonBuilderHandler.getJSONBuilt().recomBased.noOfOutcome;
    }
  }

  noOfRecomChange(ev) {
    this.jsonBuilderHandler.commonEmitter.emit({type : 'noOfRecomChange'})
  }

}
