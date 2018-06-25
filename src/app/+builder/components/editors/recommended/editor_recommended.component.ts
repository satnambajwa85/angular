import { EditorService } from './../../../services/editor.service';
import { FroalaService } from './../../../services/froala.service';
import { FormulaService } from './../../../services/formula.service';
import { FeatureAuthService } from './../../../../../shared/services/feature-access.service';
import { Component, ViewEncapsulation, Input, AfterViewInit, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { JSONElement } from '../../../services/JSONElement.service';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { Section, Page, App, Item } from '@builder/models';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { RecommendationService } from '../../../../templates/services/recommendation.service';
import { environment } from './../../../../../../environments/environment';
import { ShareOutcomeService } from './../../../services/shareOutcome.service';
import { imgArray } from '../../../models/templateImages.store';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;
declare var window: any;
declare var filestack: any;

@Component({
    selector: 'editor-recommendation',
    templateUrl: './assets/html/editor_recommended.component.html',
    encapsulation: ViewEncapsulation.None
})

export class EditorRecommended implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() control: any;
    options: any;
    width: any = 0;
    showIcon = true;
    selectInputs: any[] = [];
    currentControl: any;
    loader: boolean = false;
    inviteList: any = [];
    filePickerKey: any = environment.FILE_PICKER_API;
    imgArray: any = [];
    froalaHelpText: any = {};
    filter: string = '';
    imageType: string = 'jpg';
    showLink: boolean = false;
    showIconsList: boolean = true;
    constructor(
        public jsonBuilderHelper: JSONBuilder,
        public jsonElementHandler: JSONElement,
        public _builderService: BuilderService,
        public _ItemTrackService: JSONItemTracker,
        public recommendationService: RecommendationService,
        public _outcomeService: ShareOutcomeService,
        public _featureAuthService: FeatureAuthService,
        public formulaService: FormulaService,
        public froalaService: FroalaService,
        public _editorService: EditorService
    ) {
        this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
        this.control = jsonBuilderHelper.getSelectedControl();
        this.imgArray = imgArray;
    }

    ngOnInit() {
        this.currentControl = this.control;
        this.showIcon = this.control.isIconPresent ? true : false;
        this.jsonBuilderHelper.outcome_selectize_init.subscribe((control) => {
            // console.log('inside init');
            if (control) {
                // console.log('Control is: ', control);
                this.control = control;
                this.afterViewInitSelectizeInit();
                this.jsonBuilderHelper.outcome_selectize_init.next(null);
            }
        });
    }

    afterViewInitSelectizeInit() {
        let self = this;
        this.intializeSelectize();
        jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
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
    ngAfterViewInit() {
        this.afterViewInitSelectizeInit();
        this.initWysiwyg();
    }

    intializeSelectize() {
        this.inviteList = this.recommendationService.getAvailableOptions();
        let self = this;
        let index = 0;
        try {
            jQuery('.selectizer.' + this.control._id).each(function () {
                jQuery(this).selectize({
                    options: self.inviteList,
                    delimiter: ',',
                    closeAfterSelect: true,
                    plugins: ['remove_button'],
                    valueField: 'value',
                    labelField: 'name',
                    searchField: ['value', 'name'],
                    create: function (input: any) {
                        self.recommendationService.updateformulaObject();
                        if (!self.recommendationService.formulaResults[input.replace(/[^A-Z0-9]+/ig, "_")]) {
                            self.addOptionAndRefresh(input);
                            window.toastNotification('New Outcome Added');
                        }
                        return { value: input.replace(/[^A-Z0-9]+/ig, "_"), name: input };
                    },
                    // onItemAdd: function () {
                    //     jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
                    //     this.close();
                    //     this.blur();
                    //     self.removeDropdown(100);
                    // },
                    onItemRemove: function () {
                        jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
                        self.removeDropdown(100);
                    },
                    onChange: function (value: any) {
                        if (value) {
                            value = value.map(
                                (formula: any) => {
                                    formula = formula.replace(/[^A-Z0-9]+/ig, "_");
                                    return formula;
                                }
                            );
                        }
                        self.control.options[this['$input'][0]['id'].split("_").pop()].value = (value) ? value.toString() : '';
                        jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
                        this.blur();
                    },
                    onFocus: function () {
                        let id = this['$input'][0]['id'] ? ('#' + this['$input'][0]['id']) : '';
                        jQuery('select' + id + '.selectized').parent().find('input').prop({ 'placeholder': 'Type new or select below' });
                    },
                    onBlur: function () {
                        jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
                    }
                });
                self.selectInputs.push(jQuery(this)[0]);
                // console.log('Controll in jquery is: ', self.control.options, index, jQuery('.selectizer.' + this.control._id)[0]);
                jQuery(this)[0].selectize.setValue(self.control.options[index].value.split(','));
                index++;
            });
        }
        catch (err) {
            window.errorToast('Oops, looks like something went wrong. Try connecting in few moments. ');
        }


        // for (let index = 0; index < this.control.options.length; index++) {
        //     jQuery('.selectizer.' + this.control._id).selectize({
        //         options: self.inviteList,
        //         delimiter: ',',
        //         closeAfterSelect: true,
        //         plugins: ['remove_button'],
        //         valueField: 'value',
        //         labelField: 'name',
        //         searchField: ['value', 'name'],
        //         create: function (input: any) {
        //             self.recommendationService.updateformulaObject();
        //             if (!self.recommendationService.formulaResults[input.replace(/[^A-Z0-9]+/ig, "_")]) {
        //                 self.addOptionAndRefresh(input);
        //                 window.toastNotification('New Outcome Added');
        //             }
        //             return { value: input.replace(/[^A-Z0-9]+/ig, "_"), name: input };
        //         },
        //         // onItemAdd: function () {
        //         //     jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
        //         //     this.close();
        //         //     this.blur();
        //         //     self.removeDropdown(100);
        //         // },
        //         onItemRemove: function () {
        //             jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
        //             self.removeDropdown(100);
        //         },
        //         onChange: function (value: any) {
        //             if (value) {
        //                 value = value.map(
        //                     (formula: any) => {
        //                         formula = formula.replace(/[^A-Z0-9]+/ig, "_");
        //                         return formula;
        //                     }
        //                 );
        //             }
        //             self.control.options[this['$input'][0]['id'].split("_").pop()].value = (value) ? value.toString() : '';
        //             jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
        //             this.blur();
        //         },
        //         onFocus: function () {
        //             var id = '#' + this['$input'][0]['id'];
        //             jQuery('select' + id + ' + .selectize-control').find('input').prop({ 'placeholder': 'Type new or select below' });
        //         },
        //         onBlur: function () {
        //             jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
        //         }
        //     });
        //     self.selectInputs.push(jQuery(jQuery('.selectizer.' + this.control._id)[0]));
        //     // console.log('Controll in jquery is: ', self.control.options, index, jQuery('.selectizer.' + this.control._id)[0]);
        //     jQuery('.selectizer.' + this.control._id)[0].selectize.setValue(self.control.options[index].value.split(','));
        // }
        this.loader = false;
    }

    slectizeInit(index: any) {

    }


    addOptionAndRefresh(input: any) {
        this.jsonBuilderHelper.getJSONBuilt().addformula(input, input.replace(/[^A-Z0-9]+/ig, "_"),
            'https://dlvkyia8i4zmz.cloudfront.net/DcgzVVEJTPaZYy1WF9s5_img.gif', 'Outcome description will come here',
            '', 'Button Text', (environment.PROTOCOL + environment.APP_EXTENSION), 'true');
        for (let select in this.selectInputs) {
            this.selectInputs[select].selectize.addOption({ value: input.replace(/[^A-Z0-9]+/ig, "_"), name: `${this.jsonBuilderHelper.getJSONBuilt().formula.length}. ${input}` });
            this.selectInputs[select].selectize.refreshOptions(false);
        }
        this.removeDropdown(100);
        /** select first if its forst outcome */
        if (this.jsonBuilderHelper.getJSONBuilt().formula.length == 1)
            this._outcomeService.setSelectedFormula(this.jsonBuilderHelper.getJSONBuilt().formula[0]);
    }
    removeDropdown(time: any) {
        setTimeout(function () {
            jQuery('.selectizer .selectize-dropdown').hide();
            jQuery('.selectizer .selectize-input').removeClass('focus input-active dropdown-active');
            jQuery('.selectizer div.selectize-input > input').blur();
        }, time);
    }
    ngOnChanges() {
        console.log('changes',this.currentControl,this.control);
        let self = this;
        if ((this.currentControl != this.control) && this.currentControl != undefined) {
            this.currentControl = this.control;
            self.loader = true;
            try {
                for (let select of this.selectInputs) {
                    select.selectize.destroy();
                }
            }
            catch (err) {
                window.errorToast('Oops, looks like something went wrong. Try connecting in few moments. ');
            }
            this.selectInputs = [];
            setTimeout(function () {
                self.intializeSelectize();
            }, 1);
        }
        this._ItemTrackService.resetUnsavedData();
        this._ItemTrackService.setUnSavedItems(this.control);
        jQuery('.selectizer + .selectize-control').find('input').prop({ 'placeholder': 'Map to an outcome' });
        this.initWysiwyg();
        this.showIcon = this.control.isIconPresent ? true : false;
    }

    initWysiwyg() {
        this.froalaHelpText.options = false;
        setTimeout(() => {
            this.froalaHelpText.options = this.froalaService.getOptions({ handler: this.froalaHelpText, isAddVariable: true });
        });
    }

    seAsDefault(options: any, option: any) {
        for (let option of options) {
            if (option.defualtselected === true) {
                option.defualtselected = false;
            }
        }
        option.defualtselected = true;
    }
    setImageSize() {
        let noImg = 4, cwidth = 24;
        let tempName = this.jsonBuilderHelper.getJSONBuilt().template;
        if (tempName === 'one-page-card-new' || tempName === 'one-page-card-oldresult') {
            noImg = 3; cwidth = 32.33;
        }
        for (let item in this.jsonBuilderHelper.getQuestionsList()) {
            if (this.jsonBuilderHelper.getQuestionsList()[item] === this.control) {
                console.log("true");
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

    None() {
        this.HideIcon();
        this.control.optionImageVisible = false;
        setTimeout(() => { this.setImageSize(); }, 10);
    }
    updatePlaceholder() {
        if (this.jsonBuilderHelper.isTempName(['inline-temp-new']) && this.jsonBuilderHelper.getJSONBuilt().versioning.resultV2) {
            jQuery('#' + this.control._id)[0].selectize.settings.placeholder = this.control.config.placeholder;
            jQuery('#' + this.control._id)[0].selectize.updatePlaceholder();
        }
    }
    add_Option_In_Dropdown() {
        let item = new Item;
        if (this.control.type == 'selectbox') {
            let getOption: any = item.getOption();
            getOption.value = (this.control.options.length + 1).toString();//this.jsonBuilderHelper.getJSONBuilt().formula[0].value;
            getOption.hashIndex = this.control.options.length;
            if (this.jsonBuilderHelper.getJSONBuilt().template === 'template-six' || this.jsonBuilderHelper.getJSONBuilt().template === 'template-eight') {
                getOption.imageURL = 'https://cdn.filestackcontent.com/m5ovgp6OTaGFDRFk8dRJ';
            }
            this.control.options.push(getOption);
            this.jsonBuilderHelper.updateFormGroup();
            jQuery('#' + this.control._id)[0].selectize.addOption({ value: getOption.hashIndex, text: getOption.label });
            jQuery('#' + this.control._id)[0].selectize.refreshOptions(false);
        }
        else if (this.control.type == 'radio_button' || this.control.type == 'checkbox') {
            let getOption: any = item.getOption();
            getOption.value = (this.control.options.length + 1).toString();
            if (this.jsonBuilderHelper.getJSONBuilt().template === 'template-six' || this.jsonBuilderHelper.getJSONBuilt().template === 'template-eight') {
                getOption.imageURL = 'https://cdn.filestackcontent.com/m5ovgp6OTaGFDRFk8dRJ';
            }
            this.control.options.push(getOption);
            this.jsonBuilderHelper.updateFormGroup();
        }
        console.log(this.control.options);
        this.reInitSelectizer();
        //this.setImageSize();
        let self = this;
        setTimeout(function () { self.setImageSize(); }, 10);
    }

    reInitSelectizer() {
        this.loader = true;
        let self = this;
        for (let select of this.selectInputs) {
            select.selectize.destroy();
        }
        this.selectInputs = [];
        setTimeout(function () {
            self.intializeSelectize();
            jQuery('.side-scroll').animate({ scrollTop: jQuery(document).height() }, 50);
        }, 10);
    }

    delete_Option_From_Items(options: any, index: any) {
        if (this.control.type == 'selectbox') {
            jQuery('#' + this.control._id)[0].selectize.removeOption(options[index].hashIndex);
            jQuery('#' + this.control._id)[0].selectize.refreshOptions();
            for (let option in options) {
                if (option > index) {
                    jQuery('#' + this.control._id)[0].selectize.updateOption(options[option].hashIndex, { value: options[option].hashIndex - 1, text: options[option].label });
                    options[option].hashIndex = options[option].hashIndex - 1;
                }
            }
        }
        options.splice(index, 1);
        this.reInitSelectizer();
        let self = this;
        setTimeout(function () { self.setImageSize(); }, 10);
    }

    onChangeDescription() {
        this.control.config.showHelp = !this.control.config.showHelp;
        let helpText = this.control.props.helpText;
     helpText = helpText.replace(/&nbsp;|<\/?p[^>]*>/ig,"").trim();
    if(this.control.config.showHelp && helpText == "") {
      this.control.props.helpText = "This is question help text";
    }
        if (this.control.config.showHelp) {
            this.initWysiwyg();
            jQuery('.show-check').parents('.type-details').find('.div-check').fadeIn('slow');
        } else {
            jQuery('.show-check').parents('.type-details').find('.div-check').fadeOut('slow');
        }
    }

    onChange(control: any) {
        control.config.validations.required.status = !control.config.validations.required.status;
        this.jsonBuilderHelper.updateFormGroup();
    }

    onOptionLabelChange(option: any) {
        if (this.control.type == 'selectbox') {
            jQuery('#' + this.control._id)[0].selectize.updateOption(option.hashIndex, { value: option.hashIndex, text: option.label });
        }
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
            maxSize: 10485760,
            accept: 'image/*',
            // imageMax: [827, 833], /* option image */
            imageDim: [827, 833],
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
    }

    move_option_up(index: any) {
        this.control.options[index].hashIndex--;
        this.control.options[index - 1].hashIndex++;
        this.control.options[index] = this.control.options.splice(index - 1, 1, this.control.options[index])[0];
        if (this.control.type == 'selectbox') {
            jQuery('#' + this.control._id)[0].selectize.updateOption(index, { value: this.control.options[index].hashIndex, text: this.control.options[index].label });
            jQuery('#' + this.control._id)[0].selectize.updateOption(index - 1, { value: this.control.options[index - 1].hashIndex, text: this.control.options[index - 1].label });
            jQuery('#' + this.control._id)[0].selectize.refreshOptions();
        }
    }

    move_option_down(index: any) {
        this.control.options[index].hashIndex++;
        this.control.options[index + 1].hashIndex--;
        this.control.options[index] = this.control.options.splice(index + 1, 1, this.control.options[index])[0];
        if (this.control.type == 'selectbox') {
            jQuery('#' + this.control._id)[0].selectize.updateOption(index, { value: this.control.options[index].hashIndex, text: this.control.options[index].label });
            jQuery('#' + this.control._id)[0].selectize.updateOption(index + 1, { value: this.control.options[index + 1].hashIndex, text: this.control.options[index + 1].label });
            jQuery('#' + this.control._id)[0].selectize.refreshOptions();
        }
    }

    ngOnDestroy() {
        jQuery('.helptext-control').froalaEditor('destroy');
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
    OpenChangeIcon(i: any) {
        jQuery('.choose-icon').parents('.iconopen' + i + '').toggleClass('open');
    }

    OpenPreviousIcon(i: any) {
        if (jQuery(".option-icons").hasClass('open')) {
            jQuery('.option-icons').removeClass('open');
        }
        jQuery('.optionicon' + i + '').toggleClass('open');
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