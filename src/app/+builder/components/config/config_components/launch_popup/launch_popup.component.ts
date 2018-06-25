import { BuilderService } from './../../../../services/builder.service';
import { Component, ViewEncapsulation, OnInit, DoCheck, AfterViewInit } from '@angular/core';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { SafeUrl } from '../../../../../templates/pipes/safeUrl.pipe';
import { SubDomainService } from '../../../../../../shared/services/subdomain.service';
import { environment } from '../../../../../../../environments/environment';

declare var jQuery: any;
declare var Clipboard: any;
declare var window: any;
declare var bootbox: any;
@Component({
  selector: 'config-launch-popup',
  templateUrl: './assets/html/launch_popup.template.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./assets/css/fancybox.css']
})

export class ConfigLaunchPopupComponent implements AfterViewInit, OnInit, DoCheck {
  iframeData: any;
  loaderJs: any;
  isButton: boolean = false;
  isDrawer: boolean = false;
  isLDrawer: boolean = false;
  appExt: any = this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION;
  srcUrl: any = '//' + this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
  iFrameUrl: any = '';
  buttonName: any = '';
  bgColor: any = '';
  textColor: any = '';
  embedBorderRadius: any = '';
  embedFontSize: any = '';
  tempName: string = '';
  headerHelpText: string = '';
  footerHelpText: string = '';
  constructor(public jsonBuilderHelper: JSONBuilder, public subDomainService: SubDomainService, private builderService: BuilderService) {
    this.jsonBuilderHelper.getCommonEmitter().subscribe(emit => emit == 'Header Footer' && this.updateEmbedCode());
  }

  ngDoCheck() {
    if (document.title != 'Outgrow Home')
      document.title = "Outgrow Home";
  }

  updateScheduling(type: any) {
    if (type === 'timed') {
      this.jsonBuilderHelper.getJSONBuilt().embedTimed = true;
      this.jsonBuilderHelper.getJSONBuilt().embedExit = false;
    } else if (type === 'exit') {
      this.jsonBuilderHelper.getJSONBuilt().embedExit = true;
      this.jsonBuilderHelper.getJSONBuilt().embedTimed = false;
    }
    this.updateEmbedCode();
  }

