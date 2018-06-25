import { Script } from './../../../shared/services/script.service';
import { Injectable, EventEmitter } from '@angular/core';
import { JSONBuilder } from './JSONBuilder.service';
import { Section, Page, App, Item } from '@builder/models';
declare var jQuery: any;
@Injectable()
export class ShareOutcomeService {
    shareLinks: any = {};
    public selectedFormula: any;
    public emitter: EventEmitter<any> = new EventEmitter();
    allFormulas: any[] = [];
    constructor(public _jsonBuilderHelper: JSONBuilder, public _script: Script) {
    }

    setSelectedFormula(formula: any) {
        if (!formula)
            formula = this._jsonBuilderHelper.getJSONBuilt().formula[0];
        let self = this;
        this.selectedFormula = formula;

        if (!this.selectedFormula.visuals)
            this.selectedFormula['visuals'] = { type: 'Image' };
        else if (!this.selectedFormula.visuals.type)
            this.selectedFormula.visuals.type = 'Image';
        if (this.selectedFormula.range.status && this.selectedFormula.visuals.type == 'Video' && this.selectedFormula.visuals.videoWistiaLink != '') {
            jQuery('.wistia_responsive_wrapper').html('');
            jQuery('.wistia_responsive_wrapper').html(`<div class="wistia_embed wistia_async_` + self.selectedFormula.visuals.videoWistiaLink + ` videoFoam=true" style="height:100%;width:100%">&nbsp;</div>`);
            setTimeout(() => {
                self._script.loadScriptFromSrc(`https://fast.wistia.com/embed/medias/${self.selectedFormula.visuals.videoWistiaLink}.jsonp`).then(data => { });
                self._script.loadScriptFromSrc("https://fast.wistia.com/assets/external/E-v1.js").then(data => { });
            });
        }
        this.setResultButtonCTA(formula);
        /** sharelink object init */
        if (this._jsonBuilderHelper.devMode)
            this.setSharelinks();
        else
            formula = this.setShareLikelinks(formula);


        this.emitter.emit('Formula selected');
        // formulav1
        //this._jsonBuilderHelper.setControlChangeDetector(true);
    }

    getEmitter() {
        return this.emitter;
    }


    setResultButtonCTA(formula: any) {
        if (this._jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation' && formula) {
            if (!this._jsonBuilderHelper.getJSONBuilt().versioning.resultV2) {
                this._jsonBuilderHelper.getJSONBuilt().navigate_Url = formula.units.postValue;
            }
            /** set text */
            this._jsonBuilderHelper.getJSONBuilt().pages.map((page: Page) => {
                if (page.type === 'Result') {
                    page.sections.map((section: Section) => {
                        section.items.map((item: Item) => {
                            if (item.type == 'leadform' || item.type == 'click_button') {
                                if (!this._jsonBuilderHelper.getJSONBuilt().versioning.resultV2 && item.config.direction != 'beforeResult') {
                                    item.props.title = formula.units.preValue;
                                }
                            }

                        });
                    });
                }
            })
        }
    }

    getSelectedFormula(): any {
        this.textareaSize((this.selectedFormula != undefined) ? this.selectedFormula._id : '--'); /*DESIGNER FXN */
        return this.selectedFormula;
    }

    setFinalOutcomes(formulas: any[]) {
        formulas = formulas.map((formula: any) => {
            formula.outcome = this.setShareLikelinks(formula.outcome);
            return formula;
        });

        this.allFormulas = formulas;
    }

    getFinalOutcomes(): any[] {
        return this.allFormulas;
    }

    textareaSize(id) {
        var rightHeight = jQuery('.recom-section .outer-main.' + id).height();
        jQuery('.left-sec.' + id).css('height', rightHeight);
    }

    setShareLikelinks(formula) {
        let shareLinks: any = {}, currentFormula;
        if (this._jsonBuilderHelper.getJSONBuilt().recomBased.multipleOutcome)
            currentFormula = this._jsonBuilderHelper.getJSONBuilt().formula[0];
        else
            currentFormula = formula;
        if (currentFormula && currentFormula.links && currentFormula.links.length) {
            currentFormula.links.map((link: any) => {
                if (shareLinks[link.type]) {
                    shareLinks[link.type][link.socialType] = link;
                } else {
                    shareLinks[link.type] = {};
                    shareLinks[link.type][link.socialType] = link;
                }
            });
            this.shareLinks = formula.allLinks = shareLinks;
        }
        return formula;
    }


    setSharelinks() {
        let formula;
        if (this._jsonBuilderHelper.getJSONBuilt().recomBased.multipleOutcome) {
            formula = this._jsonBuilderHelper.getJSONBuilt().formula[0];
        }
        else {
            formula = this.selectedFormula;
        }
        if (formula && formula.links && formula.links.length) {
            formula.links.map((link: any) => {
                if (this.shareLinks[link.type]) {
                    this.shareLinks[link.type][link.socialType] = link;
                } else {
                    this.shareLinks[link.type] = {};
                    this.shareLinks[link.type][link.socialType] = link;
                }
            });
        }
    }

    getSharelinks(): any {
        return this.shareLinks;
    }
}