import { environment } from './../../../../../../environments/environment';
import { CompanyService } from './../../../../../shared/services/company.service';
import { SubDomainService } from './../../../../../shared/services/subdomain.service';
import { FroalaService } from './../../../services/froala.service';
import { Component, AfterViewInit, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { FeatureAuthService } from '../../../../../shared/services/feature-access.service';
import { UrlShortner } from '../../../services/UrlShortner.service';
import { JSONElement } from '../../../services/JSONElement.service';
import { ThemingService } from '../../../../templates/services/theming.service';

declare var window: any;
declare var jQuery: any;
declare var ga: any;
declare var filestack: any;
// declare var _kmq: any;
@Component({
  selector: 'editor-page',
  templateUrl: './assets/html/editor_page.html',
  encapsulation: ViewEncapsulation.None,
})

export class EditorPage implements OnInit, AfterViewInit {
  filePickerKey: any = environment.FILE_PICKER_API;
  page: any;
  control: any;
  sectionOrder: any[] = [];
  editorControl: any = {
    header: {},
    sub_header: {},
    click_button: {},
    logo: {},
    leadform: {},
    poweredby: {},
    footer_links: {}
  };
  logo_rect_size: string = 'horz';
  // logo_size: string = 'large-logo';
  headingCount: number = 0;
  subheadingCount: number = 0;
  public isPoweredByAccessible: Boolean = false;
  public isLeadGeneration: Boolean = false;
  public themePalettes: any;
  public HTMLeditor: Boolean = false;
  public froalaHeader: any = {};
  public froalaSubHeader: any = {};
  changeItem: any = '';
  chnageTime: any = 1;
  constructor(
    public jsonBuilderHandler: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public _featureAuthService: FeatureAuthService,
    public _jsonElementService: JSONElement,
    public froalaService: FroalaService,
    public _SubDomainService: SubDomainService,
    public _CompanyService: CompanyService
  ) {
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    this.page = jsonBuilderHandler.getSelectedPage();
    for (let section in this.page.sections) {
      for (let item in this.page.sections[section].items) {
        for (let prop in this.editorControl) {
          if (prop === this.page.sections[section].items[item].type)
            this.editorControl[prop] = this.page.sections[section].items[item];
        }
      }
    }
  }

  onNavigateURLChange($event: any) {
    let url = $event.target.value;
    if (/^(mailto:)/i.test(url)) {
      this.editorControl.logo.config.direction = url;
      return;
    }
    else if (!/^(f|ht)tps?:\/\//i.test(url)) {
      url = "http://" + url;
    }
    this.editorControl.logo.config.direction = url;
  }

  ngOnInit() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedPage(this.page);
    this.isPoweredByAccessible = this._featureAuthService.features.custom_branding.active;
    this.isLeadGeneration = this._featureAuthService.features.lead_generation.active;
    this.HTMLeditor = this._featureAuthService.features.custom_styling.html_editor;
    // get palletes
    this.initWysiwyg();
    this.themePalettes = this._jsonElementService.gettemplatePalettes(this.jsonBuilderHandler.getJSONBuilt().template);
    localStorage.setItem('editor_data', JSON.stringify(this.editorControl));
    localStorage.setItem('chnage_page', '');
  }

  initWysiwyg() {
    this.froalaHeader.options = this.froalaSubHeader.options = false;
    setTimeout(() => {
      this.froalaHeader.options = this.froalaService.getOptions({ handler: this.froalaHeader, isAddVariable: false });
      this.froalaSubHeader.options = this.froalaService.getOptions({ handler: this.froalaSubHeader, isAddVariable: false });
    });
  }

  ngAfterViewInit() {
  }

  toggleLogo(ev: any) {

    this.editorControl.logo.visible = !this.editorControl.logo.visible;
    if (this.editorControl.logo.visible === true) {
      jQuery('.show-check').parents('.type-details').find('.div-check').fadeIn('slow');
      // setTimeout(() => { this.changeSpacing(); }, 100)
    } else {
      jQuery('.show-check').parents('.type-details').find('.div-check').fadeOut('slow');
    }

  }

  togglePoweredBy() {
    if (this.isPoweredByAccessible)
      this.editorControl.poweredby.visible = !this.editorControl.poweredby.visible;
    else {
      this._featureAuthService.setSelectedFeature('custom_branding');
      jQuery('.custom_branding').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      this.editorControl.poweredby.visible = true;
      this.jsonBuilderHandler.getJSONBuilt().poweredby = true;
    }
  }

  toggleSubHeader() {
    this.editorControl.sub_header.visible = !this.editorControl.sub_header.visible;
    let helpText = this.editorControl.sub_header.props.title
    helpText = helpText.replace(/&nbsp;|<\/?p[^>]*>/ig, "").trim();
    if (this.editorControl.sub_header.visible && helpText == "") {
      this.editorControl.sub_header.props.title = "Default sub heading goes here";
    }
  }

  logoReactSize(size: any) {
    // this.logo_rect_size = size;
    this.editorControl.logo.config.attr.logoClass = size;
    setTimeout(() => { this.changeSpacing(); }, 100)
  }
  changeSpacing() {
    //   jQuery(".horz.small-logo").parents('.logo-resizing').addClass("sm").removeClass('l').removeClass('med').removeClass('v-l').removeClass('v-med').removeClass('v-sm');
    //   jQuery(".horz.medium-logo").parents('.logo-resizing').addClass("med").removeClass('l').removeClass('sm').removeClass('v-l').removeClass('v-med').removeClass('v-sm');
    //   jQuery(".horz.large-logo").parents('.logo-resizing').addClass("l").removeClass('med').removeClass('sm').removeClass('v-l').removeClass('v-med').removeClass('v-sm');

    //   jQuery(".vert.small-logo").parents('.logo-resizing').addClass("v-sm").removeClass('v-l').removeClass('v-med').removeClass('l').removeClass('med').removeClass('sm');
    //   jQuery(".vert.medium-logo").parents('.logo-resizing').addClass("v-med").removeClass('v-l').removeClass('v-sm').removeClass('l').removeClass('med').removeClass('sm');
    //   jQuery(".vert.large-logo").parents('.logo-resizing').addClass("v-l").removeClass('v-med').removeClass('v-sm').removeClass('l').removeClass('med').removeClass('sm');
    // 

    jQuery(".vert").parents('.logo-resizing').addClass("v-padding").removeClass("h-padding");
    jQuery(".horz").parents('.logo-resizing').addClass("h-padding").removeClass("v-padding");

  }
  changeVisivility() {
    this.page.visible = !this.page.visible;
    //manual hide question page logo
    if (this.page.visible) {
      if (this.jsonBuilderHandler.getJSONBuilt().template !== 'experian') {
        setTimeout(() => {
          jQuery('.result-branding.page_1').addClass('hide');
          this.scrollIt('.page_0', 'Landing');
        }, 50);
      }
    }
    if (this.jsonBuilderHandler.getJSONBuilt().template.split('-', 2).join('-') === 'inline-temp' || this.jsonBuilderHandler.getJSONBuilt().template.split('-', 2).join('-') === 'template-five') {
      setTimeout(() => {
        jQuery('.t1-result').removeClass('hide');
      }, 50);
    }
  }

  upload(type: string) {
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
      if (type === 'logo') {
        self.updateLogoUrl(s3URL);
        self.editorControl.logo.props.postfix = true;
        self.editorControl.logo.props.title = s3URL;
        self.editorControl.logo.props.unit = result.filesUploaded[0].filename;
      } else {
        self.page.bgImage = s3URL;
        self.page.bgColor = '';
      }
    });
  }
  updateLogoUrl(url: string) {
    let companyId = this._SubDomainService.currentCompany.id;
    this._CompanyService.updateGlobalConfig({ companyId, url }).subscribe((response) => {
      console.log('response', response);
    }, (error) => {
      console.log('global config error', error);
    })
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
        tHeight = 70;
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
        position = jQuery(bindingClass1).position().top + templateHeight;
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
      else if (jQuery('.one-page-slider').length > 0 || jQuery('.one-page-card').length > 0 ||
        jQuery('.one-page-card-new').length > 0 ||
        jQuery('.one-page-card-oldresult').length > 0 ||
        jQuery('.inline-temp').length > 0 ||
        jQuery('.inline-temp').length > 0 ||
        jQuery('.template-six').length > 0 ||
        jQuery('.template-eight').length > 0) {
        // get postiion of div
        templateHeight = jQuery('.editor-page-divider').height();
        if (innerText && ((innerText == 'Landing') || (innerText == 'WELCOME SCREEN With Lead Generation') || (innerText == 'With Lead Generation'))) {
          templateHeight = -jQuery(bindingClass1).position().top;
        }
        else if (innerText && ((innerText === 'Questionnaire') || (innerText === 'Result') || (innerText === 'QUESTIONNAIRE With Lead Generation') || (innerText == 'With Lead Generation'))) {
          templateHeight = 0;
        }
        position = jQuery(bindingClass1).position().top + templateHeight;
        jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
          jQuery('.template-section').clearQueue();
        });
      }
    }
  }

  callGA(opt: string) {
    switch (opt) {
      case "TOGGLELOGO":
        if (this.editorControl.logo.visible === true) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'LogoOn');
          // _kmq.push(['record', 'Builder Logo On Toggle']);
        } else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'LogoOff');
          // _kmq.push(['record', 'Builder Logo Off Toggle']);
        }
        break;
      case "UPLOADLOGO":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'UploadLogo');
        // _kmq.push(['record', 'Builder Upload Logo Click']);
        break;
      case "TOGGLESUB":
        if (this.editorControl.sub_header.visible) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Toggle Sub Heading On');
          // _kmq.push(['record', 'Builder Sub Heading Toggle On']);
        }
        else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Toggle Sub Heading Off');
          // _kmq.push(['record', 'Builder Sub Heading Toggle Off']);
        }
        break;
      case "TOGGLEBG":
        if (this.page.bgImageVisible) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Toggle Background Image On');
          // _kmq.push(['record', 'Builder Background Image Toggle On']);
        } else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Toggle Background Image Off');
          // _kmq.push(['record', 'Builder Background Image Toggle Off']);
        }
        break;
      case "REPLACEBG":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'ReplaceImage');
        // _kmq.push(['record', 'Builder Replace Image Click']);
        break;
      case "POWEROGTOGGLE":
        if (this.editorControl.poweredby.visible) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'PoweredByOGOn');
          // _kmq.push(['record', 'Builder Powered By OG Toggle On']);
        } else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'PoweredByOGOff');
          // _kmq.push(['record', 'Builder Powered By OG Toggle Off']);
        }
        break;
      case "PRIVACYTOGGLE":
        if (this.editorControl.footer_links.visible) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'PrivacyPolicyOn');
          // _kmq.push(['record', 'Builder Privacy Policy Toggle On']);
        } else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'PrivacyPolicyOff');
          // _kmq.push(['record', 'Builder Privacy Policy Toggle Off']);
        }
        break;
      case "CHANGETEMPLATE":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'ChangeTemplate');
        // _kmq.push(['record', 'Builder Change Template Click']);
        break;
      case "HIDEWELCOMETOGGLE":
        if (this.page.visible) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Hide Welcome Screen');
          // _kmq.push(['record', 'Hide Welcome Screen Toggle On']);
        }
        else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Show Welcome Screen');
          // _kmq.push(['record', 'Hide Welcome Screen Toggle Off']);
        }
        break;
    }
  }
  change(chnageItem: any) {
    this.changeItem = chnageItem;
  }
  undoChanges() {
    const appData = JSON.parse(localStorage.getItem('editor_data'));
    const keyArray = this.changeItem.split('.').slice(1, this.changeItem.split('.').length);
    let newVal = this.editorControl;
    let oldVal = appData;
    for (let i = 0; i < keyArray.length - 1; i++) {
      newVal = newVal[keyArray[i]];
      oldVal = oldVal[keyArray[i]];
    }
    this.changeItem = '';
    localStorage.setItem('chnage_page', '');
    newVal[keyArray[keyArray.length - 1]] = oldVal[keyArray[keyArray.length - 1]];
  }
}
