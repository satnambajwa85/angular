import { JSONItemTracker } from './../../../../services/JSONUpdateItemTracker.service';
import { FeatureAuthService } from './../../../../../../shared/services/feature-access.service';
import { Component, AfterViewInit, ViewEncapsulation, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { FormControl, } from '@angular/forms';
import { BuilderService } from '../../../../../+builder/services/builder.service';
import { DashboardService } from '../../../../../../shared/services/dashboard.service';
import { SubDomainService } from '../../../../../../shared/services/subdomain.service';
import { environment } from '../../../../../../../environments/environment';
import { LocaleService } from '../../../../../+builder/services/locale.service';
import { UrlShortner } from "../../../../services/UrlShortner.service";
import { CookieService, CompanyService } from "../../../../../../shared/services";

declare var jQuery: any;
declare var filestack: any;
declare var bootbox: any;
declare var window: any;
declare var ga: any;
// declare var _kmq: any;
declare var Clipboard: any;

@Component({
  selector: 'config-settings',
  templateUrl: './assets/html/settings.template.html',
  encapsulation: ViewEncapsulation.None
})
export class ConfigSettingsComponent implements AfterViewInit, OnInit {

  calcName: FormControl;
  tempName: string = '';
  uniqueNameHandler: any;
  isFocused: string;
  uniqueUrlHandler: any;
  unique = true;
  isempty = false;
  filePickerKey: any = environment.FILE_PICKER_API;
  oldCalcName: string;
  titleLength: any;
  metaDescLength: any;
  srcUrl: string;
  name: string;
  cname: any;
  locales: any = [];
  hostUrl: string = "";
  protocol: string = "";
  page: any;
  app: any = {};
  gifShortUrl: string;
  templateType: string;
  beingPublished: Boolean = false;
  showRetry: boolean = false;
  text: string = `This might take 2-3 minutes <br>Please wait.`;
  downloadGifUrl: string = '';
  publicLogo: string = '';
  navigateUrl: string = '';
  gifUrl: string;

  editorControl: any = {
    poweredby: {}
  };
  tempType = {
    'Recommendation': 'Outcome quiz',
    'Poll': 'Poll',
    'Numerical': 'Calculator',
    'Graded': 'Graded quiz',
    'Ecom': 'Ecom'
  };
  constructor(public _builderService: BuilderService, public jsonBuilderHelper: JSONBuilder,
    public _dashboardService: DashboardService, public subDomainService: SubDomainService,
    public localeService: LocaleService, public _featureAuthService: FeatureAuthService
    , public urlShortner: UrlShortner, public cookieService: CookieService, public _JSONItemTracker: JSONItemTracker, public _companyService: CompanyService) {

    this.uniqueNameHandler = this._builderService.debounce(this.updateName, 800);
    this.uniqueUrlHandler = this._builderService.debounce(this.updateUrl, 800);
    this.page = this.jsonBuilderHelper.getJSONBuilt().pages[0];
    for (let section in this.page.sections) {
      for (let item in this.page.sections[section].items) {
        for (let prop in this.editorControl) {
          if (prop === this.page.sections[section].items[item].type)
            this.editorControl[prop] = this.page.sections[section].items[item];
        }
      }
    }
  }

  @HostListener('document:click', ['$event']) clickout(event) {
    jQuery(".googleAna-infoDivwrapper").css('display', 'none');
    jQuery(".fbPixel-infoDivwrapper").css('display', 'none');
  }

  setUnSavedPage(page: any) {
    page = this.jsonBuilderHelper.getPage(page);
    this._JSONItemTracker.setUnSavedPage(page);
  }

  toggleTracking(type: any) {
    if (type === 'pixel') {
      if (this._featureAuthService.features.analytics.facebook_pixel) {
        this.jsonBuilderHelper.getJSONBuilt().fbPixel_enable = !this.jsonBuilderHelper.getJSONBuilt().fbPixel_enable;
      } else {
        this.jsonBuilderHelper.getJSONBuilt().fbPixel_enable = false;
        this.premiummodal('facebook_pixel');
      }
    }
    if (type === 'google') {
      if (this._featureAuthService.features.analytics.google_analytics) {
        this.jsonBuilderHelper.getJSONBuilt().ga_enable = !this.jsonBuilderHelper.getJSONBuilt().ga_enable;
      } else {
        this.jsonBuilderHelper.getJSONBuilt().ga_enable = false;
        this.premiummodal('google_analytics');
      }
    }
  }

  ngOnInit() {
    this.tempName = this.jsonBuilderHelper.getJSONBuilt().template;
    this.hostUrl = window.location.href.split('/')[2];
    this.protocol = window.location.href.split('/')[0];
    this.app = this.jsonBuilderHelper.getJSONBuilt();
    this.updateTitleLength(this.jsonBuilderHelper.getJSONBuilt().title);
    this.updateMetaDescLen(this.jsonBuilderHelper.getJSONBuilt().description);
    if (environment.STATIC_DOMAIN) {
      this.srcUrl = environment.LIVE_PROTOCOL + 'livec.' + environment.LIVE_EXTENSION + '/';
    } else {
      this.srcUrl = environment.LIVE_PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/';
    }
    // this.srcUrl = environment.PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION + '/';
    this.name = this.jsonBuilderHelper.getJSONBuilt().url.split('/').pop();
    this.cname = this.subDomainService.currentCompany &&
      (this.subDomainService.currentCompany.cname.url ? this.subDomainService.currentCompany.cname.url + '/' : '');
    this._companyService.getCompanyCustomFeatures(this.jsonBuilderHelper.getJSONBuilt().company).subscribe((data) => {
      if (data.extras.public_logo) {
        this.publicLogo = data.extras.public_logo.link;
        this.navigateUrl = data.extras.public_logo.navigateUrl;
      }
    });
    this.downloadGifUrl =
      `${environment.API}/builder/getImage?imageUrl=${encodeURIComponent(this.jsonBuilderHelper.getJSONBuilt().gifUrl.desktop)}`;
    this.localeService.get()
      .subscribe(data => {
        this.locales = data;
      });



    if (this.jsonBuilderHelper.getJSONBuilt().gifUrl) {
      this.urlShortner.bitlyShortner(this.jsonBuilderHelper.getJSONBuilt().gifUrl.desktop).subscribe(result => {
        this.gifShortUrl = result.data.url;
      })
    }

    this.jsonBuilderHelper.getCommonEmitter().subscribe(event => {
      if (event === 'gif_published') {
        this.setTemplateType();
        this.setGifShortUrl();
        this.refreshImage();
      }
    });

    this.refreshImage();
    this.setGifShortUrl();
    this.setTemplateType();


    if (this.jsonBuilderHelper.getJSONBuilt().publishing_gif
      && (!this.jsonBuilderHelper.getJSONBuilt().gifUrl || !this.jsonBuilderHelper.getJSONBuilt().gifUrl.desktop)) {
      setTimeout(() => {
        this.showRetry = true;
        this.text = 'This is taking some time';
      }, 70000)
    }
  }

  ngAfterViewInit() {
    let self: any = this;
    this.oldCalcName = this.jsonBuilderHelper.getJSONBuilt().name;
    if (!this._featureAuthService.features.show_trending.active) {
      this.jsonBuilderHelper.getJSONBuilt().showLiveCalc = false;
      this.showTrendingCalcs(this.jsonBuilderHelper.getJSONBuilt().showLiveCalc, false);
    }
    function resizeInput() {
      jQuery(this).attr('size', jQuery(this).val().length);
    }

    jQuery('.config-input-url').keyup(resizeInput).each(resizeInput);
    // Init wysiwyg for GDPR Text
    jQuery('textarea#froala-editorGDPR').froalaEditor({
      toolbarButtons: ['insertLink'],
      pastePlain: true,
    });
    // Set Default GDPR Text as per APP Data
    jQuery('textarea#froala-editorGDPR').froalaEditor('html.set', (self.jsonBuilderHelper.getJSONBuilt().gdpr_text));
    // Update GDPR Text on Change
    jQuery('textarea#froala-editorGDPR').on('froalaEditor.contentChanged', function (e: any, editor: any) {
      self.jsonBuilderHelper.getJSONBuilt().gdpr_text = e.currentTarget.value;
    });
  }

  refreshImage() {
    if (this.jsonBuilderHelper.getJSONBuilt().gifUrl && this.jsonBuilderHelper.getJSONBuilt().gifUrl.desktop) {
      this.gifUrl = `${this.jsonBuilderHelper.getJSONBuilt().gifUrl.desktop}?date=${new Date().getTime()}`
    }
  }

  setTemplateType() {
    this.templateType = (this.app.templateType === 'Numerical')
      ? 'Calculator' : (this.app.templateType === 'Recommendation')
        ? 'Quiz' : (this.app.templateType === 'Poll') ? 'Poll' : 'Graded Quiz';
  }

  setGifShortUrl() {
    if (this.jsonBuilderHelper.getJSONBuilt().gifUrl) {
      this.urlShortner.bitlyShortner(this.jsonBuilderHelper.getJSONBuilt().gifUrl.desktop).subscribe(result => {
        this.gifShortUrl = result.data.url;
      });
    }
  }

  fb() {
    if (!this._featureAuthService.features.analytics.facebook_pixel) this.premiummodal('facebook_pixel');
  }

  ga() {
    if (!this._featureAuthService.features.analytics.google_analytics) this.premiummodal('google_analytics');
  }

  premiummodal(sub_feature: string) {
    this._featureAuthService.setSelectedFeature('analytics', sub_feature);
    jQuery('.analytics').addClass('activegreen limited-label');
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  }

  googleAnalyticsHover() {
    jQuery(".googleAna-infoDivwrapper").css('display', 'block');
  }

  fbPixelHover() {
    jQuery(".fbPixel-infoDivwrapper").css('display', 'block');
  }

  fbCNAMEPixelHover() {
    jQuery(".fbCNAMEPixel-infoDivwrapper").css('display', 'block');
  }

  btnClose() {
    jQuery(".googleAna-infoDivwrapper").css('display', 'none');
    jQuery(".fbPixel-infoDivwrapper").css('display', 'none');
    jQuery(".fbCNAMEPixel-infoDivwrapper").css('display', 'none');
  }

  // infoDivClose(){
  //     event.stopPropagation();
  // }

  removeCss() {
    jQuery(".infoDivwrapper").css('display', 'none');
  }

  closeIt() {
    jQuery('.editor-calcUrl').fadeOut();
  }

  onCalcNameChanged() {
    if (this.jsonBuilderHelper.getJSONBuilt().name) {
      this.isempty = false;
      this.uniqueNameHandler();
    } else {
      this.isempty = true;
      this.jsonBuilderHelper.getJSONBuilt().name = this.oldCalcName;
    }
  }

  chooseNumberSystem(event: any) {
    this.jsonBuilderHelper.getJSONBuilt().numberSystem = event.target.value;
  }

  onCalcUrlChanged(event: any) {
    this.jsonBuilderHelper.getJSONBuilt().url = event.target.value;
    if (this.jsonBuilderHelper.getJSONBuilt().url) {
      this.isempty = false;
      this.uniqueUrlHandler();
    }
  }

  updateTitleLength(value: any) {
    this.titleLength = '(' + value.toString().length + '/55)';
  }

  updateMetaDescLen(value: any) {
    this.metaDescLength = '(' + value.toString().length + '/320)';
  }

  copyButton() {
    // clipboard.copy(this.srcUrl + this.jsonBuilderHelper.getJSONBuilt().url);
    let self = this;
    new Clipboard('.copy-btn', {
      text: function (trigger) {
        return self.srcUrl + self.jsonBuilderHelper.getJSONBuilt().url;
      }
    });
    window.toastNotification('Copied to Clipboard');
  }

  copyCname() {
    // clipboard.copy(this.cname + this.jsonBuilderHelper.getJSONBuilt().url);
    let self = this;
    new Clipboard('.copy-btn', {
      text: function (trigger) {
        return self.cname + self.jsonBuilderHelper.getJSONBuilt().url;
      }
    });
    window.toastNotification('Copied to Clipboard');
  }

  updateName() {
    if (this.oldCalcName != this.jsonBuilderHelper.getJSONBuilt().name) {
      /* Animation Init */
      this.jsonBuilderHelper.animInit();
      this._builderService.updateName(this.jsonBuilderHelper.getJSONBuilt()._id, this.jsonBuilderHelper.getJSONBuilt().name)
        .subscribe(
          (response: any) => {
            if (!this.jsonBuilderHelper.getJSONBuilt().url) {
              this.jsonBuilderHelper.getJSONBuilt().url = response.url;
              window.history.replaceState({}, '', (this._builderService.isDemo ? '/builder-demo/' : '/builder/') + response.url);
              let url = environment.PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION + '/' + response.url;
              window.toastNotification('Calculator name added successfully');
              bootbox.dialog({
                size: 'small',
                message: `<div class="bootbox-body-left">
                                        <div class="mat-icon">
                                            <i class="material-icons">error</i>
                                        </div>
                                    </div>
                                    <div class="bootbox-body-right">
                                        <p class="">We have set your calculator\'s url to "` + url + `" , You can always change it in configure section.</p>
                            </div>
                            `,
                buttons: {
                  success: {
                    label: "OK",
                    className: "btn btn-ok btn-hover"
                  }
                }
              });
            }
            else {
              window.toastNotification('Calculator name changed successfully');
            }
            this.oldCalcName = this.jsonBuilderHelper.getJSONBuilt().name;
            /* animation */
            this.jsonBuilderHelper.debounce(this.jsonBuilderHelper.animLoad(), 1800);
          },
          (error: any) => {
            console.log(error);
          }
        );
    }
  }

  updateUrl() {
    /* Animation Init */
    this.jsonBuilderHelper.animInit();
    this._builderService.checkUniqueUrl(this.jsonBuilderHelper.getJSONBuilt()._id, this.jsonBuilderHelper.getJSONBuilt().url)
      .subscribe(
        (response: any) => {
          if (!response.exsists) {
            this.unique = true;
            /* animation */
            this.jsonBuilderHelper.debounce(this.jsonBuilderHelper.animLoad(), 1800);
            if (this.jsonBuilderHelper.getJSONBuilt().url != response.url)
              window.toastNotification('Url changed successfully.');
            window.history.replaceState({}, '', (this._builderService.isDemo ? '/builder-demo/' : '/builder/') + response.url);
            this.jsonBuilderHelper.getJSONBuilt().url = response.url;
          } else {
            this.unique = false;
          }
        },
        (error: any) => {
          console.log(error);
        }
      );
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
      if (type == 'favicon') {
        self.jsonBuilderHelper.getJSONBuilt().favicon = s3URL;
      } else if (type == 'seo_image') {
        self.jsonBuilderHelper.getJSONBuilt().seoImage = s3URL;
        self.jsonBuilderHelper.getJSONBuilt().seoImageName = result.filesUploaded[0].filename;
      }
    });
    /*filepicker.setKey(this.filePickerKey);
    filepicker.pick(
      { mimetypes: ['image/*'], },
      (InkBlob: any) => {
        if (type == 'favicon') {
          this.jsonBuilderHelper.getJSONBuilt().favicon = InkBlob.url;
        } else if (type == 'seo_image') {
          this.jsonBuilderHelper.getJSONBuilt().seoImage = InkBlob.url;
          this.jsonBuilderHelper.getJSONBuilt().seoImageName = InkBlob.filename;
        }
        jQuery('#filepicker_dialog_container').find('a').click();
      },
      (FPError: any) => {
        console.log(FPError.toString());
      }
    );*/
  }
  saveAppSettings() {
  }
  onPublicModeChange() {
    this._dashboardService.changeAppPublicMode(this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe(
        (response: any) => {
          window.toastNotification('Success!');
          this.jsonBuilderHelper.debounce(this.jsonBuilderHelper.animLoad(), 1800);
        },
        (error: any) => {
          console.log(error);
        }
      );
  }
  onLiveCalculatorChange(event: any) {
    if (!this._featureAuthService.features.show_trending.active) {
      event.target.checked = false;
      this._featureAuthService.setSelectedFeature(null, 'show_trending');
      jQuery('.show_trending').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      return;
    }
    this.jsonBuilderHelper.getJSONBuilt().showLiveCalc = event.target.checked;
    this.showTrendingCalcs(this.jsonBuilderHelper.getJSONBuilt().showLiveCalc, true);
  }
  showTrendingCalcs(status: boolean, msg: boolean) {
    this._dashboardService.changeLiveCalculators(this.jsonBuilderHelper.getJSONBuilt()._id, status)
      .subscribe(
        (response: any) => {
          msg ? window.toastNotification('Success!') : '';
          this.jsonBuilderHelper.debounce(this.jsonBuilderHelper.animLoad(), 1800);
        },
        (error: any) => {
          console.log(error);
        }
      );
  }
  onModeChange() {
    let mode;
    if (this.jsonBuilderHelper.getJSONBuilt().mode === 'PUBLIC') {
      mode = 'PRIVATE';
      /* Animation Init */
      this.jsonBuilderHelper.animInit();
      this._dashboardService.changeAppMode(this.jsonBuilderHelper.getJSONBuilt()._id)
        .subscribe(
          (response: any) => {
            this.jsonBuilderHelper.getJSONBuilt().mode = mode;
            window.toastNotification('Mode changed to ' + mode + ' for ' + this.jsonBuilderHelper.getJSONBuilt().name);
            this.jsonBuilderHelper.debounce(this.jsonBuilderHelper.animLoad(), 1800);
          },
          (error: any) => {
            console.log(error);
          }
        );
    } else {
      mode = 'PUBLIC';
      jQuery('#live-btn').trigger('click');
    }
  }

  RTL() {
    this.jsonBuilderHelper.getJSONBuilt().RTL = !this.jsonBuilderHelper.getJSONBuilt().RTL;
  }

  callGA(opt: string) {
    switch (opt) {
      case "UPLOADFAV":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'UploadFavicon');
        // _kmq.push(['record', 'Builder Upload Favicon Click']);
        break;
      case "CALCSTATUSTOGGLE":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'CalcStatusChange');
        // _kmq.push(['record', 'Builder Calculator Status Change Toggle']);
        break;
    }
  }
  seoExp(event: any) {
    this.jsonBuilderHelper.getJSONBuilt().seo_text.showText = event.target.checked;
    if (!event.target.checked) {
      this.jsonBuilderHelper.getJSONBuilt().seo_text.inEmbed = false;
    }
  }
  seoExpEmbed(event: any) {
    this.jsonBuilderHelper.getJSONBuilt().seo_text.inEmbed = event.target.checked;
  }
  changeLocale() {
    this.localeService.get(this.jsonBuilderHelper.getJSONBuilt().localeCode)
      .subscribe(
        (response: any) => {
          this.jsonBuilderHelper.translatedFields = response.fields;
          delete this.jsonBuilderHelper.translatedFields['_id'];
        });
  }

  removeSeoImage() {
    this.jsonBuilderHelper.getJSONBuilt().seoImage = '';
    this.jsonBuilderHelper.getJSONBuilt().seoImageName = '';
  }

  removeFavicon() {
    this.jsonBuilderHelper.getJSONBuilt().favicon = '';
  }

  togglePoweredBy(ev: any) {
    if (this._featureAuthService.features.custom_branding.cta_build_similar_calc) {
      this.editorControl.poweredby.visible = !this.editorControl.poweredby.visible;
      if (this.editorControl.poweredby.visible) {
        this.editorControl.poweredby.showButton = false;
      }
    } else {
      ev.target.checked = true;
      this._featureAuthService.setSelectedFeature('custom_branding', 'logo_poweredby');
      jQuery('.custom_branding').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      this.editorControl.poweredby.visible = true;
      this.jsonBuilderHelper.getJSONBuilt().poweredby = true;
    }
  }

  copyToClipboard() {
    let gifUrl = this.jsonBuilderHelper.getJSONBuilt().gifUrl.desktop;
    new Clipboard('.copy-clipboard', {
      text: function (trigger) {
        return gifUrl;
      }
    });
    window.toastNotification('Copied to Clipboard');
  }

  generateGif({ retry, target, regenerate }) {
    if (this.jsonBuilderHelper.getJSONBuilt().liveApp != null) {
      if (target) {
        target.innerText = 'Please Wait...'
      }

      this._builderService.publishGif({
        url: this.jsonBuilderHelper.getJSONBuilt().url,
        app_id: this.jsonBuilderHelper.getJSONBuilt()._id,
        sub_domain: this.subDomainService.subDomain.sub_domain,
        company_id: this.subDomainService.subDomain.company_id,
        socket_id: this.jsonBuilderHelper.getJSONBuilt().socket_id
      }).subscribe((res) => {
        this.jsonBuilderHelper.getJSONBuilt().publishing_gif = true;

        if (retry) {
          this.text = 'This might take 2-3 minutes <br>Please wait.';
          this.showRetry = !this.showRetry;
        }
        if (regenerate) {
          window.toastNotification('Regenerated gif will be available shortly');
        }
        setTimeout(() => {
          this.showRetry = true;
          this.text = 'This is taking some time';
        }, 120000)
      }, error => {
        target && (target.innerText = 'Retry')
      })
    } else {
      window.toastNotification(`Please publish your ${this.templateType}`);
    }
  }
  downloadGif(gifUrl) {
    this._builderService.downloadGif(gifUrl)
      .subscribe(data => {

      })
  }
  publicLogoUpload(type: String) {
    let self: any = this;
    const apikey = this.filePickerKey;
    const client = filestack.init(apikey);
    client.pick({
      accept: 'image/*',
    }).then(function (result) {
      self.publicLogo = result.filesUploaded[0].url;
      let data = {
        company_id: self.jsonBuilderHelper.getJSONBuilt().company,
        link: result.filesUploaded[0].url,
        fileName: result.filesUploaded[0].filename
      };
      self.publicLogoSave(data);
    });
  }
  publicLogoSave(data) {
    let self: any = this;
    self._companyService.updatePublicLogo(data).subscribe((data) => {
      this.publicLogo = data.extras.public_logo.link;
    });
  }
  logoLink($event: any) {
    let url = $event.target.value;
    if (url != '') {
      if (!/^(f|ht)tps?:\/\//i.test(url)) {
        url = "http://" + url;
      }
    }
    this.navigateUrl = url;
    this.saveLogoLink(this.navigateUrl);
  }

  saveLogoLink(link) {
    let data = {
      company_id: this.jsonBuilderHelper.getJSONBuilt().company,
      navigateUrl: link,
      urlStatus: true
    }
    this._companyService.updatePublicLogo(data).subscribe(() => {
      window.toastNotification('public logo link saved');
    })
  }

  removePublicLogo() {
    this.publicLogo = '';
    this.updatePublicLogo();
  }
  updatePublicLogo() {
    let data = {
      company_id: this.jsonBuilderHelper.getJSONBuilt().company,
      remove: true
    };
    this._companyService.updatePublicLogo(data).subscribe(() => {
      window.toastNotification('public logo removed successfully');
    });
  }
}
