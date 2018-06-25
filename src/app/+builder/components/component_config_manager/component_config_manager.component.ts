import { Component, AfterViewInit, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FeatureAuthService } from '../../../../shared/services/feature-access.service';
import { JSONBuilder } from '../../services/JSONBuilder.service';
declare var jQuery: any;

@Component({
  selector: 'component-manager-config',
  templateUrl: './component_config_manager.template.html',
  styleUrls: ['./../assets/css/leftList.style.css'],

})

export class ComponentConfigManagerComponent implements AfterViewInit, OnInit {
  templateJson: any;
  isIntegerationAvailable: boolean = false;
  isEmbeddCodeAvailable: boolean = false;
  isConfirmationEmailAvailable: boolean = false;
  isWebhookAvailable: boolean = false;
  isCustomJSAvailable: boolean = false;
  isCustomCSSAvailable: boolean = false;
  inLaunchEmailAvailable: boolean = false;
  ConfigArray: any[] = ['settings', 'integrations', 'email', 'share-your-calculator', 'launch-popup', 'embedded-code', 'logic-jump', 'customJS', 'webhook'];

  @Input() selected: any = 'settings';
  @Output() selection = new EventEmitter();
  constructor(public _featureAuthService: FeatureAuthService, public jsonBuilderHelper: JSONBuilder) { }

  ngOnInit() {
    this.isIntegerationAvailable = <boolean>this._featureAuthService.features.integrations.active;
    this.isEmbeddCodeAvailable = <boolean>this._featureAuthService.features.embedding.active;
    this.isConfirmationEmailAvailable = <boolean>this._featureAuthService.features.confirmation_emails.active;
    this.isWebhookAvailable = <boolean>this._featureAuthService.features.integrations['webhook'];
    this.isCustomJSAvailable = <boolean>this._featureAuthService.features.custom_script.active;
    this.isCustomCSSAvailable = <boolean>this._featureAuthService.features.custom_style.active;
    this.inLaunchEmailAvailable = <boolean>this._featureAuthService.features.launch_in_email.active;
    this.jsonBuilderHelper.view_embeded_tab.subscribe(data => {
      if (data) {
        this.embeddingClick(data);
        this.jsonBuilderHelper.view_embeded_tab.next(null);
      }
    })
    /*if (jQuery.inArray(localStorage.getItem('hash-link'), this.ConfigArray) != -1) {
      this.selected = localStorage.getItem('hash-link');
      jQuery('#config-' + this.selected).click();
    }*/
    //this.selection.emit(this.selected);
  }

  ngAfterViewInit() { }

  integrationClick(event: any) {
    // this.isIntegerationAvailable = <boolean>this._featureAuthService.features.integrations.active;
    this.isIntegerationAvailable = true;
    if (this.isIntegerationAvailable) {
      this.selected = 'integrations';
      this.selection.emit('integrations');
    }
    else {
      this._featureAuthService.setSelectedFeature('integrations');
      jQuery('.integrations').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      this.selected = 'settings';
      this.selection.emit('settings');
    }
  }

  embeddingClick(event: any) {
    this.isEmbeddCodeAvailable = <boolean>this._featureAuthService.features.embedding.active;
    if (this.isEmbeddCodeAvailable) {
      this.selected = 'embedded-code';
      this.selection.emit('embedded-code');
    }
    else {
      this._featureAuthService.setSelectedFeature('embedding');
      jQuery('.embedding').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      // this.selected = 'settings';
      // this.selection.emit('settings');
    }
  }
  webhookSettingClick(event: any) {
    this.isWebhookAvailable = <boolean>this._featureAuthService.features.integrations['webhook'];
    if (this.isWebhookAvailable) {
      this.selected = 'webhook';
      this.selection.emit('webhook');
    } else {
      this._featureAuthService.setSelectedFeature('integrations', 'webhook');
      jQuery('.integrations').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }
  confirmationEmailClick(event: any) {
    this.isConfirmationEmailAvailable = <boolean>this._featureAuthService.features.confirmation_emails.active;
    // if (this.isConfirmationEmailAvailable) {
    this.selected = 'email';
    this.selection.emit('email');

    // }
    // else {
    //   this._featureAuthService.setSelectedFeature('confirmation_emails');
    //   jQuery('.confirmation_emails').addClass('activegreen limited-label');
    //   jQuery('#premiumModal').modal('show');
    //   jQuery('.modal-backdrop').insertAfter('#premiumModal');
    // this.selected = 'settings';
    // this.selection.emit('settings');
    // }
  }

  promotionChecklistClick(event: any) {
    this.selected = 'promotion-checklist';
    this.selection.emit('promotion-checklist');
  }

  customJS(event: any) {
    this.isCustomJSAvailable = <boolean>this._featureAuthService.features.custom_script.active;
    console.log("isCustomJSAvailable", this.isCustomJSAvailable);
    if (this.isCustomJSAvailable) {
      this.selected = 'customJS';
      this.selection.emit('customJS');
    }
    else {
      jQuery('div:not(#premiumModal)').modal('hide');
      this._featureAuthService.setSelectedFeature('custom_script');
      jQuery('.integrations').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('#analyticsRef').attr('active', false);
    }

  }

  customCSS(event: any) {
    this.isCustomCSSAvailable = <boolean>this._featureAuthService.features.custom_style.active;
    if (this.isCustomCSSAvailable) {
      this.selected = 'customCSS';
      this.selection.emit('customCSS');
    } else {
      jQuery('div:not(#premiumModal)').modal('hide');
      this._featureAuthService.setSelectedFeature('custom_style');
      jQuery('.integrations').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('#analyticsRef').attr('active', false);
    }
  }

  launchEmail(event: any) {
    this.inLaunchEmailAvailable = <boolean>this._featureAuthService.features.launch_in_email.active;
    if (this.inLaunchEmailAvailable) {
      this.selected = 'opinion-email';
      this.selection.emit('opinion-email');
    } else {
      jQuery('div:not(#premiumModal)').modal('hide');
      this._featureAuthService.setSelectedFeature('launch_in_email');
      jQuery('.integrations').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('#analyticsRef').attr('active', false);
    }
  }

  logicalJumpClick() {
    this.selected = 'logic-jump';
    this.selection.emit('logic-jump');

  }

  onSelect(comp: string) {
    //window.location.hash = '#'+comp;
    this.selected = comp;
    this.selection.emit(comp);
  }

}

