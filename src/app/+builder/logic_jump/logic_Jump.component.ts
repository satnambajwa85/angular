import { Observable } from 'rxjs/Rx';
import { Section, Page, App, Item } from '@builder/models';
import { Util } from './../../../config/utils';
import { BuilderService } from './../services/builder.service';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { JSONBuilder } from './../services/JSONBuilder.service';
import { AppConditionService } from './../services/AppCondition.service';
import { AppCondition } from '../../templates/models/appConditions.model';
import { QuestionCondition } from './../../templates/models/questionConditions.model';

declare var jQuery: any;
declare var document: any;
declare var Raphael: any;
@Component({
    selector: 'logic-jump',
    templateUrl: './assets/html/logic_Jump.template.html',
    styleUrls: [
        './assets/css/logic_jump_new.style.css'
    ]
})

export class LogicJumpComponent implements OnInit, AfterViewInit {
    public util: Util;
    public appCondition: AppCondition;
    public newQuestionCondition: QuestionCondition;
    public questionIndex: number;
    public sectionIndex: number;
    public templateSectionsWithEmittedLeadFormQuestion: Section[] = [];

    public questionInCondition: Item[] = [];
    public sectionInCondition: Section[] = [];
    public operators: any = {
        '==': 'equal to',
        '<=': 'less than equal to',
        '>=': 'greater than equal to',
        '<': 'less than equal to',
        '>': 'greater than equal to',
        'ne': 'not empty',
        'e': 'empty'
    };
    public buttonText: string = 'save';
    template: string = '';
    public questions: Item[];
    public questionsMap: string[];
    public loading: Boolean = false;
    public saveButtonText: string = 'DONE';
    public customHtmls: any[] = [];
    public questionLogicJump: boolean = true;
    public sections: Section[] = [];
    public leadBeforeResult: any;
    public analyticalLogicType: string[] = ['device', 'browser'];

    constructor(
        public jsonBuilderHelper: JSONBuilder,
        public _appConditionService: AppConditionService,
        public builderService: BuilderService) {
        this.util = new Util();
    }

    ngOnInit() {
        this.template = this.jsonBuilderHelper.getJSONBuilt().template;
        if (this.jsonBuilderHelper.editors('sectionalLogicJump'))
            this.questionLogicJump = false;
        Observable.interval(3000).take(4).subscribe(() => console.log('tt'));
    }

    ngAfterViewInit() {
        let self = this;
        jQuery('#logic-jump').on('show.bs.modal', function () {
            self.loading = true;
            self.appCondition = undefined;
            [self.questions, self.sections] = self.jsonBuilderHelper.getTemplateQuestionareForLogicJump();
            let lead: any = self.jsonBuilderHelper.getVisibleLeadForm();
            self.leadBeforeResult = lead.page.length && lead.page[0].type == 'Result' && lead.item[0].config.direction == 'beforeResult';
            self.customHtmls = [];
            self.fetchAppCondition();
        });
        jQuery('#logic-jump').on('hidden.bs.modal', function () { self.appCondition = undefined; self.loading = true; });
    }

