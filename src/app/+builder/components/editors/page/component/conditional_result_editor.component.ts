import { environment } from './../../../../../../../environments/environment';
import { Util } from './../../../../../../config/utils';
import { ViewChild, ElementRef } from '@angular/core';
import { FroalaService } from './../../../../services/froala.service';
import { FeatureAuthService } from './../../../../../../shared/services/feature-access.service';
import { RequestOptions } from '@angular/http';
import { CurrentPlan } from './../../../../../../shared/models/currentPlan';
import { Datatable } from './../../../../../../shared/interfaces/datatable.interface';
import { Component, Input, ViewEncapsulation, AfterViewInit, OnDestroy, OnInit, Optional, OnChanges } from '@angular/core';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { FormulaService } from '../../../../services/formula.service';
import { ConditionalResultService } from "../../../../services/conditionalResult.service";
import { ComponentService } from '../../../../services/component.service';
import { EditorService } from './../../../../services/editor.service';

declare var jQuery: any;
declare var bootbox: any;
declare var filepicker: any;
declare var ga: any;
declare var filestack: any;
// declare var _kmq: any;
@Component({
  selector: 'conditional-result-editor',
  templateUrl: './html/conditional_result_editor.component.html',
  styleUrls: ['./css/ion.rangeSlider.css', './css/ion.rangeSlider.skinHTML5.css',],
  encapsulation: ViewEncapsulation.None
})

export class ConditionalResultComponent implements AfterViewInit, OnDestroy, OnInit, OnChanges {
  @Input() control: any;
  @Input() optionIndex: any;
  @Input() controlIndex: number;
  @Input() optionImageVisible: any; //This is just to reinit the WYSIWYGs
  filePickerKey: any = environment.FILE_PICKER_API;
  slider: any;
  option: any;
  isNew: boolean = false;
  sliderJson: any;
  editorControl: any;
  HTMLeditor: Boolean = false;
  util: Util;
  froalaHeader: any = {};
  froalaSubHeader: any = {};
  froalaCtaRedirectUrl: any = {};
  froalaCtaSocialTitle: any = {};
  froalaCtaSocialDesc: any = {};

  @ViewChild('froalaCtaRedirectUrl1') froalaCtaRedirectUrl1: ElementRef;
  @ViewChild('froalaCtaRedirectUrl2') froalaCtaRedirectUrl2: ElementRef;

