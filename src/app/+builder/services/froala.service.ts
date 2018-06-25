import { FormulaService } from './formula.service';
import { EventEmitter } from '@angular/core';
import { FeatureAuthService } from './../../../shared/services/feature-access.service';
import { JSONBuilder } from './JSONBuilder.service';
import { Injectable } from '@angular/core';

declare let jQuery: any;

@Injectable()
export class FroalaService {
    emitter: EventEmitter<any> = new EventEmitter();
    undoEmiter: EventEmitter<any> = new EventEmitter<any>(false);
    redoEmiter: EventEmitter<any> = new EventEmitter<any>(false);
    public leadObj: any = {
        firstname: 'First Name',
        lastname: 'Last Name',
        fullname: 'Full Name',
        tel: 'Tel',
        tel_us: 'US Tel',
        email: 'Email',
        others: 'Others'
    };

    constructor(
        private jsonBuilderHelper: JSONBuilder,
        private _featureAuthService: FeatureAuthService,
        private formulaService: FormulaService
    ) { }

    /*
        handler - The handler get updated with values decodedText,textCount and rawHtml.
        isAddVariable - Weather the addVariable dropdown should be there.
        isOnlyAddVariable - Only addVariable dropdown would be there with no other buttons(eg: bold,italics).
        showNoTags - Show no tags in add variable.
        includeScores- include scores in addVariable dropdown
        conditionalOption
        id - Unique Id of the froala
    */

    getOptions(args) {
        let toolbarButtons = [];
        let advancedToolbarButtons = [];
        args.isOnlyAddVariable && (args.isAddVariable = true);
        if (!args.isOnlyAddVariable) {
            // this.customButtons();
            toolbarButtons.push('bold', '|', 'italic', '|', 'underline');
            advancedToolbarButtons.push(...toolbarButtons, '|', 'insertLink', '|', 'color');
        }

        if (!args.isOnlyAddVariable && this.jsonBuilderHelper.getJSONBuilt().froalaAdvance) {
            this._featureAuthService.features.custom_styling.html_editor && advancedToolbarButtons.push('|', 'html', '|');
            // toolbarButtons.push('|', 'advance-editor');
            // advancedToolbarButtons.push('|', 'advance-editor');
        }

        if (!args.isOnlyAddVariable && !this.jsonBuilderHelper.getJSONBuilt().froalaAdvance) {
            this._featureAuthService.features.custom_styling.html_editor && advancedToolbarButtons.push('|', 'html', '|');
            // toolbarButtons.push('|', 'advance-editor');
            // advancedToolbarButtons.push('|', 'advance-editor');
        }

        if (args.isAddVariable) {
            let questions = this.createAddVariables(args.showNoTags, args.includeScores);
            toolbarButtons.push(questions);
            advancedToolbarButtons.push(questions);
        }
        if (args.onlyInserLink) {
            toolbarButtons = [];
            advancedToolbarButtons = [];
            advancedToolbarButtons.push('|', 'insertLink', '|');
        }
        return {
            editorClass: this.jsonBuilderHelper.getJSONBuilt().froalaAdvance ? 'froala-advanced' : 'froala-basic',
            charCounterCount: false,
            shortcutsEnabled: !args.onlyInserLink ? ['bold', 'italic', 'underline'] : '',
            heightMax: 250,
            toolbarButtons: this.jsonBuilderHelper.getJSONBuilt().froalaAdvance ? advancedToolbarButtons : advancedToolbarButtons,
            events: {
                'froalaEditor.focus': (e: any, editor: any) => {
                    args.conditionalOption && (args.conditionalOption.defualtselected = !args.conditionalOption.defualtselected);
                },
                'froalaEditor.contentChanged': (e: any, editor: any) => {
                    if (args.handler) {
                        args.handler['decodedText'] = editor.html.get().replace(/<(?:.|\n)*?>/gm, '').replace(/(&nbsp;)/g, ' ');
                        args.handler['textCount'] = args.handler.decodedText.length;
                        args.handler['rawHtml'] = editor.html.get();
                    }
                },
                'froalaEditor.blur': (e: any, editor: any) => {
                    args.id && this.emitter.emit({ event: 'blur', data: { id: args.id } });
                }
            }
        }
    }

    /** get email Options */