  updateEmbedCode() {
    // Checks for empty embedTimeValue & embedCookieDays
    if (!this.jsonBuilderHelper.getJSONBuilt().embedTimeValue) {
      this.jsonBuilderHelper.getJSONBuilt().embedTimeValue = 5;
    }
    if (!this.jsonBuilderHelper.getJSONBuilt().embedCookieDays) {
      this.jsonBuilderHelper.getJSONBuilt().embedCookieDays = 10;
    }
    // Header Footer Logic
    let embedHeader = (this.jsonBuilderHelper.getJSONBuilt().embedHeader) ? 1 : 0;
    let embedFooter = (this.jsonBuilderHelper.getJSONBuilt().embedFooter) ? 1 : 0;
    let queryparam = '?q=1';
    if (this.headerVisible()) queryparam = queryparam + '&header=' + embedHeader;
    if (this.footerVisible()) queryparam = queryparam + '&footer=' + embedFooter;
    if (this.tempName === 'template-eight') {
      queryparam = '';
    }
    this.bgColor = this.jsonBuilderHelper.getJSONBuilt().embedBgColor;
    this.textColor = this.jsonBuilderHelper.getJSONBuilt().embedTextColor;
    this.buttonName = this.jsonBuilderHelper.getJSONBuilt().embedTitle;
    this.embedBorderRadius = this.jsonBuilderHelper.getJSONBuilt().embedBorderRadius;
    this.embedFontSize = this.jsonBuilderHelper.getJSONBuilt().embedFontSize;
    if (environment.LIVE_PROTOCOL === 'https://') {
      if (environment.STATIC_DOMAIN) {
        this.srcUrl = 'https://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + queryparam;
      } else {
        this.srcUrl = 'https://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + queryparam;
      }
    } else {
      if (environment.STATIC_DOMAIN) {
        this.srcUrl = '//' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + queryparam;
      } else {
        this.srcUrl = '//' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id + queryparam;
      }
    }
    if (this.isDrawer) {
      if (this.isButton)
        this.iframeData = `<div><div id='` + this.jsonBuilderHelper.getJSONBuilt()._id + `' data-embedCookieDays='` + this.jsonBuilderHelper.getJSONBuilt().embedCookieDays + `' data-embedScheduling='` + this.jsonBuilderHelper.getJSONBuilt().embedScheduling + `' data-embedTimed='` + this.jsonBuilderHelper.getJSONBuilt().embedTimed + `' data-embedExit='` + this.jsonBuilderHelper.getJSONBuilt().embedExit + `' data-embedTimeFormat='` + this.jsonBuilderHelper.getJSONBuilt().embedTimeFormat + `' data-embedTimeValue='` + this.jsonBuilderHelper.getJSONBuilt().embedTimeValue + `' data-isLDrawer='` + this.isLDrawer + `' data-embedBorderRadius='` + this.embedBorderRadius + `' data-embedFontSize='` + this.embedFontSize + `' data-textcolor='` + this.textColor + `' data-bgcolor='` + this.bgColor + `' data-prop='outgrow-d' data-type='outgrow-b' data-url='` + this.srcUrl + `' data-text='` + this.buttonName + `'></div><script src='` + this.loaderJs + `'></script><script>initIframe('` + this.jsonBuilderHelper.getJSONBuilt()._id + `');</script></div>`;
      else {
        this.textColor = this.jsonBuilderHelper.getJSONBuilt().embedLinkColor;
        this.iframeData = `<div><div id='` + this.jsonBuilderHelper.getJSONBuilt()._id + `' data-embedCookieDays='` + this.jsonBuilderHelper.getJSONBuilt().embedCookieDays + `' data-embedScheduling='` + this.jsonBuilderHelper.getJSONBuilt().embedScheduling + `' data-embedTimed='` + this.jsonBuilderHelper.getJSONBuilt().embedTimed + `' data-embedExit='` + this.jsonBuilderHelper.getJSONBuilt().embedExit + `' data-embedTimeFormat='` + this.jsonBuilderHelper.getJSONBuilt().embedTimeFormat + `' data-embedTimeValue='` + this.jsonBuilderHelper.getJSONBuilt().embedTimeValue + `' data-isLDrawer='` + this.isLDrawer + `' data-embedBorderRadius='` + this.embedBorderRadius + `' data-embedFontSize='` + this.embedFontSize + `' data-textcolor='` + this.textColor + `' data-bgcolor='` + this.bgColor + `' data-prop='outgrow-d' data-type='outgrow-l' data-url='` + this.srcUrl + `' data-text='` + this.buttonName + `'></div><script src='` + this.loaderJs + `'></script><script>initIframe('` + this.jsonBuilderHelper.getJSONBuilt()._id + `');</script></div>`;
      }
    } else {
      if (this.isButton)
        this.iframeData = `<div><div id='` + this.jsonBuilderHelper.getJSONBuilt()._id + `' data-embedCookieDays='` + this.jsonBuilderHelper.getJSONBuilt().embedCookieDays + `' data-embedScheduling='` + this.jsonBuilderHelper.getJSONBuilt().embedScheduling + `' data-embedTimed='` + this.jsonBuilderHelper.getJSONBuilt().embedTimed + `' data-embedExit='` + this.jsonBuilderHelper.getJSONBuilt().embedExit + `' data-embedTimeFormat='` + this.jsonBuilderHelper.getJSONBuilt().embedTimeFormat + `' data-embedTimeValue='` + this.jsonBuilderHelper.getJSONBuilt().embedTimeValue + `' data-embedBorderRadius='` + this.embedBorderRadius + `' data-embedFontSize='` + this.embedFontSize + `' data-textcolor='` + this.textColor + `' data-bgcolor='` + this.bgColor + `' data-prop='outgrow-p' data-type='outgrow-b' data-url='` + this.srcUrl + `' data-text='` + this.buttonName + `'></div><script src='` + this.loaderJs + `'></script><script>initIframe('` + this.jsonBuilderHelper.getJSONBuilt()._id + `');</script></div>`;
      else {
        this.textColor = this.jsonBuilderHelper.getJSONBuilt().embedLinkColor;
        this.iframeData = `<div><div id='` + this.jsonBuilderHelper.getJSONBuilt()._id + `' data-embedCookieDays='` + this.jsonBuilderHelper.getJSONBuilt().embedCookieDays + `' data-embedScheduling='` + this.jsonBuilderHelper.getJSONBuilt().embedScheduling + `' data-embedTimed='` + this.jsonBuilderHelper.getJSONBuilt().embedTimed + `' data-embedExit='` + this.jsonBuilderHelper.getJSONBuilt().embedExit + `' data-embedTimeFormat='` + this.jsonBuilderHelper.getJSONBuilt().embedTimeFormat + `' data-embedTimeValue='` + this.jsonBuilderHelper.getJSONBuilt().embedTimeValue + `' data-embedBorderRadius='` + this.embedBorderRadius + `' data-embedFontSize='` + this.embedFontSize + `' data-textcolor='` + this.textColor + `' data-bgcolor='` + this.bgColor + `' data-prop='outgrow-p' data-type='outgrow-l' data-url='` + this.srcUrl + `' data-text='` + this.buttonName + `'></div><script src='` + this.loaderJs + `'></script><script>initIframe('` + this.jsonBuilderHelper.getJSONBuilt()._id + `');</script></div>`;
      }
    }
  }

