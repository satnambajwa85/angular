import { BuilderService } from './../../../../services/builder.service';
import { UrlShortner } from './../../../../services/UrlShortner.service';
import { Component, AfterViewInit, Input, ViewEncapsulation, DoCheck, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { SafeUrl } from '../../../../../templates/pipes/safeUrl.pipe';
import { environment } from '../../../../../../../environments/environment';
import { FeatureAuthService } from '../../../../../../shared/services/feature-access.service';
import { SubDomainService } from '../../../../../../shared/services/subdomain.service';
import { settings } from 'cluster';
declare var jQuery: any;
declare var Clipboard: any;
declare var window: any;
declare var bootbox: any;

@Component({
  selector: 'config-embedded-code',
  templateUrl: './assets/html/embedded_code.template.html',
  encapsulation: ViewEncapsulation.None
})

export class ConfigEmbeddedCodeComponent implements OnInit, AfterViewInit {
  @Input() child?: any;
  selectedItem: any = 'embedpage';
  hideSmallCode: boolean = true;
  hideFullCode: boolean = true;
  embedVariable: boolean = true;
  tempName: string = '';
  smallPageCode: any = 'Generating Embed Code...';
  fullPageCode: any = 'Generating Embed Code...';
  noMarginCode: any = '';
  deMarginCode: any = '';
  figCapCode: any = '';
  iloaderJS: any = '//dyv6f9ner1ir9.cloudfront.net/assets/js/sloader.js';
  nloaderJS: any = '//dyv6f9ner1ir9.cloudfront.net/assets/js/nloader.js';
  appExt: any = this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION;
  iFrameUrl: any = '';
  fbCommentsCode: any = '';
  src: any;
  csrc: any;
  fsrc: any;
  headerHelpText: string = '';
  footerHelpText: string = '';
  fbHelpText: string = '';
  embedpage: boolean = true;
  promotion: boolean = false;
  opinionEmail: boolean = false
  heading: string = '';
  subheading: string = '';
  dev_id: string = '';
  bgimage: string = '';
  logo: string = 'https://cdn.filestackcontent.com/k7te2pyHQPSHN1AvfguW';
  bgImageVisible: boolean;
  lpVisible: boolean;
  color: any;
  constructor(public jsonBuilderHelper: JSONBuilder,
    public subDomainService: SubDomainService,
    public _featureAuthService: FeatureAuthService,
    public _urlShortner: UrlShortner,
    private builderService: BuilderService
  ) { this.jsonBuilderHelper.getCommonEmitter().subscribe(emit => emit == 'Header Footer' && this.setEmbedLinks()); }

  ngAfterViewInit() {
    const self: any = this;

    jQuery('.promotionlist').click();

    jQuery('.embed-togle-right a.embed1').click(function () {
      jQuery('.embedshow1').slideDown();
      jQuery('.embedshow2').slideUp();
      jQuery('.embedshow3').slideUp();
    });

    jQuery('.embed-togle-right a.embed2').click(function () {
      jQuery('.embedshow1').slideUp();
      jQuery('.embedshow2').slideDown();
      jQuery('.embedshow3').slideUp();
    });

    jQuery('.embed-togle-right a.embed3').click(function () {
      jQuery('.embedshow2').slideUp();
      jQuery('.embedshow1').slideUp();
      jQuery('.embedshow3').slideDown();
    });

    jQuery('#embed-btn-color1').ColorPickerSliders({
      sliders: false,
      swatches: false,
      hsvpanel: true,
      previewformat: 'hex',
      size: 'large',
      placement: 'top',
      color: self.jsonBuilderHelper.getJSONBuilt().embedBgColor,
      onchange: function (container, color) {
        self.jsonBuilderHelper.getJSONBuilt().embedBgColor = '#' + color.tiny.toHex();
        self.updateEmbedCode();
      }
    });
  }

  ngOnInit() {
    localStorage.setItem('template', JSON.stringify(this.jsonBuilderHelper.getJSONBuilt()));
    this.iFrameUrl = environment.PROTOCOL + this.appExt + (this.builderService.isDemo ? '/preview-demo/previewFrame' : '/preview/previewFrame');
    this.tempName = this.jsonBuilderHelper.getJSONBuilt().template;
    this.dev_id = this.jsonBuilderHelper.getJSONBuilt()._id;
    this.jsonBuilderHelper.getDataForEmbed((heading: string, subheading: string, bgimage: string, bgImageVisible: boolean, lpVisible: boolean, logo: string) => {
      this.heading = heading;
      this.subheading = subheading;
      this.bgimage = bgimage;
      this.bgImageVisible = bgImageVisible;
      this.lpVisible = lpVisible;
      if (!this.bgImageVisible) {
        this.bgimage = '';
      }
      this.logo = logo;
    });
    this.color = this.jsonBuilderHelper.getJSONBuilt().theme;
    this.initEmbedVariables();
    this.setSmallPageCode();
    if (!this.jsonBuilderHelper.getJSONBuilt().shortUrl) {
      this._urlShortner.googleShortner(environment.PROTOCOL + 'live' + '.' + environment.APP_EXTENSION + '/seo/' + this.jsonBuilderHelper.getJSONBuilt()._id +
        '?sLead=1').subscribe(
        body => {
          this.jsonBuilderHelper.getJSONBuilt().shortUrl = body.id;
          this.setFullPageCode();
          this.setFBCommentsURL();
        }
        );
    } else {
      this.setFullPageCode();
      this.setFBCommentsURL();
    }
    this.headerHelpText = `Turn off your header so that your ${this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? 'calculator' : this.jsonBuilderHelper.getJSONBuilt().templateType == 'Poll' ? 'poll' : 'quiz'} can fit seamlessly into your site.`;
    this.footerHelpText = `Turn off your footer so that your ${this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? 'calculator' : this.jsonBuilderHelper.getJSONBuilt().templateType == 'Poll' ? 'poll' : 'quiz'} can fit seamlessly into your site.`;
    this.fbHelpText = `Turn on to have Facebook comments appended to your ${this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? 'calculator' : this.jsonBuilderHelper.getJSONBuilt().templateType == 'Poll' ? 'poll' : 'quiz'}. `;
  }


  setFBCommentsURL() {
    if (this.jsonBuilderHelper.getJSONBuilt().fbComments) {
      this.fbCommentsCode = `<div id='fb-root'></div><script>(function(d, s, id){var js, fjs=d.getElementsByTagName(s)[0]; if (d.getElementById(id)) return; js=d.createElement(s); js.id=id; js.src='//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.10'; fjs.parentNode.insertBefore(js, fjs);}(document, 'script', 'facebook-jssdk'));</script><div class='fb-comments' data-href='` + this.fsrc + `' data-width='100%' data-numposts='5'></div>`;
    }
  }

  initEmbedVariables() {
    const embedVariable = true;
    // Header Footer Logic
    let embedHeader = (this.jsonBuilderHelper.getJSONBuilt().embedHeader) ? 1 : 0;
    let embedFooter = (this.jsonBuilderHelper.getJSONBuilt().embedFooter) ? 1 : 0;
    let queryparam = '';
    if (this.headerVisible()) queryparam = queryparam + '&header=' + embedHeader;
    if (this.footerVisible()) queryparam = queryparam + '&footer=' + embedFooter;
    if (this.tempName === 'template-eight') {
      queryparam = '';
    }
    this.iloaderJS = '//dyv6f9ner1ir9.cloudfront.net/assets/js/sloader.js';
    this.nloaderJS = '//dyv6f9ner1ir9.cloudfront.net/assets/js/nloader.js';
    if (environment.APP_EXTENSION !== 'outgrow.co') {
      this.iloaderJS = '//dyv6f9ner1ir9.cloudfront.net/assets/js/niloader.js';
    } else {
      this.iloaderJS = '//dyv6f9ner1ir9.cloudfront.net/assets/js/sloader.js';
    }
    if (environment.LIVE_PROTOCOL === 'https://') {
      if (environment.STATIC_DOMAIN) {
        this.src = 'https://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?vHeight=1';
        this.csrc = 'https://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?sLead=1' + queryparam;
        this.fsrc = 'https://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      } else {
        this.src = 'https://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?vHeight=1';
        this.csrc = 'https://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?sLead=1' + queryparam;
        this.fsrc = 'https://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      }
    } else {
      if (environment.STATIC_DOMAIN) {
        this.src = '//' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?vHeight=1';
        this.csrc = '//' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?sLead=1' + queryparam;
        this.fsrc = 'http://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      } else {
        this.src = '//' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?vHeight=1';
        this.csrc = '//' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + '?sLead=1' + queryparam;
        this.fsrc = 'http://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      }
    }
  }

  setSmallPageCode() {
    this.smallPageCode = `<div><div class='op-interactive' id='` + this.jsonBuilderHelper.getJSONBuilt()._id + `' data-url='` + this.src + `' data-width='100%'></div><script src='` + this.nloaderJS + `'></script><script>initIframe('` + this.jsonBuilderHelper.getJSONBuilt()._id + `');</script></div>`;
    // this.fullPageCode = `<div><div class='op-interactive' id='` + this.jsonBuilderHelper.getJSONBuilt()._id + `' data-url='` + this.csrc + `' data-surl='` + this.jsonBuilderHelper.getJSONBuilt().shortUrl + `' data-width='100%' logo='` + this.logo + `' tintRGB='` + this.color.tintRGB + `' heading='` + this.heading + `' subheading='` + this.subheading + `' bgimage='` + this.bgimage + `' bgImageVisible='` + this.bgImageVisible + `' lpVisible='` + this.lpVisible + `' bgColor='` + this.color.bgColor + `' componentColor='` + this.color.componentColor + `' textColor='` + this.color.textColor + `'></div><script src='` + this.iloaderJS + `'></script><script>initMobileCode('` + this.jsonBuilderHelper.getJSONBuilt()._id + `');initIframe('` + this.jsonBuilderHelper.getJSONBuilt()._id + `');</script></div>`;
    // this.noMarginCode = `<figure class='op-interactive'><iframe class='no-margin' src='` + this.src + `' height='180' width='320'></iframe></figure>`;
    // this.deMarginCode = `<figure class='op-interactive'><iframe class='column-width' src='` + this.src + `' height='180' width='320'></iframe></figure>`;
    // this.figCapCode = `<figure class='op-interactive'><iframe class='no-margin' src='` + this.src + `' height='180' width='320'></iframe><figcaption>This graphic is awesome.</figcaption></figure>`;
  }

  setFullPageCode() {
    this.fullPageCode = `<div><div class='op-interactive' id='` + this.jsonBuilderHelper.getJSONBuilt()._id + `' data-url='` + this.csrc + `' data-surl='` + this.jsonBuilderHelper.getJSONBuilt().shortUrl + `' data-width='100%'></div><script src='` + this.iloaderJS + `'></script><script>initIframe('` + this.jsonBuilderHelper.getJSONBuilt()._id + `');</script></div>`;
  }

  setEmbedLinks() {
    this.initEmbedVariables();
    this.setSmallPageCode();
    this.setFullPageCode();
  }

  embedToggle() {
    this.hideFullCode = !this.hideFullCode;
    this.hideSmallCode = true;
  }

  embedToggle2() {
    if (this._featureAuthService.features.embedding.active) {
      this.hideSmallCode = !this.hideSmallCode;
      this.hideFullCode = true;
    } else {
      this._featureAuthService.setSelectedFeature('embedding');
      jQuery('.embedding').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }

  embedSelect(className: any) {
    const self: any = this;
    let copyCode: any = '';
    if (className === 'code1') {
      copyCode = self.smallPageCode;
    } else if (className === 'code2') {
      copyCode = self.fullPageCode;
      if (self.jsonBuilderHelper.getJSONBuilt().fbComments) {
        copyCode = copyCode + self.fbCommentsCode;
        console.log(copyCode);
      }
    } else if (className === 'code3') {
      copyCode = self.noMarginCode;
    } else if (className === 'code4') {
      copyCode = self.deMarginCode;
    } else if (className === 'code5') {
      copyCode = self.figCapCode;
    }
    if (this.jsonBuilderHelper.isClipboardSupported) {
      // clipboard.copy(copyCode);
      let self = this;
      new Clipboard('.embed2', {
        text: function(trigger) {
            return copyCode;
        }
      });
      window.toastNotification('Copied to Clipboard');
      setTimeout(() => {
        const el = document.getElementsByClassName(className)[0];
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }, 0);
    }
  }

  setShortUrl() {
    if (!this.jsonBuilderHelper.getJSONBuilt().shortUrl) {
      this._urlShortner.googleShortner(environment.PROTOCOL + 'live' + '.' + environment.APP_EXTENSION + '/seo/' + this.jsonBuilderHelper.getJSONBuilt()._id +
        '?sLead=1').subscribe(
        body => {
          this.jsonBuilderHelper.getJSONBuilt().shortUrl = body.id;
        }
        );
    }
  }

  headerVisible() {
    let header_sec = this.jsonBuilderHelper.getJSONBuilt().pages[0].sections.find(sec => sec.type == 'Page_Header');
    if (header_sec) {
      let header = header_sec.items.find(item => item.type == 'header_links');;
      return (header && header.visible);
    } else return false;
  }

  footerVisible() {
    let footer_sec = this.jsonBuilderHelper.getJSONBuilt().pages[2].sections.find(sec => sec.type == 'Page_Footer');
    if (footer_sec) {
      let footer = footer_sec.items.find(item => item.type == 'footer_links');;
      return (footer && footer.visible);
    } else return false;
  }

  setItem(item) {
    this.selectedItem = item;
  }

  embedSel(elem) {
    jQuery('.'+elem)[0].click()
  }
}