    getDataForMindMap() {
        if (this.appCondition) {
            // Permitted in Response Dropdown Array
            var condArray = [];
            condArray['device'] = 'Device';
            condArray['browser'] = 'Browser';
            for (let question of this.questionInCondition) {
                if (question.type != 'custom_html') {
                    condArray[question._id] = 'Q' + (this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().indexOf(question) + 1);
                } else {
                    condArray[question._id] = question.props.title + ' ' + (this.customHtmls.indexOf(question) + 1);
                }
            }
            // Operator Array
            var optArray = [];
            optArray['=='] = 'is equal to';
            optArray['!='] = 'is not equal to';
            optArray['<'] = 'is less than';
            optArray['>'] = 'is greater than';
            optArray['ne'] = 'is filled';
            optArray['e'] = 'is empty';
            optArray['tablet'] = 'Tablet';
            optArray['mobile'] = 'Mobile';
            optArray['desktop'] = 'Desktop';
            optArray['Opera'] = 'Opera';
            optArray['Chrome'] = 'Chrome';
            optArray['Firefox'] = 'Firefox';
            optArray['Safari'] = 'Safari';
            optArray['UC Browser'] = 'UC Browser';
            optArray['IE'] = 'IE';
            optArray['Others'] = 'Others';
            // Jump To Array
            var jumpArray = [];
            for (let questionCondition of this.appCondition.questionConditions) {
                if (this.questionLogicJump) {
                    for (let question of this.questions) {
                        if (question.type != 'custom_html') {
                            jumpArray[question._id] = 'Q' + (this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().indexOf(question) + 1);
                        } else {
                            jumpArray[question._id] = question.props.title + ' ' + (this.customHtmls.indexOf(question) + 1);
                        }
                    }
                } else {
                    for (let section of this.sections) {

                        if (section.type != 'CustomHtml') {
                            jumpArray[section._id] = 'Sec' + (this.templateSectionsWithEmittedLeadFormQuestion.indexOf(section) + 1);
                        } else {
                            jumpArray[section._id] = section.title + ' ' + (this.customHtmls.indexOf(section) + 1);
                        }
                    }
                }
            }
            var outcomeIndex = 0;
            if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation') {
                jumpArray['r'] = 'Default Outcome';
                for (let formulaResult of this.jsonBuilderHelper.getJSONBuilt().formula) {
                    jumpArray[formulaResult.value] = 'Outcome ' + (++outcomeIndex);
                }
                jumpArray['beforeResult'] = 'Lead Generation';

            } else {
                jumpArray['r'] = 'Default Result Page';
                jumpArray['beforeResult'] = 'Lead Generation';
            }
            console.log('jumpArray', jumpArray);
            console.log('condArray', condArray);
            console.log('optArray', optArray);
            var i = 0;
            for (let questionCondition of this.appCondition.questionConditions) {
                var j = 0;
                // console.log('questionCondition', questionCondition);
                var test = "If";
                for (let condition of questionCondition.conditions) {
                    // console.log(j);
                    // Sub Condition Operator
                    test = test + ((j == 0) ? "" : (" " + condition.operator));
                    // Type
                    test = test + " " + condition.question + " " + condition.operation + " " + condition.value;
                    // console.log('condition', condition);
                    // console.log('test', test);
                    j++;
                }
                test = test + " then jump to " + questionCondition.outcome;
                test = test + " else in all other cases jump to " + this.appCondition.else;
                console.log('test', test);
                i++;
            }
        }
    }

    /** Add New app condition */
    createAppCondition() {
        this._appConditionService.create(this.appCondition)
            .subscribe((response: any) => {
                this.appCondition = new AppCondition().deserialize(response);
                if (this.questionLogicJump)
                    this.jsonBuilderHelper.getSelectedControl().condition = this.appCondition.get('_id');
                else
                    this.jsonBuilderHelper.getSelectedSection().condition = this.appCondition.get('_id');
                this.appCondition.set('addLoading', false);
                this.appCondition.set('type', false);
                this.buttonText = 'Update';
                jQuery('#logic-jump').modal('toggle');
                this.jsonBuilderHelper.getJSONBuilt().changed = true;
                this.saveButtonText = 'DONE';
            },
                (error: any) => {
                    console.log(error);
                }
            );
    }

    fetchAppCondition() {
        /** Condition to fetch questionaaire logic jump */
        let condition: any;
        let questionsinDropdown: Item[] = [];
        this.questionsMap = this.questions.map((q) => {
            if (this.questionLogicJump) {
                if (q.type == 'custom_html')
                    this.customHtmls.push(q);
                //else
                questionsinDropdown.push(q);
            }
            return q._id
        });
        if (this.questionLogicJump) {  /** Question logic jump condition*/
            this.questionIndex = questionsinDropdown.indexOf(this.jsonBuilderHelper.getSelectedControl());
            this.questionInCondition = questionsinDropdown.slice(0, this.questionIndex + 1);
            condition = { calc: this.jsonBuilderHelper.getJSONBuilt()._id, question: this.jsonBuilderHelper.getSelectedControl()._id };
        } else { /** Section logic jump condition*/
            this.sectionIndex = this.sections.indexOf(this.jsonBuilderHelper.getSelectedSection());
            this.questionInCondition = [];
            condition = { calc: this.jsonBuilderHelper.getJSONBuilt()._id, section: this.jsonBuilderHelper.getSelectedSection()._id };
            this.templateSectionsWithEmittedLeadFormQuestion = [];
            this.sections.map((sec, indx) => {
                if (sec.type == 'CustomHtml')
                    this.customHtmls.push(sec)
                else if (sec.type != 'LeadFormQ')
                    this.templateSectionsWithEmittedLeadFormQuestion.push(sec);

                if (sec.type != 'CustomHtml' && indx <= this.sectionIndex) {
                    this.questionInCondition.push(...sec.items);
                }
            });
        }

        /** fetch request for app conditions */
        this._appConditionService.fetch(condition)
            .subscribe((response: any) => {
                if (response && Object.keys(response).length !== 0) {
                    this.appCondition = new AppCondition().deserialize(response);
                    this.buttonText = 'Update';
                    this.getDataForMindMap();
                }
                this.loading = false;
            },
                (error: any) => {
                    console.log(error);
                });
    }

    addNewAppCondition() {
        let next: number;
        let questionCondition: QuestionCondition = new QuestionCondition();
        if (this.questionLogicJump) { /** Question logic jump condition*/
            questionCondition.get('conditions')[0].question = this.jsonBuilderHelper.getSelectedControl()._id;
            this.appCondition = new AppCondition(this.jsonBuilderHelper.getJSONBuilt()._id, this.jsonBuilderHelper.getSelectedControl()._id);
            //put else as next question or result
            next = this.questionsMap.indexOf(this.jsonBuilderHelper.getSelectedControl()._id) + 1;
            this.appCondition.set('else', (next >= this.questionsMap.length) ? 'r' : this.questionsMap[next]);
        } else { /** Section logic jump condition*/
            questionCondition.get('conditions')[0].question = (this.jsonBuilderHelper.getSelectedSection().type == 'CustomHtml') ? 'device' : this.jsonBuilderHelper.getSelectedSection().items[0]._id;
            this.appCondition = new AppCondition(this.jsonBuilderHelper.getJSONBuilt()._id, '', this.jsonBuilderHelper.getSelectedSection()._id);
            //put else as next question or result
            next = this.sections.indexOf(this.jsonBuilderHelper.getSelectedSection()) + 1;
            this.appCondition.set('else', (next >= this.sections.length) ? 'r' : this.sections[next]);
            this.appCondition.set('type', 'Section');  //set type as section logic jump
            delete this.appCondition.question; //set type as section logic jump
            this.appCondition.set('section', this.jsonBuilderHelper.getSelectedSection()._id);
        }

        this.appCondition.addConditions(questionCondition);
        this.buttonText = 'Save';
    }

    /** add questionCondition in appcondition */
    addQuestionaCondition() {
        let questionCondition: QuestionCondition = new QuestionCondition();

        if (this.questionLogicJump) { /** Question logic jump condition*/
            questionCondition.get('conditions')[0].question = this.jsonBuilderHelper.getSelectedControl()._id;
        } else { /** Section logic jump condition*/
            questionCondition.get('conditions')[0].question = (this.jsonBuilderHelper.getSelectedSection().type == 'CustomHtml') ? 'device' : this.jsonBuilderHelper.getSelectedSection().items[0]._id;
        }
        this.appCondition.addConditions(questionCondition);
    }

    /** remove questioncondtion in app condition */
    removeQuestionaCondition(index: number) {
        this.appCondition.removeCondition(index);
    }

    /** Add question conditions/logics in Appcondition*/
    addCondition(quesCondition: QuestionCondition) {
        quesCondition.addConditions(JSON.parse(JSON.stringify(quesCondition.get('conditions')[0])));
        /** add default 'And' in condition */
        let conditions: any = quesCondition.get('conditions');
        if (conditions.length > 1)
            conditions[conditions.length - 1].operator = '&';
    }

    /** remove subcondition in questions condition */
    removeCondition(quesCondition: QuestionCondition, index: number) {
        quesCondition.removeCondition(index);
    }

    saveCondition() {
        this.appCondition.set('addLoading', true);
        this.saveButtonText = 'PLEASE WAIT...';
        this.updateOpertor();
        /** if is to check whether option selected in condition is valid or not */
        if (this.checkValidConditions()) {
            if (this.appCondition.get('_id'))
                this.updateAppCondition();
            else
                this.createAppCondition();
        }
        setTimeout(() => {
            this.saveButtonText = 'DONE';
        }, 2000);
    }

    checkValidConditions(): boolean {
        let self: any = this;
        let isValid: boolean = true;
        this.appCondition.get('questionConditions').map(qCon => {
            qCon.get('conditions').map(con => {
                let item: Item = self.questions[self.questionsMap.indexOf(con.question)];
                if (this.analyticalLogicType.indexOf(con.question) == -1 && ['checkbox', 'checkbox_new', 'radio_button', 'radio_button_new', 'selectbox'].indexOf(item.type) != -1 && ['==', '!='].some((a) => a == con.operation)) {
                    let matched = item.options.filter(option => {
                        return option.label == this.util.unEscapeDOM(con.options);
                    });
                    if (!matched.length) {
                        self.appCondition.set('status', 'INVALID');
                        isValid = false;
                        self.appCondition.set('addLoading', false);
                    }
                }
            });
        });
        return isValid;
    }

    deleteAllCondition() {
        if (this.appCondition.get('_id')) {
            this._appConditionService.delete(this.appCondition.get('_id'))
                .subscribe((response: any) => {
                    if (this.questionLogicJump)
                        this.jsonBuilderHelper.getSelectedControl().condition = '';
                    else
                        this.jsonBuilderHelper.getSelectedSection().condition = '';
                    this.appCondition = undefined;
                    this.jsonBuilderHelper.getJSONBuilt().changed = true;
                });
        } else {
            this.appCondition = undefined;
        }
    }

    updateAppCondition() {
        this._appConditionService.update(this.appCondition)
            .subscribe((response: any) => {
                if (this.questionLogicJump)
                    this.jsonBuilderHelper.getSelectedControl().condition = this.appCondition.get('_id');
                else
                    this.jsonBuilderHelper.getSelectedSection().condition = this.appCondition.get('_id');
                this.buttonText = 'Update';
                this.appCondition.set('addLoading', false);
                jQuery('#logic-jump').modal('toggle');
                this.jsonBuilderHelper.getJSONBuilt().changed = true;
                this.saveButtonText = 'DONE';
            });
    }

    parseInteger(value: string) {
        return parseInt(value);
    }

    conditionSwap(quesCondition: QuestionCondition, indexA: number, indexB: number) {
        quesCondition.swap(indexA, indexB);
    }

    questionSwap(indexA: number, indexB: number) {
        this.appCondition.swap(indexA, indexB);
    }

    filterItem(controlId: string) {
        let control: Item = this.questions[this.questionsMap.indexOf(controlId)];
        return (control) ? control : this.questions[0];
    }

    checkstatus() {
        let conditions: string[] = [];
        let conditiondiff: string[] = [];
        if (this.appCondition.get('else') != 'r')
            conditions.push(this.appCondition.get('else'));

        this.appCondition.get('questionConditions').map((question: QuestionCondition) => {
            if (conditions.indexOf(question.get('outcome')) == -1 && question.get('outcome') != 'r')
                conditions.push(question.get('outcome'));

            if (this.questionLogicJump) {
                question.get('conditions').map((condition) => {
                    if (conditions.indexOf(condition.question) == -1 && condition.question != 'r')
                        conditions.push(condition.question);
                });
            }

        });

        if (this.questionLogicJump)
            conditiondiff = conditions.filter(x => this.questionsMap.indexOf(x) == -1);
        else
            conditiondiff = conditions.filter(x => this.sections.findIndex((sec) => sec._id == x) == -1);

        if (!conditiondiff.length)
            this.appCondition.set('status', 'VALID');
    }

    updateOpertor() {
        this.appCondition.get('questionConditions').map((question: QuestionCondition) => {
            question.get('conditions')[0].operator = '';
        });
    }

    operatorsFilter(controlId: string) {
        let control: Item = this.questions[this.questionsMap.indexOf(controlId)];
        if (this.analyticalLogicType.indexOf(controlId) == -1 && this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' && control && (control.type == 'slider' || (control.type == 'textfield' && control.config.type == 'number') || control.type == 'rating'))
            return true;
        else
            return false;
    }

    changeAppCondition(event: any) {
        let appElse: string = event.target.value;
        if (this.questionLogicJump && (appElse == 'r' || this.questionsMap.indexOf(appElse) != -1)) {
            this.appCondition.set('result', '');
            this.appCondition.set('else', appElse);
        } else if (!this.questionLogicJump && (appElse == 'r' || this.sections.find((sec) => sec._id == appElse))) {
            this.appCondition.set('result', '');
            this.appCondition.set('else', appElse);
        } else if (appElse == 'beforeResult') {
            this.appCondition.set('result', 'leadformBeforeResult');
            this.appCondition.set('else', 'r');
        } else {
            this.appCondition.set('result', appElse);
            this.appCondition.set('else', 'r');
        }
    }

    changeCondition(quesCondition: QuestionCondition, event: any) {
        let q_Outcome: string = event.target.value;
        if (this.questionLogicJump && (q_Outcome == 'r' || this.questionsMap.indexOf(q_Outcome) != -1)) {
            quesCondition.set('result', '');
            quesCondition.set('outcome', q_Outcome);
        } else if (!this.questionLogicJump && (q_Outcome == 'r' || this.sections.find((sec) => sec._id == q_Outcome))) {
            quesCondition.set('result', '');
            quesCondition.set('outcome', q_Outcome);
        } else if (q_Outcome == 'beforeResult') {
            quesCondition.set('result', 'leadformBeforeResult');
            quesCondition.set('outcome', 'r');
        } else {
            quesCondition.set('result', q_Outcome);
            quesCondition.set('outcome', 'r');
        }
    }

    optionLabel(option: any, question) {
        return (option.label) ? option.label : ((this.filterItem(question).optionImageVisible) ? `<img src='${option.imageURL}' alt='${option.imageName}' width='20' height='20'>` : ((this.filterItem(question).isIconPresent) ? `<i class='material-icons'>${option.icon}</i>` : ''))
    }
}