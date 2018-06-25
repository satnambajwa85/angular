import { OnInit } from '@angular/core';
import { Component, AfterViewInit } from '@angular/core';
import { Control } from '../../../templates/controls/control.component';
import { JSONBuilder } from '../../services/JSONBuilder.service';
import { FormulaService } from '../../services/formula.service';
import { RemoveTags } from '../../../templates/pipes/index';
import { Section, Page, App, Item } from '@builder/models';
import { BuilderService } from '../../services/builder.service';
import { JSONItemTracker } from '../../services/JSONUpdateItemTracker.service';
import { environment } from '../../../../../environments/environment';
import { ShareOutcomeService } from './../../services/shareOutcome.service';
import { FeatureAuthService } from "../../../../shared/services/feature-access.service";

declare var jQuery: any;
declare var bootbox: any;
declare var window: any;
declare var ga: any;
// declare var _kmq: any;

@Component({
  selector: 'component-manager',
  templateUrl: './component_manager.template.html',
  styleUrls: [
    './assets/css/component_manager.style.css'
  ]
})

export class ComponentManagerComponent implements AfterViewInit, OnInit {
  templateJson: any;
  toastMessage: string;
  leadSection: any;
  resultSection: any;
  pnHeight: any;
  preOrder: any;
  preOrderList: any;
  postorder: any;
  tempName: string;
  sectionTemplates: any[] = ['inline-temp-new', 'inline-temp', 'one-page-slider', 'sound-cloud-new', 'sound-cloud-v3', 'template-seven'];
  sectionNumber: any[] = ['sound-cloud-new', 'sound-cloud-v3'];
  previousItemArray: any[] = [];