  private isCtaAccessible: Boolean = false;
  constructor(
    public componentService: ComponentService,
    public jsonBuilderHelper: JSONBuilder,
    public formulaService: FormulaService,
    public conditionalResultService: ConditionalResultService,
    public _editorService: EditorService,
    public _featureAuthService: FeatureAuthService,
    public froalaService: FroalaService
  ) {
    this.util = new Util();
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWyswyg());
  }

  ngOnChanges() {
    this.initWyswyg();
  }

  ngOnInit(): void {
    this.isNew = this.jsonBuilderHelper.getJSONBuilt().versioning.resultV2;
    this.option = this.control.options[this.optionIndex];
    let editorObj: any = this._editorService.setEditorControl(this.controlIndex);
    this.editorControl = editorObj.staticControl;
    this.isCtaAccessible = this._featureAuthService.features.cta.active;
    this.HTMLeditor = this._featureAuthService.features.custom_styling.html_editor;
  }

  ngAfterViewInit() {
    /*For tabbing*/
    jQuery('.type-details-head').on('click', function () {
      jQuery(this).parent().toggleClass('tab-collapse');
    });
    /* For tabbing end */
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
      let s3URL = 'https://dlvkyia8i4zmz.cloudfront.net/' + result.filesUploaded[0].key;
      self.option.links.share.shareImg = s3URL;
    });
  }

  onNavigateURLChange($event: any) {
    let url = $event.target.value;
    if (/^(tel:)/i.test(url)) {
      this.option.description = url;
      return;
    }
    if (/^(mailto:)/i.test(url)) {
      this.option.description = url;
      return;
    }
    if (!/^(f|ht)tps?:\/\//i.test(url)) {
      url = "http://" + url;
    }
    this.option.description = url;
  }

  onWysiwygChange(froalaName: string) {
    switch (froalaName) {
      case 'share-title': {
        this.option.links.share.title = this.froalaCtaSocialTitle.decodedText;
        break;
      }
      case 'share-desc': {
        this.option.links.share.description = this.froalaCtaSocialDesc.decodedText;
        break;
      }
    }
  }

  ngOnDestroy() {
  }

  initWyswyg() {
    this.froalaHeader.options = this.froalaSubHeader.options = this.froalaCtaRedirectUrl.options = this.froalaCtaSocialTitle.options = this.froalaCtaSocialDesc.options = false;
    setTimeout(() => {
      this.froalaHeader.options = this.froalaService.getOptions({ handler: this.froalaHeader, isAddVariable: true, includeScores: true, conditionalOption: this.option });
      this.froalaSubHeader.options = this.froalaService.getOptions({ handler: this.froalaSubHeader, isAddVariable: true, includeScores: true, conditionalOption: this.option });
      this.froalaCtaRedirectUrl.options = this.froalaService.getOptions({ handler: this.froalaCtaRedirectUrl, isAddVariable: true, isOnlyAddVariable: true, conditionalOption: this.option });
      this.froalaCtaSocialTitle.options = this.froalaService.getOptions({ handler: this.froalaCtaSocialTitle, isAddVariable: true, isOnlyAddVariable: true, conditionalOption: this.option });
      this.froalaCtaSocialDesc.options = this.froalaService.getOptions({ handler: this.froalaCtaSocialDesc, isAddVariable: true, isOnlyAddVariable: true, conditionalOption: this.option });
    });
  }

  updateSlider(param: any) {
    if (this.jsonBuilderHelper.isTempType(['Poll'])) {
      if (this.option.attr[param] < 0) this.option.attr[param] = 0;
      else if (this.option.attr[param] > 100) this.option.attr[param] = 100;
    }
    if (param === 'class') {
      if (this.option.attr.lower === '==') {
        this.option.attr.style = this.option.attr.class;
      }
    }
  }

  updateHeading() { }

  toggleCta(type: string, isCtaAccessible: Boolean) {
    isCtaAccessible = this._featureAuthService.features.cta.active;
    if (isCtaAccessible && this.jsonBuilderHelper.isTempType(['Numerical', 'Graded', 'Poll']) || type == 'cta_button') {
      if (type == 'cta_button' && !this._featureAuthService.features.cta.redirect_url) {
        this._featureAuthService.setSelectedFeature('cta', 'redirect_url');
        jQuery('.cta').addClass('activegreen limited-label');
        this.showPremiumPopup();
        return;
      }
      else if (type == 'cta_shares' && !this._featureAuthService.features.cta.shares) {
        this._featureAuthService.setSelectedFeature('cta', 'shares');
        jQuery('.cta').addClass('activegreen limited-label');
        this.showPremiumPopup();
        return;
      }
      else if (type == 'cta_likes' && !this._featureAuthService.features.cta.like_follow) {
        this._featureAuthService.setSelectedFeature('cta', 'like_follow');
        jQuery('.cta').addClass('activegreen limited-label');
        this.showPremiumPopup();
        return;
      }
      if (!this.isNew) {
        this.option.links.cta.ctaVisible = false;
        this.option.links.like.visible = false;
        this.option.links.share.visible = false;
      }
      if (type == 'cta_button')
        this.option.links.cta.ctaVisible = !this.option.links.cta.ctaVisible;
      else if (type == 'cta_shares')
        this.option.links.share.visible = !this.option.links.share.visible;
      else if (type == 'cta_likes')
        this.option.links.like.visible = !this.option.links.like.visible;
    } else {
      this._featureAuthService.setSelectedFeature('cta');
      jQuery('.cta').addClass('activegreen limited-label');
      this.showPremiumPopup();
      this.editorControl.cta_shares.visible = false;
      this.editorControl.cta_likes.visible = false;
      this.editorControl.click_button.visible = this.isNew ? false : true;
    }
    this.initWyswyg()
  }

  showPremiumPopup() {
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }

  isLeadInResult() {
    let leadItem = this.jsonBuilderHelper.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items.find((it) => it.type == 'leadform');
    return leadItem.visible && leadItem.config.direction == 'withResult';
  }

  firstConditionalChange(e: any) {
    this.option.attr.lower = e.target.value;
    if (this.option.attr.lower === '==') {
      this.option.attr.upper = '==';
      this.option.attr.style = this.option.attr.class;
    }
  }

  secondConditionalChange(e: any) {
    this.option.attr.upper = e.target.value;
  }

  isVKontakteAvailbale() {
    let leadSec = this.jsonBuilderHelper.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm');
    let ctaItem = leadSec.items.find(item => item.type == 'cta_shares');
    if (ctaItem.options[3]) return true;
    else return false;
  }

  isWMMAvailbale() {
    let leadSec = this.jsonBuilderHelper.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm');
    let ctaItem = leadSec.items.find(item => item.type == 'cta_shares');
    if (ctaItem.options[4] && ctaItem.options[5] && ctaItem.options[6]) return true;
    else return false;
  }

  onURLChange(ev: any) {
    let url = ev.target.value;
    if (/^(tel:)/i.test(url)) {
      this.jsonBuilderHelper.getJSONBuilt().navigate_Url = url;
      return;
    }
    if (/^(mailto:)/i.test(url)) {
      this.jsonBuilderHelper.getJSONBuilt().navigate_Url = url;
      return;
    }
    if (!/^(f|ht)tps?:\/\//i.test(url)) {
      url = "http://" + url;
    }
    this.option.description = url;
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

  isSharePopupAllowed() {
    let leadItem = this.jsonBuilderHelper.getJSONBuilt().pages[2].sections.find((section) => section.type == 'LeadForm').items.find((it) => it.type == 'leadform');
    return this.jsonBuilderHelper.getJSONBuilt().version == 'V_3_5' && !(leadItem.visible && leadItem.config.direction == 'beforeResult');
  }
}
