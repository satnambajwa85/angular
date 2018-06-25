import { EditorService } from './../../../services/editor.service';
import { Util } from './../../../../../config/utils';
import { FroalaService } from './../../../services/froala.service';
import { FormulaService } from './../../../services/formula.service';
import { ShareOutcomeService } from './../../../services/shareOutcome.service';
import { Component, Input, ViewEncapsulation, AfterViewInit, OnDestroy, OnInit, ViewChild, ElementRef, OnChanges } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { FeatureAuthService } from '../../../../../shared/services/feature-access.service';
import { Selectize } from './component/selectize.component';
import { Section, Page, App, Item } from '@builder/models';
declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;
declare var bootbox: any;
declare var window: any;

@Component({
  selector: 'editor-section-leadform-page',
  templateUrl: './assets/html/editor_section_leadform_page.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorSectionLeadformPage implements AfterViewInit, OnDestroy, OnInit, OnChanges {
  @Input() page: any;
  leadSection: any;
  Sectionindex: number;
  restrictDup: Boolean;
  tempName: string = '';
  public isLeadGenAvailable: Boolean = false;
  public isCtaAccessible: Boolean = false;
  private util: Util;
  editorControl: any = {
    click_button: {},
    leadform: {},
    share_links: {}
  };
  @ViewChild('froalaCtaRedirectUrlDOM') froalaCtaRedirectUrlDOM: ElementRef;
  public froalaCtaRedirectUrl: any = {};
  public froalaHeader: any = {};
  constructor(
    public _JSONBuilder: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public _featureAuthService: FeatureAuthService,
    public _outcomeService: ShareOutcomeService,
    public _formulaService: FormulaService,
    private froalaService: FroalaService,
    private _editorService: EditorService
  ) {
    this.util = new Util();
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    // this._featureAuthService.features.lead_generation.active = false;
  }
  ngOnInit() {
    this.leadformInit();
  }

  ngOnChanges() {
    this.leadformInit();
  }
  leadformInit() {
    this.tempName = this._JSONBuilder.getJSONBuilt().template;
    this.isLeadGenAvailable = this._featureAuthService.features.lead_generation.active;
    for (let section in this.page.sections) {
      if (this.page.sections[section].type === 'LeadForm') {
        this.leadSection = this.page.sections[section];
      }
      for (let item in this.page.sections[section].items) {
        for (let prop in this.editorControl) {
          if (prop === this.page.sections[section].items[item].type)
            this.editorControl[prop] = this.page.sections[section].items[item];
        }
      }
    }
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedPage(this.page);
    this.restrictDup = this._featureAuthService.features.lead_generation.restrict_duplicate;
    if (!this.restrictDup) {
      this.editorControl.leadform.hideDuplicates = false;
      this.editorControl.leadform.fields.map(f => f.unique = false);
    }

    if (this.editorControl.leadform.props && this.editorControl.leadform.props.unit == '') {
      this.editorControl.leadform.props.email_lead = this.editorControl.leadform.visible;
      if(!this.editorControl.leadform.visible)
        this.editorControl.leadform.props.postfix = false;
      this.editorControl.leadform.props.unit = 'changed';
      this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform);
    }
    // this.addDefaultField();
    /*For tabbing*/
    jQuery('.type-details-head').on('click', function () {
      jQuery(this).parent().toggleClass('tab-collapse');
    });
    /* For tabbing end */
    this.initWysiwyg();
  }
  initWysiwyg() {
    this.froalaCtaRedirectUrl.options = this.froalaHeader.options = false;
    setTimeout(() => {
      this.froalaCtaRedirectUrl.options = this.froalaService.getOptions({ handler: this.froalaCtaRedirectUrl, isOnlyAddVariable: true });
      this.froalaHeader.options = this.froalaService.getOptions({ handler: this.froalaHeader, isAddVariable: false });
    });
  }

  ctaCheck() {
    this.isCtaAccessible = this._featureAuthService.features.cta.redirect_url;
    if (!this.isCtaAccessible || !this._featureAuthService.features.custom_branding.edit_cta_text) {
      this._featureAuthService.setSelectedFeature('cta', 'edit_cta_text');
      jQuery('.cta').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }
  onChangeResultPosition(event: any) {
    this.editorControl.leadform.config.direction = event.target.value;
    // if(event.target.value!=='withResult') {
    //   this.hideForm();
    // }else {
    //   this.showForm();
    // }
  }
  showForm() {
    jQuery(document).find('#my-btn').hide();
    jQuery('.result-mid.result-comm').addClass('opc');
    jQuery('#my-btn').addClass('hide');
    jQuery('.leadform-outer.new-lead ').fadeIn();
    jQuery('.result-fixed .t2-scroller-outer').addClass('new-block');
  }
  hideForm() {
    console.log('hide form');
    jQuery('.result-mid.result-comm').removeClass('opc');
    // jQuery(document).find('#my-btn').show();
    // jQuery('.leadform-outer.new-lead ').fadeOut();
    // jQuery('.result-mid.result-comm').removeClass('opc');
  }
  showPopup() {
    if (!this._featureAuthService.features.cta.redirect_url || !this._featureAuthService.features.custom_branding.edit_cta_text) {
      this._featureAuthService.setSelectedFeature('cta', 'redirect_url');
      jQuery('.cta').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }
  showMessage() {
    // this.isCtaAccessible = this._featureAuthService.features.cta.redirect_url;
    // if (!this.isCtaAccessible) {
    //   this._featureAuthService.setSelectedFeature('cta','redirect_url');
    //   jQuery('.cta').addClass('activegreen limited-label');
    //   jQuery('#premiumModal').modal('show');
    //   jQuery('.modal-backdrop').insertAfter('#premiumModal');
    // } else {
    bootbox.dialog({
      closeButton: false,
      message: `
                      <div class="bootbox-body-left">
                          <div class="mat-icon">
                            <i class="material-icons">error</i>
                          </div>
                      </div>
                      <div class="bootbox-body-right">
                        <p>Social Sharing buttons are disabled as the lead generation form is on the results page!</p>
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
    // }
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
  onChange($event: any) {
    jQuery('[ng-reflect-ng-switch= sound-cloud]').addClass('template2');
    let $value = '';
    if (['beforeResult', 'withResult', 'afterResult'].indexOf($event.target.value) >= 0) {
      $value = 'Result';
    } else {
      $value = $event.target.value;
    }
    let data: any[] = [];
    // let fb = $event.target.selectedOptions[0].parentNode.getAttribute('fb');
    // this.editorControl.leadform.props.postfix = (fb == 'true') ? true : false;
    // this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform);
    data = this._JSONBuilder.hideOtherLeadForm($value, $event.target.selectedIndex, $value == 'Result' ? $event.target.value : '');
    this.editorControl = data[1];
    this.leadSection = data[0];
    let self: any = this;
    if ($value === 'Questionnaire') {
      setTimeout(function () { self.scrollIt('.sec_' + (self._JSONBuilder.getJSONBuilt().pages[1].sections.length - 1),$value); }, 50);
      this.cta();
    } else if ($value === 'Landing') {
      if (this._JSONBuilder.isTempName(['sound-cloud-v3', 'template-seven'])) {
        if (this.tempName === 'template-seven') {
          jQuery('.new-lead-common .result-mid.result-comm').show();
        }
        jQuery('.leadform-outer').hide();
      }
      this._ItemTrackService.setUnSavedPage(this._JSONBuilder.getJSONBuilt().pages[0]);
      this.scrollIt('.page_0', $value);
      this.cta();
      // if (this._JSONBuilder.getJSONBuilt().template === 'sound-cloud-v3') {
      //   jQuery('.cust-close').trigger("click");
      // }

    } else {
      this.editorControl.leadform.config.direction = ($event.target.value === 'Result') ? 'withResult' : $event.target.value;
      if (this._JSONBuilder.isTempName(['sound-cloud-v3', 'template-seven'])) {
        if ($event.target.value === 'beforeResult') {
          if (this.tempName === 'template-seven') {
            jQuery('.result-mid.result-comm').hide();
          }
          jQuery('.leadform-outer').show();
        }
        if ($event.target.value === 'afterResult') {
          jQuery('.new-lead-common .result-mid.result-comm').show();
          jQuery('.leadform-outer').show();
          jQuery('#my-btn').hide();
        } else {
          // if(this.tempName === 'template-seven') {
          jQuery('.new-lead-common .result-mid.result-comm').show();
          jQuery('.leadform-outer').show();
          // }
        }
      }

      this._ItemTrackService.setUnSavedPage(this._JSONBuilder.getJSONBuilt().pages[2]);
      let resultSection = this._JSONBuilder.getJSONBuilt().pages[2].sections.find((section: any) => section.type == 'Result');
      resultSection.items[0] && (resultSection.items[0].optionImageVisible = false);
      if(this._JSONBuilder.getPage('Landing').visible) {
      this.scrollIt('.page_2', $value);
       }
      else{
        this.scrollIt('.page_1', $value);
      }
      // if (this._JSONBuilder.getJSONBuilt().template === 'sound-cloud-v3') {
      //   jQuery('#my-btn').trigger("click");
      // }
    }
    this._JSONBuilder.getVisibleLeadForm();
    this._JSONBuilder.commonEmitter.emit({ type: 'reInitSelectize' })
    this.initWysiwyg();
  }


  cta() {
    var flag = 0;
    var control_ff: any;
    let resultSection = this._JSONBuilder.getJSONBuilt().pages[2].sections.find((section: any) => section.type == 'Result');
    let isConditionalOn = resultSection.items[0] && (resultSection.items[0].optionImageVisible);

    // let isConditionalOn = this._JSONBuilder.getJSONBuilt().pages[2].sections.find((section: any) => section.type == 'Result').items[0].optionImageVisible;
    for (let section of this._JSONBuilder.getJSONBuilt().pages[2].sections) {
      if (section.type == 'LeadForm') {
        for (let control of section.items) {
          if (control.type == 'cta_shares' && (control.visible || isConditionalOn)) {
            flag = 1;
          } else if (control.type == 'cta_likes' && (control.visible || isConditionalOn)) {
            flag = 1;
          }
          if (control.type == 'click_button') {
            control_ff = control;
          }
        }
        break;
      }
    }
    if (flag == 0) {
      control_ff.visible = true;
    } else {
      control_ff.visible = false;
    }
    this._ItemTrackService.setUnSavedItems(control_ff);
  }
  // saveControl(){
  //   this._builderService
  // }
  toggleLeadform(event: any) {
    if (this.isLeadGenAvailable) {
      this.editorControl.leadform.visible = !this.editorControl.leadform.visible;
      if (this.editorControl.leadform.visible) {
        this._JSONBuilder.hideOtherLeadForm1();
        // if (this._JSONBuilder.getJSONBuilt().template === 'sound-cloud-v3' && this._JSONBuilder.getSelectedPage().type == 'Result') {
        //   jQuery('#my-btn').trigger("click");
        // }
      } else {
        // if (this._JSONBuilder.getJSONBuilt().template === 'sound-cloud-v3') {
        //   jQuery('.cust-close').trigger("click");
        // }
      }
      if (!this._JSONBuilder.getJSONBuilt().versioning.resultV2) {
        this.editorControl.click_button.visible
          ? this.editorControl.leadform.props.title = this.editorControl.click_button.props.title
          : this.editorControl.click_button.props.title = this.editorControl.leadform.props.title;
      }
      this._JSONBuilder.getVisibleLeadForm();
      if (this._JSONBuilder.getSelectedPage().type == 'Result') {
        // if (!this.editorControl.leadform.visible) this.cta();
        // else this.editorControl.click_button.visible = false;
        if(this._JSONBuilder.isTempName(['sound-cloud-v3', 'template-seven']) && this.editorControl.leadform.config.direction == 'afterResult') {
          this.editorControl.click_button.visible = !this.editorControl.leadform.visible;
        }

        if(this._JSONBuilder.isTempName(['template-seven']) && this.editorControl.leadform.config.direction == 'beforeResult') {
          if(!this.editorControl.leadform.visible)
            jQuery('.result-mid.result-comm').show();
          else
            jQuery('.result-mid.result-comm').hide();
        }

        let item = this._JSONBuilder.getSelectedPage().sections.find(section => section.type === 'Result').items[0];
        if (item) item.optionImageVisible = false;
      } else {
        this.editorControl.click_button.visible = !this.editorControl.leadform.visible;
      }

      // }

      // add default field
      // this.addDefaultField();
      // add default field
    } else {
      if (this.editorControl.leadform.visible) {
        this.editorControl.leadform.visible = false;
        if (this._JSONBuilder.getSelectedPage().type == 'Result') {
          if (!this.editorControl.leadform.visible) this.cta();
          else this.editorControl.click_button.visible = false;
        } else {
          this.editorControl.click_button.visible = !this.editorControl.leadform.visible;
        }
      } else {
        event.preventDefault();
        this._featureAuthService.setSelectedFeature('lead_generation');
        jQuery('.lead_generation').addClass('activegreen limited-label');
        jQuery('#premiumModal').modal('show');
        jQuery('.modal-backdrop').insertAfter('#premiumModal');
      }
    }
    this._ItemTrackService.setUnSavedItems(this.editorControl.leadform);
    this._ItemTrackService.setUnSavedItems(this.editorControl.click_button);
  }
  addDefaultField() {
    if (!this.editorControl.leadform.fields.length) { this.add_Field_In_LeadForm(); }
  }

  // scrollIt(bindingClass1: string, innerText?: string) {
  //   console.log('page component',bindingClass1,innerText);
  //   if (jQuery(bindingClass1).length) {
  //     var position = 0;
  //     var templateHeight = 0;
  //     var zoomFactor = 1;
  //     var topVal = 0;

  //     if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
  //       var tHeight = -30;
  //     }
  //     else {
  //       zoomFactor = jQuery('temp-dev').css('zoom');
  //       tHeight = 146;
  //     }
  //     if (jQuery('.sound-cloud').length > 0 || jQuery('.sound-cloud-new').length > 0 || jQuery('.sound-cloud-v3').length > 0) {
  //       // for template sound-cloud
  //       jQuery('.sound-cloud').addClass('template2');
  //       jQuery('.sound-cloud-new').addClass('template2');
  //       jQuery('.sound-cloud-v3').addClass('template2');
  //       if (innerText && innerText === 'Landing') {
  //         templateHeight = -jQuery(bindingClass1).position().top;
  //       }
  //       else if (innerText && (innerText === 'Questionnaire' || innerText === 'Result')) {
  //         templateHeight = jQuery('.template2').height();
  //       }
  //       else {
  //         templateHeight = jQuery('.template2').height() + tHeight;

  //       }
  //       // console.log(templateHeight);
  //       position = jQuery(bindingClass1).position().top + templateHeight;
  //       //console.log('position', position);
  //       jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
  //         jQuery('.template-section').clearQueue();
  //       });
  //     }
  //     else if (['one-page-slider', 'one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'inline-temp', 'inline-temp-new', 'experian', 'template-five', 'template-five-oldresult', 'template-six', 'template-eight'].indexOf(this._JSONBuilder.getJSONBuilt().template) >= 0) {
  //       // get postiion of div
  //       templateHeight = jQuery('.editor-page-divider').height();
  //       console.log('template',templateHeight);
  //       if (innerText && ((innerText == 'Landing') || (innerText == 'WELCOME SCREEN With Lead Generation') || (innerText == 'With Lead Generation'))) {
  //         templateHeight = -jQuery(bindingClass1).position().top;
  //         console.log('page lead Generation',templateHeight);
  //       }
  //       else if (innerText && ((innerText === 'Questionnaire') || (innerText === 'Result') || (innerText === 'QUESTIONNAIRE With Lead Generation') || (innerText == 'With Lead Generation'))) {
  //         console.log('page inside innertext',innerText);
  //         templateHeight = 0;
  //       }
  //       if (['template-six', 'template-eight'].indexOf(this._JSONBuilder.getJSONBuilt().template) >= 0 && bindingClass1.split('_')[0] == '.sec') {
  //         bindingClass1 = bindingClass1 + '_q_0';
  //       }
  //       position = jQuery(bindingClass1).position().top + templateHeight;
  //       console.log('binding position',bindingClass1,position);
  //       jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
  //         jQuery('.template-section').clearQueue();
  //       });
  //     }
  //   }
  // }

  scrollIt(bindingClass1: string, event?: any) {
    if (jQuery(bindingClass1).length) {
      var position = 0;
      var templateHeight = 0;
      var zoomFactor = 1;
      var topVal = 0;

      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        var tHeight = -150;
      }
      else {
        zoomFactor = jQuery('temp-dev').css('zoom');
        tHeight = 80;
      }
      if (jQuery('.sound-cloud').length > 0) {
        // for template sound-cloud
        jQuery('.sound-cloud').addClass('template2');
        if (bindingClass1 === ".page_0") {
          templateHeight = -jQuery(bindingClass1).position().top;
        }
        else if (bindingClass1 == ".page_1") {
          templateHeight = jQuery('.template2').height();
        }
        else {
          templateHeight = jQuery('.template2').height() + tHeight;

        }
        //console.log(templateHeight);
        position = jQuery(bindingClass1).position().top + templateHeight;
        //console.log('position', position);
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
      else if (jQuery('.sound-cloud-new').length > 0 || jQuery('.sound-cloud-v3').length > 0 || jQuery('.template-seven').length > 0) {
        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
          var tHeight = -150;
        }
        else {
          zoomFactor = jQuery('temp-dev').css('zoom');
          tHeight = 30;
        }
        // for template sound-cloud
        jQuery('.sound-cloud-new').addClass('template2');
        jQuery('.sound-cloud-v3').addClass('template2');
        jQuery('.template-seven').addClass('template2');
        console.log(bindingClass1, 'bindingClass1');
        if (bindingClass1 === ".page_0") {
          templateHeight = -jQuery(bindingClass1).position().top;
        }
        else if (bindingClass1 == ".page_1") {
          templateHeight = jQuery('.template2').height();
        }
        else {
          templateHeight = jQuery('.template2').height() + tHeight;

        }
        //console.log(templateHeight);
        position = jQuery(bindingClass1).position().top + templateHeight;
        //console.log('position', position);
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
      else if (['one-page-slider', 'one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'inline-temp', 'inline-temp-new', 'experian', 'template-five', 'template-five-oldresult', 'template-six', 'template-eight'].indexOf(this._JSONBuilder.getJSONBuilt().template) >= 0) {
        // get postiion of div
        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
          var tHeight = -190;
        }
        else {
          tHeight = 0;
        }
        // templateHeight = jQuery('.editor-page-divider').height();
        if (jQuery('.t1-landing').length > 0) {
          templateHeight = jQuery('.t1-landing').height() + tHeight;
        } else {
          templateHeight = 0;
        }
        if (bindingClass1 == ".page_0") {
          templateHeight = -jQuery(bindingClass1).position().top;
        }
        else if (bindingClass1 == ".page_1") {
          templateHeight = 0;
        }
        if (['template-five', 'template-five-oldresult', 'experian'].indexOf(this._JSONBuilder.getJSONBuilt().template) >= 0 && bindingClass1[7] == 'q') {
          templateHeight = templateHeight + jQuery(bindingClass1.substr(0, 6)).position().top;
        }
        if (['template-six', 'template-eight'].indexOf(this._JSONBuilder.getJSONBuilt().template) >= 0 && bindingClass1.split('_')[0] == '.sec') {
          bindingClass1 = bindingClass1 + '_q_0';
        }
        position = jQuery(bindingClass1).position().top + templateHeight;
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
    }
  }

  add_Field_In_LeadForm() {

    let item = new Item;
    let length = this.editorControl.leadform.fields.length - 1;
    if (this.editorControl.leadform.fields[length].icon === 'GDPR') {
      this.editorControl.leadform.fields.splice(length, 0, item.getField());
    } else {
      this.editorControl.leadform.fields.push(item.getField());
    }
    // add check in the last
    // this.editorControl.leadform.fields = this._JSONBuilder.updateCheckboxField(this.editorControl.leadform.fields);
    //update fields of other leadforms
    this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform);
    /* for uniquename of leadform*/
    this._JSONBuilder.uniqueNameGenerator(this.editorControl.leadform);
  }
  delete_Field_From_LeadForm(index: any) {
    this.editorControl.leadform.fields.splice(index, 1);
    if (!this.editorControl.leadform.fields.length) {
      jQuery('.show-check.lead').click();
    }
    //update fields of other leadforms
    this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform);
    /* for uniquename of leadform*/
    this._JSONBuilder.uniqueNameGenerator(this.editorControl.leadform);
  }
  toggleRequired(field: any) {
    field.validations.required.status = !field.validations.required.status;
    this._JSONBuilder.commonEmitter.emit({ type: 'leadchanges' });
  }
  onChangeDescription(leadSection: any) {
    leadSection.showDesc = !leadSection.showDesc;
  }
  callGA(str: string, leadSection: any = {}) {
    switch (str) {
      case "HELPTEXT":
        if (leadSection.showDesc) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ToggleHelpTextOn');
          // _kmq.push(['record', 'Builder Lead Gen HelpText Toggle On']);
        }
        else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ToggleHelpTextOff');
          // _kmq.push(['record', 'Builder Lead Gen HelpText Toggle Off']);
        }
        break;
      case "SETMANDATE":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Set Leadgen Field Mandatory Click');
        // _kmq.push(['record', 'Builder Leadgen field Set Mandatory Click']);
        break;
      case "UNSETMANDATE":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Unset Leadgen Field Mandatory Click');
        // _kmq.push(['record', 'Builder Leadgen field Unset Mandatory Click']);
        break;
      case "ADDLEADFIELD":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Add Leadgen Field Click');
        // _kmq.push(['record', 'Builder Add Leadgen field Click']);
        break;
      case "SHOWLAST":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Show Leadgen Form in Last Click');
        // _kmq.push(['record', 'Builder Show Leadgen Form in Last Click']);
        break;
    }
  }
  ngAfterViewInit() {
    /*For tabbing*/
    jQuery('.type-details-head').on('click', function () {
      jQuery(this).parent().toggleClass('tab-collapse');
    });
    /* For tabbing end */
    /* for uniquename of leadform*/
    this._JSONBuilder.uniqueNameGenerator(this.editorControl.leadform);
  }

  onWysiwygChange(froalaName: string) {
    if (froalaName == 'ctaRedirectUrl') {
      if (this._JSONBuilder.isTempType(['Numerical', 'Graded']))
        this.editorControl.click_button.props.title = this.editorControl.leadform.props.title;
      else if (this._JSONBuilder.isTempType(['Recommendation']))
        this._outcomeService.getSelectedFormula().units.preValue = this.editorControl.leadform.props.title;
    }
  }

  ngOnDestroy() {
    //
  }

  onNavigateURLChange($event: any) {
    let url = $event.target.value;
    if (!url.trim()) {
      this._JSONBuilder.getJSONBuilt().navigate_Url = '';
      return;
    }
    if (/^(tel:)/i.test(url)) {
      this._JSONBuilder.getJSONBuilt().navigate_Url = url;
      return;
    }
    if (/^(mailto:)/i.test(url)) {
      this._JSONBuilder.getJSONBuilt().navigate_Url = url;
      return;
    }
    if (!/^(f|ht)tps?:\/\//i.test(url))
      url = "http://" + url;
    this._JSONBuilder.getJSONBuilt().navigate_Url = url;
  }

  copyToAll(type: string) {
    let text: string;
    if (type == 'header') {
      text = this._outcomeService.getSelectedFormula().decimal;
      this._JSONBuilder.getJSONBuilt().formula.map((formula: any) => { formula.decimal = text; return formula; });
      window.toastNotification('Header has been applied to all outcomes');
    } else if (type == 'button') {
      text = this._outcomeService.getSelectedFormula().units.preValue;
      this._JSONBuilder.getJSONBuilt().formula.map((formula: any) => { formula.units.preValue = text; return formula; });
      window.toastNotification('Button CTA has been applied to all outcomes');
    } else if (type == 'url') {
      text = this._outcomeService.getSelectedFormula().units.postValue;
      this._JSONBuilder.getJSONBuilt().formula.map((formula: any) => { formula.units.postValue = text; return formula; });
      window.toastNotification('URL has been applied to all outcomes');
    }
  }

  handleFile(event: any, field: any, index: any) {
    let file: File = event.target.files[0];
    let fileExt = file.name.split('.').pop();
    if (fileExt === 'csv') {
      jQuery('.spining' + index).removeClass('hide');
      let myReader: FileReader = new FileReader();
      let self = this;
      myReader.onload = function (e) {
        field.fileName = file.name;
        field.fieldsArray = [];
        let arr = myReader.result.split(/\n|,/);
        for (let j = 0; j < arr.length; j++) {
          let obj = {};
          arr[j] = arr[j].trim();
          if (arr[j] == '') continue;
          obj['text'] = arr[j];
          field.fieldsArray.push(obj);
        }
        // let selectizeObject = [];
        // for (let opt of field.fieldsArray) {
        //   let obj = {
        //     "label": opt.text,
        //     "value": opt.text
        //   }
        //   selectizeObject.push(obj);
        // }
        // jQuery('#' + field.key)[0].selectize.clearOptions();
        // jQuery('#' + field.key)[0].selectize.addOption(selectizeObject);
        jQuery('.spining' + index).addClass('hide');
        window.toastNotification('File Uploaded Successfully');
        self._JSONBuilder.commonEmitter.emit({ type: 'reInitSelectize' });
        // jQuery('#' + field.key)[0].selectize.setValue(selectizeObject[0].value);
        self._JSONBuilder.updateOtherLeadFormFields(self.editorControl.leadform);
      }
      myReader.onerror = function (e) {
        console.log(myReader.error);
      }
      myReader.readAsText(file);
    } else {
      window.toastNotification('Error! Invalid File Uplaoded, PLease Try Again.');
    }
  }
  onChangeDuplicates(leadSection: any, event: any) {
    if (!this.restrictDup) {
      event.preventDefault();
      this._featureAuthService.setSelectedFeature('lead_generation', 'restrict_duplicate');
      //jQuery('.calculators').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      setTimeout(function () {
        jQuery('.dashboard-toast').fadeOut().animate({ bottom: -60 }, 800, function () { });
      }, 200);
      leadSection.hideDuplicate = false;
    }
    else {
      leadSection.hideDuplicates = !leadSection.hideDuplicates;
      if (!leadSection.hideDuplicates) {
        this.editorControl.leadform.fields.map(f => f.unique = false);
      }
      this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform);
    }

  }
  fieldsForDup() {
    return this.editorControl.leadform.fields;
  }

  changeHeading(ev) {
    // this.leadSection.title = ev.target.value;
    this._JSONBuilder.updateOtherLeadFormSection(this.leadSection);
  }

  callToAction() {
    this.editorControl.leadform.postfix = this.editorControl.leadform.postfix == 'true' ? this.editorControl.leadform.postfix = 'false' : this.editorControl.leadform.postfix = 'true';
  }

  checkUrl() {
    this.editorControl.leadform.redirect_url = this._editorService.checkUrl(this.editorControl.leadform.redirect_url);
  }
  setUrlTab() {
    this.editorControl.leadform.imageName = this.editorControl.leadform.imageName == 'true' ? this.editorControl.leadform.imageName = 'false' : this.editorControl.leadform.imageName = 'true';
  }

  useFB() {
    this.editorControl.leadform.props.postfix = !this.editorControl.leadform.props.postfix;
    this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform);
    this._JSONBuilder.commonEmitter.emit({ type: 'reInitSelectize' });
  }

  changeLeadformtype(type: any, ev: any) {
    if (!(this.editorControl.leadform.props.postfix || this.editorControl.leadform.props.email_lead))
      this.toggleLeadform(ev);

    if (type == 'fb') {
      this.editorControl.leadform.props.postfix = !this.editorControl.leadform.props.postfix;
    } else if (type == 'email') {
      this.editorControl.leadform.props.email_lead = !this.editorControl.leadform.props.email_lead;
      if(this.editorControl.leadform.props.email_lead)
        this._JSONBuilder.commonEmitter.emit({ type: 'reInitSelectize' });
    }

    if (!(this.editorControl.leadform.props.postfix || this.editorControl.leadform.props.email_lead))
      this.toggleLeadform(ev);

    this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform);
  }
}