    getEmailOptions(args) {
        let toolbarButtons = [];
        args.isOnlyAddVariable && (args.isAddVariable = true);
        if (!args.isOnlyAddVariable)
            toolbarButtons.push('bold', '|', 'italic', '|', 'underline', '|', 'insertLink', '|', 'color', '|', 'html');


        if (args.isAddVariable) {
            let questions = this.createAddVariables(args.showNoTags, args.includeScores);
            toolbarButtons.push(questions);
        }

        return {
            editorClass: this.jsonBuilderHelper.getJSONBuilt().froalaAdvance ? 'froala-advanced' : 'froala-basic',
            charCounterCount: false,
            shortcutsEnabled: ['bold', 'italic', 'underline'],
            heightMax: 250,
            toolbarButtons: toolbarButtons,
            events: args.event /** custom event binding */
        }
    }

    getEmitter() {
        return this.emitter;
    }

    customButtons() {
        jQuery.FroalaEditor.DefineIcon('advance-editor', { NAME: (this.jsonBuilderHelper.getJSONBuilt().froalaAdvance ? 'minus' : 'plus') });
        jQuery.FroalaEditor.RegisterCommand('advance-editor', {
            title: this.jsonBuilderHelper.getJSONBuilt().froalaAdvance ? 'Basic Editor' : 'Advanced Editor',
            focus: true,
            undo: true,
            refreshAfterCallback: true,
            callback: () => {
                this.jsonBuilderHelper.getJSONBuilt().froalaAdvance = !this.jsonBuilderHelper.getJSONBuilt().froalaAdvance;
                this.emitter.emit('advanceEditor');
            }
        });
    }

    createAddVariables(showNoTags: any, includeScores?: any) {
        let options: any = {};
        let uniqueQuestionId: string = this.jsonBuilderHelper.randomId(9);
        if (this.jsonBuilderHelper.isTempType(['Graded'])) {
            for (let variable in this.allValidVariables({ includeScores, showNoTags }))
                options[this.allValidVariables({ includeScores, showNoTags })[variable]] = this.allValidVariablesWysiywigList({ includeScores })[variable];
        } else if (this.jsonBuilderHelper.isTempType(['Numerical', 'Ecom'])) {
            for (let variable in this.allValidVariables({ includeScores: false, showNoTags }))
                options[this.allValidVariables({ includeScores: false, showNoTags })[variable]] = this.allValidVariablesWysiywigList({})[variable];
        } else if (this.jsonBuilderHelper.isTempType(['Recommendation'])) {
            for (let variable in this.allValidVariables({ includeScores: false, showNoTags }))
                options[this.allValidVariables({ includeScores: false, showNoTags })[variable]] = this.allValidVariablesWysiywigList({})[variable];
        } else if (this.jsonBuilderHelper.isTempType(['Poll'])) {
            for (let variable in this.allValidVariables({ includeScores: false, showNoTags }))
                options[this.allValidVariables({ includeScores: false, showNoTags })[variable]] = this.allValidVariablesWysiywigList({})[variable];
        }

        jQuery.FroalaEditor.DefineIcon(uniqueQuestionId, { NAME: 'input' });
        jQuery.FroalaEditor.RegisterCommand(uniqueQuestionId, {
            title: 'Add Variable',
            type: 'dropdown',
            focus: true,
            undo: true,
            // icon: 'questions',
            refreshAfterCallback: true,
            options: options,
            callback: function (cmd: any, val: any) {
                this.html.insert(val);
            }
        });
        return uniqueQuestionId;
    }

    //	wysiwig List --Start

    /* arguments for the functions allValidVariables() and allValidVariablesWysiywigList()
        includeScores,
        showNoTags,
        isResultHeadings - show ResultHeadings in case of Numerical
        includeOutcomeDesc - show Outcome Desc in case of Recom
    */

