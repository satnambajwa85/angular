import { environment } from './../../../../environments/environment';
import { FeatureAuthService } from './../../../shared/services/feature-access.service';
import { ShareOutcomeService } from './shareOutcome.service';
import { Injectable } from '@angular/core';
import { JSONBuilder } from './JSONBuilder.service';
import { Section, Page, App, Item } from '@builder/models';
declare var jQuery: any;
declare var filestack: any;
declare var bootbox: any;
@Injectable()
export class EditorService {
    filePickerKey: any = environment.FILE_PICKER_API;
    public editorControl: any = {
        result_header: {},
        section: {},
        leadform: {},
        click_button: {},
        share_links: {},
        cta_shares: {},
        cta_likes: {},
        result_redo: {},
        backImage: {},
        result_disclaimer: {},
        footer_links: {},
        result_summary: {}
    };
    isNew: boolean = false;
    constructor(public jsonBuilderHelper: JSONBuilder,
        public _featureAuthService: FeatureAuthService,
        public _outcomeService: ShareOutcomeService) {
    }

    setEditorControl(controlIndex?: number) {
        let page: Page = this.jsonBuilderHelper.getSelectedPage();
        let resultSection: Section;
        let leadformSection: Section;
        for (let section in page.sections) {
            for (let item in page.sections[section].items) {
                // check for result outputs
                if (page.sections[section].title === 'Result') {
                    resultSection = page.sections[section];
                    this.jsonBuilderHelper.setSelectedControl(resultSection.items[controlIndex ? controlIndex : 0]);
                }
                if (page.sections[section].type === 'LeadForm') leadformSection = page.sections[section];
                for (let prop in this.editorControl) {
                    if (prop === page.sections[section].items[item].type) this.editorControl[prop] = page.sections[section].items[item];
                }
            }
        }
        return { staticControl: this.editorControl, result: resultSection, leadform: leadformSection }
    }
    /** common fxn s */
    showPremiumPopup() {
        jQuery('#premiumModal').modal('show');
        jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }

    isEmpty(obj: any) {
        if (obj == null || obj.length === 0 || typeof obj !== "object") return true;

        if (obj.length > 0) return false;

        for (var key in obj)
            if (key != '_id' && obj[key] != "") return false;

        return true;
    }

    ctaFeatureCheck() {
        if (!this._featureAuthService.features.custom_branding.edit_cta_text) {
            this._featureAuthService.setSelectedFeature('custom_branding', 'edit_cta_text');
            jQuery('.cta').addClass('activegreen limited-label');
            this.showPremiumPopup();
        }
    }

    ctaCheck(isCtaAccessible: Boolean) {
        isCtaAccessible = this._featureAuthService.features.cta.active;
        if (isCtaAccessible === false) {
            this._featureAuthService.setSelectedFeature('cta');
            jQuery('.cta').addClass('activegreen limited-label');
            this.showPremiumPopup();
        }
    }

    initDisclaimer(isDisclaimers: Boolean) {
        let self = this;
        let options = ['insertLink'];
        if (this._featureAuthService.features.custom_styling.html_editor)
            options.push('|', 'html');
        jQuery('.wysiwyg-disclaimer').froalaEditor({
            heightMax: 250, toolbarButtons: options,
            shortcutsEnabled: ['bold', 'italic', 'underline'],
        })
        jQuery('.wysiwyg-disclaimer').on('froalaEditor.contentChanged', function (e: any, editor: any) {
            self.editorControl.result_disclaimer.props.title = e.currentTarget.value;
        });
        if (!isDisclaimers)
            jQuery('.wysiwyg-disclaimer').froalaEditor('edit.off');
    }
    initRedirectsWysiwyg() {
        let self = this;
        setTimeout(() => {
            /*Redirect URL Wysiwyg -- START*/
            jQuery('.wysiwyg-redirect-url').froalaEditor('destroy');

            jQuery('.wysiwyg-redirect-url').froalaEditor({
                heightMax: 250, toolbarButtons: ['questions'],
            });
            jQuery('.wysiwyg-redirect-url').on('froalaEditor.contentChanged', function (e: any, editor: any) {
                (self.jsonBuilderHelper.isTempType(['Numerical', 'Graded'])) ? (self.editorControl.click_button.props.title = e.currentTarget.value) : (self._outcomeService.getSelectedFormula().units.preValue = e.currentTarget.value);
                if (!self.jsonBuilderHelper.getJSONBuilt().versioning.resultV2) {
                    self.editorControl.leadform.props.title = e.currentTarget.value;
                }
            });
            /*Redirect URL Wysiwyg -- END*/

        }, 100);
    }
    getShareTitle(decoded: any, oldText: any, domElement?: any) {
        let text: any;
        let gText: any;
        if (!this._featureAuthService.features.custom_branding.share_text) {
            if ((new RegExp("\\| via @outgrowco\\b")).test(decoded)) {
                text = decoded;
                gText = decoded;
            } else {
                this._featureAuthService.setSelectedFeature("custom_branding", "share_text");
                this.showPremiumPopup();
                text = oldText;
                (<any>jQuery(domElement.nativeElement)).froalaEditor('html.set', `<p>${oldText}</p>`);
            }
        } else
            text = decoded;
        return { text, gText };
    }

