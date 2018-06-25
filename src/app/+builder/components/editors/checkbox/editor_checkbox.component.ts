import { environment } from './../../../../../../environments/environment';
import { FroalaService } from './../../../services/froala.service';
import { EditorService } from './../../../services/editor.service';
import { FeatureAuthService } from './../../../../../shared/services/feature-access.service';
import { TemplateRendererService } from './../../../../templates/services/templateRenderer.service';
import { Component, ViewEncapsulation, OnInit, AfterViewInit, OnChanges, Input, OnDestroy } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { JSONElement } from '../../../services/JSONElement.service';
import { Section, Page, App, Item } from '@builder/models';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { FormulaService } from '../../../services/formula.service';
import { imgArray } from '../../../models/templateImages.store';

declare var jQuery: any;
declare var e: any;
declare var ga: any;
// declare var _kmq: any;
declare var filestack: any;

declare var UploaderWindow: any;

@Component({
  selector: 'editor-checkbox',
  templateUrl: './assets/html/editor_checkbox.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class EditorCheckbox implements AfterViewInit, OnInit, OnChanges, OnDestroy {
  @Input() control: any;
  inputType: string;
  width: any = 0;
  defaultSelected: any;
  showIcon = true;
  isQuestionInResults: boolean = false;
  filePickerKey: any = environment.FILE_PICKER_API;
  imgArray: any = [];
  filter: string = '';
  lastOption: any;
  imageType: string = 'jpg';
  showLink: boolean = false;
  showIconsList: boolean = true;
  public froalaHelpText: any = {};

  constructor(public jsonBuilderHelper: JSONBuilder,
    public jsonElementHandler: JSONElement,
    public _builderService: BuilderService,
    public _itemTrackService: JSONItemTracker,
    public formulaService: FormulaService,
    public _templateRenderer: TemplateRendererService,
    public _featureAuthService: FeatureAuthService,
    public _editorService: EditorService,
    public froalaService: FroalaService
  ) {
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    this.control = jsonBuilderHelper.getSelectedControl();
    this.inputType = (jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? 'number' : 'text');
    this.imgArray = imgArray;
  }
  ngOnInit() {
    this.showIcon = this.control.isIconPresent ? true : false;
    // Assign Last Option
    this.lastOption = this.control.options[this.control.options.length - 1];
    this.initWysiwyg();
  }

  ngAfterViewInit() {
    let self = this;
    jQuery('body').on('click', function (e: any) {

      if (!jQuery('.option-icons.open').is(e.target)
        && jQuery('.option-icons.open .btn').has(e.target).length === 0

        && jQuery('.open').has(e.target).length === 0
      ) {
        jQuery('.option-icons').removeClass('open');
      }
      if (!jQuery('.option-images.open').is(e.target)
        && jQuery('.option-images.open .btn').has(e.target).length === 0

        && jQuery('.open').has(e.target).length === 0
      ) {
        jQuery('.option-images').removeClass('open');
        self.filter = '';
        self.imgArray = imgArray;
      }
    });
  }
  OpenChangeIcon(i: any) {
    jQuery('.choose-icon').parents('.iconopen' + i + '').toggleClass('open');
  }
  OpenPreviousIcon(i: any) {
    if (jQuery(".option-icons").hasClass('open')) {
      jQuery('.option-icons').removeClass('open');
    }
    jQuery('.optionicon' + i + '').toggleClass('open');
  }
  OpenChangeImage(i: any) {
    jQuery('.choose-image').parents('.imageopen' + i + '').toggleClass('open');
  }
  OpenPreviousImage(i: any) {
    if (jQuery(".option-images").hasClass('open')) {
      jQuery('.option-images').removeClass('open');

    }
    this.newaddphotos()
    jQuery('.optionimage' + i + '').toggleClass('open');
    jQuery('.optionImage' + i + '').addClass('newdesignimg');

  }

  // CloseChangeIcon(i: any) {
  //   jQuery('.choose-icon').parents('.optionicon' + i + '').removeClass('open');
  // }

  CloseChangeIcon(i: any) {
    jQuery('.optionImage' + i + '').addClass('newdesignimg2');
    setTimeout(() => {
      jQuery('.optionImage' + i + '').removeClass('newdesignimg2');
      jQuery('.optionImage' + i + '').removeClass('newdesignimg');
    }, 1000);
  }

  newaddlink() {
    jQuery('.newimgupload-search').addClass('hide');
    jQuery('.newimgupload-scrolbar').addClass('hide');
    jQuery('.newimgupload-addlink').addClass('show');
    this.showLink = true;
    this.showIconsList = false;
  }

  newaddphotos() {
    jQuery('.newimgupload-search').removeClass('hide');
    jQuery('.newimgupload-scrolbar').removeClass('hide');
    jQuery('.newimgupload-addlink').removeClass('show');
    this.showLink = false;
    this.showIconsList = true;
  }



  setImageSize() {
    let noImg = 4, cwidth = 24;
    let tempName = this.jsonBuilderHelper.getJSONBuilt().template;
    if (tempName === 'one-page-card-new' || tempName === 'one-page-card-oldresult') {
      noImg = 3; cwidth = 32.33;
    }
    for (let item in this.jsonBuilderHelper.getQuestionsList()) {
      if (this.jsonBuilderHelper.getQuestionsList()[item] === this.control) {

        if (this.control.optionImageVisible) {
          if (this.jsonBuilderHelper.getQuestionsList()[item].type === 'checkbox' ||
            this.jsonBuilderHelper.getQuestionsList()[item].type === 'radio_button') {
            let width = this.control.options.length;
            if (width > noImg) { width = cwidth; } else { width = (100 / width) - 1; }
            this.control.config.attr.width = width + '%';
            console.log(width, 'widthffffff');
          }
        } else {
          this.control.config.attr.width = '100%';
        }
      }

    }

  }
  optionImageToggle() {
    this.HideIcon();
    this.control.optionImageVisible = true;
    let self = this;
    setTimeout(function () { self.setImageSize(); }, 10);
    this.removeOthersField();
  }
  removeOthersField() {
    let textfieldType = this.control.options.find((option) => option.type == 'textfield');
    if (textfieldType)
      this.control.options.splice(this.control.options.indexOf(textfieldType), 1);
  }
  add_Option_In_Dropdown(autoAdd: Boolean = false) {
    let item = new Item, newOption = item.getOption();
    newOption.value = this.control.options.length + 1;
    newOption.type = '';
    if (autoAdd)
      newOption.label = '';
    if (this.jsonBuilderHelper.getJSONBuilt().template === 'template-six' || this.jsonBuilderHelper.getJSONBuilt().template === 'template-eight') {
      newOption.imageURL = 'https://cdn.filestackcontent.com/m5ovgp6OTaGFDRFk8dRJ';
    }
    if (this.control.options[this.control.options.length - 1].type === 'textfield') {
      this.control.options.splice(this.control.options.length - 1, 0, newOption);
    } else {
      this.control.options.push(newOption);
    }

    this.jsonBuilderHelper.updateFormGroup();
    // Update Last Option
    this.lastOption = this.control.options[this.control.options.length - 1];
    //this.setImageSize();
    let self = this;
    setTimeout(function () { self.setImageSize(); }, 10);
  }
  addOthersField(option: any, event) {
    if (event.target.checked) {
      this.control.options = this.control.options.map((option: any) => { option.type = ''; return option; });
      let item = new Item, newOption = item.getOption();
      newOption.value = this.control.options.length + 1;
      newOption.label = 'Other';
      newOption.type = 'textfield';
      newOption.description = 'Other';
      this.control.options.push(newOption);
    } else {
      this.control.options.splice(this.control.options.indexOf(option), 1);
      // option.type = '';
    }
    this.jsonBuilderHelper.updateFormGroup();
  }
  // addOthersField() {
  //   if (this.control.options[this.control.options.length - 1].type !== 'textfield') {
  //     let item = new Item, newOption = item.getOption();
  //     newOption.type = 'textfield'; newOption.label = 'Others';
  //     newOption.config.placeholder = 'Add description for others';
  //     newOption.value = this.control.options.length + 1;
  //     this.control.options = this.control.options.map((option: any) => { option.type = ''; return option; });
  //     this.control.options.push(newOption);
  //     this.jsonBuilderHelper.updateFormGroup();
  //   }
  // }
  delete_Option_From_Items(options: any, index: any) {
    options.splice(index, 1);
    // Update Last Option
    this.lastOption = this.control.options[this.control.options.length - 1];
    //this.setImageSize();
    let self = this;
    setTimeout(function () { self.setImageSize(); }, 10);
  }
  onChangeDescription(control: any) {
    control.config.showHelp = !control.config.showHelp;
     let helpText = control.props.helpText;
     helpText = helpText.replace(/&nbsp;|<\/?p[^>]*>/ig,"").trim();
    if(control.config.showHelp && helpText == "") {
      control.props.helpText = "This is question help text";
    }
    this.initWysiwyg();
  }
  onChange(control: any) {
    control.config.validations.required.status = !control.config.validations.required.status;
  }
  onChange1(control: any) {
    if (this.isQuestionInResults) {
      this._editorService.showPopup();
    }
  }
  ShowIcon() {
    this.showIcon = true;
    this.control.isIconPresent = true;
    this.control.optionImageVisible = false;
    for (let option of this.control.options) {
      option.icon = option.previousIcons.length ? option.previousIcons[option.previousIcons.length - 1] : '';
    }
    setTimeout(() => { this.setImageSize(); }, 10);
  }
  HideIcon() {
    this.showIcon = false;
    this.control.isIconPresent = false;
    for (let option of this.control.options) {
      option.icon = '';
    }
  }
  None() {
    this.HideIcon();
    this.control.optionImageVisible = false;
    setTimeout(() => { this.setImageSize(); }, 10);
  }
  seAsDefault(options: any, option: any) {

    // if(this.control.type === 'radio_button') {
    for (let option of options) {
      if (option.defualtselected === true) {
        option.defualtselected = false;
      }
      if (option.selected === true) {
        option.selected = false;
      }
    }
    option.defualtselected = true;
    option.selected = true;
    // }else {
    // 	option.defualtselected = !option.defualtselected;
    // }
  }
  UnSet(option: any) {
    option.defualtselected = false;
    option.selected = false;
  }
  onChangeControl() {
    if (this.jsonBuilderHelper.getSelectedControl().type === 'checkbox') {
      this.jsonBuilderHelper.changeControl('radio_button');
    } else {
      this.jsonBuilderHelper.changeControl('checkbox');
    }
  }
  changeIcon(option: any, event: any) {
    option.icon = event.target.value;
    //store previously selected Icons
    //option.previousIcons.push(event.target.value);
    let index = option.previousIcons.indexOf(event.target.value);
    if (index > 0) {
      option.previousIcons.splice(index, 1);
    }
    if (event.target.value !== '') {
      if (option.previousIcons.length > 3) {
        option.previousIcons.splice(0, 1);
        option.previousIcons.push(event.target.value);
      } else {
        option.previousIcons.push(event.target.value);
      }
    }
  }

  ngOnChanges() {
    this._itemTrackService.resetUnsavedData();
    this._itemTrackService.setUnSavedItems(this.control);
    this.initWysiwyg();
    this.showIcon = this.control.isIconPresent ? true : false;
  }

  callGA(str: string, control: any = {}) {
    switch (str) {
      case "HELPTEXT":
        if (control.config.showHelp) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ToggleHelpTextOn');
          // _kmq.push(['record', 'Builder Toggle Help Text On']);
        }
        else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ToggleHelpTextOff');
          // _kmq.push(['record', 'Builder Toggle Help Text Off']);
        }
        break;

      case "TOGGLEICONON":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'IconShow');
        // _kmq.push(['record', 'Builder Icon Show']);
        break;

      case "TOGGLEICONOFF":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'IconHide');
        // _kmq.push(['record', 'Builder Icon Hide']);
        break;

      case "SETDEFAULT":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'SetValueDefault');
        // _kmq.push(['record', 'Builder Set Value Default']);
        break;

      case "UNSETDEFAULT":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'UnsetValueDefault');
        // _kmq.push(['record', 'Builder Unset Value Default']);
        break;

      case "ADDOPTION":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'AddAnotherValue');
        // _kmq.push(['record', 'Builder Add Another Value']);
        break;

      case "DELETEOPTION":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'RemoveValue');
        // _kmq.push(['record', 'Builder Remove Value']);
        break;

      case "MANDATE":
        if (control.config.validations.required.status) {
          ga('markettingteam.send', 'event', 'Builder', 'Check', 'MarkAsMandatory');
          // _kmq.push(['record', 'Builder Mark As Mandatory']);
        }
        else {
          ga('markettingteam.send', 'event', 'Builder', 'Check', 'UnmarkAsMandatory');
          // _kmq.push(['record', 'Builder Unmark As Mandatory']);
        }
        break;
    }
  }

  onKeyDown(index: any, $event: any) {
    if ($event.keyCode == 9 && this.control.options.length == index + 1) {
      this.add_Option_In_Dropdown(false);
    }
  }

  onKeyUp(index: any, $event: any) {
    if (this.control.options.length == index + 1) {
      // this.add_Option_In_Dropdown(true);
    }
  }

  uploadImage(control: any) {
    // Condition for Crop
    // UploaderWindow.open({ apiKey: 'k9OpeEGVXbJgRuqT', accept: 'image/*', forceCrop: true })
    //   .then((urls) => {
    //     let fileName = urls[0].name;
    //     console.log("urls: ", urls)
    //     control.imageURL = urls[0].url;
    //     control.imageName = fileName;
    //   });
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
      // imageMax: [827, 833], /* option image */
      // imageDim: [827, 833],
      // transformations: transformations,
    }).then(function (result) {
      let s3URL = 'https://dlvkyia8i4zmz.cloudfront.net/' + result.filesUploaded[0].key;
      let fileName = result.filesUploaded[0].filename;
      // const fileParams = fileName.split('.');
      // if (self.imageType === 'gif') {
      //   fileName = fileParams[0] + '.gif';
      // } else {
      //   if (fileParams[1] === 'gif') {
      //     fileName = fileParams[0] + '.jpg';
      //   }
      // }
      control.imageURL = s3URL;
      control.imageName = fileName;
    });
  }

  openLogicPopup() {
    if (this._featureAuthService.features.logic_jump.active)
      jQuery('#logic-jump').modal('toggle');
    else {
      this._featureAuthService.setSelectedFeature("logic_jump", null);
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('.modal-backdrop').addClass('added');
    }
  }


  openIconImgSel() {
    // jQuery('#icon_img_selection_pop').modal('hide');
    setTimeout(function () {
      jQuery('#icon_img_selection_pop').modal('show').insertAfter('#icon_img_selection_pop');
      jQuery('.modal-backdrop').insertAfter('#icon_img_selection_pop');
    }, 100);
  }

  move_option_up(index: any) {
    this.control.options[index] = this.control.options.splice(index - 1, 1, this.control.options[index])[0];
    this.lastOption = this.control.options[this.control.options.length - 1];
  }

  move_option_down(index: any) {
    this.control.options[index] = this.control.options.splice(index + 1, 1, this.control.options[index])[0];
    this.lastOption = this.control.options[this.control.options.length - 1];
  }

  ngOnDestroy() {
    this._templateRenderer.computeMinMax();
    jQuery('.helptext-control').froalaEditor('destroy');
    // this.autoDeleteEmptyOptions();
  }

  autoDeleteEmptyOptions() {
    // Auto Delete Default Options from Control
    let options: any = JSON.parse(JSON.stringify(this.control.options));
    let deleteIndex: number = -1;
    for (let option in options) {
      // if (this.control.options[option].label == 'Option' && parseInt(this.control.options[option].value) == parseInt(option) + 1) {
      if (this.control.options.length > 1 && options[option].label === '') {
        deleteIndex++;
        this.delete_Option_From_Items(this.control.options, parseInt(option) - deleteIndex);
      }
    }
  }

  isQuestionInFormula() {
    let quesIndex = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().indexOf(this.jsonBuilderHelper.getSelectedControl());
    this.isQuestionInResults = this.formulaService.isQuestionInResults(quesIndex);
    if (this.isQuestionInResults) {
      this.control.config.validations.required.status = true;
      return true;
    }
    return false;
  }

  setOptionImage(option: any, img: any, event: any) {
    option.imageURL = img.url;
    option.imageName = '';
    event.preventDefault();
    event.stopPropagation();
  }

  filterIcons() {
    if (this.filter == '') {
      this.imgArray = imgArray;
    }
    else {
      this.imgArray = imgArray.filter(i => i.title.includes(this.filter));
    }
  }

  initWysiwyg() {
    this.froalaHelpText.options = false;
    setTimeout(() => {
      this.froalaHelpText.options = this.froalaService.getOptions({ handler: this.froalaHelpText, isAddVariable: true });
    });
  }

  getImgType(option: any, type: string) {
    const imageName = option.imageName;
    const imageExt = imageName.split('.').pop();
    if (type === 'jpg') {
      if (imageExt !== 'gif') {
        return true;
      }
    }
    if (type === 'gif') {
      if (imageExt === 'gif') {
        return true;
      }
    }
    return false;
  }
}