    public allValidVariables(args: any) {

        let allVariables: any = [];
        let i: number;
        if (this.jsonBuilderHelper.isTempType(['Graded']) && args.includeScores === true) {
            allVariables.push('  ');
            allVariables.push((args.showNoTags === true) ? "{Score_absolute}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Score_absolute}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
            allVariables.push((args.showNoTags === true) ? "{Score_per}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Score_per}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
            allVariables.push((args.showNoTags === true) ? "{Score_rank}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Score_rank}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
        }
        if (this.jsonBuilderHelper.isTempType(['Poll'])) {
            allVariables.push('    ');
            allVariables.push((args.showNoTags === true) ? "{Average_Poll_Result}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Average_Poll_Result}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
            allVariables.push('      ');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push((args.showNoTags === true) ? "{Highest_poll_score_Q" + (questionIndex + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Highest_poll_score_Q" + (questionIndex + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
                }
            });
            allVariables.push('       ');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push((args.showNoTags === true) ? "{Most_selected_option_Q" + (questionIndex + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Most_selected_option_Q" + (questionIndex + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
                }
            });
            allVariables.push('        ');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push((args.showNoTags === true) ? "{Lowest_poll_score_Q" + (questionIndex + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Lowest_poll_score_Q" + (questionIndex + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
                }
            });
            allVariables.push('         ');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push((args.showNoTags === true) ? "{Least_selected_option_Q" + (questionIndex + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Least_selected_option_Q" + (questionIndex + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
                }
            });
            allVariables.push('          ');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push((args.showNoTags === true) ? "{User_poll_score_Q" + (questionIndex + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{User_poll_score_Q" + (questionIndex + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
                }
            });
            allVariables.push('           ');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push((args.showNoTags === true) ? "{User_selected_option_Q" + (questionIndex + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{User_selected_option_Q" + (questionIndex + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
                }
            });
        }

        let leadformItem: any = this.formulaService.getFirstLeadForm();
        if (leadformItem) {
            allVariables.push('');
            for (let field in leadformItem.fields) {
                let key = leadformItem.fields[field].key;
                allVariables.push((args.showNoTags === true) ? "{" + key.toLowerCase() + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{" + key.toLowerCase() + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
            }
        }
        allVariables.push(' ');
        for (i = 0; i < this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().length; i++)
            allVariables.push((args.showNoTags === true) ? "{Q" + (i + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Q" + (i + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");

        if (this.jsonBuilderHelper.isTempType(['Numerical'])) {
            allVariables.push('   ');
            for (i = 0; i < this.jsonBuilderHelper.getJSONBuilt().formula.length; i++) {
                allVariables.push((args.showNoTags === true) ? "{R" + (i + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{R" + (i + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
                args.isResultHeadings && allVariables.push((args.showNoTags === true) ? "{RH" + (i + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{RH" + (i + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
                args.isResultHeadings && allVariables.push((args.showNoTags === true) ? "{RS" + (i + 1) + "}" : "<span class='fr-deletable var-tag' contenteditable='false'>{RS" + (i + 1) + "}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
            }
        }
        else if (this.jsonBuilderHelper.isTempType(['Recommendation'])) {
            if (args.includeOutcomeDesc)
                allVariables.push('   ');
            if (this.jsonBuilderHelper.getJSONBuilt().recomBased && this.jsonBuilderHelper.getJSONBuilt().recomBased.multipleOutcome) {
                allVariables.push('   ');
                // if multiple outcome On
                for (let i = 1; i <= this.jsonBuilderHelper.getJSONBuilt().recomBased.noOfOutcome; i++) {
                    allVariables.push((args.showNoTags === true) ? ((i == 1) ? "{Outcome}" : `{Outcome_${i}}`) : `<span class='fr-deletable var-tag' contenteditable='false'>${((i == 1) ? `{Outcome}` : `{Outcome_${i}}`)}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;`);
                    args.includeOutcomeDesc && allVariables.push((args.showNoTags === true) ? ((i == 1) ? "{Outcome_desc}" : `{Outcome_desc_${i}}`) : `<span class='fr-deletable var-tag' contenteditable='false'>${((i == 1) ? `{Outcome_desc}` : `{Outcome_desc_${i}}`)}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;`);
                }
            } else {
                // if One Outcome as result
                allVariables.push((args.showNoTags === true) ? "{Outcome}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Outcome}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
                args.includeOutcomeDesc && allVariables.push((args.showNoTags === true) ? "{Outcome_desc}" : "<span class='fr-deletable var-tag' contenteditable='false'>{Outcome_desc}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;");
            }
        }
        return allVariables;
    }

    public allValidVariablesWysiywigList(args: any) {
        let allVariables: any = [];
        let i: number;
        if (this.jsonBuilderHelper.isTempType(['Graded']) && args.includeScores === true) {
            allVariables.push('Scores:');
            allVariables.push('Score As Absolute');
            allVariables.push('Score As Percentage');
            allVariables.push('Score As Rank <p class=\'flo-cust-text\' style=\'float: left;width: 100%;white-space: normal;line-height: 14px;font-size: 10px;opacity: 0.5;margin-bottom: 10px !important;padding: 0 8px 0 0;\'><i class=\'material-icons\' style=\'font-size:12px; position:relative; top:2px;left:-2px\'>info_outline</i> It is automatically calculated based on your rank. If your score is the 5th highest of all test taker then your {score_rank} value will be 5.</p>');
        }
        if (this.jsonBuilderHelper.isTempType(['Poll'])) {
            allVariables.push('Poll:');
            allVariables.push('Average Poll Result');
            allVariables.push('Highest poll score for:');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push("Q" + (questionIndex + 1) + ": " + question.props.title.replace(/(<([^>]+)>)/ig, ''));
                }
            });
            allVariables.push('Most selected option for:');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push("Q" + (questionIndex + 1) + ": " + question.props.title.replace(/(<([^>]+)>)/ig, ''));
                }
            });
            allVariables.push('Lowest poll score for:');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push("Q" + (questionIndex + 1) + ": " + question.props.title.replace(/(<([^>]+)>)/ig, ''));
                }
            });
            allVariables.push('Least selected option for:');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push("Q" + (questionIndex + 1) + ": " + question.props.title.replace(/(<([^>]+)>)/ig, ''));
                }
            });
            allVariables.push('User poll score for:');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push("Q" + (questionIndex + 1) + ": " + question.props.title.replace(/(<([^>]+)>)/ig, ''));
                }
            });
            allVariables.push('User selected option for:');
            this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
                if (question && question.type == 'radio_button') {
                    allVariables.push("Q" + (questionIndex + 1) + ": " + question.props.title.replace(/(<([^>]+)>)/ig, ''));
                }
            });
        }
        let leadformItem: any = this.formulaService.getFirstLeadForm();
        if (leadformItem) {
            allVariables.push('Lead Details:');
            for (let field in leadformItem.fields) {
                let fieldNow = leadformItem.fields[field];
                let name = (fieldNow.key == 'tel_us' || fieldNow.key.match(/tel_us_[\d]/g)) ? "tel_us" : fieldNow.key.replace(/[\d/_]/g, '');
                let key = this.leadObj[name.toLowerCase()] + (fieldNow.key.match(/\d+/g) ? fieldNow.key.replace(/[^0-9]/g, ' ').toString() : '');
                if (key.length > 35)
                    key = key.substr(0, 35) + "...";
                allVariables.push(key + ' : ' + leadformItem.fields[field].value);
            }
        }
        allVariables.push('Answer to:');
        for (i = 0; i < this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().length; i++) {
            let title = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[i].props.title.replace(/(<([^>]+)>)/ig, '');
            if (title.length > 35)
                title = title.substr(0, 35) + "...";
            allVariables.push('  Q' + (i + 1) + ': ' + title);
        }
        if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical') {
            allVariables.push('Result:');
            for (i = 0; i < this.jsonBuilderHelper.getJSONBuilt().formula.length; i++) {
                allVariables.push('  Result ' + (i + 1));
                args.isResultHeadings && allVariables.push(`  Result ${(i + 1)} Text`);
                args.isResultHeadings && allVariables.push(`  Result ${(i + 1)} Description Text`);
            }
        } else if (this.jsonBuilderHelper.isTempType(['Recommendation'])) {
            allVariables.push(' Outcome ');
            if (this.jsonBuilderHelper.getJSONBuilt().recomBased && this.jsonBuilderHelper.getJSONBuilt().recomBased.multipleOutcome) {
                if (args.includeOutcomeDesc) allVariables.push(' Outcome ');
                // if multiple outcome On
                for (let i = 1; i <= this.jsonBuilderHelper.getJSONBuilt().recomBased.noOfOutcome; i++) {
                    allVariables.push((args.includeOutcomeDesc) ? ` Outcome Title ${i}` : ` Outcome ${i}`);
                    args.includeOutcomeDesc && allVariables.push(` Outcome Description ${i}`);
                }
            } else {
                // if One Outcome as result
                if (args.includeOutcomeDesc)
                    allVariables.push(' Outcome Title');
                args.includeOutcomeDesc && allVariables.push(' Outcome Description ');
            }

        }
        return allVariables;
    }
    //	wysiwig List --End
}