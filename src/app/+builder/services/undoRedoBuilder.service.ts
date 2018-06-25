import { JSONBuilder } from './JSONBuilder.service';
import { Injectable, ApplicationRef } from '@angular/core';
import { Section, Page, App, Item } from '@builder/models';
import { TemplateValidatorService } from '../../templates/services/templateValidator.service';
import { BuilderService } from './builder.service';
import { ThemingService } from './../../templates/services/theming.service';
import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx';

declare var jQuery: any;

@Injectable()

export class UndoRedo {
    undo_stack: any = [];
    redo_stack: any = [];
    undoRedoAppData: App = null;
    itemNotChnagedField: any = ['_id', 'setResulTTitle', 'setItemType', 'setCurrentValue', 'setFormulaIndex', 'setVisibility', 'setScale', 'setLeadPlaceholder', 'setOptionImageVisibility', 'qustionImageVisibility', 'setTitle', 'setPostTitle', 'setHelptext', 'setPlaceHolder', 'setOptions', 'getField', 'getOption', 'addOptions', 'addFieldToCheckbox', 'addLinksToFooter', 'deserialize', 'updateTextFieldForT7', 'setResultLeadformPosition'];
    FormulaUndoRedoSet: Subject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(private jsonBuilderHelper: JSONBuilder, private tvs: TemplateValidatorService,
        private _applicationRef: ApplicationRef, private themingService: ThemingService,
        private _builderService: BuilderService) { }

    initRedoUndoStack() {
        this.undo_stack = [];
        this.redo_stack = [];
        this.undoRedoAppData = null;
    }

    undoFunction() {
        if (this.undo_stack.length > 1) {
            let redoData = JSON.parse(this.undo_stack[0]);
            this.redo_stack.unshift(JSON.stringify(redoData));// move current app data to redo stack
            let appData = JSON.parse(this.undo_stack[1]);
            this.setAppData(appData);// Set last data
            this.undo_stack.splice(0, 1);
        }
    }

    redoFunction() {
        if (this.redo_stack.length > 0) {
            let undoData = JSON.parse(this.redo_stack[0]);
            this.undo_stack.unshift(JSON.stringify(undoData));
            let appData = JSON.parse(this.redo_stack[0]);
            this.setAppData(appData);
            this.redo_stack.splice(0, 1);
        }
    }

    setUndoStack(app: any) {
        if (app && this.jsonBuilderHelper.getJSONBuilt() && this.jsonBuilderHelper.getJSONBuilt()._id) {
            if (!this.undo_stack.length) {
                this.undo_stack[0] = app;
            } else {
                if (this.undo_stack[0] != app) {
                    this.undo_stack.unshift(app);
                }
            }
        }
    }

    setRedoStack(app) {
        if (!this.redo_stack.length) {
            this.redo_stack[0] = app;
        } else {
            this.redo_stack.unshift(app);
        }
    }