    disclaimerClick(isDisclaimers: Boolean) {
        if (!isDisclaimers) {
            this._featureAuthService.setSelectedFeature('disclaimers');
            jQuery('.disclaimers').addClass('activegreen limited-label');
            this.showPremiumPopup();
        }
    }

    isSocialChecked(socialMedia: any) {
        for (let option in this.editorControl.share_links.options) {
            if (this.editorControl.share_links.options[option].type == socialMedia) {
                return this.editorControl.share_links.options[option].selected;
            }
        }
        return true;
    }

    scrollToTop() {
        if (jQuery('.settings-header').length) {
            var position = jQuery('.settings-header').position().top;
            jQuery('.no-scroll').animate({ scrollTop: position }, 1000);
        }
    }

    validateUrl(validUrl: boolean) {
        var urlregex = /(http(s)?:\\)?([\w-]+\.)+[\w-]+[.com|.in|.org]+(\[\?%&=]*)?/;
        if (urlregex.test(this.jsonBuilderHelper.getJSONBuilt().navigate_Url)) {
            validUrl = true;
        } else {
            validUrl = false;
        }
    }

    onNavigateURLChange($event: any) {
        let url = $event.target.value;
        if (/^(tel:)/i.test(url)) {
            this.jsonBuilderHelper.getJSONBuilt().navigate_Url = url;
            return;
        }
        if (/^(mailto:)/i.test(url)) {
            this.jsonBuilderHelper.getJSONBuilt().navigate_Url = url;
            return;
        }
        if (!/^(f|ht)tps?:\/\//i.test(url)) {
            url = "http://" + url;
        }
        this.jsonBuilderHelper.getJSONBuilt().navigate_Url = url;
    }

    onURLChange($event: any) {
        let url = $event.target.value;
        if (/^(tel:)/i.test(url)) {
            return url;
        }
        if (/^(mailto:)/i.test(url)) {
            return url;
        }
        if (!/^(f|ht)tps?:\/\//i.test(url)) {
            url = "http://" + url;
        }
        return url;
    }

