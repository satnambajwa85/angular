import { environment } from './../../../../../../../environments/environment';
import { VisualsService } from './../../../../services/visuals.service';
import { Component, Input, ViewEncapsulation, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { ComponentService } from '../../../../services/component.service';
import { FeatureAuthService } from '../../../../../../shared/services/feature-access.service';

declare var jQuery: any;
declare let filestack: any;
declare let bootbox: any;

@Component({
  selector: 'visuals-editor',
  templateUrl: './html/visuals_editor.component.html',
  encapsulation: ViewEncapsulation.None
})

export class VisualsEditorComponent implements AfterViewInit, OnDestroy, OnInit {
  option: any;
  @Input() control: any;
  @Input() controlIndex: number;
  @Input() optionIndex: number;
  @Input() isEnabled: boolean;
  isConditional: boolean = false;
  formulaNow: any;
  isDualGraph: boolean = false;
  toggleOn: boolean = false;
  filePickerKey: any = environment.FILE_PICKER_API;
  types: any = [];
  imageExt: string = 'jpg';
  public videoLink: string;

  constructor(public componentService: ComponentService,
    public jsonBuilderHelper: JSONBuilder,
    public visualsService: VisualsService,
    public _featureAuthService: FeatureAuthService) {
  }

  ngOnInit(): void {
    if (this.jsonBuilderHelper.isTempName(['experian', 'template-seven'])) {
      if (['image', 'video'].indexOf(this.jsonBuilderHelper.getJSONBuilt().formula[0].visuals.type) >= 0) {
        this.jsonBuilderHelper.getJSONBuilt().formula[0].visuals.type = 'graph';
      }
      this.types = this.jsonBuilderHelper.getJSONBuilt().formula[0].visuals.type.split(',');
      this.isDualGraph = true;
    }

    if (this.optionIndex >= 0) {
      this.option = this.control.options[this.optionIndex];
      this.isConditional = true;
      this.formulaNow = this.jsonBuilderHelper.getJSONBuilt().formula[0];
    } else {
      this.formulaNow = this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex];
    }

    if (this.isConditional)
      this.videoLink = this.option.visuals.videoLink || this.option.visuals.youtubeLink || this.option.visuals.videoWistiaLink || this.videoLink;
    else
      this.videoLink = this.formulaNow.visuals.videoLink || this.formulaNow.visuals.youtubeLink || this.formulaNow.visuals.videoWistiaLink || this.videoLink;

    if (this.isConditional)
      this.toggleOn = this.control.options[this.optionIndex].visuals.visible;
    else if (this.formulaNow.visuals.visible && this.formulaNow.visuals.type) {
      this.toggleOn = true;
      if (this.isDualGraph && !this._featureAuthService.features.charts.active) {
        this.formulaNow.visuals.visible = false;
        this.toggleOn = false;
      }
    }
    const imageName = (this.isConditional ? this.option.visuals.imageName : this.formulaNow.visuals.imageName);
    this.imageExt = imageName.split('.').pop();
  }


  isTypes(type: string) {
    return (this.jsonBuilderHelper.isTempName(['experian', 'template-seven']) && this.types.indexOf(type) !== -1);
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
  }

  graph() {
    if (this._featureAuthService.features.charts.active) {
      this.jsonBuilderHelper.updateTemplateQuestionare();
      this.componentService.graph.graphPop = true;
      this.componentService.graph.conditionalIndex = this.isConditional ? this.optionIndex : undefined;
      this.componentService.graph.formulaIndex = this.controlIndex;
    } else {
      this.toggleType('image');
      this._featureAuthService.setSelectedFeature('charts');
      jQuery('.custom_styling').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }

  }

  table() {
    if (this._featureAuthService.features.charts.active) {
      this.jsonBuilderHelper.updateTemplateQuestionare();
      this.componentService.tableExcel.tablePop = true;
    } else {
      this.toggleType('image');
      this._featureAuthService.setSelectedFeature('charts');
      jQuery('.custom_styling').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }

  toggleType(type: string) {
    if (type === 'gif') {
      this.imageExt = 'gif';
      type = 'image';
    } else if (type === 'image') {
      this.imageExt = 'jpg';
    }
    if (this.isEnabled) {
      if (this.isConditional && !this.jsonBuilderHelper.isTempName(['template-seven', 'experian'])) {
        this.option.visuals.type = type;
        this.option.visuals.visible = (type != '');
        if (type === 'image' && this.imageExt === 'gif') {
          this.option.visuals.imageName = `default.gif`;
          this.option.visuals.imageLink = 'https://cdn.filestackcontent.com/4BKw69bMQCmc98E5AP1A';
        } else if (type === 'image' && this.imageExt !== 'gif') {
          this.option.visuals.imageName = `default.jpg`;
          this.option.visuals.imageLink = 'https://dlvkyia8i4zmz.cloudfront.net/DcgzVVEJTPaZYy1WF9s5_img.gif';
        }
      } else {
        if (this.isDualGraph) {
          if (this.types.indexOf(type) === -1) {   //doesnt exist
            this.types.push(type);
            if (type == 'graph') this.graph();
            else if (type == 'table') this.table();
          }
          else {
            if ((this.types.indexOf('graph') == -1 && type == 'table') || this.types.indexOf('table') == -1 && type == 'graph') {
              if (type == 'graph') this.graph();
              else if (type == 'table') this.table();
              return;
            }
            this.types.splice(this.types.indexOf(type), 1);
          }
          this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.type = this.types.toString();
          if (this.jsonBuilderHelper.isTempName(['template-seven', 'experian'])) {
            this.componentService.visualsIniterT7 = false;
            setTimeout(() => this.componentService.visualsIniterT7 = true);
          }
        } else {
          this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.type = type;
          this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.visible = true;
          if (type === 'image' && this.imageExt === 'gif') {
            this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.imageName = `default.gif`;
            this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.imageLink = 'https://cdn.filestackcontent.com/4BKw69bMQCmc98E5AP1A';
          } else if (type === 'image' && this.imageExt !== 'gif') {
            this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.imageName = `default.jpg`;
            this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.imageLink = 'https://dlvkyia8i4zmz.cloudfront.net/DcgzVVEJTPaZYy1WF9s5_img.gif';
          }
          if (type == 'graph') this.graph();
          else if (type == 'table') this.table();
        }
        //this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.visible = (type != '');
      }
      if (this.control.options.filter((option) => option.visuals.visible == true).length) this.control.imageVisible = true;
      else this.control.imageVisible = false;

      // if (type == 'graph' || type == 'table') {
      //   this.componentService.visualsIniter = false;
      //   setTimeout(() => this.componentService.visualsIniter = true, 10);
      // }
    } else {
      bootbox.dialog({
        closeButton: false,
        message: `
                    <div class="bootbox-body-left">
                        <div class="mat-icon">
                           <i class="material-icons">error</i>
                        </div>
                    </div>
                    <div class="bootbox-body-right">
                      <p>You are already using media elements as a part of the conditional messaging settings. You can edit the settings there.</p>
                    </div>
                `,
        buttons: {
          success: {
            label: "OK",
            className: "btn btn-ok btn-hover",
            callback: function () {
              jQuery('#myonoffswitch').attr('checked', false);
            }
          }
        }
      });
    }
  }

  getType(): string {
    if (this.isConditional)
      return this.option.visuals.type
    else
      return this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.type;
  }

  mediaToggle() {

    if (this.isDualGraph && !this._featureAuthService.features.charts.active) {
      this._featureAuthService.setSelectedFeature('charts');
      jQuery('.custom_styling').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      return;
    }
    // (this.getType() == '' || this.getType().length == 0) ?
    //   this.jsonBuilderHelper.isTempName(['experian']) ? this.toggleType('graph') : this.toggleType('image') :
    //   this.toggleType('');

    this.toggleOn = !this.toggleOn;
    if (this.toggleOn) {
      if (this.isConditional && !this.jsonBuilderHelper.isTempName(['template-seven', 'experian'])) this.option.visuals.visible = true;
      else this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.visible = true;
      // if (this.isDualGraph) { 
      //   this.types.push('graph');
      //   this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.type = 'graph';
      // }
      // else this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.type = 'image';
    }
    else {
      //this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.type = '';
      if (this.isConditional && !this.jsonBuilderHelper.isTempName(['template-seven', 'experian'])) this.option.visuals.visible = false;
      else this.jsonBuilderHelper.getJSONBuilt().formula[this.controlIndex].visuals.visible = false;
      //if (this.isDualGraph) this.types = [];
    }
    if (this.control.options.filter(option => option.visuals.visible == true).length) this.control.imageVisible = true;
    else this.control.imageVisible = false;
  }

  UploadImage(type: string) {
    // Condition for Crop
    // let transformations: any = {};
    // if (type === 'gif') {
    //   transformations['crop'] = false;
    // } else {
    //   transformations['crop'] = {};
    //   transformations['crop']['force'] = true;
    //   transformations['crop']['aspectRatio'] = 16 / 7;
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
      // imageMax: [640, 290], /* result image */
      // imageDim: [640, 290],
      // transformations: transformations,
    }).then(function (result) {
      let s3URL = 'https://dlvkyia8i4zmz.cloudfront.net/' + result.filesUploaded[0].key;
      let fileName = result.filesUploaded[0].filename;
      // const fileParams = fileName.split('.');
      // if (type === 'gif') {
      //   fileName = fileParams[0] + '.gif';
      // } else {
      //   if (fileParams[1] === 'gif') {
      //     fileName = fileParams[0] + '.jpg';
      //   }
      // }
      if (self.isConditional) {
        self.option.visuals.imageLink = s3URL;
        self.option.visuals.imageName = fileName;
      } else {
        self.formulaNow.visuals.imageLink = s3URL;
        self.formulaNow.visuals.imageName = fileName;
      }
    });
  }

  videoLinkUpdate() {
    if (this.isConditional)
      this.visualsService.getUpdatedVideoVisuals(this.option.visuals, this.videoLink);
    else
      this.visualsService.getUpdatedVideoVisuals(this.formulaNow.visuals, this.videoLink);
  }
}
