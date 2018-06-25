import { EditorService } from './../../../services/editor.service';
import { environment } from './../../../../../../environments/environment';
import { Title } from '@angular/platform-browser';
import { ConditionalResultComponent } from './../page/component/conditional_result_editor.component';
import { CompanyService } from './../../../../../shared/services/company.service';
import { PollService } from './../../../../templates/services/poll.service';
// import { Item } from './../../../models/item.model';
import { PoweredByComponent } from './../../../../templates/controls/footer/poweredby.component';
import { BuilderService } from './../../../services/builder.service';
import { Component, OnInit, OnChanges, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { TemplateSwitching } from '../../../services/templateSwitching.service';
import { JSONElement } from '../../../services/JSONElement.service';
import { ThemingService } from '../../../../templates/services/theming.service';
import { FeatureAuthService } from '../../../../../shared/services/feature-access.service';
import { THEMING_FONTS } from '../../../../templates/services/theming.store';
import { DashboardService } from '../../../../../shared/services/dashboard.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { SubDomainService } from '../../../../../shared/services/subdomain.service';
import { App } from '../../../models/app.model';

declare var jQuery: any;
declare var ga: any;
declare var bootbox: any;
declare var filestack: any;
declare var tinycolor: any;

@Component({
    selector: 'global_settings',
    templateUrl: './assets/html/global_settings.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class GlobalSettingsComponent implements OnInit, OnChanges, AfterViewInit {
    editorControl: any = {
        click_button: {},
        logo: {},
        leadform: {},
        poweredby: {},
        footer_links: {},
        header_links: {}
    };
    switchType1 = {};
    switchType2 = {};
    switchType3 = {}
    switchType4 = {}
    switchType1Access: boolean = true;
    switchType2Access: boolean = true;
    switchType3Access: boolean = true;
    switchType4Access: boolean = true;
    num: string = '';
    text: string = '';
    public colordot: string;
    public themePalettes: any;
    RGBcolor: any = '';
    tempType: string = '';
    tempName: string;
    changeTempAccess: number = 0;
    public isRealTimeResult: Boolean = false;
    realTimeResultList: any = [];

    switchExp: boolean = true;
    template: string = '';
    customColorBlock: number = 0;
    filePickerKey: any = environment.FILE_PICKER_API;
    public isTintAccessible: Boolean = true;
    public isCustomFontAvailable: Boolean = false;
    public isCustomColorAvailable: Boolean = false;
    page: any;
    questionPage: any;
    fonts: any[] = THEMING_FONTS;
    coltype = '';
    isLtdPlan: Boolean = false;
    Dimensions = {
        'one-page-card-new': '5800px 3800px',
        'one-page-card-oldresult': '5800px 3800px',
        'one-page-card': '5800px 3800px',
        'sound-cloud-new': '5800px 3800px',
        'sound-cloud-v3': '5800px 3800px',
        'template-seven': '5800px 3800px',
        'sound-cloud': '5800px 3800px',
        'inline-temp-new': '5800px 3800px',
        'inline-temp': '5800px 3800px',
        'experian': '5800px 3800px',
        'template-five': '365px 480px',
        'template-five-oldresult': '365px 480px',
        'template-six': '700px 220px',
        'template-eight': '570px 480px'
    }
    isFreelancerLtdPlan: Boolean = false;
    experienceType: any;
    constructor(public jsonBuilderHandler: JSONBuilder,
        public _jsonElementService: JSONElement,
        public themingService: ThemingService,
        public _featureAuthService: FeatureAuthService,
        public _TemplateSwitching: TemplateSwitching,
        public router: Router,
        public _dashboardService: DashboardService,
        public _itemTrackService: JSONItemTracker,
        public builderService: BuilderService,
        public _subdomainService: SubDomainService,
        public _pollService: PollService,
        public _CompanyService: CompanyService,
        public _editorService: EditorService
    ) {

        this.experienceType = {
            graded: true,
            numerical: true,
            poll: true,
            recommendation: true,
            ecom: true
        };
        this.page = jsonBuilderHandler.getJSONBuilt().pages[0];
        this.questionPage = jsonBuilderHandler.getJSONBuilt().pages[1];
        for (let section in this.page.sections) {
            for (let item in this.page.sections[section].items) {
                for (let prop in this.editorControl) {
                    if (prop === this.page.sections[section].items[item].type)
                        this.editorControl[prop] = this.page.sections[section].items[item];
                }
            }
        }
        let footerSection = jsonBuilderHandler.getPage('Result').sections.find(s => s.type == 'Page_Footer');
        if (footerSection) {
            this.editorControl.footer_links = footerSection.items.find(i => i.type == 'footer_links');
        }
        this.tempName = jsonBuilderHandler.getJSONBuilt().template;
        if (!jsonBuilderHandler.editors('RTL')) {
            this.fonts = this.fonts.filter(font => font.fontFamily != 'afarat_ibn_bladyregular');
        }
        if (this._subdomainService.currentCompany.billing.chargebee_plan_id === 'ltd_d') {
            this.isLtdPlan = true;
        }
        if (this._subdomainService.currentCompany.billing.chargebee_plan_id === 'freelancer-ltd_y') {
            this.isFreelancerLtdPlan = true;
        }
    }
    toggleHeaderLinks() {
        this.editorControl.header_links.visible = !this.editorControl.header_links.visible;
        this.jsonBuilderHandler.commonEmitter.emit('Header Footer');
        this._itemTrackService.resetUnsavedData();
        this._itemTrackService.setUnSavedItems(this.editorControl.header_links);
    }
    toggleFooterLinks() {
        this.editorControl.footer_links.visible = !this.editorControl.footer_links.visible;
        this.jsonBuilderHandler.commonEmitter.emit('Header Footer');
        this._itemTrackService.resetUnsavedData();
        this._itemTrackService.setUnSavedItems(this.editorControl.footer_links);
    }
    ngOnInit() {
        if (!this.jsonBuilderHandler.isEmpty(this.editorControl.footer_links)) {
            if (!this.editorControl.footer_links.columneLayout || this.editorControl.footer_links.columneLayout == '') {
                this.editorControl.footer_links.columneLayout = '1';
            }
        }

        // this._featureAuthService.features.custom_styling.custom_tints = false;
        // this.RGBcolor = tinycolor(this.jsonBuilderHandler.getJSONBuilt().theme.bgColor);
        // this.RGBcolor.toRgbString();
        this.num = Math.round(((this.jsonBuilderHandler.getJSONBuilt().theme.tint) * 100)).toString();
        this.isCustomFontAvailable = this._featureAuthService.features.custom_styling.active;
        this.isCustomColorAvailable = this._featureAuthService.features.custom_styling.predefined_color_themes;

        // get palletes
        this.themePalettes = this._jsonElementService.gettemplatePalettes(this.jsonBuilderHandler.getJSONBuilt().template);
        this.themePalettes.pallete = this.themePalettes.pallete.filter(pal => this.jsonBuilderHandler.isTempType(pal.subType));
        if(this.tempName == 'sound-cloud-v3' || this.tempName == 'one-page-card-new' || this.tempName == 'template-five') {
            if((this.themePalettes.pallete.length>3)&&this.jsonBuilderHandler.getJSONBuilt().version == 'V_3_5'){
                this.themePalettes.pallete = this.themePalettes.pallete.slice(3)
            } else{
                this.themePalettes.pallete = this.themePalettes.pallete.slice(0,3)
            }    
        }
        this.isRealTimeResult = this._featureAuthService.features.real_time_results.active;
        this.initRealTimeResult();
        /*For tabbing*/
        jQuery('.type-details-head').on('click', function () {
            jQuery(this).parent().toggleClass('tab-collapse');
        });
        /* For tabbing end */
        // if (!this._featureAuthService.features.custom_styling.custom_tints) {
        //     this.jsonBuilderHandler.getJSONBuilt().theme.tintToggle = false;
        // }
        this.tempType = this.jsonBuilderHandler.getJSONBuilt().templateType;
        // change layout access
        this.changeTempAccess = this.jsonBuilderHandler.template(this.tempType).length;
        // change experience access
        if (this.tempType === 'Numerical') {
            this.switchType1 = { 'text': 'OUTCOME QUIZ', 'changeTo': 'Recommendation' };
            this.switchType2 = { 'text': 'GRADED QUIZ', 'changeTo': 'Graded' };
            this.switchType3 = { 'text': 'POLL', 'changeTo': 'Poll' };
            this.switchType4 = { 'text': 'ECOM', 'changeTo': 'Ecom' };
        }
        if (this.tempType === 'Recommendation') {
            this.switchType1 = { 'text': 'CALCULATOR', 'changeTo': 'Numerical' };
            this.switchType2 = { 'text': 'GRADED QUIZ', 'changeTo': 'Graded' };
            this.switchType3 = { 'text': 'POLL', 'changeTo': 'Poll' };
            this.switchType4 = { 'text': 'ECOM', 'changeTo': 'Ecom' };
        }
        if (this.tempType === 'Graded') {
            this.switchType1 = { 'text': 'OUTCOME QUIZ', 'changeTo': 'Recommendation' };
            this.switchType2 = { 'text': 'CALCULATOR', 'changeTo': 'Numerical' };
            this.switchType3 = { 'text': 'POLL', 'changeTo': 'Poll' };
            this.switchType4 = { 'text': 'ECOM', 'changeTo': 'Ecom' };

        }
        if (this.tempType === 'Poll') {
            this.switchType1 = { 'text': 'OUTCOME QUIZ', 'changeTo': 'Recommendation' };
            this.switchType2 = { 'text': 'CALCULATOR', 'changeTo': 'Numerical' };
            this.switchType3 = { 'text': 'GRADED QUIZ', 'changeTo': 'Graded' };
            this.switchType4 = { 'text': 'ECOM', 'changeTo': 'Ecom' };

        }
        if (this.tempType === 'Ecom') {
            this.switchType1 = { 'text': 'OUTCOME QUIZ', 'changeTo': 'Recommendation' };
            this.switchType2 = { 'text': 'CALCULATOR', 'changeTo': 'Numerical' };
            this.switchType3 = { 'text': 'GRADED QUIZ', 'changeTo': 'Graded' };
            this.switchType4 = { 'text': 'POLL', 'changeTo': 'Poll' };

        }
        this.switchType1Access = this.jsonBuilderHandler.templatesTypes(this.switchType1['changeTo']);
        this.switchType2Access = this.jsonBuilderHandler.templatesTypes(this.switchType2['changeTo']);
        this.switchType3Access = this.jsonBuilderHandler.templatesTypes(this.switchType3['changeTo']);
        this.switchType4Access = this.jsonBuilderHandler.templatesTypes(this.switchType4['changeTo']);
        this.switchExp = this.isSingleExp();



        this._featureAuthService.getFeatures().subscribe(f => {
            if (f.length) {
                let experiences = f.filter((feature) => {
                    if (feature._id == 'experiences')
                        return feature;
                });
                if (Array.isArray(experiences) && experiences.length > 0) {
                    experiences[0].sub_features.forEach((sf) => {
                        if (sf._id == 'graded')
                            this.experienceType.graded = sf.active;
                        else if (sf._id == 'numerical')
                            this.experienceType.numerical = sf.active;
                        else if (sf._id == 'poll')
                            this.experienceType.poll = sf.active;
                        else if (sf._id == 'recommendation')
                            this.experienceType.recommendation = sf.active;
                    });
                }
            }
        });
    }
    isSingleExp() {
        let access = [this.switchType1Access, this.switchType2Access, this.switchType3Access,this.switchType4Access].filter(x => x).length;
        return (access === 1 || access === 0) ? false : true;
    }
    getSwitchText(type: any) {
        this.text = {
            'Numerical': 'Please note that certain calculator layouts do not support features like outcome mapping, logic jump, graphs and question images. Hence, switching to a calculator may result in loss of data.',
            'Recommendation': 'Please note that certain quiz layouts do not support features like logic jump, graphs, formulas and question images. Hence, switching to a quiz may result in loss of data.',
            'Graded': 'Please note that graded quiz do not support formulas. Hence, switching to a graded quiz may result in loss of data.',
            'Poll': 'Please note that switching to any other experience type may result in loss of data.',
            'Ecom': 'Please note that switching to any other experience type may result in loss of data.'
        }[type];
    }
    onRealTimeChange() {
        this.isRealTimeResult = true;
        if (this.isRealTimeResult) {
            this.jsonBuilderHandler.getJSONBuilt().realTime = !this.jsonBuilderHandler.getJSONBuilt().realTime;
        } else {
            this._featureAuthService.setSelectedFeature('real_time_results');
            jQuery('.real_time_results').addClass('activegreen limited-label');

            this._editorService.showPremiumPopup();
            this.jsonBuilderHandler.getJSONBuilt().realTime = false;
        }
    }
    selectRealTime(value) {
        this.jsonBuilderHandler.getJSONBuilt().realTimeResult = value;
    }
    initRealTimeResult() {
        this.realTimeResultList = [];
        let self = this;
        this.jsonBuilderHandler.getJSONBuilt().formula.map((d, i) => self.realTimeResultList.push('R' + (i + 1)));
    }
    getChangeTemplateText(type: any) {
        return {
            'Numerical': `Please note that certain calculator layouts do not support features like outcome mapping, 
                                logic jump, header, footer, graphs and question images. Hence, switching the layout may result in loss of data.`,
            'Recommendation': `Please note that certain quiz layouts do not support features like logic jump, 
                                graphs, header, footer, formulas and question images. Hence, switching the layout may result in loss of data.`,
            'Graded': `Please note that certain Graded quiz layouts do not support features like logic jump, 
                                graphs, header, footer, formulas and question images. Hence, switching the layout may result in loss of data.`,
            'Poll': `Please note that certain Poll layouts do not support features like logic jump, 
                                graphs, header, footer, formulas and question images. Hence, switching the layout may result in loss of data.`,
            'Ecom': `Please note that certain Ecom layouts do not support features like logic jump, 
                                graphs, header, footer, formulas and question images. Hence, switching the layout may result in loss of data.`
        }[type];
        // if (type === 'Numerical') {
        //     return `Please note that certain calculator layouts do not support features like outcome mapping, 
        //     logic jump, header, footer, graphs and question images. Hence, switching the layout may result in loss of data.`;
        // } else if (type === 'Recommendation') {
        //     return `Please note that certain quiz layouts do not support features like logic jump, 
        //     graphs, header, footer, formulas and question images. Hence, switching the layout may result in loss of data.`;
        // } else if (type === 'Poll') {
        //     return `Please note that certain Poll layouts do not support features like logic jump, 
        //     graphs, header, footer, formulas and question images. Hence, switching the layout may result in loss of data.`;
        // } else {
        //     return `Please note that certain Graded quiz layouts do not support features like logic jump, 
        //     graphs, header, footer, formulas and question images. Hence, switching the layout may result in loss of data.`;
        // }
    }

    premiumPopup() {
        jQuery('#premiumModal').modal('show');
        jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }

    changeCalcType(switchTo: string) {
        if (!this.experienceType.numerical && switchTo == 'Numerical') {
            this._featureAuthService.setSelectedFeature('experiences', switchTo.toLowerCase());
            this.premiumPopup();
        } else if (!this.experienceType.recommendation && switchTo == 'Recommendation') {
            this._featureAuthService.setSelectedFeature('experiences', switchTo.toLowerCase());
            this.premiumPopup();
        } else if (!this.experienceType.graded && switchTo == 'Graded') {
            this._featureAuthService.setSelectedFeature('experiences', switchTo.toLowerCase());
            this.premiumPopup();
        } else if (!this.experienceType.poll && switchTo == 'Poll') {
            this._featureAuthService.setSelectedFeature('experiences', switchTo.toLowerCase());
            this.premiumPopup();
        } else {
            this.getSwitchText(switchTo);
            let self = this;
            bootbox.dialog({
                size: 'small',
                message: `
                        <div class="bootbox-body-left">
                            <div class="mat-icon">
                                <i class="material-icons">error</i>
                            </div>
                        </div>
                        <div class="bootbox-body-right">
                            <p class="">` + this.text + `</p>
                        </div>
                `,
                buttons: {
                    cancel: {
                        label: "Cancel",
                        className: "btn-cancel btn-cancel-hover"
                    },

                    success: {
                        label: "Switch Anyway ",
                        className: "btn btn-ok btn-hover",
                        callback: function () {
                            self.changeCalcTypeNow(switchTo); // part-A/step-1
                        }
                    },

                    dSuccess: {
                        label: "Duplicate & Switch",
                        className: "btn btn-ok btn-hover",
                        callback: function () {
                            self.duplicateAndChange(switchTo); // part-B/step-1
                        }
                    }
                }
            });
        }
    }
    // part-B/step-1
    duplicateAndChange(switchTo: string) {
        this._dashboardService.duplicateApp({ id: this.jsonBuilderHandler.getJSONBuilt()._id })
            .subscribe((response: any) => {
                if (jQuery.isEmptyObject(response)) {
                    console.log("Maybe an error");
                }
                else {
                    localStorage.setItem('project', response._id);
                    window.history.replaceState({}, '', '/builder/' + response.url);
                    this.changeNowCalcType(switchTo);
                }
            },
                (error: any) => {
                    if (error.error.code === 'E_USER_LIMIT_EXCEEDED') {
                        this._featureAuthService.setSelectedFeature('Need more calculators?');
                        //jQuery('.calculators').addClass('activegreen limited-label');
                        jQuery('#premiumModal').modal('show');
                        jQuery('.modal-backdrop').insertAfter('#premiumModal');
                        setTimeout(function () {
                            jQuery('.dashboard-toast').fadeOut().animate({ bottom: -60 }, 800, function () { });
                        }, 200);
                    }
                    else {
                        console.log(error);
                    }
                });
    }
    // part-A/step-1
    changeCalcTypeNow(switchTo: string) {
        if (this.jsonBuilderHandler.getJSONBuilt().templateType === 'Poll') {
            this._pollService.resetPolls({ app: this.jsonBuilderHandler.getJSONBuilt()._id, duplicated: false })
                .subscribe(() => {
                    this.changeNowCalcType(switchTo);
                });
        } else {
            this.changeNowCalcType(switchTo);
        }
    }
    //part-A/part-B step-2
    changeNowCalcType(switchTo: string) {
        let app = new App().deserialize(JSON.parse(JSON.stringify(this.jsonBuilderHandler.getJSONBuilt())));
        jQuery('.preloader.john').removeClass('hide');
        this._TemplateSwitching.ntoqChange(switchTo, app).subscribe((response: any) => {
            console.log('template type changes saved', response);
            window.location.reload();

        },
            (error: any) => {
                console.log(error);
            });
    }
    customPalleteApplied() {
        return !this.themePalettes.pallete.find((pallete) => {
            return (
                this.jsonBuilderHandler.getJSONBuilt().theme.componentColor == pallete.components
                &&
                this.jsonBuilderHandler.getJSONBuilt().theme.textColor == pallete.text
                &&
                this.jsonBuilderHandler.getJSONBuilt().theme.bgColor == pallete.backGround
            );
        });
    }

    toggleTint() {
        // this.isTintAccessible = this._featureAuthService.features.background_tints;
        // // if (!this.isTintAccessible) {
        //     jQuery('#premiumModal').modal('show');
        //     jQuery('.modal-backdrop').insertAfter('#premiumModal');
        //     this.jsonBuilderHandler.getJSONBuilt().theme.tintToggle = false;
        // }else {

        if (this._featureAuthService.features.custom_styling.custom_tints) {
            this.jsonBuilderHandler.getJSONBuilt().theme.tintToggle = !this.jsonBuilderHandler.getJSONBuilt().theme.tintToggle;
        } else {
            if (this.jsonBuilderHandler.getJSONBuilt().theme.tintToggle) {
                this.jsonBuilderHandler.getJSONBuilt().theme.tintToggle = false;
            } else {
                this._featureAuthService.setSelectedFeature('custom_styling');
                jQuery('.custom_styling').addClass('activegreen limited-label');
                jQuery('#premiumModal').modal('show');
                jQuery('.modal-backdrop').insertAfter('#premiumModal');
            }
        }
    }
    featureAccessIssue() {
        if (!this._featureAuthService.features.custom_styling.custom_themes) {
            jQuery('.custom_styling').addClass('activegreen limited-label');
            jQuery('#premiumModal').modal('show');
            jQuery('.modal-backdrop').insertAfter('#premiumModal');
        }
    }
    ngAfterViewInit() {
        let self = this;
        //BG Color
        jQuery('.bg-theme-color-picker').ColorPickerSliders({
            sliders: false,
            flat: true,
            swatches: false,
            hsvpanel: true,
            previewformat: 'hex',
            size: 'large',
            placement: 'top',
            color: self.jsonBuilderHandler.getJSONBuilt().customColor.bgColor,
            onchange: function (container, color) {
                self.jsonBuilderHandler.getJSONBuilt().customColor.bgColor = '#' + color.tiny.toHex();
                if (self.customColorBlock === 1) {
                    self.updateThemeColorFromCustomColors('bgColor');
                }
            }
        });
        // //Component Color
        jQuery('.component-theme-color-picker').ColorPickerSliders({
            sliders: false,
            flat: true,
            swatches: false,
            hsvpanel: true,
            previewformat: 'hex',
            size: 'large',
            placement: 'top',
            color: self.jsonBuilderHandler.getJSONBuilt().customColor.componentColor,
            onchange: function (container, color) {
                self.jsonBuilderHandler.getJSONBuilt().customColor.componentColor = '#' + color.tiny.toHex();
                if (self.customColorBlock === 1) {
                    self.updateThemeColorFromCustomColors('componentColor');
                }
            }
        });
        //Text Color
        jQuery('.text-theme-color-picker').ColorPickerSliders({
            sliders: false,
            flat: true,
            swatches: false,
            hsvpanel: true,
            previewformat: 'hex',
            size: 'large',
            placement: 'top',
            color: self.jsonBuilderHandler.getJSONBuilt().customColor.textColor,
            onchange: function (container, color) {
                self.jsonBuilderHandler.getJSONBuilt().customColor.textColor = '#' + color.tiny.toHex();
                if (self.customColorBlock === 1) {
                    self.updateThemeColorFromCustomColors('textColor');
                }
            }
        });

        //Tint Color
        jQuery('.tint-color-picker').ColorPickerSliders({
            sliders: false,
            flat: true,
            swatches: false,
            hsvpanel: true,
            previewformat: 'hex',
            size: 'large',
            placement: 'top',
            color: self.jsonBuilderHandler.getJSONBuilt().theme.tintColor,
            onchange: function (container, color) {
                setTimeout(() => self.jsonBuilderHandler.getJSONBuilt().theme.tintColor = '#' + color.tiny.toHex(), 100);
                self.bindTint();
            }
        });

        jQuery('.text-theme-color').on('click', function () {
            if (self._featureAuthService.features.custom_styling.custom_themes) {
                jQuery('.text-theme-modal').removeClass('hide').siblings('.theme-modal').addClass('hide');
                self.updateThemeColorFromCustomColors('textColor');
            } else {
                self._featureAuthService.setSelectedFeature('custom_styling', 'custom_themes');
                jQuery('.custom_styling').addClass('activegreen limited-label');
                jQuery('#premiumModal').modal('show');
                jQuery('.modal-backdrop').insertAfter('#premiumModal');
            }
        });
        jQuery('.component-theme-color').on('click', function () {
            if (self._featureAuthService.features.custom_styling.custom_themes) {
                jQuery('.component-theme-modal').removeClass('hide').siblings('.theme-modal').addClass('hide');
                self.updateThemeColorFromCustomColors('componentColor');
            } else {
                self._featureAuthService.setSelectedFeature('custom_styling', 'custom_themes');
                jQuery('.custom_styling').addClass('activegreen limited-label');
                jQuery('#premiumModal').modal('show');
                jQuery('.modal-backdrop').insertAfter('#premiumModal');
            }
        });
        jQuery('.bg-theme-color').on('click', function () {
            if (self._featureAuthService.features.custom_styling.custom_themes) {
                jQuery('.bg-theme-modal').removeClass('hide').siblings('.theme-modal').addClass('hide');
                self.updateThemeColorFromCustomColors('bgColor');
            } else {
                self._featureAuthService.setSelectedFeature('custom_styling', 'custom_themes');
                jQuery('.custom_styling').addClass('activegreen limited-label');
                jQuery('#premiumModal').modal('show');
                jQuery('.modal-backdrop').insertAfter('#premiumModal');
            }
        });
        if (this._featureAuthService.features.custom_styling.custom_tints) {
            jQuery('.tint-theme-color').on('click', function () {
                jQuery('.tint-theme-modal').removeClass('hide').siblings('.theme-modal').addClass('hide');

            });
        }
        jQuery(document).click(function (e: any) {
            jQuery('.theme-parent').addClass('hide');
            jQuery('.theme-modal').addClass('hide');
        })
        jQuery(".color-parent-sub").click(function (e: any) {
            e.stopPropagation();
        });

        /* wysiwyg editor */

        jQuery(document).click(function (e: any) {
            jQuery('.theme-parent').addClass('hide');
        })
        // tint
        jQuery('#tint_range').on('input', function () {
            self.num = this.value;
            self.jsonBuilderHandler.getJSONBuilt().theme.tint = Number(self.num) / 100;
            self.bindTint();
        });
        this.bindTint();
    }

    bindTint() {
        let color = tinycolor(this.jsonBuilderHandler.getJSONBuilt().theme.tintColor);
        color.toRgbString();
        color.setAlpha(this.jsonBuilderHandler.getJSONBuilt().theme.tint);
        this.jsonBuilderHandler.getJSONBuilt().theme.tintRGB = color.toRgbString();
        this.themingService.setColors();
    }
    featureCheck() {
        if (!this._featureAuthService.features.custom_styling.custom_tints) {
            jQuery('.custom_styling').addClass('activegreen limited-label');
            jQuery('#premiumModal').modal('show');
            jQuery('.modal-backdrop').insertAfter('#premiumModal');
        }
    }
    toggleBgImage() {
        this.page.bgImageVisible = !this.page.bgImageVisible;
        this._itemTrackService.resetUnsavedData();
        this._itemTrackService.setUnSavedPage(this.page);
        // if (!this.page.bgImageVisible) { this.jsonBuilderHandler.getJSONBuilt().theme.tintToggle = false; }
    }
    toggleQuestionBgImage() {
        this.questionPage.bgImageVisible = !this.questionPage.bgImageVisible;
        this._itemTrackService.resetUnsavedData();
        this._itemTrackService.setUnSavedPage(this.questionPage);
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
            this.editorControl.poweredby.showButton = false;
            this.jsonBuilderHandler.getJSONBuilt().poweredby = true;
        }
        this._itemTrackService.setUnSavedItems(this.editorControl.poweredby);
    }

    toggleAgencyPoweredBy() {
        if (this._featureAuthService.features.custom_branding.allow_agency_branding) {
            this.editorControl.poweredby.showButton = !this.editorControl.poweredby.showButton;
            if (this.editorControl.poweredby.showButton) {
                this.editorControl.poweredby.visible = false;
            }
        } else {
            this._featureAuthService.setSelectedFeature('custom_branding', 'allow_agency_branding');
            jQuery('.custom_branding').addClass('activegreen limited-label');
            jQuery('#premiumModal').modal('show');
            jQuery('.modal-backdrop').insertAfter('#premiumModal');
            this.editorControl.poweredby.visible = true;
            this.editorControl.poweredby.showButton = false;
            this.jsonBuilderHandler.getJSONBuilt().poweredby = true;
        }
    }

    setTempType() {
        localStorage.setItem('temp_type', this.jsonBuilderHandler.getJSONBuilt().templateType);
    }

    fontClick() {
        if (!this._featureAuthService.features.custom_styling.fonts) {
            this._featureAuthService.setSelectedFeature('custom_styling', 'fonts');
            jQuery('.custom_styling').addClass('activegreen limited-label');
            jQuery('#premiumModal').modal('show');
            jQuery('.modal-backdrop').insertAfter('#premiumModal');
        }
    }

    changeFont($event: any) {
        this.isCustomFontAvailable = this._featureAuthService.features.custom_styling.fonts;
        let selectedFont;
        this._featureAuthService.setSelectedFeature('custom_styling', 'fonts');
        if (!this.isCustomFontAvailable) {
            jQuery('.custom_styling').addClass('activegreen limited-label');
            jQuery('#premiumModal').modal('show');
            jQuery('.modal-backdrop').insertAfter('#premiumModal');
            let index;
            for (let i = 0; i < this.fonts.length; i++) {
                if (this.fonts[i].fontFamily === this.jsonBuilderHandler.getJSONBuilt().theme.fontFamily) {
                    index = i;
                    break;
                }
            }
            jQuery('#font-selectbox option[value="' + index + '"]').prop('selected', true);
            selectedFont = this.fonts[index];
        } else {
            selectedFont = this.fonts[$event.target.value];
        }
        this.jsonBuilderHandler.getJSONBuilt().theme.fontURL = selectedFont.fontURL;
        this.jsonBuilderHandler.getJSONBuilt().theme.fontFamily = selectedFont.fontFamily;
        this.themingService.setFonts();

    }

    RTL() {
        this.jsonBuilderHandler.getJSONBuilt().RTL = !this.jsonBuilderHandler.getJSONBuilt().RTL;
    }
    ngOnChanges() {
        this._itemTrackService.resetUnsavedData();
        this._itemTrackService.setUnSavedItems(this.editorControl);

    }
    onURLChange($event: any) {
        let url = $event.target.value;
        if (/^(tel:)/i.test(url)) {
            this.editorControl.poweredby.postfix = url;
            return;
        }
        if (/^(mailto:)/i.test(url)) {
            this.editorControl.poweredby.postfix = url;
            return;
        }
        if (!/^(f|ht)tps?:\/\//i.test(url)) {
            url = "http://" + url;
        }
        this.editorControl.poweredby.postfix = url;
    }

    updateTheming(pallete: any) {
        if (this._featureAuthService.features.custom_styling.predefined_color_themes) {
            jQuery('.custom_box').addClass('hide');
            jQuery('.custom_text').removeClass('hide');
            jQuery('.theme_text').addClass('hide');
            jQuery('.theme_box').removeClass('hide');
            //set class
            this.jsonBuilderHandler.getJSONBuilt().setThemeColor(pallete.themeClass);
            //set colors
            this.jsonBuilderHandler.getJSONBuilt().theme.bgColor = pallete.backGround;
            this.jsonBuilderHandler.getJSONBuilt().theme.componentColor = pallete.components;
            this.jsonBuilderHandler.getJSONBuilt().theme.textColor = pallete.text;
            this.themingService.setColors();
        } else {
            this._featureAuthService.setSelectedFeature('custom_styling', 'predefined_color_themes');
            jQuery('.custom_styling').addClass('activegreen limited-label');
            jQuery('#premiumModal').modal('show');
            jQuery('.modal-backdrop').insertAfter('#premiumModal');
        }
    }

    backgroundModal() {
        if (this._featureAuthService.features.custom_styling.background_image) {
            jQuery('.upload-bg').modal('show');
        } else {
            this._featureAuthService.setSelectedFeature('custom_styling', 'background_image');
            jQuery('.custom_styling').addClass('activegreen limited-label');
            jQuery('#premiumModal').modal('show');
            jQuery('.modal-backdrop').insertAfter('#premiumModal');
        }
    }

    changeVisivility() {
        this.page.visible = !this.page.visible;
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
                self._itemTrackService.resetUnsavedData();
                self._itemTrackService.setUnSavedItems(self.editorControl.logo);
            } else {
                self.page.bgImage = s3URL;
                self.page.bgColor = '';
            }
        });
    }
    updateLogoUrl(url: string) {
        let companyId = this._subdomainService.currentCompany.id;
        this._CompanyService.updateGlobalConfig({ companyId, url }).subscribe((response) => {
            console.log('response', response);
        }, (error) => {
            console.log('global config error', error);
        })
    }
    toggleLogo() {

        this.editorControl.logo.visible = !this.editorControl.logo.visible;
        if (this.editorControl.logo.visible === true) {
            jQuery('.show-check').parents('.type-details').find('.div-check').fadeIn('slow');
            // setTimeout(() => { this.changeSpacing(); }, 100)
        } else {
            jQuery('.show-check').parents('.type-details').find('.div-check').fadeOut('slow');
        }
        this._itemTrackService.resetUnsavedData();
        this._itemTrackService.setUnSavedItems(this.editorControl.logo);
    }
    logoReactSize(size: any) {
        // this.logo_rect_size = size;
        this.editorControl.logo.config.attr.logoClass = size;
        setTimeout(() => { this.changeSpacing(); }, 100)
    }
    changeSpacing() {
        jQuery(".vert").parents('.logo-resizing').addClass("v-padding").removeClass("h-padding");
        jQuery(".horz").parents('.logo-resizing').addClass("h-padding").removeClass("v-padding");

    }
    onNavigateURLChange($event: any) {
        let url = $event.target.value;
        if (/^(tel:)/i.test(url)) {
            this.editorControl.logo.config.direction = url;
            return;
        }
        if (/^(mailto:)/i.test(url)) {
            this.editorControl.logo.config.direction = url;
            return;
        }
        if (!/^(f|ht)tps?:\/\//i.test(url)) {
            url = "http://" + url;
        }
        this.editorControl.logo.config.direction = url;
    }
    changeTemplate() {
        let tempText = this.getChangeTemplateText(this.jsonBuilderHandler.getJSONBuilt().templateType);
        let self = this;
        bootbox.dialog({
            size: 'small',
            message: `
                    <div class="bootbox-body-left">
                        <div class="mat-icon">
                            <i class="material-icons">error</i>
                        </div>
                    </div>
                    <div class="bootbox-body-right">
                        <p class="">` + tempText + `</p>
                    </div>
            `,
            buttons: {
                cancel: {
                    label: "Cancel",
                    className: "btn-cancel btn-cancel-hover"
                },

                success: {
                    label: "Change Anyway",
                    className: "btn btn-ok btn-hover",
                    callback: function () {
                        localStorage.setItem('changeTemplate', 'true');
                        localStorage.setItem('currTemplate', self.jsonBuilderHandler.getJSONBuilt().template);
                        localStorage.setItem('temp_type', self.jsonBuilderHandler.getJSONBuilt().templateType);
                        self.router.navigate(['/templates']);
                    }
                },

                dSuccess: {
                    label: "Duplicate & Change",
                    className: "btn btn-ok btn-hover",
                    callback: function () {
                        localStorage.setItem('changeTemplate', 'true');
                        localStorage.setItem('currTemplate', self.jsonBuilderHandler.getJSONBuilt().template);
                        localStorage.setItem('temp_type', self.jsonBuilderHandler.getJSONBuilt().templateType);
                        jQuery('.dashboard-toast').fadeIn().animate({ bottom: 60 }, 800, function () { });
                        jQuery('.dash-toast-msg').html('Duplicating Calculator, Please Wait...');
                        self._dashboardService.duplicateApp({ id: self.jsonBuilderHandler.getJSONBuilt()._id })
                            .subscribe((response: any) => {
                                if (jQuery.isEmptyObject(response)) {
                                    console.log("this._router.navigate(['/dashboard']);");
                                }
                                else {
                                    localStorage.setItem('project', response._id);
                                    window.history.replaceState({}, '', '/builder/' + response.url);
                                    //this.subs.push(this.getCompanyProjects());
                                    jQuery('.dash-toast-msg').html('Calculator duplicated Successfully');
                                    setTimeout(function () {
                                        jQuery('.dashboard-toast').fadeOut().animate({ bottom: -60 }, 800, function () { });
                                    }, 2000);
                                    self.router.navigate(['/templates']);
                                }
                            },
                                (error: any) => {
                                    if (error.error.code === 'E_USER_LIMIT_EXCEEDED') {
                                        self._featureAuthService.setSelectedFeature('Need more calculators?');
                                        //jQuery('.calculators').addClass('activegreen limited-label');
                                        jQuery('#premiumModal').modal('show');
                                        jQuery('.modal-backdrop').insertAfter('#premiumModal');
                                        setTimeout(function () {
                                            jQuery('.dashboard-toast').fadeOut().animate({ bottom: -60 }, 800, function () { });
                                        }, 200);
                                    }
                                    else {
                                        console.log(error);
                                    }
                                });
                    }
                }
            }
        });
    }
    themeColorPopup(param: any) {
        if (param == 'theme') {
            jQuery('.default-theme-parent').removeClass('hide');
            jQuery('.custom-theme-parent').addClass('hide');
        }
        else if (param == 'custom') {
            this.jsonBuilderHandler.getJSONBuilt().customColor.bgColor = this.jsonBuilderHandler.getJSONBuilt().theme.bgColor;
            this.jsonBuilderHandler.getJSONBuilt().customColor.componentColor = this.jsonBuilderHandler.getJSONBuilt().theme.componentColor;
            this.jsonBuilderHandler.getJSONBuilt().customColor.textColor = this.jsonBuilderHandler.getJSONBuilt().theme.textColor;
            jQuery('.custom_box').removeClass('hide');
            jQuery('.custom_text').addClass('hide');
            jQuery('.theme_text').removeClass('hide');
            jQuery('.theme_box').addClass('hide');
            jQuery('.default-theme-parent').addClass('hide');
        }
        else if (param == 'opacity' && this._featureAuthService.features.custom_styling.custom_tints)
            jQuery('.tint-theme-parent').removeClass('hide');
        else
            jQuery('.custom-theme-parent').removeClass('hide');
        if (this.customColorBlock === 0) {
            this.customColorBlock = 1;
        }
    }

    themeColorClose(palette: any) {
        this.colordot = palette;
        jQuery('.theme-parent').addClass('hide');
    }

    CloseTintModal() {
        jQuery('.theme-modal').addClass('hide');
    }

    CloseThemeModal(type: any) {
        jQuery('.theme-modal').addClass('hide');
        jQuery('.custom_box').removeClass('hide');
        jQuery('.custom_text').addClass('hide');
        jQuery('.theme_text').removeClass('hide');
        jQuery('.theme_box').addClass('hide');
        this.updateThemeColorFromCustomColors(type);
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

    updateThemeColorFromCustomColors(type: any) {
        this._featureAuthService.setSelectedFeature('custom_styling', 'custom_themes');
        this.isCustomColorAvailable = this._featureAuthService.features.custom_styling.custom_themes;
        if (this.isCustomColorAvailable) {
            jQuery('.custom_box').removeClass('hide');
            jQuery('.custom_text').addClass('hide');
            jQuery('.theme_text').removeClass('hide');
            jQuery('.theme_box').addClass('hide');
            if (type === 'all') {
                this.jsonBuilderHandler.getJSONBuilt().theme.bgColor = this.jsonBuilderHandler.getJSONBuilt().customColor.bgColor;
                this.jsonBuilderHandler.getJSONBuilt().theme.componentColor = this.jsonBuilderHandler.getJSONBuilt().customColor.componentColor;
                this.jsonBuilderHandler.getJSONBuilt().theme.textColor = this.jsonBuilderHandler.getJSONBuilt().customColor.textColor;
            } else if (type === 'bgColor') {
                this.jsonBuilderHandler.getJSONBuilt().theme.bgColor = this.jsonBuilderHandler.getJSONBuilt().customColor.bgColor;
            } else if (type === 'componentColor') {
                this.jsonBuilderHandler.getJSONBuilt().theme.componentColor = this.jsonBuilderHandler.getJSONBuilt().customColor.componentColor;
            } else {
                this.jsonBuilderHandler.getJSONBuilt().theme.textColor = this.jsonBuilderHandler.getJSONBuilt().customColor.textColor;
            }
            this.themingService.setColors();
        } else {
            jQuery('.custom_styling').addClass('activegreen limited-label');
            jQuery('#premiumModal').modal('show');
            jQuery('.modal-backdrop').insertAfter('#premiumModal');
        }
    }

    uploadAgencyLogo() {
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
            self.editorControl.poweredby.imageName = result.filesUploaded[0].filename;
            self.editorControl.poweredby.imageURL = s3URL;
        });
    }

    progressBarChange(ev: any) {
        this.jsonBuilderHandler.getJSONBuilt().progressBar['visible'] = ev.target.checked;
        // if(!this.jsonBuilderHandler.getJSONBuilt().progressBar['visible']) {
        //     this.jsonBuilderHandler.getJSONBuilt().progressBar['auto'] = true;
        // }
    }
    progressBarBulletChange(ev: any) {
        this.jsonBuilderHandler.getJSONBuilt().progressBar['bulletStyle'] = ev.target.checked;
    }
}
