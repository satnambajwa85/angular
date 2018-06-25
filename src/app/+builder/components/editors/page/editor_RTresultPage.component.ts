import { Component, OnInit, ViewEncapsulation, OnChanges, Input } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { BuilderService } from '../../../services/builder.service';
import { FeatureAuthService } from '../../../../../shared/services/feature-access.service';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;
@Component({
  selector: 'editor_RT_result_page',
  templateUrl: './assets/html/editor_RTresultPage.html',
  encapsulation: ViewEncapsulation.None,
})
export class EditorRTResultPage implements OnInit, OnChanges {
  @Input() page: any;
  leadSection: any;
  Sectionindex: number;
  tempName: string;
  public isRealTimeResult: Boolean = false;
  public isLeadGenAvailable: Boolean = false;
  constructor(public jsonBuilderHandler: JSONBuilder,
    public _builderService: BuilderService,
    public _featureAuthService: FeatureAuthService,
    public _ItemTrackService: JSONItemTracker
  ) {
    this.tempName = jsonBuilderHandler.getJSONBuilt().template.split('-',2).join('-');
  }
  changeVisibility() {
    let self: any = this;
    //hide other leadform
    if (this.isLeadGenAvailable) {
      this.leadSection.visible = !this.leadSection.visible;
      this.leadSection.items[0].visible = !this.leadSection.items[0].visible;
      if (this.leadSection.visible && this.leadSection.items[0].visible) {
        this.jsonBuilderHandler.hideOtherLeadForm1();
        this.jsonBuilderHandler.setSelectedModel('Section');
        this.jsonBuilderHandler.setSelectedPage(this.page);
        this.jsonBuilderHandler.setSelectedSection(this.leadSection);
        setTimeout(function () {
          self.scrollIt('.sec_' + (self.jsonBuilderHandler.getJSONBuilt().pages[1].sections.length - 1), 'Questionnaire');
        }, 100);
      }
    } else {
      this._featureAuthService.setSelectedFeature('lead_generation');
      jQuery('.lead_generation').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }
  ngOnInit() {
    for (let section in this.page.sections) {
      if (this.page.sections[section].type === 'LeadFormQ') {
        this.leadSection = this.page.sections[section];
      }
    }
    this.Sectionindex = jQuery.inArray(this.leadSection, this.page.sections);
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedPage(this.page);
    this.isRealTimeResult = this._featureAuthService.features.real_time_results.active;
    this.isLeadGenAvailable = this._featureAuthService.features.lead_generation.active;

  }
  scrollIt(bindingClass1: string, innerText?: string) {
    if (jQuery(bindingClass1).length) {
      var position = 0;
      var templateHeight = 0;
      var zoomFactor = 1;
      var topVal = 0;

      if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        var tHeight = -30;
      }
      else {
        zoomFactor = jQuery('temp-dev').css('zoom');
        tHeight = 146;
      }
      if (jQuery('.sound-cloud').length > 0) {
        // for template sound-cloud
        jQuery('.sound-cloud').addClass('template2');

        if (innerText && innerText === 'Landing') {
          templateHeight = -jQuery(bindingClass1).position().top;
        }
        else if (innerText && (innerText === 'Questionnaire' || innerText === 'Result')) {
          templateHeight = jQuery('.template2').height();
        }
        else {
          templateHeight = jQuery('.template2').height() + tHeight;

        }
        // console.log(templateHeight);
        position = jQuery(bindingClass1).position().top + templateHeight;
        //console.log('position', position);
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
      else if (jQuery('.one-page-slider').length > 0 || jQuery('.one-page-card').length > 0 || jQuery('.one-page-card-new').length > 0 || jQuery('.one-page-card-oldresult').length > 0) {
        // get postiion of div
        position = jQuery(bindingClass1).position().top;
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
    }
  }
  ngOnChanges() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedPage(this.page);
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
    }
  }

  callGA(opt: string) {
    switch (opt) {
      case "SHOWLEADFORMTOGGLE":
        if (this.leadSection.visible) {
          ga('markettingteam.send', 'event', 'Settings', 'Toggle', 'ShowLeadFormToggleOn');
          // _kmq.push(['record', 'Builder Show Leadform Toggle On']);
        }
        else {
          ga('markettingteam.send', 'event', 'Settings', 'Toggle', 'ShowLeadFormToggleOff');
          // _kmq.push(['record', 'Builder Show Leadform Toggle Off']);
        }
        break;
      case "SHOWLEADFORMLASTTOGGLE":
        ga('markettingteam.send', 'event', 'Settings', 'Click', 'ShowLeadFormToggle');
        // _kmq.push(['record', 'Builder Show Lead Form in Last Click']);
        break;
      case "REALTIMECHANGE":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ShowResultInReal');
        // _kmq.push(['record', 'Builder Show Result in Realtime Click']);
        break;
    }
  }

}