  constructor(public jsonBuilderHelper: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public _outcomeService: ShareOutcomeService,
    public _featureAuthService: FeatureAuthService
  ) {
    this.templateJson = jsonBuilderHelper.getJSONBuilt();
    for (let page of this.templateJson.pages) {
      for (let section in page.sections) {
        if (page.sections[section].type === 'Result') {
          this.resultSection = page.sections[section];
        }
        if (page.sections[section].type === 'LeadFormQ') {
          this.leadSection = page.sections[section];
        }
      }
    }
  }
  ngOnInit() {
    this.tempName = this.jsonBuilderHelper.getJSONBuilt().template;
  }
  toastNotificationWithFormulaCheck(baseMessage: any) {
    let toastMessage: any = baseMessage;
    window.toastNotification(toastMessage);
  }
  initialize() {
    let sortFormula: boolean = false;
    let self = this;
    console.log("AAAAAAAA", this)
    this.pnHeight = jQuery(".panel-scroll").height();
    jQuery('.sortable1').sortable({
      connectWith: 'ul',
      //cursor: "move",
      //helper: "clone",
      cursor: 'pointer',
      opacity: 0.5,
      revert: false,
      scroll: false,
      start: function () {
        self.preOrder = jQuery(this).sortable('toArray', { attribute: 'data-odr' });
      },
      stop: function (e) {
        let order = jQuery(this).sortable('toArray', { attribute: 'data-order' });
        let sorder = jQuery(this).sortable('toArray', { attribute: 'data-odr' });

        if (JSON.stringify(self.preOrder) !== JSON.stringify(sorder) && order.length == self.jsonBuilderHelper.getSelectedSection().items.length) {
          /* -- Update All section orderting   -- */
          if (!self.previousItemArray.length)
            self.previousItemArray = self.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion();
          /* -- Update All section orderting eND  -- */
          self.jsonBuilderHelper.sort(sorder);
          /* -- Update same section reorderting  -- */
          self._ItemTrackService.setUnSavedSections(self.jsonBuilderHelper.getSelectedSection());
          /* Animation Init */
          self.jsonBuilderHelper.animInit();
          self._builderService.updateIntraSectionOrder(order, jQuery(this).attr('data-section'), self.jsonBuilderHelper.getSelectedControl()._id)
            .subscribe(
              (response: any) => {

                self.toastNotificationWithFormulaCheck('Re-ordered successfully.');
                /* animation */
                self.jsonBuilderHelper.debounce(self.jsonBuilderHelper.animLoad(), 1800);
              },
              (error: any) => {
                console.log(error);
              }
            );

          /* -- Update same section orderting End  -- */
          self.jsonBuilderHelper.updateFormulas(sorder);

          /* -- Update All section orderting   -- */
          self.jsonBuilderHelper.updateAllSectionsFormulas(self.previousItemArray);
          self.previousItemArray = [];
          /* -- Update All section orderting  End -- */
        }
        else if (JSON.stringify(self.preOrder) === JSON.stringify(sorder)) {
          self.jsonBuilderHelper.reorder(sorder, true)
        }
      },
      out: function () {
      },
      receive: function (event: any, ui: any) {
        let order = jQuery(this).sortable('toArray', { attribute: 'data-order' });
        let sorder = jQuery(this).sortable('toArray', { attribute: 'data-odr' });

        /* -- Update All section orderting   -- */
        self.previousItemArray = self.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion();
        /* -- Update All section orderting  eND -- */

        /* -- Update same section reorderting  -- */
        self.jsonBuilderHelper.multiSectionSort(jQuery(this).attr('data-sec'), ui.item.index(), sorder);
        /* Animation Init */
        self.jsonBuilderHelper.animInit();

        self._builderService.updateInterSectionOrder(order, jQuery(this).attr('data-section'))
          .subscribe(
            (response: any) => {
              self.toastNotificationWithFormulaCheck('Re-ordered successfully.');
              if (!self.jsonBuilderHelper.getSelectedSection().items.length) {
                var message = self.jsonBuilderHelper.getSelectedSection().title + ' section was removed successfully.';
                self.DeleteSection(message);
              }
              /* animation */
              self.jsonBuilderHelper.debounce(self.jsonBuilderHelper.animLoad(), 1800);

            },
            (error: any) => {
              console.log(error);
            }
          );
        /* -- Update same section orderting End  -- */
      },
    }).disableSelection();
    jQuery(document).mouseup(function (e: any) {
      if (!jQuery('.add-parent').is(e.target)
        && jQuery('.add-dropdown-menu').has(e.target).length === 0
      ) {
        jQuery('.add-parent').removeClass('active');
      }
    });
  }
  ngAfterViewInit() {
    let self = this;
    self.initialize();
    this.initializeSectionSorting();
    /*canvas slimscroll */
    this.templateScroll();
    jQuery(window).on("resize", function () {
      self.templateScroll();
    });
    this.nameEdit();
  }
  initializeSectionSorting() {
    let self = this;
    jQuery('.ch-sortable').sortable({
      cancel: ".fixed",
      connectWith: 'div',
      cursor: 'pointer',
      opacity: 0.5,
      revert: false,
      scroll: false,
      start: function () {
        self.preOrderList = jQuery(this).sortable('toArray', { attribute: 'data-section' });
      },
      stop: function (ev, ui) {
        self.postorder = jQuery(this).sortable('toArray', { attribute: 'data-section' });
        if (JSON.stringify(self.preOrder) === JSON.stringify(self.postorder))
          return;

        /* -- Update All section orderting   -- */
        self.previousItemArray = self.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion();
        /* -- Update All section orderting  eND -- */

        self.postorder = self.postorder.filter(i => i);
        if (!self.checkDragAbility(self.jsonBuilderHelper.getPage('Questionnaire'), self.postorder)) {
          jQuery(this).sortable("cancel");
          return;
        }
        self.postorder = self.findLeadform(self.postorder);
        self.updateSection(self.postorder);

      }
    }).disableSelection();
  }
  checkDragAbility(page: any, postorder: any) {
    let section = page.sections.find((section) => section._id === postorder[postorder.length - 2]);
    return (section && section.type === 'LeadFormQ') ? false : true;
  }
  updateSection(postorder: any[]) {
    this._builderService.updateSectionOrder(postorder, this.jsonBuilderHelper.getPage('Questionnaire')._id)
      .subscribe((response: any) => {
        this.sortSection(postorder, this.jsonBuilderHelper.getPage('Questionnaire'));
      }, (error: any) => {
        console.log('error', error);
      })
  }
  sortSection(postorder: any[], page: any) {
    let arr = [];
    postorder.forEach((_id) => {
      let item = page.sections.find((section) => section._id === _id);
      item ? arr.push(item) : '';
    });
    console.log('arr=>>', arr);
    page.sections = arr;

    /* -- Update All section orderting   -- */
    this.jsonBuilderHelper.updateAllSectionsFormulas(this.previousItemArray);
    this.previousItemArray = [];
    this.jsonBuilderHelper.setQuestionsData();
    /* -- Update All section orderting  End -- */
  }
  nameEdit() {
    jQuery(".edit_name_link_sitemap").on("click", function () {
      if ((jQuery(this).parent().parent().parent().find('.edit-name-sitemap').hasClass('hide'))) {
        jQuery(this).parent().parent().parent().find('.section-subhead').addClass('hide');
        jQuery(this).parent().parent().parent().find('.edit-name-sitemap').removeClass('hide');
        jQuery(this).parent().parent().parent().find('.edit-name-sitemap').focus();
      }
    });

    jQuery(document).on("focusout", ".edit-name-sitemap", function () {
      jQuery(this).parent().parent().find('.section-subhead').removeClass('hide');
      jQuery(this).parent().parent().find('.edit-name-sitemap').addClass('hide');
    });
  }
  deleteResult(formulaIndex: any, resultControl: any) {
    if (this.resultSection.items.length > 1) {
      this._builderService.deleteItem(resultControl._id, this.resultSection._id)
        .subscribe(
          (response: any) => {
            if (response.title != 'Not Deleted') {
              this.jsonBuilderHelper.deleteResultSection(this.resultSection, formulaIndex);
              this.jsonBuilderHelper.getJSONBuilt().formula.splice(formulaIndex, 1);
              window.toastNotification('Result Deleted Successfully');
            }
          },
          (error: any) => {
            console.log(error);
          }
        );
    }
  }

