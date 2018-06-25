import { Component, Input, ViewEncapsulation, OnInit } from '@angular/core';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { FeatureAuthService } from '../../../../../../shared/services/feature-access.service';
import { FroalaService } from './../../../../services/froala.service';

declare var jQuery: any;
declare var window: any;
@Component({
  selector: 'selectize',
  templateUrl: './selectize.template.html',
  encapsulation: ViewEncapsulation.None
})

export class Selectize implements OnInit {
  @Input() field: any;
  @Input() control: any;
  @Input() index: any;
  templateName: string;
  froalaCheckbox: any = {};
  constructor(public _JSONBuilder: JSONBuilder, public _featureAuthService: FeatureAuthService, public _froalaEditor: FroalaService) {
  }

  ngOnInit() {
    this._JSONBuilder.uniqueNameGenerator(this.control);
    this.templateName = this._JSONBuilder.getJSONBuilt().template;
    this.initializeFroalaEditor();
  }
  emailValidationToggle(ev: any) {
    if (this._featureAuthService.features.lead_generation.email_check) {
      this.field.emailValidator = !(this.field.emailValidator);
      this._JSONBuilder.updateOtherLeadFormFields(this.control);
    }
    else {
      if (this.field.emailValidator) {
        this.field.emailValidator = false;
        this._JSONBuilder.updateOtherLeadFormFields(this.control);
      } else ev.preventDefault();
      jQuery('div:not(#premiumModal)').modal('hide');
      this._featureAuthService.setSelectedFeature('lead_generation', 'email_check');
      jQuery('.integrations').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('#analyticsRef').attr('active', false);
    }

  }
  changed($event: any, field: any) {
    let type = $event.target.value;
    let oldType = field.subType;
    // Remove Selectize if Old Type Dropdown
    if (oldType === 'dropdown') {
      jQuery('#' + field.key).selectize()[0].selectize.destroy();
      jQuery('#' + field.key).parent().find('.selectize-control').remove();
    }
    field.type = type;
    // Rest Processing
    field.value = '';
    field.subType = '';
    if (this._JSONBuilder.getJSONBuilt().template.split('-', 3).join('-') == 'one-page-card' ||
      this._JSONBuilder.getJSONBuilt().template.split('-', 2).join('-') == 'sound-cloud') {
      if (type === 'firstName') {
        field.name = 'First Name';
        field.placeholder = 'First Name';
      } else if (type === 'lastName') {
        field.name = 'Last Name';
        field.placeholder = 'Last Name';
      } else if (type === 'fullName') {
        field.name = 'Full Name';
        field.placeholder = 'Name';
      } else if (type === 'email') {
        field.name = 'Email';
        field.placeholder = 'Email';
      } else if (type === 'tel') {
        field.name = 'Phone Number';
        field.placeholder = 'Phone Number';
      } else if (type === 'tel_us') {
        field.name = 'Phone Number(US)';
        field.placeholder = 'Phone Number(US)';
      } else if (type === 'others') {
        field.name = 'Others';
        field.placeholder = 'Others';
        field.subType = 'others';
      }
    } else {
      if (type === 'firstName') {
        field.name = 'First Name';
        field.placeholder = 'John';
      } else if (type === 'lastName') {
        field.name = 'Last Name';
        field.placeholder = 'Doe';
      } else if (type === 'fullName') {
        field.name = 'Full Name';
        field.placeholder = 'John Doe';
      } else if (type === 'email') {
        field.name = 'Email';
        field.placeholder = 'John@outgrow.co';
      } else if (type === 'tel') {
        field.name = 'Phone Number';
        field.placeholder = '312-917-8106';
      } else if (type === 'tel_us') {
        field.name = 'Phone Number(US)';
        field.placeholder = 'Phone Number(US)';
      } else if (type === 'others') {
        field.name = 'Others';
        field.placeholder = 'Others';
        field.subType = 'others';
      }
    }
    this._JSONBuilder.uniqueNameGenerator(this.control);
    this._JSONBuilder.updateOtherLeadFormFields(this.control);
    this._JSONBuilder.commonEmitter.emit({ type: 'leadchanges' });
  }
  checked(field: any, ev: any) {
    if (ev.target.checked) {
      field.attr.class = 'true';
    } else {
      field.attr.class = 'false';
    }
    this._JSONBuilder.commonEmitter.emit({ type: 'leadchanges' });
    this._JSONBuilder.updateOtherLeadFormFields(this.control);
  }
  changedSubType(event, field) {
    let subType = event.target.value;
    let oldType = field.subType;
    // Remove Selectize if Old Type Dropdown
    if (oldType === 'dropdown') {
      jQuery('#' + field.key)[0].selectize.destroy();
      jQuery('#' + field.key).parent().find('.selectize-control').remove();
    }
    field.subType = subType;
    // Rest Processing
    if (subType === 'others') {
      field.name = 'Others';
      field.placeholder = 'Others';
    } else if (subType === 'checkbox') {
      field.name = 'Checkbox';
      field.placeholder = 'Checkbox';
      this._JSONBuilder.commonEmitter.emit({ type: 'leadchanges' });
    } else if (subType === 'dropdown') {
      field.name = 'Dropdown';
      field.placeholder = 'Dropdown';
      this._JSONBuilder.commonEmitter.emit({ type: 'leadchanges' });
      setTimeout(function () {
        jQuery('#' + field.key).selectize({
          //options: [{ 'label': 'Default Option', 'value': 'Default Option' }],
          allowEmptyOption: true,
          labelField: 'label',
          placeholder: field.placeholder
        });
        // jQuery('#' + field.key)[0].selectize.setValue('Default Option');
        // jQuery('.selectize-input input').prop('disabled', true);
        if (jQuery(window).width() < 768) {
          jQuery('.selectize-input input').prop('disabled', true);
        }
      }, 50);
    }
    this._JSONBuilder.updateOtherLeadFormFields(this.control);
  }



  placeholderChange(field) {
    if (field.subType === 'dropdown') {
      jQuery('#' + field.key)[0].selectize.settings.placeholder = field.placeholder;
      jQuery('#' + field.key)[0].selectize.updatePlaceholder();
    }
    this._JSONBuilder.updateOtherLeadFormFields(this.control);
  }

  checkGDPR() {
    return this.field.icon === 'GDPR';
  }

  restrictingPhoneNumber(ev, field) {
    let val1 = ev.target.value.trim();
    if (val1 != '') {
      if (Number(val1) > 15) {
        val1 = 15;
      }
      else if (Number(val1) < 6) {
        val1 = 6;
      }
    }
    field.icon = val1;
    this._JSONBuilder.commonEmitter.emit({ type: 'leadchanges' });
  }

  initializeFroalaEditor() {
    this.froalaCheckbox.options = false;
    setTimeout(() => {
      this.froalaCheckbox.options = this._froalaEditor.getOptions({ handler: this.froalaCheckbox, isAddVariable: false, onlyInserLink: true });
    });
  }
}
