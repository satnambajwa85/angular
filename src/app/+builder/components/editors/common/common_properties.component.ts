import { environment } from './../../../../../../environments/environment';
import { VisualsService } from './../../../services/visuals.service';
import { FroalaService } from './../../../services/froala.service';
import { Component, ViewEncapsulation, Input, AfterViewInit, OnChanges, OnInit } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { FormulaService } from '../../../services/formula.service';
import { FeatureAuthService } from '../../../../../shared/services/feature-access.service';
declare var jQuery: any;
declare var filestack: any;
declare var observe: any;
@Component({
  selector: 'common-editor',
  templateUrl: './assets/html/common_properties.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class CommonEditor implements AfterViewInit, OnChanges, OnInit {
  @Input() control: any;
  filePickerKey: any = environment.FILE_PICKER_API;
  count: number = 0;
  froalaHeader: any = {};
  froalaFollowUp: any = {};
  videoLink: string;
  ngOnInit() {
    this.videoLink = this.control.video.videoLink || this.control.video.youtubeLink || this.control.video.videoWistiaLink || this.videoLink;
  }

  ngAfterViewInit() {
    setTimeout(function () { jQuery('.ques-title').css('height', jQuery('.ques-title').prop('scrollHeight')); }, 1);
    jQuery('body').on('click', function (e: any) {
      if (!jQuery('.control-images.open').is(e.target)
        && jQuery('.control-images.open .btn').has(e.target).length === 0

        && jQuery('.open').has(e.target).length === 0
      ) {
        jQuery('.control-images').removeClass('open');
      }
    });
  }

  OpenPreviousImage() {
    // if (jQuery(".control-images").hasClass('open')) {
    //   jQuery('.control-images').removeClass('open');
    // }
    // jQuery('.control-images').toggleClass('open');
    jQuery('.control-images').toggleClass('open');
  }

  show(content: string) {
    // false by default for content === 'text'
    this.control.imageVisible = false;
    this.control.video.visible = false;
    if (content === 'image')
      this.control.imageVisible = true;
    else if (content === 'video') {
      this.control.video.visible = true;
      // setTimeout(()=> this.jsonBuilderHelper.videoCheck(true, true), 100);
    }
  }

  constructor(public jsonBuilderHelper: JSONBuilder,
    public formulaService: FormulaService,
    public froalaService: FroalaService,
    public _featureAuthService: FeatureAuthService,
    private visualsService: VisualsService) {
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    this.control = jsonBuilderHelper.getSelectedControl();
  }
  textAreaAdjust(event: any) {
    jQuery('.ques-title2').css('height', jQuery('.ques-title2').prop('scrollHeight'));
  }
  textAreaAdjust1(event: any) {
    jQuery('.ques-title1').css('height', jQuery('.ques-title1').prop('scrollHeight'));
  }
  textEnd(event: any) {
    if (event.keyCode === 10 || event.keyCode === 13)
      event.preventDefault();
  }

  ngOnChanges() {
    this.initWysiwyg();
  }

  initWysiwyg() {
    this.froalaHeader.options = this.froalaFollowUp.options = false;
    setTimeout(() => {
      this.froalaHeader.options = this.froalaService.getOptions({ handler: this.froalaHeader, isAddVariable: true });
      this.froalaFollowUp.options = this.froalaService.getOptions({ handler: this.froalaFollowUp, isAddVariable: true });
    });
  }

  uploadImage(control: any, type: string) {
    // Condition for Crop
    // let transformations: any = {};
    // if (type === 'gif') {
    //   transformations['crop'] = false;
    // } else {
    //   transformations['crop'] = {};
    //   transformations['crop']['force'] = true;
    //   transformations['crop']['aspectRatio'] = 16 / 6;
    // }
    // Filestack V3
    let self: any = this;
    const apikey = this.filePickerKey;
    const client = filestack.init(apikey);
    client.pick({
      storeTo: {
        location: 's3',
        access: 'public'
      },
      maxSize: 10485760,
      accept: 'image/*',
      // imageMax: [833, 240], /* Question image*/
      imageDim: [833, 240],
      // transformations: transformations,
    }).then(function (result) {
      let s3URL = 'https://dlvkyia8i4zmz.cloudfront.net/' + result.filesUploaded[0].key;
      let fileName = result.filesUploaded[0].filename;
      // const fileParams = fileName.split('.');
      // if (self.imageExt === 'gif') {
      //   fileName = fileParams[0] + '.gif';
      // } else {
      //   if (fileParams[1] === 'gif') {
      //     fileName = fileParams[0] + '.jpg';
      //   }
      // }
      control.imageURL = s3URL;
      control.imageName = fileName;
    });
    /*filepicker.setKey(this.filePickerKey);
    filepicker.pick(
      {
        mimetypes: ['image/*'],
        imageQuality: 50
      },
      (InkBlob: any) => {
        control.imageURL = InkBlob.url;
        control.imageName = InkBlob.filename;
        jQuery('#filepicker_dialog_container').find('a').click();
      },
      (FPError: any) => {
        console.log(FPError.toString());
      }
    );*/
  }

  videoLinkUpdate() {
    this.videoLink = this.videoLink.split('&')[0].replace('watch?v=', 'embed/');
    this.visualsService.getUpdatedVideoVisuals(this.control.video, this.videoLink);
    jQuery('#videoId' + this.control._id).attr('src', this.videoLink);
    // this.jsonBuilderHelper.videoCheck(true, true);
  }
  updateVideoLink
}
