import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Section, Page, App, Item } from '@builder/models';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { FeatureAuthService } from '../../../../../shared/services/feature-access.service';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;
@Component({
  selector: 'editor-lead-form',
  encapsulation: ViewEncapsulation.None,
  template: `
        <div>
          <section class="type-details-head">
            <span class="type-details-icon"><i class="material-icons"></i></span>
            <span class="type-details-heading">LEAD GENERATION:</span>
            <div class="help-tip editor-helptip">
              <i class="material-icons">info_outline</i>
              <div class="help-checktip">Toggle here to collect user information (name, email etc) along with the
                  <span *ngIf="jsonBuilderHelper.getSelectedPage().type!=='Landing'"> {{jsonBuilderHelper.getSelectedPage().type }}</span>
                  <span *ngIf="jsonBuilderHelper.getSelectedPage().type==='Landing'"> Welcome Screen</span>.
              </div>
            </div>
            <div class="switch" [class.alwaysOff]="!isLeadAccessible">
                  <label>
                      <input id="lead_gen_control"
                              type="checkbox"
                              (change)="toggleLeadform($event);callGA('LEADGENTOGGLE')"
                              [checked]="leadform.visible">
                      <span class="lever"></span>
                  </label>
            </div>
          </section>
          <section class="type-details-components">
            <div class="type-details" *ngIf="!leadform.visible">
              <span class="editor-helptext no-margin">
                    Lead Generation is Off.
              </span>
            </div>
            <div class="type-details" *ngIf="jsonBuilderHelper.getOtherVisibleLeadForm() &&
                  jsonBuilderHelper.getOtherVisibleLeadForm() !==jsonBuilderHelper.getSelectedPage().type">
              <span class="editor-helptext no-margin">
                  Please note that you are currently collecting leads on the
                  <i> {{ jsonBuilderHelper.getOtherVisibleLeadForm() }} Page</i>.
                  If you wish to collect leads here instead, Toggle here to override.
              </span>
            </div>
            <div *ngIf="leadform.visible">
            <div class="type-details"  *ngIf="jsonBuilderHelper.getSelectedPage().type==='Result'">
              <div class="form-label"> Title:</div>
              <input class="detail-text" type="text" *ngIf="leadform.visible && jsonBuilderHelper.getSelectedPage().type==='Result'"
                [(ngModel)]="jsonBuilderHelper.getJSONBuilt().pages[2].sections[2].title">
            </div>
            <div class="div-check type-details">
            <div *ngFor="let field of leadform.fields ; let i = index"> 
              <div class="lead-gen">
                <selectize [field]="field" [index] = "i"></selectize>
                <!-- More button -->
                <div class="btn-group icon-options">
                  <button type="button" class="btn btn-default dropdown-toggle"
                          data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  <i class="material-icons" style="margin-top: 12px;">more_vert</i>
                  </button>
                  <ul class="dropdown-menu">
                    <li><a href="javascript:void(0);"
                      *ngIf = "!field.validations.required.status"
                      (click)="toggleRequired(field);callGA('SETMANDATE')">
                      <i class="material-icons">done_all</i> Require</a>
                    </li>
                    <li>
                      <a href="javascript:void(0);"
                      *ngIf = "field.validations.required.status" (click)="toggleRequired(field);callGA('UNSETMANDATE')">
                      <i class="material-icons">not_interested</i> Don't Require</a>
                    </li>
                    <li>
                      <a href="javascript:void(0);" class="form-leadform-icon"
                      (click)="delete_Field_From_LeadForm(i);callGA('DeleteLeadGenField')">
                      <i class="material-icons">clear</i> Delete</a>
                    </li>
                  </ul>
                </div>
              </div>
              <hr class="radio-last-hr">
              </div>
              <div [class.hide]="leadform.fields.length>=4">
                <a  href="javascript:void(0);"
                    (click)="add_Field_In_LeadForm();callGA('ADDLEADFIELD')"
                    class="default add_field_button">Add a Field
                </a>
              </div>
            </div>

          </div>
          <div class="type-details has-content">
              <div class="form-label"> Location:</div>
              <select
                class="select-default"
                (change)="onChange($event)"
                data-width="fit"
                class="form-control"
              >
                <option  value="Landing" [selected] = "jsonBuilderHelper.getSelectedPage().type ==='Landing'">Welcome screen</option>
                <!--<option  value="Questionnaire" [selected] = "jsonBuilderHelper.getSelectedPage().type ==='Questionnaire' && _JSONBuilder.getSelectedPage().sections[0].type === 'LeadFormQ'">Before Questions</option>-->
                <option *ngIf="jsonBuilderHelper.getJSONBuilt().template !=='sound-cloud'" value="Questionnaire" [selected] = "jsonBuilderHelper.getSelectedPage().type ==='Questionnaire' && jsonBuilderHelper.getSelectedPage().sections[0].type !== 'LeadFormQ'">After Questions</option>
                <option  value="Result" [selected] = "jsonBuilderHelper.getSelectedPage().type ==='Result'">Results Page</option>
              </select>
            </div>
          </section>
      </div>
    `
})