    setAppData(appData: any) {
        for (let key in this.jsonBuilderHelper.getJSONBuilt()) {
            if (key == '_id' || key == 'pages' || key == 'login' || key == 'user_id' || key == 'user_name' || key == 'socket_id' || (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' && key == 'formula')) {
                continue;
            } else {
                this.jsonBuilderHelper.getJSONBuilt()[key] = appData[key] || this.jsonBuilderHelper.getJSONBuilt()[key];
            }
        }
        this.themingService.setColors();
        this.themingService.setFonts();
        this.undoRedoAppData = appData;
        this.updatePages(appData.pages);
    }

    updatePages(updatePages: any) {
        for (let pages of updatePages) {
            let i = 0;
            for (let page of this.jsonBuilderHelper.getJSONBuilt().pages) {
                if (pages._id == page._id && JSON.stringify(page) != JSON.stringify(pages)) {
                    for (let pageKey in page) {
                        if (['addSections', 'deserialize', '_id'].findIndex(d => d == pageKey) != -1) {
                            continue;
                        } else if (pageKey == 'sections') {
                            this.setSectionOfAPage(i, pages.sections);
                        } else {
                            this.jsonBuilderHelper.getJSONBuilt().pages[i][pageKey] = pages[pageKey] || this.jsonBuilderHelper.getJSONBuilt().pages[i][pageKey];
                        }
                    }
                    break;
                }
                i++;
            }
        }
    }

    setSectionOfAPage(pageIndex: any, updateSections: any) {
        let j = 0;
        for (let section of this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections) {
            let selectSection = updateSections.find(d => d._id == section._id);
            let selectSectionIndex = updateSections.findIndex(d => d._id == section._id);
            if (selectSection && JSON.stringify(selectSection) != JSON.stringify(section)) {
                for (let sectionKey in section) {
                    if (['_id', 'addItems', 'setVisibilityOfShowDesc', 'setVisibility', 'deserialize'].findIndex(d => d == sectionKey) != -1) {
                        continue;
                    } else if (sectionKey == 'items') {
                        this.setItemOfASection(pageIndex, j, selectSection.items);
                    } else {
                        this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[j][sectionKey] = selectSection[sectionKey]; //|| this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[j][sectionKey];
                    }
                }
            }
            if (selectSection && selectSectionIndex != j) {
                this.swapSection(j, selectSectionIndex, pageIndex);
            }
            j++;
        }
    }

    swapSection(section1Index, section2Index, pageIndex) {
        let temp = this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[section1Index];
        this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[section1Index] = this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[section2Index];
        this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[section2Index] = temp;
        this.jsonBuilderHelper.setQuestionsData();
    }

    swapItem(item1Index, item2Index, pageIndex, sectionIndex) {
        let temp = this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[item1Index];
        this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[item1Index] = this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[item2Index];
        this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[item2Index] = temp;
        this.jsonBuilderHelper.setQuestionsData();
    }

    setItemOfASection(pageIndex: any, sectionIndex: any, updateItems: any) {
        if (this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items.length != updateItems.length) {
            this.deleteOrAddItemUndoRedo(pageIndex, sectionIndex, updateItems);
        } else {
            this.redoUndoSetValues(pageIndex, sectionIndex, updateItems);
        }
    }

    deleteOrAddItemUndoRedo(pageIndex: any, sectionIndex: any, updateItems: any) {
        if (updateItems.length > this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items.length) {
            let x = -1;
            for (let item of updateItems) {
                ++x;
                let index = this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items.findIndex(d => d._id == item._id);
                if (index == -1 && item.type != 'custom_html') {
                    let newItem = new Item().deserialize(item);
                    this._builderService.addUndoItem(newItem).subscribe(data => {
                        this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items.splice(x, 0, newItem);
                        this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? this.FormulaUndoRedoSet.next(true) : '';
                        //set question data
                        this.jsonBuilderHelper.setQuestionsData();
                        
                        this.tvs.updateFormGroup(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex]);
                        this._applicationRef.tick();
                    }, err => console.log('Iteam add error: ', err));
                    break;
                }
            }
        } else if (updateItems.length < this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items.length) {
            let x = -1;
            for (let item of this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items) {
                ++x;
                let index = updateItems.findIndex(d => d._id == item._id);
                if (index == -1 && item.type != 'custom_html') {
                    this._builderService.deleteUndoItem(item._id).subscribe(data => {
                        this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items.splice(x, 1);
                        this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? this.FormulaUndoRedoSet.next(true) : '';
                        //set question data
                        this.jsonBuilderHelper.setQuestionsData();

                        this.tvs.updateFormGroup(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex]);
                        this._applicationRef.tick();
                    }, err => console.log('Delete add error: ', err));
                    break;
                }
            }
        }
    }

    redoUndoSetValues(pageIndex: any, sectionIndex: any, updateItems) {
        let k = 0;
        for (let item of this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items) {
            let selectItem = updateItems.find(d => d._id == item._id);
            let selectedItemIndex = updateItems.findIndex(d => d._id == item._id);
            if (selectItem && JSON.stringify(selectItem) != JSON.stringify(item)) {
                // if (item.type != selectItem.type && selectItem.type != 'leadform') {
                //     Object.assign(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k], selectItem);
                // } else {
                for (let itemKey in item) {
                    if (this.itemNotChnagedField.findIndex(d => d == itemKey) != -1) {
                        continue;
                    } else {
                        this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k][itemKey] = selectItem[itemKey];// || this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k][itemKey];
                    }
                    // }
                }
                // console.log('K is: ', k);
                // this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k].video.visible ? this.jsonBuilderHelper.videoCheck(true, true) : '';
                this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? this.FormulaUndoRedoSet.next(true) : '';
                //dropdown init....
                if (selectItem.type && selectItem.type == 'selectbox') {
                    let dir = 'down';
                    if (this.jsonBuilderHelper.getJSONBuilt().template === 'template-six') {
                        dir = this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k].options && this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k].options.length > 10 ? 'up' : 'auto';
                    }
                    jQuery('#' + selectItem._id).selectize({
                        allowEmptyOption: true,
                        dropdownDirection: dir
                    });
                    // console.log('inside 1', selectItem.type, k);
                    this.tvs.updateFormGroup(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex]);
                    this.jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation' ? this.initSelectizeForOutcome(pageIndex, sectionIndex, k) : '';
                    this.jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation' ? this.tvs.updateFormGroup(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex]) : '';
                } else if (selectItem.type && selectItem.type == 'leadform') {
                    // Re Init dropdown in lead form
                    let field = selectItem.fields.find(d => d.subType == 'dropdown');
                    if (field) {
                        setTimeout(() => {
                            jQuery('#' + field.key).selectize({
                                //options: [{ 'label': 'Default Option', 'value': 'Default Option' }],
                                allowEmptyOption: true,
                                labelField: 'label',
                                placeholder: field.placeholder
                            });
                            // jQuery('#' + field.key)[0].selectize.setValue('Default Option');
                            // jQuery('.selectize-input input').prop('disabled', true);
                            if (jQuery(window).width() < 768) {
                                jQuery('.selectize-input input').prop('disabled', true);
                            }
                            this.tvs.updateFormGroup(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex]);
                        }, 200);
                    }
                    if ((this.jsonBuilderHelper.getSelectedSection().type == 'Content Area' || this.jsonBuilderHelper.getSelectedSection().type == 'LeadForm') && this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k].visible) {
                        this.jsonBuilderHelper.setSelectedPage(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex]);
                        this.scrollIt('.page_' + pageIndex, this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].type);
                        this.jsonBuilderHelper.setSelectedSection(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex]);
                        this.jsonBuilderHelper.setSelectedModel("Section");
                        this.jsonBuilderHelper.setSelectedControl(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k]);
                    }
                } else if (selectItem.type != 'textfield' && selectItem.type != 'rating' && this.jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation') {
                    // console.log('inside 2', selectItem.type, k, this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k]);
                    this.tvs.updateFormGroup(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex]);
                    this.initSelectizeForOutcome(pageIndex, sectionIndex, k);
                }
                else {
                    this.tvs.updateFormGroup(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex]);
                }
            }
            if (selectItem && k != selectedItemIndex) {
                this.swapItem(k, selectedItemIndex, pageIndex, sectionIndex);
            }
            k++;
            this._applicationRef.tick();
        }
    }

    initSelectizeForOutcome(pageIndex, sectionIndex, k) {
        // console.log('call');
        setTimeout(() => this.jsonBuilderHelper.outocmeSelectizeSubjectEmit(this.jsonBuilderHelper.getJSONBuilt().pages[pageIndex].sections[sectionIndex].items[k]), 300);
    }
    updateFormula() {
        let app = new App().deserialize(this.undoRedoAppData);
        Object.assign(this.jsonBuilderHelper.getJSONBuilt().formula, app.formula);
        this.FormulaUndoRedoSet.next(false);
    }
    scrollIt(bindingClass1: string, innerText?: string) {
        if (jQuery(bindingClass1).length) {
            var position = 0;
            var templateHeight = 0;
            var zoomFactor = 1;
            var topVal = 0;

            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
                var tHeight = -30;
            else {
                zoomFactor = jQuery('temp-dev').css('zoom');
                tHeight = 70;
            }
            if (jQuery('.sound-cloud').length > 0 || jQuery('.sound-cloud-new').length > 0 || jQuery('.template-seven').length > 0 || jQuery('.sound-cloud-v3').length > 0) {
                // for template sound-cloud
                jQuery('.sound-cloud').addClass('template2');
                jQuery('.sound-cloud-new').addClass('template2');
                jQuery('.sound-cloud-v3').addClass('template2');
                jQuery('.template-seven').addClass('template2');
                if (innerText && innerText === 'Landing') {
                    templateHeight = -jQuery(bindingClass1).position().top;
                }
                else if (innerText && (innerText === 'Questionnaire' || innerText === 'Result')) {
                    templateHeight = jQuery('.template2').height();
                }
                else {
                    templateHeight = jQuery('.template2').height() + tHeight;

                }
                position = jQuery(bindingClass1).position().top + templateHeight;
                jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
                    jQuery('.template-section').clearQueue();
                });
            }
            else if (['one-page-slider', 'one-page-card', 'one-page-card-new', 'inline-temp', 'inline-temp-new', 'one-page-card-oldresult', 'template-six', 'template-eight', 'template-five', 'template-five-oldresult']
                .findIndex(d => d == this.jsonBuilderHelper.getJSONBuilt().template) != -1) {
                // get postiion of div
                templateHeight = jQuery('.editor-page-divider').height();
                if (innerText && ['Landing', 'WELCOME SCREEN With Lead Generation', 'With Lead Generation'].findIndex(d => d == innerText) != -1)
                    templateHeight = -jQuery(bindingClass1).position().top;
                else if (innerText && ['Questionnaire', 'Result', 'QUESTIONNAIRE With Lead Generation', 'With Lead Generation'].findIndex(d => d == innerText) != -1)
                    templateHeight = 0;
                if (['template-six', 'template-eight'].indexOf(this.jsonBuilderHelper.getJSONBuilt().template) >= 0 && bindingClass1.split('_')[0] == '.sec')
                    bindingClass1 = bindingClass1 + '_q_0';
                position = jQuery(bindingClass1).position().top + templateHeight;
                jQuery('.template-section').animate({ scrollTop: position * zoomFactor }, function () {
                    jQuery('.template-section').clearQueue();
                });
            }
        }
    }
}