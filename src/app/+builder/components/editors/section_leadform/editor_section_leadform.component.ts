import { EditorService } from './../../../services/editor.service';
import { TEMPLATE_IMAGES } from './../../../models/templateImages.store';
import { Component, ViewEncapsulation, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { FeatureAuthService } from '../../../../../shared/services/feature-access.service';
import { Section, Page, App, Item } from '@builder/models';
import { FroalaService } from '../../../services/froala.service';
declare var jQuery: any;
declare var ga: any;
declare var window: any;
// declare var _kmq: any;

@Component({
  selector: 'editor-section-leadform',
  templateUrl: './assets/html/editor_section_leadform.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorSectionLeadform implements AfterViewInit, OnDestroy, OnInit {
  page: any;
  leadSection: any;
  Sectionindex: number;
  restrictDup: Boolean;
  public isLeadGenAvailable: Boolean = false;
  editorControl: any = {
    leadform_question: {},
    click_button: {},
    share_links: {}
  };
  public leadFormObj: any = {};
  public froalaHeader: any = {};

  constructor(
    public _JSONBuilder: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public _featureAuthService: FeatureAuthService,
    public froalaService: FroalaService,
    public _editorService: EditorService
  ) {
    this.page = this._JSONBuilder.getPage('Questionnaire');
    // this._featureAuthService.features.lead_generation.active = false;
  }
  ngOnInit() {
    this.isLeadGenAvailable = this._featureAuthService.features.lead_generation.active;
    for (let section in this.page.sections) {
      if (this.page.sections[section].type === 'LeadFormQ') {
        this.leadSection = this.page.sections[section];
      }
      for (let item in this.page.sections[section].items) {
        for (let prop in this.editorControl) {
          if (prop === this.page.sections[section].items[item].type)
            this.editorControl[prop] = this.page.sections[section].items[item];
        }
      }
    }
    this.Sectionindex = jQuery.inArray(this.leadSection, this.page.sections);
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedPage(this.page);
    this.restrictDup = this._featureAuthService.features.lead_generation.restrict_duplicate;
    if (!this.restrictDup) {
      this.editorControl.leadform_question.hideDuplicates = false;
      this.editorControl.leadform_question.fields.map(f => f.unique = false);
    }
    if (this.editorControl.leadform_question.props.unit == '') {
      this.editorControl.leadform_question.props.email_lead = this.editorControl.leadform_question.visible;
      if(!this.editorControl.leadform_question.visible)
        this.editorControl.leadform_question.props.postfix = false;
      this.editorControl.leadform_question.props.unit = 'changed';
      this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform_question);
    }
    !this.editorControl.leadform_question.postfix ? this.editorControl.leadform_question.postfix = 'false' : this.editorControl.leadform_question.postfix = this.editorControl.leadform_question.postfix;
    !this.editorControl.leadform_question.imageName ? this.editorControl.leadform_question.imageName = 'true' : this.editorControl.leadform_question.imageName = this.editorControl.leadform_question.imageName;
    this.initWysiwyg()
  }

  initWysiwyg() {
    this.froalaHeader.options = false;
    setTimeout(() => {
      this.froalaHeader.options = this.froalaService.getOptions({ handler: this.froalaHeader, isAddVariable: false });
    });
  }

  ctaCheck() {
    // if (this.isCtaAccessible == false) {
    //   jQuery('#premiumModal').modal('show');
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
    if (['beforeResult', 'withResult'].indexOf($event.target.value) >= 0) {
      $value = 'Result';
    } else {
      $value = $event.target.value;
    }
    let data: any[] = [];
    // let fb = $event.target.selectedOptions[0].parentNode.getAttribute('fb');
    // this.editorControl.leadform_question.props.postfix = (fb == 'true') ? true : false;
    // this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform_question);
    data = this._JSONBuilder.hideOtherLeadForm($value, $event.target.selectedIndex, $event.target.value);
    // if ($value == 'Result' && this._JSONBuilder.getJSONBuilt().templateType == 'Recommendation')
    //   this._JSONBuilder.setSelectedModel('Outcome_Settings');

    if ($value == 'Questionnaire') {
      this._JSONBuilder.setSelectedModel('Section');
      this._JSONBuilder.setSelectedSection(data[0]);
    }
    let self: any = this;
    if ($value === 'Questionnaire') {
      setTimeout(function () { self.scrollIt('.sec_' + (self._JSONBuilder.getJSONBuilt().pages[1].sections.length - 1),$value); }, 50);
      this.cta();
    } else if ($value === 'Landing') {
      this.scrollIt('.page_0', $value);
      this.cta();
    } else {
      let item = this._JSONBuilder.getSelectedPage().sections.find(section => section.type === 'Result').items[0];
      if (item) item.optionImageVisible = false;
      this.editorControl.leadform_question.config.direction = ($event.target.value === 'Result') ? 'withResult' : $event.target.value;
      // this._JSONBuilder.getJSONBuilt().pages[2].sections.find((section: any) => section.type == 'Result').items[0].optionImageVisible = false;
      let resultSection = this._JSONBuilder.getJSONBuilt().pages[2].sections.find((section: any) => section.type == 'Result');
      resultSection.items[0] && (resultSection.items[0].optionImageVisible = false);
      if(this._JSONBuilder.getPage('Landing').visible) {
        this.scrollIt('.page_2', $value);
         }
        else{
          this.scrollIt('.page_1', $value);
        }
      // this.cta();
    }
    this._JSONBuilder.getVisibleLeadForm();
    this._JSONBuilder.commonEmitter.emit({ type: 'reInitSelectize' })
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
  toggleLeadform(event: any) {
    let self: any = this;
    if (this.isLeadGenAvailable) {
      this.leadSection.visible = !this.leadSection.visible;
      this.editorControl.leadform_question.visible = this.leadSection.visible;
      if (this.leadSection.visible && this.editorControl.leadform_question.visible) {
        this._JSONBuilder.hideOtherLeadForm1();
        setTimeout(function () { self.scrollIt('.sec_' + (self._JSONBuilder.getJSONBuilt().pages[1].sections.length - 1), 'Questionnaire'); }, 50);
      } else {
        // this._JSONBuilder.setSelectedModel('Page');
      }

      // add default field
      // this.addDefaultField();
      // add default field
    } else {
      if (this.editorControl.leadform_question.visible) {
        this.editorControl.leadform_question.visible = false;
        this.leadSection.visible = false;
      } else {
        event.preventDefault();
        this._featureAuthService.setSelectedFeature('lead_generation');
        jQuery('.lead_generation').addClass('activegreen limited-label');
        jQuery('#premiumModal').modal('show');
      }
    }
    this._JSONBuilder.getVisibleLeadForm();
  }
  addDefaultField() {
    if (!this.editorControl.leadform_question.fields.length) { this.add_Field_In_LeadForm(); }
  }

  // scrollIt(bindingClass1: string, innerText?: string) {
  //   console.log('component',bindingClass1,innerText);
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
  //     if (jQuery('.sound-cloud').length > 0 || jQuery('.sound-cloud-new').length > 0
  //       || jQuery('.template-seven').length > 0
  //       || jQuery('.sound-cloud-v3').length > 0) {
  //       // for template sound-cloud
  //       jQuery('.sound-cloud').addClass('template2');
  //       jQuery('.sound-cloud-new').addClass('template2');
  //       jQuery('.sound-cloud-v3').addClass('template2');
  //       jQuery('.template-seven').addClass('template2');
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
  //       console.log('component height',templateHeight);
  //       if (innerText && ((innerText == 'Landing') || (innerText == 'WELCOME SCREEN With Lead Generation') || (innerText == 'With Lead Generation'))) {

  //         templateHeight = -jQuery(bindingClass1).position().top;
  //       }
  //       else if (innerText && ((innerText === 'Questionnaire') || (innerText === 'Result') || (innerText === 'QUESTIONNAIRE With Lead Generation') || (innerText == 'With Lead Generation'))) {
  //         console.log('q$r component');
  //         templateHeight = 0;
  //       }
  //       if (['template-six', 'template-eight'].indexOf(this._JSONBuilder.getJSONBuilt().template) >= 0 && bindingClass1.split('_')[0] == '.sec') {
  //         bindingClass1 = bindingClass1 + '_q_0';
  //       }
  //       console.log('binding class ',bindingClass1);
  //       position = jQuery(bindingClass1).position().top + templateHeight;
  //       console.log('position',position);
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
    let length = this.editorControl.leadform_question.fields.length - 1;
    if (this.editorControl.leadform_question.fields[length].icon === 'GDPR') {
      this.editorControl.leadform_question.fields.splice(length, 0, item.getField());
    } else {
      this.editorControl.leadform_question.fields.push(item.getField());
    }
    // this.editorControl.leadform_question.fields = this._JSONBuilder.updateCheckboxField(this.editorControl.leadform_question.fields);
    //update fields of other leadforms
    this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform_question);
    /* for uniquename of leadform*/
    this._JSONBuilder.uniqueNameGenerator(this.editorControl.leadform_question);
  }
  delete_Field_From_LeadForm(index: any) {
    this.editorControl.leadform_question.fields.splice(index, 1);
    if (!this.editorControl.leadform_question.fields.length) {
      this.editorControl.leadform_question.visible = false;
      this.leadSection.visible = false;
    }
    //update fields of other leadforms
    this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform_question);
    /* for uniquename of leadform*/
    this._JSONBuilder.uniqueNameGenerator(this.editorControl.leadform_question);
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
    // if (!this._featureAuthService.features.lead_generation.active) {
    //      setTimeout(() => {
    //       this.leadSection.visible = false;
    //       this.editorControl.leadform_question.visible = false;
    //        }, 100);
    // }
    //after editor initialized..
    /*For tabbing*/
    jQuery('.type-details-head').on('click', function () {
      jQuery(this).parent().toggleClass('tab-collapse');
    });
    /* For tabbing end */
    /* for uniquename of leadform*/
    this._JSONBuilder.uniqueNameGenerator(this.editorControl.leadform_question);
  }



  ngOnDestroy() {
    //
  }

  handleFile(event: any, field: any, index: any) {
    let file: File = event.target.files[0];
    let fileExt = file.name.split('.').pop();
    if (fileExt === 'csv') {
      jQuery('.spining' + index).removeClass('hide');
      field.fileName = file.name;
      let myReader: FileReader = new FileReader();
      let self = this;
      myReader.onload = function (e) {
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
        //     'label': opt.text,
        //     'value': opt.text
        //   }
        //   selectizeObject.push(obj);
        // }
        // jQuery('#' + field.key)[0].selectize.clearOptions();
        // jQuery('#' + field.key)[0].selectize.addOption(selectizeObject);
        jQuery('.spining' + index).addClass('hide');
        window.toastNotification('File Uploaded Successfully');
        self._JSONBuilder.commonEmitter.emit({ type: 'reInitSelectize' });
        //jQuery('#' + field.key)[0].selectize.setValue(selectizeObject[0].value);
        self._JSONBuilder.updateOtherLeadFormFields(self.editorControl.leadform_question);
      }
      myReader.onerror = function (e) {
        console.log(myReader.error);
      }
      myReader.readAsText(file);
    } else {
      window.toastNotification('Error! Invalid File Uplaoded, PLease Try Again.');
    }
  }

  onChangeDuplicates(leadSection: any) {
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
      console.log(leadSection.hideDuplicates);
      if (!leadSection.hideDuplicates) {
        this.editorControl.leadform_question.fields.map(f => f.unique = false);
      }
      this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform_question);
    }
  }

  fieldsForDup() {
    return this.editorControl.leadform_question.fields;
  }

  changeHeading(ev) {
    // this.leadSection.title = ev.target.value;
    this._JSONBuilder.updateOtherLeadFormSection(this.leadSection);
  }

  callToAction() {
    this.editorControl.leadform_question.postfix = this.editorControl.leadform_question.postfix == 'true' ? this.editorControl.leadform_question.postfix = 'false' : this.editorControl.leadform_question.postfix = 'true';
  }

  checkUrl() {
    this.editorControl.leadform_question.redirect_url = this._editorService.checkUrl(this.editorControl.leadform_question.redirect_url);
  }
  setUrlTab() {
    this.editorControl.leadform_question.imageName = this.editorControl.leadform_question.imageName == 'true' ? this.editorControl.leadform_question.imageName = 'false' : this.editorControl.leadform_question.imageName = 'true';
  }

  useFB() {
    this.editorControl.leadform_question.props.postfix = !this.editorControl.leadform_question.props.postfix;
    this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform_question);
  }

  changeLeadformtype(type: any, ev: any) {
    if (!(this.editorControl.leadform_question.props.postfix || this.editorControl.leadform_question.props.email_lead))
      this.toggleLeadform(ev);

    if (type == 'fb') {
      this.editorControl.leadform_question.props.postfix = !this.editorControl.leadform_question.props.postfix;
    } else if (type == 'email') {
      this.editorControl.leadform_question.props.email_lead = !this.editorControl.leadform_question.props.email_lead;
      if (this.editorControl.leadform_question.props.email_lead)
        this._JSONBuilder.commonEmitter.emit({ type: 'reInitSelectize' });
    }

    if (!(this.editorControl.leadform_question.props.postfix || this.editorControl.leadform_question.props.email_lead))
      this.toggleLeadform(ev);

    this._JSONBuilder.updateOtherLeadFormFields(this.editorControl.leadform_question);
  }

}
