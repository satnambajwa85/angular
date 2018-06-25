import { Component, AfterViewInit, ViewEncapsulation, OnInit } from '@angular/core';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { UrlShortner } from '../../../../services/UrlShortner.service';
import { environment } from '../../../../../../../environments/environment';
import { SubDomainService } from '../../../../../../shared/services/subdomain.service';
declare var jQuery: any;
declare var FB: any;
declare var window: any;
declare var Clipboard: any;
declare var ga: any;
// declare var _kmq: any;
declare var filestack: any;
declare var bootbox: any;

@Component({
  selector: 'config-share-calculator',
  templateUrl: './assets/html/share_calculator.template.html',
  encapsulation: ViewEncapsulation.None
})

export class ConfigShareCalculatorComponent implements AfterViewInit, OnInit {
  filePickerKey: any = environment.FILE_PICKER_API;
  constructor(public jsonBuilderHelper: JSONBuilder, public subDomainService: SubDomainService, public _urlShortner: UrlShortner) { }
  srcUrl: any;
  shortURL: any;
  twitterSrcUrl: any = `https://twitter.com/intent/tweet`;
  linkedInSrcUrl: any = `https://www.linkedin.com/shareArticle?mini=true&url=
   ` + this.srcUrl + `
    &title=Check%20out%20my%20utgrow%20Calculator
                &summary=My%20Awesome%20Calculator&source=LinkedIn`;

  ngOnInit() {
    let letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    let shareTitle = this.jsonBuilderHelper.getJSONBuilt().title.trim() != '' ? this.jsonBuilderHelper.getJSONBuilt().title : this.jsonBuilderHelper.getJSONBuilt().name;
    this.srcUrl = environment.PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt().url;
    this.twitterSrcUrl = `https://twitter.com/intent/tweet?status=` + encodeURI(shareTitle) + `+` + this.srcUrl;
    this.linkedInSrcUrl = `https://www.linkedin.com/shareArticle?mini=true&url=` + this.srcUrl + `?` + letter + `&title=` + encodeURI(shareTitle) + `
                &summary=` + encodeURI(this.jsonBuilderHelper.getJSONBuilt().description) + `&source=LinkedIn`;

    let fbImgUrl = environment.PROTOCOL + 'live' + '.' + environment.APP_EXTENSION + '/seo/' + this.jsonBuilderHelper.getJSONBuilt().url;
    this._urlShortner.googleShortner(fbImgUrl).subscribe(
      body => {
        this.shortURL = body.id;
      }
    );
  }

  copyButton() {
    // clipboard.copy(jQuery('#inputName')[0].value);
    new Clipboard('.copy-btn', {
      text: function (trigger) {
        return jQuery('#inputName')[0].value;
      }
    });
    window.toastNotification('Link Copied');
  }

  ngAfterViewInit() {
    //Initialize FB
    let appid = this.jsonBuilderHelper.checkReplaceFbAppId() ? {
      appId: this.jsonBuilderHelper.getJSONBuilt().fb_app_id, xfbml: true,
      version: 'v2.8'
    } : {
        appId: environment.FB_API, xfbml: true,
        version: 'v2.7'
      }

    window.fbAsyncInit = function () {
      FB.init(appid);
    };

    (function (d: any, s: any, id: any) {
      var js: any, fjs: any = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s);
      js.id = id;
      js.src = "//connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }


  upload() {
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
      self.jsonBuilderHelper.getJSONBuilt().seoImage = s3URL;
      self.jsonBuilderHelper.getJSONBuilt().seoImageName = result.filesUploaded[0].filename;
    });
    /*filepicker.setKey(this.filePickerKey);
    filepicker.pick(
      { mimetypes: ['image/*'], imageQuality: 50 },
      (InkBlob: any) => {
        this.jsonBuilderHelper.getJSONBuilt().seoImage = InkBlob.url;
        this.jsonBuilderHelper.getJSONBuilt().seoImageName = InkBlob.filename;
      },
      (FPError: any) => {
        console.log(FPError.toString());
      }
    );*/
  }

  facebookShare() {
    // let resultLink = environment.PROTOCOL + this.subDomainService.subDomain.sub_domain + '.' + environment.APP_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt().url;
    let screenShotURL = `http://api.screenshotlayer.com/api/capture?access_key=` + environment.SCREENSHOTLAYER_API + `&url=` + this.shortURL + `&viewport=1200x630&fullpage=1&delay=3`;
    let shareTitle = this.jsonBuilderHelper.getJSONBuilt().title.trim() != '' ? this.jsonBuilderHelper.getJSONBuilt().title : this.jsonBuilderHelper.getJSONBuilt().name;
    let image = this.jsonBuilderHelper.getJSONBuilt().seoImage == '' ? screenShotURL : this.jsonBuilderHelper.getJSONBuilt().seoImage;
    FB.ui({
      method: 'feed',
      display: 'popup',
      name: shareTitle,
      //caption: this.jsonBuilderHelper.getJSONBuilt().name,
      description: this.jsonBuilderHelper.getJSONBuilt().description,
      link: this.srcUrl,
      picture: image
    }, function (response: any) {
    });
  }

  callGA(opt: string) {
    switch (opt) {
      case "COPYLINK":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'CopyLink');
        // _kmq.push(['record', 'Builder Copy Link']);
        break;
      case "FBSHARE":
        ga('markettingteam.send', 'event', 'Builder', 'Share', 'FacebookShare');
        // _kmq.push(['record', 'Builder Facebook Share']);
        break;
      case "LISHARE":
        ga('markettingteam.send', 'event', 'Builder', 'Share', 'LinkedInShare');
        // _kmq.push(['record', 'Builder LinkedIn Share']);
        break;
      case "TSHARE":
        ga('markettingteam.send', 'event', 'Builder', 'Share', 'TwitterShare');
        // _kmq.push(['record', 'Builder Twitter Share']);
        break;
    }
  }
}