  ngAfterViewInit() {
    let self: any = this;
    //Button Color
    jQuery('#embed-btn-color').ColorPickerSliders({
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
    //Text/Link Color
    jQuery('#embed-text-color').ColorPickerSliders({
      sliders: false,
      swatches: false,
      hsvpanel: true,
      previewformat: 'hex',
      size: 'large',
      placement: 'top',
      color: self.isButton ? self.jsonBuilderHelper.getJSONBuilt().embedTextColor : self.jsonBuilderHelper.getJSONBuilt().embedLinkColor,
      onchange: function (container, color) {
        self.jsonBuilderHelper.getJSONBuilt().embedTextColor = '#' + color.tiny.toHex();
        self.jsonBuilderHelper.getJSONBuilt().embedLinkColor = '#' + color.tiny.toHex();
        self.updateEmbedCode();
      }
    });
  }

  toggleDrawer() {
    localStorage.setItem('template', JSON.stringify(this.jsonBuilderHelper.getJSONBuilt()));
    this.iFrameUrl = environment.PROTOCOL + this.appExt + (this.builderService.isDemo ? '/preview-demo/previewFrame' : '/preview/previewFrame');
    jQuery('#drawerIframe')[0].contentWindow.location.reload(true);
    setTimeout(() => {
      jQuery("#drawerIframe").toggleClass("hide");
      jQuery("#close-drawer").toggleClass("hide");
      jQuery(".fancybox-drawer").toggleClass("hide");
      jQuery('html').css('overflow', 'hidden');

    }, 3000);
  }

  togglePopup() {
    this.iFrameUrl = environment.PROTOCOL + this.appExt + (this.builderService.isDemo ? '/preview-demo/previewFrame' : '/preview/previewFrame');
    localStorage.setItem('template', JSON.stringify(this.jsonBuilderHelper.getJSONBuilt()));
    jQuery('html').css('overflow', 'hidden');

  }

  drawerClose() {
    jQuery("#drawerIframe").toggleClass("hide");
    jQuery("#close-drawer").toggleClass("hide");
    jQuery(".fancybox-drawer").toggleClass("hide");
    jQuery('html').css('overflow', 'initial');
  }

  ngOnInit() {
    this.loaderJs = '//dyv6f9ner1ir9.cloudfront.net/assets/js/nploader.js';
    this.tempName = this.jsonBuilderHelper.getJSONBuilt().template;
    if (environment.LIVE_PROTOCOL === 'https://') {
      if (environment.STATIC_DOMAIN) {
        this.srcUrl = 'https://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      } else {
        this.srcUrl = 'https://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      }
    } else {
      if (environment.STATIC_DOMAIN) {
        this.srcUrl = '//' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      } else {
        this.srcUrl = '//' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
      }
    }
    jQuery('.fancybox').fancybox();
    jQuery(".fancybox-effects-d").fancybox({
      padding: 0, openEffect: 'elastic',
      openSpeed: 150, closeEffect: 'elastic',
      closeSpeed: 150, closeClick: true,
      afterShow: function () {
        jQuery('html').css('overflow', 'hidden');
      },
      afterClose: function () {
        jQuery('html').css('overflow', 'scroll');
      }
    });
    this.updateEmbedCode();
    this.headerHelpText = `Turn off your header so that your ${this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? 'calculator' : this.jsonBuilderHelper.getJSONBuilt().templateType == 'Poll' ? 'poll' : 'quiz'} can fit seamlessly into your site.`;
    this.footerHelpText = `Turn off your footer so that your ${this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? 'calculator' : this.jsonBuilderHelper.getJSONBuilt().templateType == 'Poll' ? 'poll' : 'quiz'} can fit seamlessly into your site.`;
  }

  embedSelect(className: any) {
    let self: any = this;
    let copyCode: any = '';
    copyCode = self.iframeData;
    if (this.jsonBuilderHelper.isClipboardSupported) {
      // clipboard.copy(copyCode);
      let self = this;
      new Clipboard('.embed2', {
        text: function (trigger) {
          return copyCode;
        }
      });
      window.toastNotification('Copied to Clipboard');
      setTimeout(() => {
        var el = document.getElementsByClassName(className)[0];
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }, 0);
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

  updateColor($event: any, type: any) {
    if (type === 'embedLinkColor') {
      this.jsonBuilderHelper.getJSONBuilt().embedLinkColor = $event.target.value;
      this.jsonBuilderHelper.getJSONBuilt().embedTextColor = $event.target.value;
    } else if (type === 'embedBgColor') {
      this.jsonBuilderHelper.getJSONBuilt().embedBgColor = $event.target.value;
    }
  }

  embedSel(elem) {
    jQuery('.' + elem)[0].click()
  }
}