    toggleConditionalCta(type: string, option: any) {
        option.links.cta.ctaVisible = false;
        option.links.share.visible = false;
        option.links.like.visible = false;
        if (type == 'cta_button') {
            option.links.cta.ctaVisible = true;
        } else if (type == 'cta_shares') {
            option.links.share.visible = true;
        } else if (type == 'cta_likes') {
            option.links.like.visible = true;
        }

    }
    toggleCta(type: string, isCtaAccessible: Boolean) {
        this.initRedirectsWysiwyg();
        isCtaAccessible = this._featureAuthService.features.cta.active;
        if (isCtaAccessible && this.jsonBuilderHelper.isTempType(['Numerical', 'Graded', 'Poll', 'Ecom']) || type == 'cta_button') {
            if (type == 'cta_button' && !this._featureAuthService.features.cta.redirect_url) {
                this._featureAuthService.setSelectedFeature('cta', 'redirect_url');
                jQuery('.cta').addClass('activegreen limited-label');
                this.showPremiumPopup();
                return;
            }
            else if (type == 'cta_shares' && !this._featureAuthService.features.cta.shares) {
                this._featureAuthService.setSelectedFeature('cta', 'shares');
                jQuery('.cta').addClass('activegreen limited-label');
                this.showPremiumPopup();
                return;
            }
            else if (type == 'cta_likes' && !this._featureAuthService.features.cta.like_follow) {
                this._featureAuthService.setSelectedFeature('cta', 'like_follow');
                jQuery('.cta').addClass('activegreen limited-label');
                this.showPremiumPopup();
                return;
            }
            if (type == 'nothing') {
                this.editorControl.click_button.visible = false;
                this.editorControl.cta_shares.visible = false;
                this.editorControl.cta_likes.visible = false;
            }
            if (this.jsonBuilderHelper.getJSONBuilt().versioning.resultV2) {
                if (type == 'cta_button')
                    this.editorControl.click_button.visible = !this.editorControl.click_button.visible;
                else if (type == 'cta_shares')
                    this.editorControl.cta_shares.visible = !this.editorControl.cta_shares.visible;
                else if (type == 'cta_likes')
                    this.editorControl.cta_likes.visible = !this.editorControl.cta_likes.visible;
            } else {
                if (type == 'cta_button') {
                    this.editorControl.click_button.visible = !this.editorControl.click_button.visible;
                    this.editorControl.cta_shares.visible = false;
                    this.editorControl.cta_likes.visible = false;
                }
                else if (type == 'cta_shares') {
                    this.editorControl.cta_shares.visible = !this.editorControl.cta_shares.visible;
                    this.editorControl.click_button.visible = false;
                    this.editorControl.cta_likes.visible = false;
                }
                else if (type == 'cta_likes') {
                    this.editorControl.cta_likes.visible = !this.editorControl.cta_likes.visible;
                    this.editorControl.click_button.visible = false;
                    this.editorControl.cta_shares.visible = false;
                }
            }

        } else {
            this._featureAuthService.setSelectedFeature('cta');
            jQuery('.cta').addClass('activegreen limited-label');
            this.showPremiumPopup();
            this.editorControl.cta_shares.visible = false;
            this.editorControl.cta_likes.visible = false;
            this.editorControl.click_button.visible = this.jsonBuilderHelper.getJSONBuilt().versioning.resultV2 ? false : true;
        }
    }

    toggleDisclaimer(isDisclaimers: Boolean) {
        isDisclaimers = this._featureAuthService.features.disclaimers.active;
        if (isDisclaimers) {
            this.editorControl.result_disclaimer.visible = !this.editorControl.result_disclaimer.visible;
        } else {
            if (!this.editorControl.result_disclaimer.visible) {
                this.editorControl.result_disclaimer.visible = true;
            } else {
                this._featureAuthService.setSelectedFeature('disclaimers');
                jQuery('.disclaimers').addClass('activegreen limited-label');
                this.showPremiumPopup();
            }
        }
        setTimeout(() => {
            this.initDisclaimer(isDisclaimers);
        }, 100);
    }

    toggleSocialIcon(socialMedia: any) {
        var flag = false;
        for (let option in this.editorControl.share_links.options) {
            if (this.editorControl.share_links.options[option].type == socialMedia) {
                this.editorControl.share_links.options[option].selected = !this.editorControl.share_links.options[option].selected;
                flag = true;
            }
        }
        if (flag == false) {
            let option = (new Item).getOption();
            option.type = socialMedia;
            option.selected = false;
            this.editorControl.share_links.options.push(option);
        }
    }
    showPopup() {
        bootbox.dialog({
            closeButton: false,
            message: `<button type="button" class="bootbox-close-button close" data-dismiss="modal"
                               aria-hidden="true"><i class='material-icons'>close</i></button>
                            <div class="bootbox-body-left">
                                  <div class="mat-icon">
                                    <i class="material-icons">error</i>
                                  </div>
                              </div>
                              <div class="bootbox-body-right">
                                <p>this question is used in formula,</p>
                                <p>that's why you are unable to uncheck it.</p>
                              </div>
                  `,
            buttons: {
                success: {
                    label: "OK",
                    className: "btn btn-ok btn-hover",
                    callback: function () {
                    }
                }
            }
        });
    }

    checkUrl(url: any) {
        if (!url.trim())
            return '';
        if (/^(tel:)/i.test(url)) {
            return url;
        }
        if (/^(mailto:)/i.test(url)) {
            return url;
        }
        if (!/^(f|ht)tps?:\/\//i.test(url)) {
            url = "http://" + url;
            return url;
        }
        return url;
    }
    uploadSeoImage() {
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
        /*
        filepicker.setKey(filePickerKey);
        filepicker.pick({
            mimetypes: ['image/*'], imageQuality: 50
        }, (InkBlob: any) => {
            this.jsonBuilderHelper.getJSONBuilt().seoImage = InkBlob.url;
            this.jsonBuilderHelper.getJSONBuilt().seoImageName = InkBlob.filename;
        }, (FPError: any) => {
            console.log(FPError.toString());
        });*/
    }
    /** common fxn end s */
}