  addLead(page: Page, event?: any) {
    this.stopPropagation(event);
    let self = this;
    this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getPage('Result'));
    let newLeadSec = this.getResultLead();
    let newLeadItem = newLeadSec.items.find(it => it.type == 'leadform');
    if (this.leadSection.visible && this.leadSection.items[0].visible) {
      this.leadSection.visible = false;
      this.leadSection.items[0].visible = false;
    } else {
      newLeadSec.visible = true;
      if (newLeadItem.config.direction == 'beforeResult')
        newLeadItem.visible = !newLeadItem.visible;
      if (newLeadSec.visible && newLeadItem.visible) {
        newLeadItem.config.direction = 'beforeResult';
        newLeadItem.props.email_lead = true;
      }
    }
    this.jsonBuilderHelper.getVisibleLeadForm();
    if (newLeadItem.visible) {
      this.jsonBuilderHelper.setSelectedModel('Control');
      this.jsonBuilderHelper.setSelectedControl(newLeadItem)
      this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getPage('Result'));
      // this.jsonBuilderHelper.setSelectedSection(newLeadSec);
      this.jsonBuilderHelper.hideOtherLeadForm1();
      this.jsonBuilderHelper.commonEmitter.emit({ type: 'reInitSelectize' });
      setTimeout(function () {

        // self.scrollIt('.sec_' + (page.sections.length - 1));
        self.scrollIt('.page_' + 2);
        jQuery('.leadAsPopup').removeClass('hide');
        jQuery('.lead-popup').removeClass('hide');
        if (self.jsonBuilderHelper.getJSONBuilt().template == 'template-eight')
          jQuery('.t1-result').addClass('LeadBefore');
      }, 200);
      // }
    } else {
      newLeadItem.props.email_lead = false;
      newLeadItem.props.postfix = false;
    }
    this.jsonBuilderHelper.updateOtherLeadFormFields(newLeadItem);
    self.addDropdown();
  }

  addResult(page: Page) {
    let self = this;
    // this.resultSection = this.getResultSection(page);
    if (this.jsonBuilderHelper.getJSONBuilt().formula.length <= this.resultSection.items.length)
      this.jsonBuilderHelper.addFormula();
    this.jsonBuilderHelper.animInit();
    let ItemResult: any = this.jsonBuilderHelper.addResultSection(this.resultSection);
    // /* save result output item in resultPage */
    this._builderService.addItem(this.resultSection._id, ItemResult.item, this.resultSection.items.length - 1).subscribe(
      (response: any) => {
        setTimeout(function () {
          self.nameEdit();
        }, 100);
        this.resultSection.items[ItemResult.index] = new Item().deserialize(response);
        this.jsonBuilderHelper.debounce(this.jsonBuilderHelper.animLoad(), 1800);
      },
      (error: any) => {
        //
      }
    );
  }

  stopPropagation(event?: any) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  addDropdown(event?: any) {
    if (event) { this.stopPropagation(event); }
    jQuery('.add-parent.option').toggleClass('active');
  }

  templateScroll() {
    var zoomFactor = 1;
    var correctedViewportW = (function (win: any, docElem: any) {
      var mM = win['matchMedia'] || win['msMatchMedia']
        , client = docElem['clientWidth']
        , inner = win['innerWidth']

      return mM && client < inner && true === mM('(min-width:' + inner + 'px)')['matches']
        ? function () { return win['innerWidth']; }
        : function () { return docElem['clientWidth']; }
    }(window, document.documentElement));

    if (jQuery(window).width() > 992) { var minWinWidth = correctedViewportW() - 575; }
    else { var minWinWidth = correctedViewportW() - 0; }

    if (correctedViewportW() > 1850) { zoomFactor = 0.78; }
    else if (correctedViewportW() < 1150) { zoomFactor = 0.55; }
    else if (correctedViewportW() < 1300) { zoomFactor = 0.65; }
    else if (correctedViewportW() < 992) { zoomFactor = 1; }
    else { zoomFactor = 0.7; }

    if (!jQuery('#sidebar').hasClass('properties-close')) {
      jQuery(".template-section").css('width', minWinWidth);
      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        jQuery('.template-container').css({
          'transform': 'scale(' + zoomFactor + ')',
          'float': 'left',
          'margin-bottom': '-19460px',
          'transform-origin': '60px 0px'
        });
      }
      else {
        jQuery('.template-container').css('zoom', zoomFactor);
      }
    }
    else {
      var minWinWidth = correctedViewportW() - 250;
      jQuery(".template-section").animate({ width: minWinWidth }, 300);
      jQuery(".template-section").css('overflow-x', "hidden");
      if (correctedViewportW() > 992) { jQuery('temp-dev').css('zoom', ".97"); }
      // else { jQuery('temp-dev').css('zoom', ".93"); }
    }

    if (jQuery(window).width() > 992) { var winWidth = correctedViewportW() - 290; }
    else { var winWidth = correctedViewportW() - 0; }
    jQuery('.template-container').css('width', winWidth);
  }
  getVisibleSections(page: Page): any[] {
    return page.sections.filter((section: any) => section.visible);
  }
  getLeadFormVisibility(section: Section) {
    let visiblity: boolean;
    for (let item of section.items) {
      if (item.type === 'leadform') {
        visiblity = item.visible;
      }
    }
    return visiblity;
  }
  getVisibleLeadinPage(page: Page) {
    let visiblity: boolean;
    for (let section of page.sections) {
      for (let item of section.items) {
        if (item.type === 'leadform' || item.type === 'leadform_question') {
          visiblity = item.visible;
          if (page.type == 'Result')
            visiblity = item.visible && (item.config.direction == 'withResult' || item.config.direction == 'afterResult');
        }
      }
    }
    return visiblity;
  }

  selectControl(control: any) {
    this.jsonBuilderHelper.setSelectedControl(control);
  }

  selectModel(event: any, type: any, Class?: any, index?: any) {
    if (this.jsonBuilderHelper.getJSONBuilt().template.split('-', 3).join('-') == 'one-page-card' || ['template-six', 'template-eight'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0) {
      if (type == 'Section' && this.jsonBuilderHelper.getSelectedSection().type !== 'LeadFormQ' && this.jsonBuilderHelper.getSelectedSection().type !== 'CustomHtml') {
        this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getSelectedPage());
        this.jsonBuilderHelper.setSelectedModel('Page');
      }
      else
        this.jsonBuilderHelper.setSelectedModel(type);
    }
    else
      this.jsonBuilderHelper.setSelectedModel(type);


    event.stopPropagation();
    event.preventDefault();

    if (this.jsonBuilderHelper.getJSONBuilt().pages[0].type == 'Landing'
      && this.jsonBuilderHelper.getJSONBuilt().pages[0].visible == false && type == 'Page') { index = index - 1; }

    if (index < 0) return;

    if (this.jsonBuilderHelper.getJSONBuilt().pages[0].type == 'Landing'
      && this.jsonBuilderHelper.getJSONBuilt().pages[0].visible == false && type == 'Page'
      && ['experian'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0) { index = index + 1; }
    //for bringing selected template area up
    let bindingClass = Class + index;
    console.log(type, Class);

    if ((jQuery('.inline-temp').length > 0 || jQuery('.inline-temp-new').length > 0) && type === 'Control') {
      bindingClass = Class.substr(0, 6);
    }
    if (this.jsonBuilderHelper.getSelectedPage().type == 'Result' && type == 'Page') {
      bindingClass = '.t1-result';
    }
    if (jQuery('.sound-cloud').length > 0 || jQuery('.sound-cloud-new').length > 0 || jQuery('.sound-cloud-v3').length > 0 || jQuery('.template-seven').length > 0) {
      jQuery('.sound-cloud').addClass('template2');
      jQuery('.sound-cloud-new').addClass('template2');
      jQuery('.sound-cloud-v3').addClass('template2');
      jQuery('.template-seven').addClass('template2');
      if (this.jsonBuilderHelper.getSelectedPage().type == 'Result' && type == 'Page') {
        bindingClass = '.page_2';
      }
    }
    if (['template-six', 'template-eight'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0 && type == 'Section') {
      bindingClass = bindingClass + '_q_0';
    }
    //scrollable code moved to function scrollIt()
    this.scrollIt(bindingClass, event);
    //scrollable code moved to function scrollIt()

    if (['experian'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0) {
      let bindingClass1 = Class + index;
      let position = jQuery(bindingClass1).position().top;
      jQuery('.experian-question-outer').animate({ scrollTop: position }, function () {
        jQuery('.experian-question-outer').clearQueue();
      });
    }

  }

  selectOutcomeSettings(event: any, type: any) {
    this.jsonBuilderHelper.setSelectedModel(type);
    event.stopPropagation();
    event.preventDefault();
  }
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
      else if (['one-page-slider', 'one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'inline-temp', 'inline-temp-new', 'experian', 'template-five', 'template-five-oldresult', 'template-six', 'template-eight'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0) {
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
        if (['template-five', 'template-five-oldresult', 'experian'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0 && bindingClass1[7] == 'q') {
          templateHeight = templateHeight + jQuery(bindingClass1.substr(0, 6)).position().top;
        }
        position = jQuery(bindingClass1).position().top + templateHeight;
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
    }
  }

  scrollEditor(bindingClass1: string) {
    if (jQuery(bindingClass1).length) {
      var position = jQuery(bindingClass1).position().top;
      jQuery('.side-scroll').animate({ scrollTop: position }, 1000);
    }
  }

  OnDeleteControl(sectionIndex: number) {
    var that: any = this;
    bootbox.dialog({
      size: 'small',
      message: `
                    <div class="bootbox-body-left">
                        <div class="mat-icon">
                            <i class="material-icons">error</i>
                        </div>
                    </div>
                    <div class="bootbox-body-right">
                       ${this.jsonBuilderHelper.getSelectedControl().type == 'custom_html' ? ' <p class="one-line-para">You will not be able to retrieve the deleted question. Are you sure you want to delete?</p>' : '<p class="">Are you sure you want to delete this question?</p>'} 
                    </div>
            `,
      buttons: {
        cancel: {
          label: `${this.jsonBuilderHelper.getSelectedControl().type == 'custom_html' ? 'No, do not delete' : 'Cancel'}`,
          className: "btn-cancel btn-cancel-hover"
        },

        success: {
          label: `${this.jsonBuilderHelper.getSelectedControl().type == 'custom_html' ? 'Yes, Delete permanently' : 'OK'}`,
          className: "btn btn-ok btn-hover",
          callback: function () {
            that.DeleteControl(sectionIndex);
          }
        }
      }
    });
  }

  OnDeleteSection() {
    var that: any = this;
    bootbox.dialog({
      size: 'small',
      message: `
                    <div class="bootbox-body-left">
                        <div class="mat-icon">
                            <i class="material-icons">error</i>
                        </div>
                    </div>
                    <div class="bootbox-body-right">
                        <p class="one-line-para">You will not be able to retrieve the deleted section. Are you sure you want to delete?</p>
                    </div>
            `,
      buttons: {
        cancel: {
          label: "No, do not delete",
          className: "btn-cancel btn-cancel-hover"
        },

        success: {
          label: "Yes, Delete permanently  ",
          className: "btn btn-ok btn-hover",
          callback: function () {
            that.DeleteSection('Section Deleted Successfully.');
          }
        }
      }
    });

  }
  DeleteControl(sectionIndex: any) {
    jQuery('.template-section.og-loader').addClass('add-del-overlay');
    var that: any = this;
    var sectionId: any = null,
      itemId: any = that.jsonBuilderHelper.getSelectedControl()._id;
    if (that.jsonBuilderHelper.getSelectedSection().items.length == 1)
      sectionId = that.jsonBuilderHelper.getSelectedSection()._id;
    // jQuery('.editor-page-divider.sec_'+sectionIndex).addClass('delete-animation');
    /* Animation Init */
    let slide_index = this.jsonBuilderHelper.getQuestionsList().length;
    jQuery('.editor-page-divider.slide_' + (slide_index - 1)).addClass('removed-item-animation');
    that.jsonBuilderHelper.animInit();
    that._builderService.remove(itemId, sectionId)
      .subscribe(
        (response: any) => {
          that.jsonBuilderHelper.deleteControl();
          //toast start
          jQuery('.template-section.og-loader').removeClass('add-del-overlay');
          let bindingClass1 = '.sec_' + sectionIndex + '_q_0';
          that.scrollIt(bindingClass1);
          that.toastNotificationWithFormulaCheck('Question Deleted Successfully.');
          // toast end
          /* animation */
          that.jsonBuilderHelper.debounce(that.jsonBuilderHelper.animLoad(), 1800);
          that.jsonBuilderHelper.updateGradedFormula();
        },
        (error: any) => {
          console.log(error);
        }
      );
  }
  DeleteSection(messsage: string) {
    if (this.jsonBuilderHelper.getSelectedSection().type === 'CustomHtml') {
      this.DeleteSectionb(messsage);
    } else {
      this.DeleteSectiona(messsage);
    }
  }

  DeleteSectiona(messsage: string) {
    let pages = this.templateJson.pages;
    let sectionPage = pages.filter(p => p.type == 'Questionnaire');
    let sectionList = sectionPage[0].sections.filter(d => d.type != 'LeadFormQ');
    let nonCustomSection = [];
    for (let i = 0; i < sectionList.length; i++) {
      if (sectionList[i].type != 'CustomHtml') {
        nonCustomSection.push(sectionList[i]);
      }
    }
    jQuery('.template-section.og-loader').addClass('add-del-overlay');
    var that: any = this;
    let self = this;
    var sectionId: any = that.jsonBuilderHelper.getSelectedSection()._id;
    let index = nonCustomSection.findIndex(d => d._id == sectionId);
    let items = nonCustomSection[index].items;
    let itemsId = [];
    for (let im of items) {
      im.section = index == 0 ? nonCustomSection[(index + 1)]._id : nonCustomSection[(index - 1)]._id;
      itemsId.push(im._id);
      this.jsonBuilderHelper.setDeleteSectionQuestion(im, index == 0 ? nonCustomSection[index + 1]._id : nonCustomSection[index - 1]._id, index);
    }
    this._builderService.addDeleteSectionQuestion({ sectionId: index == 0 ? nonCustomSection[index + 1]._id : nonCustomSection[index - 1]._id, items: itemsId })
      .subscribe(data => {
        self.jsonBuilderHelper.animInit();
        that._builderService.removeSection(sectionId)  //TODO udpate section ID
          .subscribe(
            (response: any) => {
              //toast start
              self.toastNotificationWithFormulaCheck(messsage);
              jQuery('.template-section.og-loader').removeClass('add-del-overlay');
              // toast end
              that.jsonBuilderHelper.deleteSection();
              /* animation */
              self.jsonBuilderHelper.debounce(self.jsonBuilderHelper.animLoad(), 1800);
              self.jsonBuilderHelper.updateGradedFormula();
            },
            (error: any) => {
              console.log(error);
            }
          );
      }, error => console.log('Section Remove Eroor'));
    //jQuery('.editor-page-divider.sec_' + (lastSectionIndex - 1)).addClass('removed-item-animation');
  }

  DeleteSectionb(messsage: string) {
    console.log('Delete section');
    jQuery('.template-section.og-loader').addClass('add-del-overlay');
    var that: any = this;
    let self = this;
    var sectionId: any = that.jsonBuilderHelper.getSelectedSection()._id;
    let lastSectionIndex = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections.length;
    if (this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1].type === 'LeadFormQ') {
      lastSectionIndex = lastSectionIndex - 1;
    }
    jQuery('.editor-page-divider.sec_' + (lastSectionIndex - 1)).addClass('removed-item-animation');
    /* Animation Init */
    self.jsonBuilderHelper.animInit();
    that._builderService.removeSection(sectionId)  //TODO udpate section ID
      .subscribe(
        (response: any) => {
          //toast start
          self.toastNotificationWithFormulaCheck(messsage);
          jQuery('.template-section.og-loader').removeClass('add-del-overlay');
          // toast end
          that.jsonBuilderHelper.deleteSection();
          /* animation */
          self.jsonBuilderHelper.debounce(self.jsonBuilderHelper.animLoad(), 1800);
          self.jsonBuilderHelper.updateGradedFormula();
        },
        (error: any) => {
          console.log(error);
        }
      );
    // this.panelHeightUpdate("deleteSection");
  }

  addControl(type: string) {
    jQuery('.template-section.og-loader').addClass('add-del-overlay');
    let self = this;
    let item: Item;
    let index = jQuery.inArray(this.jsonBuilderHelper.getSelectedControl(), this.jsonBuilderHelper.getSelectedSection().items);
    if (type == 'New') {
      item = new Item(this.jsonBuilderHelper.getSelectedControl().type,
        'Default Question Title',
        'Default Question Help Text',
        'Default Placeholder');

    } else {
      item = this.jsonBuilderHelper.getSelectedControl();
    }
    if (this.jsonBuilderHelper.isTempType(['Ecom']))
      item.options.map((opt) => opt.value = 0);
    /* Animation Init */
    self.jsonBuilderHelper.animInit();
    this._builderService.addItem(this.jsonBuilderHelper.getSelectedSection()._id, item, index + 1).subscribe(
      (response: any) => {
        let newItem = new Item().deserialize(response);
        if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Poll' && newItem.type == 'radio_button') {
          newItem.options.map(opt => opt.value = 'poll_' + (Math.floor((Math.random() * 10000000) + 1)) + Date.now());
        }
        self.jsonBuilderHelper.addControl(newItem, index);
        jQuery('.template-section.og-loader').removeClass('add-del-overlay');
        self.toastNotificationWithFormulaCheck('New Question added Successfully.');
        let slide_index = this.jsonBuilderHelper.getQuestionsList().length;
        jQuery('.editor-page-divider.slide_' + (slide_index - 1)).addClass('new-item-animation');
        /** select the new added item */
        self.jsonBuilderHelper.setSelectedControl(newItem);
        /* animation */
        self.jsonBuilderHelper.debounce(self.jsonBuilderHelper.animLoad(), 1800);
        // self.questions.push(newItem);
        self.jsonBuilderHelper.updateGradedFormula();
      },
      (error: any) => {
        //
        //  console.log("error", error);
      }
    );
  }
  addCustomHtmlCompo(event?: any) {
    jQuery('.template-section.og-loader').addClass('add-del-overlay');
    this.stopPropagation(event);
    /* select default questionaire page on click */
    this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getJSONBuilt().pages[1]);

    let self = this;
    let item: Item;
    let templateName: string = this.jsonBuilderHelper.getJSONBuilt().template;
    let appType: string = this.jsonBuilderHelper.getJSONBuilt().templateType;
    item = new Item('custom_html', 'Custom Html');
    item.setCurrentValue("<html><h1>You can</h1> <p style='color:blue;'>add custom</p> <a href='javascript:void(0)'> HTML here.</a> <html>");
    let lastSectionIndex = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections.length;
    if (this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1].type === 'LeadFormQ') {
      lastSectionIndex = lastSectionIndex - 1;
    }
    let secId = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1]._id;
    let index = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1].items.length;
    /* Animation Init */
    self.jsonBuilderHelper.animInit();
    this._builderService.addItem(secId, item, index + 1).subscribe(
      (response: any) => {
        let newItem = new Item().deserialize(response);
        self.jsonBuilderHelper.addNewQuestion(newItem, lastSectionIndex);
        // select on add of ques
        this.jsonBuilderHelper.setSelectedModel('Control');
        this.jsonBuilderHelper.setSelectedSection(this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1]);
        this.jsonBuilderHelper.setSelectedControl(newItem);
        let bclasss = "#" + this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1]._id;

        jQuery('.template-section.og-loader').removeClass('add-del-overlay');
        //scroll to newly added ques
        let bindingClass2 = '.sec_' + (lastSectionIndex - 1) + '_q_' + index + '';
        if (jQuery('.inline-temp').length > 0 || jQuery('.inline-temp-new').length > 0) {
          bindingClass2 = '.sec_' + (lastSectionIndex - 1);
        }
        let that: any = this;
        setTimeout(function () { that.scrollIt(bindingClass2); }, 50);
        self.toastNotificationWithFormulaCheck('New Question added Successfully.');
        /** select the new added item */
        /* animation */
        self.jsonBuilderHelper.debounce(self.jsonBuilderHelper.animLoad(), 1800);
        // self.questions.push(newItem);
      },
      (error: any) => {

      }
    );
    self.addDropdown();
  }
  getQuestionSections(page: Page, section: any) {
    if (section && section.type === 'CustomHtml') return false;
    let sections = page.sections.filter(x => ['LeadFormQ', 'CustomHtml'].indexOf(x.type) < 0);
    return !(sections.length > 1);
  }
  addNewQuestion(event?: any) {
    jQuery('.template-section.og-loader').addClass('add-del-overlay');
    this.stopPropagation(event);
    /* select default questionaire page on click */
    this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getJSONBuilt().pages[1]);

    let self = this;
    let item: Item;
    let templateName: string = this.jsonBuilderHelper.getJSONBuilt().template;
    let appType: string = this.jsonBuilderHelper.getJSONBuilt().templateType;
    if (templateName.split('-', 2).join('-') !== 'inline-temp') {
      if (appType === 'Recommendation' || appType === 'Poll') {
        item = new Item('radio_button', 'New Question', 'Default Question Help Text', 'Question Placeholder');
        if (appType === 'Poll')
          item.options[0].value = 'poll_' + (Math.floor((Math.random() * 10000000) + 1)) + Date.now();
      } else {
        item = new Item('checkbox', 'New Question', 'Default Question Help Text', 'Question Placeholder');
      }
    } else {
      if (appType === 'Recommendation') {
        item = new Item('selectbox', 'New Question', 'Default Question Help Text', 'Question Placeholder');
      } else {
        item = new Item('textfield', 'New Question', 'Default Question Help Text', 'Question Placeholder');
      }
    }
    if (templateName == 'template-seven') {
      item = new Item('textfield', 'New Question', 'Default Question Help Text', 'Question Placeholder');
    }
    if (templateName === 'template-six' || templateName === 'template-eight') {
      item.imageURL = 'https://cdn.filestackcontent.com/m5ovgp6OTaGFDRFk8dRJ';
      item.options[0].imageURL = 'https://cdn.filestackcontent.com/m5ovgp6OTaGFDRFk8dRJ';
    }
    let lastSectionIndex = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections.length;
    let type = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1].type;
    if (type === 'LeadFormQ') {
      lastSectionIndex = this.determineCustomHtml(this.jsonBuilderHelper.getJSONBuilt().pages[1].sections);
    } else if (type === 'CustomHtml') {
      lastSectionIndex = this.determineCustomHtml(this.jsonBuilderHelper.getJSONBuilt().pages[1].sections);
    }
    let secId = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1]._id;
    let index = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1].items.length;
    let slide_index = this.jsonBuilderHelper.getQuestionsList().length;
    jQuery('.editor-page-divider.slide_' + (slide_index - 1)).addClass('new-item-animation');
    /* Animation Init */
    self.jsonBuilderHelper.animInit();

    if (this.jsonBuilderHelper.isTempType(['Ecom']))
      item.options.map((opt) => opt.value = 0);
    this._builderService.addItem(secId, item, index + 1).subscribe(
      (response: any) => {
        let newItem = new Item().deserialize(response);
        self.jsonBuilderHelper.addNewQuestion(newItem, lastSectionIndex);
        self.jsonBuilderHelper.updateGradedFormula();

        jQuery('.template-section.og-loader').removeClass('add-del-overlay');
        // select on add of ques
        this.jsonBuilderHelper.setSelectedModel('Control');
        this.jsonBuilderHelper.setSelectedSection(this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1]);
        this.jsonBuilderHelper.setSelectedControl(newItem);
        let bclasss = "#" + this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1]._id;
        //scroll to newly added ques
        let bindingClass2 = '.sec_' + (lastSectionIndex - 1) + '_q_' + index + '';
        if (jQuery('.inline-temp').length > 0 || jQuery('.inline-temp-new').length > 0) {
          bindingClass2 = '.sec_' + (lastSectionIndex - 1);
        }
        let that: any = this;
        setTimeout(function () { that.scrollIt(bindingClass2); }, 50);
        self.toastNotificationWithFormulaCheck('New Question added Successfully.');
        /** select the new added item */
        /* animation */
        self.jsonBuilderHelper.debounce(self.jsonBuilderHelper.animLoad(), 1800);
        // self.questions.push(newItem);
      },
      (error: any) => {

      }
    );
    self.addDropdown();
  }
  determineCustomHtml(sections: any[]) {
    let count = 1;
    for (let i = sections.length - 2; i >= 0; i--) {
      if (sections[i].type === 'CustomHtml') {
        count++;
      } else {
        return sections.length - count;
      }
    }
  }
  addNewSection(param?: string, ev?: any) {
    let self = this, item: any, section: any;
    if (param === 'customHtml' && !this._featureAuthService.features.custom_html.active) {
      ev.stopPropagation();
      ev.preventDefault();
      this.featureforCustomHTML();
      return;
    }
    jQuery('.template-section.og-loader').addClass('add-del-overlay');
    if (param === 'customHtml') {
      [item, section] = this.getHTMLSection();
    } else {
      section = new Section('New Section', 'This is Description of new section', 'Please add help text.');
      section.setVisibilityOfShowDesc(false);
      let templateName: string = this.jsonBuilderHelper.getJSONBuilt().template;
      let appType: string = this.jsonBuilderHelper.getJSONBuilt().templateType;
      if (templateName.split('-', 2).join('-') !== 'inline-temp') {
        if (appType === 'Recommendation' || appType === 'Poll') {
          item = new Item('radio_button', 'New Question', 'Default Question Help Text', 'Question Placeholder');
          if (appType === 'Poll')
            item.options[0].value = 'poll_' + (Math.floor((Math.random() * 10000000) + 1)) + Date.now();
        } else {
          item = new Item('checkbox', 'New Question', 'Default Question Help Text', 'Question Placeholder');
        }
      } else {
        if (appType === 'Recommendation') {
          item = new Item('selectbox', 'New Question', 'Default Question Help Text', 'Question Placeholder');
        } else {
          item = new Item('textfield', 'New Question', 'Default Question Help Text', 'Question Placeholder');
        }
      }
      if (templateName == 'template-seven') {
        item = new Item('textfield', 'New Question', 'Default Question Help Text', 'Question Placeholder');
      }
    }
    console.log('section', section);
    /* Animation Init */
    self.jsonBuilderHelper.animInit();
    this._builderService.addSection(section, item, this.jsonBuilderHelper.getPage('Questionnaire')._id).subscribe(
      (response: any) => {
        jQuery('.template-section.og-loader').removeClass('add-del-overlay');
        response[1] = new Item().deserialize(response[1]);
        let newsection = new Section().deserialize(response[0]);
        self.jsonBuilderHelper.addNewSection(response[0], response[1]);
        let lastSectionIndex = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections.length;
        if (this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1].type === 'LeadFormQ') {
          lastSectionIndex = lastSectionIndex - 1;
        }
        let bindingClass1: any = '.sec_' + (lastSectionIndex - 1);
        if (param === 'customHtml' && (['template-six', 'one-page-card', 'one-page-card-new', 'one-page-card-new', 'one-page-card-oldresult', 'template-eight'].indexOf(this.tempName) >= 0)) {
          this.jsonBuilderHelper.setSelectedModel('Control');
          this.jsonBuilderHelper.setSelectedControl(this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1].items[0]);
          bindingClass1 = '.sec_' + (lastSectionIndex - 1) + '_q_0';
        }
        else {
          this.jsonBuilderHelper.setSelectedModel('Section');
          this.jsonBuilderHelper.setSelectedSection(this.jsonBuilderHelper.getJSONBuilt().pages[1].sections[lastSectionIndex - 1]);
        }
        setTimeout(function () {
          self.initializeSectionSorting();
          self.initialize();
          self.scrollIt(bindingClass1);
          jQuery('.editor-page-divider.sec_' + (lastSectionIndex - 1)).addClass('new-item-animation');
        }, 100);
        self.toastNotificationWithFormulaCheck('New Section added Successfully.');
        /* animation */
        self.jsonBuilderHelper.debounce(self.jsonBuilderHelper.animLoad(), 1800);

      },

      (error: any) => {
        //
        //  console.log("error", error);
      }
    );
    // this.panelHeightUpdate('addSection');
    self.addDropdown();
  }
  // panelHeightUpdate(action: string) {
  //   switch (action) {
  //     case "addSection":
  //       this.pnHeight = this.pnHeight + 54;
  //       break;
  //     case "deleteSection":
  //       this.pnHeight = this.pnHeight - 54;
  //       break;
  //     case "addQuestion":
  //       this.pnHeight = this.pnHeight + 18;
  //       break;
  //     case "addControl":
  //       this.pnHeight = this.pnHeight + 18;
  //       break;
  //     case "deleteQuestion":
  //       this.pnHeight = this.pnHeight - 18;
  //       break;
  //   }
  // }
  getHTMLSection() {
    let section = new Section('CustomHtml', 'customHtml', 'This is Description of CustomHtml section');
    let item = new Item('custom_html', 'Custom Html');
    item.setCurrentValue("<html><h1>You can</h1> <p style='color:blue;'>add custom</p> <a href='javascript:void(0)'> HTML here.</a> <html>");
    return [item, section];
  }
  callGA(opt: string) {
    switch (opt) {
      case "ADDSECTION":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'AddSection');
        // _kmq.push(['record', 'Builder Add Section Click']);
        break;
      case "DELETESECTION":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'DeleteSection');
        // _kmq.push(['record', 'Builder Delete Section Click']);
        break;
      case "ADDQUESTION":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'AddQuestion');
        // _kmq.push(['record', 'Builder Add Question Click']);
        break;
      case "DUPLICATEQUESTION":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'DuplicateQuestion');
        // _kmq.push(['record', 'Builder Duplicate Question Click']);
        break;
      case "DELETEQUESTION":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'DeleteQuestion');
        // _kmq.push(['record', 'Builder Delete Question Click']);
        break;
    }
  }

  visibilityEye(page: Page) {
    page.visible = !page.visible;
    if (!page.visible) {
      this.jsonBuilderHelper.setSelectedModel('Page');
      this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getJSONBuilt().pages[1]);
    }
  }

  openLogicPopup() {
    if (this._featureAuthService.features.logic_jump.active)
      jQuery('#logic-jump').modal('toggle');
    else {
      this._featureAuthService.setSelectedFeature("logic_jump", null);
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('.modal-backdrop').addClass('added');
    }

  }
  featureforCustomHTML() {
    this._featureAuthService.setSelectedFeature("custom_html", null);
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
    jQuery('.modal-backdrop').addClass('added');
    // return;
  }
  getSectionsList() {
    return this.jsonBuilderHelper.getJSONBuilt().pages[1].sections.filter(s => (['CustomHtml', 'LeadFormQ'].indexOf(s.type) < 0));
  }

  findLeadform(postorder) {
    let leadform = this.jsonBuilderHelper.getJSONBuilt().pages[1].sections.find(s => s.type == 'LeadFormQ');
    if (postorder.indexOf(leadform._id) < 0) {
      postorder.push(leadform._id);
    }
    return postorder;
  }

  getTemplateQuestionareWithEmittedLeadFormQuestion(): Item[] {
    //First Updates the questionare list and then returns
    let templateQuestionareWithEmittedLeadFormQuestion = [];
    for (var page of this.templateJson.pages) {
      if (page.type === 'Questionnaire') {
        for (var section of page.sections) {
          for (var item of section.items) {
            if (['leadform_question', 'custom_html'].indexOf(item.type) < 0)
              templateQuestionareWithEmittedLeadFormQuestion.push(item);
          }
        }
      }
    }
    return templateQuestionareWithEmittedLeadFormQuestion;
  }

  getResultLead() {
    return this.jsonBuilderHelper.getPage('Result').sections.find(sec => sec.type == 'LeadForm');
  }

  getResultLeadControl() {
    return this.getResultLead().items.find(it => it.type == 'leadform');
  }

  selectLeadPopup(ev: any) {
    ev.stopPropagation();
    ev.preventDefault();
    this.jsonBuilderHelper.setSelectedModel('Section');
    this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getPage('Result'));
    this.jsonBuilderHelper.setSelectedSection(this.getResultLead())
    this.jsonBuilderHelper.setSelectedControl(this.getResultLeadControl())
    if (!this.jsonBuilderHelper.getJSONBuilt().pages[0].visible)
      this.scrollIt('.page_1')
    else
      this.scrollIt('.page_2')
  }

}