export class EditorLeadForm implements OnInit {
  @Input() control: any;
  @Input() leadsection: any;
  isLeadAccessible: Boolean = false;
  leadform: any;
  types: any = ['firstName', 'email', 'tel', 'lastName', 'tel_us'];
  constructor(public jsonBuilderHelper: JSONBuilder,
    public _featureAuthService: FeatureAuthService) {
  }

  ngOnInit() {
    this.leadform = this.control.leadform;
    this.isLeadAccessible = this._featureAuthService.features.lead_generation.active;
    jQuery("#lead_gen_control").stop();
  }
  toggleRequired(field: any) {
    field.validations.required.status = !field.validations.required.status;
    this.jsonBuilderHelper.setChanged(true);
  }
  add_Field_In_LeadForm() {
    let item = new Item;
    let length = this.leadform.fields.length - 1;
    if (this.leadform.fields[length].icon === 'GDPR') {
      this.leadform.fields.splice(length, 0, item.getField());
    } else {
      this.leadform.fields.push(item.getField());
    }
  }

  toggleLeadform(event: any) {
    if (this.isLeadAccessible) {
      this.leadform.visible = !this.leadform.visible;
      if (this.leadform.visible) {
        this.jsonBuilderHelper.hideOtherLeadForm1();
      }
      this.control.click_button.visible
        ? this.control.leadform.props.title = this.control.click_button.props.title
        : this.control.click_button.props.title = this.control.leadform.props.title;
      if (this.control.click_button)
        this.control.click_button.visible = !this.control.click_button.visible;
    } else {
      event.preventDefault();
      this._featureAuthService.setSelectedFeature('lead_generation');
      jQuery('.lead_generation').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      this.leadform.visible = false;
      this.control.click_button.visible = true;
    }
  }

  delete_Field_From_LeadForm(index: any) {
    this.leadform.fields.splice(index, 1);
  }

  callGA(opt: string) {
    switch (opt) {
      case "LEADGENTOGGLE":
        if (this.leadform.visible) {
          ga('markettingteam.send', 'event', 'Settings', 'Toggle', 'LeadGenerationToggleOn');
          // _kmq.push(['record', 'Builder Lead Gen Toggle Set On']);
        }
        else {
          ga('markettingteam.send', 'event', 'Settings', 'Toggle', 'LeadGenerationToggleOff');
          // _kmq.push(['record', 'Builder Lead Gen Toggle Set Off']);
        }
        break;
      case "DeleteLeadGenField":
        ga('markettingteam.send', 'event', 'Settings', 'Click', 'DeleteLeadGenField');
        // _kmq.push(['record', 'Builder Delete Lead Gen Field Click']);
        break;
      case "AddNewLeadField":
        ga('markettingteam.send', 'event', 'Settings', 'Click', 'AddNewLeadField');
        // _kmq.push(['record', 'Builder Add New Lead Field Click']);
        break;
      case "SETMANDATE":
        ga('markettingteam.send', 'event', 'Settings', 'Click', 'Set Mandatory');
        // _kmq.push(['record', 'Builder Lead Field Set Mandatory Click']);
        break;
      case "UNSETMANDATE":
        ga('markettingteam.send', 'event', 'Settings', 'Click', 'Unset Mandatory');
        // _kmq.push(['record', 'Builder Lead Field Unset Mandatory Click']);
        break;
    }
  }

  onChange($event: any) {
    jQuery('[ng-reflect-ng-switch= sound-cloud]').addClass('template2');
    let data: any[] = [];
    data = this.jsonBuilderHelper.hideOtherLeadForm($event.target.value, $event.target.selectedIndex);
    //this.editorControl = data[1];
    if ($event.target.value == 'Result' && this.jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation')
      this.jsonBuilderHelper.setSelectedModel('Outcome_Settings');

    if ($event.target.value == 'Questionnaire') {
      this.jsonBuilderHelper.setSelectedModel('Section');
      this.jsonBuilderHelper.setSelectedSection(data[0]);
    }
    this.leadsection = data[0];
    let self: any = this;
    if ($event.target.value === 'Questionnaire') {
      setTimeout(function () {
        // if (jQuery('.one-page-card').length > 0) {
        //    self.scrollIt('.sec_1', $event.target.value);
        // }else {
        self.scrollIt('.sec_' + (self.jsonBuilderHelper.getJSONBuilt().pages[1].sections.length - 1), $event.target.value);
        // }
      }, 50);
    } else if ($event.target.value === 'Landing') {
      this.scrollIt('.page_0', $event.target.value);
    } else {
      setTimeout(function () {
        jQuery('.settings-header').trigger('click');
      }, 50);
      this.scrollIt('.page_2', $event.target.value);
    }
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
      else if (jQuery('.one-page-slider').length > 0 || jQuery('.one-page-card').length > 0) {
        // get postiion of div
        position = jQuery(bindingClass1).position().top;
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
    }
  }
}
