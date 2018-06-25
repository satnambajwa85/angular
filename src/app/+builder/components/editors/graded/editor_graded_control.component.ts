import { Util } from './../../../../../config/utils';
import { FroalaService } from './../../../services/froala.service';
import { FeatureAuthService } from './../../../../../shared/services/feature-access.service';
import { ComponentService } from './../../../services/component.service';
import { FormulaService } from './../../../services/formula.service';
import { environment } from './../../../../../../environments/environment';
import { Component, ViewEncapsulation, OnInit, AfterViewInit, OnChanges, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { JSONElement } from '../../../services/JSONElement.service';
import { Section, Page, App, Item } from '@builder/models';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { imgArray } from '../../../models/templateImages.store';

declare var jQuery: any;
declare var e: any;
declare var ga: any;
declare var filestack: any;

@Component({
    selector: 'editor-graded-control',
    templateUrl: './assets/editor_graded_control.component.html',
    encapsulation: ViewEncapsulation.None,
})

export class EditorGradedControl implements AfterViewInit, OnInit, OnChanges, OnDestroy {
    @Input() control: any;
    util: Util;
    width: any = 0;
    showIcon = true;
    helpTextCount: number = 0;
    filePickerKey: any = environment.FILE_PICKER_API;
    HTMLeditor: Boolean = false;
    imgArray: any = [];
    froalaHelpText: any = {};
    froalaCorrect: any = {};
    froalaError: any = {};
    filter: string = '';
    imageType: string = 'jpg';
    showLink: boolean = false;
    showIconsList: boolean = true;
    @ViewChild('froalaCorrectDOM') froalaCorrectDOM: ElementRef;
    @ViewChild('froalaErrorDOM') froalaErrorDOM: ElementRef;

    constructor(public jsonBuilderHelper: JSONBuilder,
        public jsonElementHandler: JSONElement,
        public _builderService: BuilderService,
        public _itemTrackService: JSONItemTracker,
        public formulaService: FormulaService,
        public componentService: ComponentService,
        public _featureAuthService: FeatureAuthService,
        public froalaService: FroalaService
    ) {
        this.util = new Util();
        this.control = jsonBuilderHelper.getSelectedControl();
        this.imgArray = imgArray;
        this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    }

    ngOnInit() {
        this.showIcon = this.control.isIconPresent ? true : false;
        this.HTMLeditor = this._featureAuthService.features.custom_styling.html_editor;
        this.initWysiwyg();
    }

    initWysiwyg() {
        this.froalaHelpText.options = this.froalaCorrect.options = this.froalaError.options = false;
        setTimeout(() => {
            this.froalaHelpText.options = this.froalaService.getOptions({ handler: this.froalaHelpText, isAddVariable: true });
            this.froalaCorrect.options = this.froalaService.getOptions({ handler: this.froalaCorrect, isAddVariable: true });
            this.froalaError.options = this.froalaService.getOptions({ handler: this.froalaError, isAddVariable: true });
        });
        setTimeout(() => {
            this.froalaCorrectDOM && this.util.jQueryWrap(this.froalaCorrectDOM).on('froalaEditor.focus', () => this.componentService.graded.builderMessage = 'correct');
            this.froalaErrorDOM && this.util.jQueryWrap(this.froalaErrorDOM).on('froalaEditor.focus', () => this.componentService.graded.builderMessage = 'incorrect');
        }, 1000);
    }

    ngAfterViewInit() {
        let self = this;
        jQuery('body').on('click', (e: any) => {
            if (!jQuery('.option-icons.open').is(e.target)
                && jQuery('.option-icons.open .btn').has(e.target).length === 0
                && jQuery('.open').has(e.target).length === 0
            )
                jQuery('.option-icons').removeClass('open');

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
        this.newaddphotos();
        jQuery('.optionimage' + i + '').toggleClass('open');
        jQuery('.optionImage' + i + '').addClass('newdesignimg');
    }

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
    }
    updatePlaceholder() {
        if (this.jsonBuilderHelper.isTempName(['inline-temp-new']) && this.jsonBuilderHelper.getJSONBuilt().versioning.resultV2) {
            jQuery('#' + this.control._id)[0].selectize.settings.placeholder = this.control.config.placeholder;
            jQuery('#' + this.control._id)[0].selectize.updatePlaceholder();
        }
    }
    add_Option_In_Dropdown(autoAdd: Boolean = false) {
        let item = new Item, newOption = item.getOption();
        newOption.value = 0;
        if (autoAdd)
            newOption.label = '';
        if (this.jsonBuilderHelper.getJSONBuilt().template === 'template-six' || this.jsonBuilderHelper.getJSONBuilt().template === 'template-eight') {
            newOption.imageURL = 'https://cdn.filestackcontent.com/m5ovgp6OTaGFDRFk8dRJ';
        }
        this.control.options.push(newOption);
        this.jsonBuilderHelper.updateFormGroup();
        setTimeout(() => this.setImageSize(), 10);
    }

    delete_Option_From_Items(options: any, index: any) {
        options.splice(index, 1);
        setTimeout(() => this.setImageSize(), 10);
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

    ShowIcon() {
        this.showIcon = true;
        this.control.isIconPresent = true;
        this.control.optionImageVisible = false;
        for (let option of this.control.options)
            option.icon = option.previousIcons.length ? option.previousIcons[option.previousIcons.length - 1] : '';
        setTimeout(() => this.setImageSize(), 10);
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

    onChangeControl() {
        if (this.jsonBuilderHelper.getSelectedControl().type === 'checkbox')
            this.jsonBuilderHelper.changeControl('radio_button');
        else
            this.jsonBuilderHelper.changeControl('checkbox');
    }

    changeIcon(option: any, event: any) {
        option.icon = event.target.value;
        /*store previously selected Icons*/
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
        // this.initMessageWysiwygs();
        this.initWysiwyg();
        // this.autoDeleteEmptyOptions();
        this.showIcon = this.control.isIconPresent ? true : false;
    }

    onKeyDown(index: any, $event: any) {
        if ($event.keyCode == 9 && this.control.options.length == index + 1)
            this.add_Option_In_Dropdown(false);
    }

    uploadImage(control: any) {
        // Condition for Crop
        // let transformations: any = {};
        // if (this.imageType === 'gif') {
        //     transformations['crop'] = false;
        // } else {
        //     transformations['crop'] = {};
        //     transformations['crop']['force'] = true;
        //     transformations['crop']['aspectRatio'] = 4 / 3.5;
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
            // imageMax: [827, 833], /* option image */
            // imageDim: [827, 833],
            // transformations: transformations,
        }).then(function (result) {
            let s3URL = 'https://dlvkyia8i4zmz.cloudfront.net/' + result.filesUploaded[0].key;
            let fileName = result.filesUploaded[0].filename;
            // const fileParams = fileName.split('.');
            // if (self.imageType === 'gif') {
            //     fileName = fileParams[0] + '.gif';
            // } else {
            //     if (fileParams[1] === 'gif') {
            //         fileName = fileParams[0] + '.jpg';
            //     }
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

    move_option_up(index: any) {
        this.control.options[index] = this.control.options.splice(index - 1, 1, this.control.options[index])[0];
    }

    move_option_down(index: any) {
        this.control.options[index] = this.control.options.splice(index + 1, 1, this.control.options[index])[0];
    }

    ngOnDestroy() {
        jQuery('.helptext-control').froalaEditor('destroy');
        // this.autoDeleteEmptyOptions();
    }


    isCorrect(option) {
        // if (this.control.type == 'radio_button' || this.control.type == 'selectbox')
        //     this.control.options.map((option: any) => { option.isCorrect = false; option.value = 0; });
        option.isCorrect = !option.isCorrect;
        option.value = option.isCorrect ? 1 : 0;
    }

    onKeyUp(index: any, $event: any) {
        // if (this.control.options.length == index + 1)
        //     this.add_Option_In_Dropdown(true);
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

    setOptionImage(option: any, img: any, event: any) {
        event.stopPropagation();
        event.preventDefault();
        option.imageURL = img.url;
        option.imageName = '';
    }

    filterIcons() {
        if (this.filter == '') {
            this.imgArray = imgArray;
        }
        else {
            this.imgArray = imgArray.filter(i => i.title.includes(this.filter));
        }
    }
}
