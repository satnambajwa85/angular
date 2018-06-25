import { LocaleService } from './locale.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { EventEmitter } from '@angular/core';
import { FeatureAuthService } from './../../../shared/services/feature-access.service';
import { Injectable } from '@angular/core';
import { JSONBuilder } from '../../+builder/services/JSONBuilder.service';
import { AnalyticService } from '../../templates/services/analytic.service';
import { BuilderService } from './builder.service';
import { ShareOutcomeService } from './shareOutcome.service';

declare var jQuery: any;
declare var math: any;
declare var Handsontable: any;
@Injectable()
export class FormulaService {
  private emitter: EventEmitter<any> = new EventEmitter();
  private sub: any;
  private resultSaver: any;
  public parsedAllData: any;
  public pollCookiePresent: boolean = false;
  public pollCookie: any = {};
  constructor(private jsonBuilderHelper: JSONBuilder,
    private _analysisService: AnalyticService,
    private _BuilderService: BuilderService,
    private _outcomeService: ShareOutcomeService,
    private localeService: LocaleService) {
    this.resultSaver = this.debounce(this.saveResult, 2000);
    this.localeService.getEmitterLocale().subscribe(emitted => emitted === 'Locales Loaded' && this.computeParserData());
  }

  /* All Getters and Setters START */
  public getEmitter() {
    return this.emitter;
  }
  /* All Getters and Setters END */

  public addCommas(nStr: any) {
    nStr += '';
    let x: any = nStr.split('.');
    let x1: any = x[0];
    let x2: any = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  }

  public addCommasEU(euStr: any) {
    euStr += '';
    let x: any = euStr.split(',');
    let x1: any = x[0];
    let x2: any = x.length > 1 ? ',' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + '.' + '$2');
    }
    return x1 + x2;
  }

  public getFirstLeadForm() {
    let leadformItem: any;
    for (var page of this.jsonBuilderHelper.getJSONBuilt().pages) {
      if (page.type === 'Landing' || page.type === 'Result') {
        for (var section of page.sections) {
          for (var item of section.items) {
            if (item.type == 'leadform' && item.visible == true) {
              leadformItem = item;
            }
          }
        }
      }
    }
    if (!leadformItem) {
      this.jsonBuilderHelper.updateTemplateQuestionare();
      for (let i = 0; i < this.jsonBuilderHelper.getTemplateQuestionare()[0].length; i++) {
        if (this.jsonBuilderHelper.getTemplateQuestionare()[0][i].type == 'leadform_question' &&
          this.jsonBuilderHelper.getTemplateQuestionare()[0][i].visible == true) {
          leadformItem = this.jsonBuilderHelper.getTemplateQuestionare()[0][i];
          break;
        }
      }
    }
    return leadformItem;
  }

  public isQuestionInResults(quesIndex: any) {
    for (let formulaIndex in this.jsonBuilderHelper.getJSONBuilt().formula) {
      if (this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].result.indexOf("Q" + (parseInt(quesIndex) + 1)) >= 0)
        return true;
    }
    return false;
  }

  public correctAll() {
    for (let formulaIndex in this.jsonBuilderHelper.getJSONBuilt().formula)
      this.correctAllInvalidQuestions(this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].result, formulaIndex);
  }

  // Checking Questionare Validity After Changes To builder
  public correctAllInvalidQuestions(rawFormula: any, formulaIndex: any) {
    var currentQuesNumber: any;
    //Replace R's with Q's
    rawFormula = this.replaceRs(rawFormula);
    let changedItems: any[] = [];
    for (var i: any = 0; i < rawFormula.length; i++) {
      if (rawFormula[i] == 'Q') {
        i++;
        currentQuesNumber = '';
        while (!isNaN(parseFloat(rawFormula[i]))) currentQuesNumber += rawFormula[i++];
        var currentQuesObject: any = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[currentQuesNumber - 1];
        //for marking as mandatory
        if (currentQuesObject && (currentQuesObject.type == 'switchbox' || currentQuesObject.type == 'radio_button' ||
          currentQuesObject.type == 'checkbox' || (currentQuesObject.type == 'textfield' && currentQuesObject.config.type == 'number'))) {
          if (!currentQuesObject.config.validations.required.status) {
            currentQuesObject.config.validations.required.status = true;
            changedItems.push(currentQuesObject);
          }
        }
      }
    }

    let unsaveddata = { app: '', sections: '', items: changedItems, page: '' };
    this._BuilderService.updateChanges(unsaveddata, this.jsonBuilderHelper.getJSONBuilt().socket_id || 'blank', this.jsonBuilderHelper.getJSONBuilt()._id)
      .subscribe((response: any) => { }, (error: any) => console.log(error));
  }

  debounce(func: any, wait: number) {
    let timeout: any;
    return function () {
      let context = this, args = arguments;
      let later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  public updateFormulaValidity(rawFormula: any, formulaIndex: any) {
    var currentQuesNumber: any;
    var isValid: boolean = true;
    //Replace R's with Q's
    rawFormula = this.replaceRs(rawFormula);
    for (var i: any = 0; i < rawFormula.length; i++) {
      if (rawFormula[i] == 'Q') {
        i++;
        currentQuesNumber = '';
        while (!isNaN(parseFloat(rawFormula[i]))) currentQuesNumber += rawFormula[i++];
        var currentQuesObject: any = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[currentQuesNumber - 1];
        if (currentQuesObject) {
          if ((currentQuesObject.type == 'switchbox' || currentQuesObject.type == 'radio_button' ||
            currentQuesObject.type == 'selectbox' || currentQuesObject.type == 'checkbox' || (currentQuesObject.type == 'textfield' && currentQuesObject.config.type == 'number'))) {
            let isAnyDefaultSelected: boolean = false;
            for (let option in currentQuesObject.options) {
              if (currentQuesObject.options[option].defualtselected == true)
                isAnyDefaultSelected = true;
            }
            if (currentQuesObject.config.validations.required.status || isAnyDefaultSelected) {
            }
            else
              isValid = false;
          }
        } else isValid = false;
      }
    }
    this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].isValid = isValid;
  }

  public getAllInvalidFormulas() {

    var areAllFormulasValid = true;
    var allInvalidFormulas: string = '';
    for (let formula in this.jsonBuilderHelper.getJSONBuilt().formula) {
      this.updateFormulaValidity(this.jsonBuilderHelper.getJSONBuilt().formula[formula].result, formula);
      if (!this.jsonBuilderHelper.getJSONBuilt().formula[formula].isValid) {
        areAllFormulasValid = false;
        allInvalidFormulas += 'Result ' + (parseFloat(formula) + 1) + ',';
      }
    }
    if (areAllFormulasValid) return undefined;
    else {
      allInvalidFormulas = allInvalidFormulas.slice(0, -1);
      return allInvalidFormulas;
    }
  }

  public checkIfFormulaWouldGiveSyntaxError() {
    let allFormulas = this.jsonBuilderHelper.getJSONBuilt().formula;
    let errorResultList: string = '';
    for (let formula in allFormulas) {
      let rawFormula = allFormulas[formula].result;
      //Replace R's with Q's
      rawFormula = this.replaceRs(rawFormula);
      for (var i: any = 0; i < rawFormula.length; i++) {
        if (rawFormula[i] == 'Q') {
          i++;
          var currentQuesNumber: any = '';
          while (!isNaN(parseFloat(rawFormula[i]))) currentQuesNumber += rawFormula[i++];
          var currentQuesObject: any = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[currentQuesNumber - 1];
          if (!currentQuesObject || ((currentQuesObject.type == 'textfield' && (currentQuesObject.config.type == 'text' || currentQuesObject.config.type == 'email'))
            || currentQuesObject.type == 'text-area' || (currentQuesObject.type == 'calendar' && !currentQuesObject.isIconPresent))) {
            errorResultList += 'Result ' + (parseFloat(formula) + 1) + ',';
            break;
          }
        }
      }
    }
    errorResultList = errorResultList.slice(0, -1);
    return errorResultList;
  }

  saveResult() {
    if (this._analysisService.getVisitorKey() && this.jsonBuilderHelper.getJSONBuilt().status == 'LIVE') {
      this.sub && this.sub.unsubscribe();
      this.sub = this._analysisService.saveResult(this.jsonBuilderHelper.getJSONBuilt()._id, this.jsonBuilderHelper.getJSONBuilt().formula)
        .subscribe((response: any) => { }, (error: any) => console.log(error));
    }
  }

  replaceRs(formula) {
    let invalidRs: any = [];
    let formulaIndex = this.jsonBuilderHelper.getJSONBuilt().formula.findIndex(x => x.result == formula);
    while (true) {
      formula = formula.replace(/(R[\d]+)/g, (match) => {
        let index = Number(match.split(/[R]/)[1]) - 1;
        if (index >= 0 && formulaIndex >= 0 && (index < this.jsonBuilderHelper.getJSONBuilt().formula.length && index != formulaIndex)) {
          if (this.jsonBuilderHelper.getJSONBuilt().formula[index].result)
            return '(' + this.jsonBuilderHelper.getJSONBuilt().formula[index].result + ')';
          else {
            //comes here if result exsists but is empty
            invalidRs.push(index + 1);
            return match;
          }
        }
        //comes here if result is being used in itself or dosen't exsist
        invalidRs.push(index + 1);
        return match;
      });
      //check if any unprocessed (valid) R's are still left to continue processing else break out
      let validRsLeft = invalidRs.length ?
        formula.match(new RegExp('(R[^' + invalidRs.join('') + ']+)', 'g')) :
        formula.match(new RegExp('(R[\\d]+)', 'g'));
      if (!validRsLeft)
        break;
    }
    return formula;
  }

  public getSanitizedFormula(formula: any): any {
    return formula.replace(/[\s]+/g, '').replace(/[\d)]+x/g, match => `${match.slice(0, -1)}*`);
  }

  /* ############## All About Parser START */
  public computeParserData(parseWithValus?: boolean) {

    let parserData: any = {};

    // Update {Q} Questions variables
    this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
      if (question) {
        let questionLabel: any = `{Q${(questionIndex + 1)}}`;
        if (parseWithValus)
          questionLabel = question.props.currentValue || questionLabel;
        else if (question.props.currentLabel != '' && question.props.currentLabel != undefined)
          questionLabel = question.props.currentLabel.replace(/\#\@\&\_\!\_\&\@\#/gi, ',');
        else if (!question.props.currentLabel && question.props.currentLink.length) { // show link of img or icon if no label or option is presenty
          questionLabel = (question.optionImageVisible) ? question.props.currentLink.toString() : question.props.currentLink.map((link) => { return `<i class="material-icons">${link}</i>`; });
        }

        if (this.jsonBuilderHelper.isTempType(['Numerical']) && !parseWithValus && question.type !== 'calendar')
          questionLabel = this.jsonBuilderHelper.getJSONBuilt().numberSystem === 'EU' ? this.addCommasEU(questionLabel) : this.addCommas(questionLabel);
        parserData[`{Q${(questionIndex + 1)}}`] = questionLabel;
      }
    });

    // Update {R} Results variables
    if (this.jsonBuilderHelper.isTempType(['Numerical', 'Graded']))
      this.jsonBuilderHelper.getJSONBuilt().formula.map((formula: any, formulaIndex: number) => parserData[`{R${(formulaIndex + 1)}}`] = this.formulaFunction(formulaIndex));

    // Update Leadform Variables
    let leadformItem: any = this.getFirstLeadForm();
    if (leadformItem && leadformItem.fields.length) {
      leadformItem.fields.map((field) => parserData[`{${field.key.toLowerCase()}}`] = field.value);
    }

    // Update Outcome Variables
    if (this.jsonBuilderHelper.isTempType(['Recommendation']) && this._outcomeService.getSelectedFormula()) {
      // first outcome name 
      parserData[`{Outcome}`] = this._outcomeService.getFinalOutcomes()[0].outcome.name;

      // For multiple outcome 
      if (this.jsonBuilderHelper.getJSONBuilt().recomBased && this.jsonBuilderHelper.getJSONBuilt().recomBased.multipleOutcome)
        this._outcomeService.getFinalOutcomes().map((Obj: any, index: number) => {
          if (index) {
            parserData[`{Outcome_${index + 1}}`] = Obj.outcome.name;
          }
        });
    }

    // Update Graded Variables
    if (this.jsonBuilderHelper.isTempType(['Graded']) && this.jsonBuilderHelper.getJSONBuilt().formula[0]) {
      let absoluteScore: number = parseInt(this.formulaFunction(0));
      const scorePer: any = Math.round((absoluteScore / this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().length) * 100);

      parserData[`{Score_absolute}`] = absoluteScore;
      parserData[`{Score_per}`] = this.jsonBuilderHelper.getJSONBuilt().formula[0].units.preValue = scorePer;

      let scoreRank: string = this.jsonBuilderHelper.graded.rank ? this.jsonBuilderHelper.graded.rank : '';
      if (this.jsonBuilderHelper.getJSONBuilt().formula[0].units.postValue != scoreRank) {
        this.jsonBuilderHelper.getJSONBuilt().formula[0].units.postValue = scoreRank;
        this.resultSaver();
      }
      parserData[`{Score_rank}`] = scoreRank;
    }
    if (this.jsonBuilderHelper.isTempType(['Poll'])) {
      if (this.pollCookiePresent) {
        parserData = this.pollCookie.parsedValues;
      } else {
        parserData[`{Average_Poll_Result}`] = this.getAvgPollScore();
        let poll_data = {};
        this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, questionIndex: number) => {
          if (question && question.answered && question.type == 'radio_button') {
            poll_data[`{Highest_poll_score_Q${(questionIndex + 1)}}`] = 0;
            poll_data[`{Most_selected_option_Q${(questionIndex + 1)}}`] = '';
            poll_data[`{Lowest_poll_score_Q${(questionIndex + 1)}}`] = 100;
            poll_data[`{Least_selected_option_Q${(questionIndex + 1)}}`] = '';
            parserData[`{User_selected_option_Q${(questionIndex + 1)}}`] = poll_data[`{User_selected_option_Q${(questionIndex + 1)}}`] = question.props.currentLabel.replace(/\#\@\&\_\!\_\&\@\#/gi, ',');
            question.options.forEach((option: any) => {
              if (option.value == question.props.currentValue) {
                parserData[`{User_poll_score_Q${(questionIndex + 1)}}`] = poll_data[`{User_poll_score_Q${(questionIndex + 1)}}`] = option.isCorrect;
              }
              if (poll_data[`{Highest_poll_score_Q${(questionIndex + 1)}}`] == option.isCorrect) {
                parserData[`{Most_selected_option_Q${(questionIndex + 1)}}`] = poll_data[`{Most_selected_option_Q${(questionIndex + 1)}}`] = poll_data[`{Most_selected_option_Q${(questionIndex + 1)}}`] + `, ` + option.label;
              } else if (poll_data[`{Highest_poll_score_Q${(questionIndex + 1)}}`] < option.isCorrect) {
                parserData[`{Highest_poll_score_Q${(questionIndex + 1)}}`] = poll_data[`{Highest_poll_score_Q${(questionIndex + 1)}}`] = option.isCorrect;
                parserData[`{Most_selected_option_Q${(questionIndex + 1)}}`] = poll_data[`{Most_selected_option_Q${(questionIndex + 1)}}`] = option.label;
              }
              if (poll_data[`{Lowest_poll_score_Q${(questionIndex + 1)}}`] == option.isCorrect) {
                parserData[`{Least_selected_option_Q${(questionIndex + 1)}}`] = poll_data[`{Least_selected_option_Q${(questionIndex + 1)}}`] = poll_data[`{Least_selected_option_Q${(questionIndex + 1)}}`] + `, ` + option.label;
              } else if (poll_data[`{Lowest_poll_score_Q${(questionIndex + 1)}}`] > option.isCorrect) {
                parserData[`{Lowest_poll_score_Q${(questionIndex + 1)}}`] = poll_data[`{Lowest_poll_score_Q${(questionIndex + 1)}}`] = option.isCorrect;
                parserData[`{Least_selected_option_Q${(questionIndex + 1)}}`] = poll_data[`{Least_selected_option_Q${(questionIndex + 1)}}`] = option.label;
              }
            });
          }
        });
        this.jsonBuilderHelper.getJSONBuilt().formula[0].units.preValue = JSON.stringify(poll_data);
      }
    }

    !parseWithValus && this.emitter.emit({
      event: 'dataParsed',
      data: parserData
    });

    this.parsedAllData = parserData;
    return parserData;
  }

  public parseText(text: any, parsedData: string) {
    return text && text.toString().replace(this.getParserRegex(), (match: string) =>
      (parsedData[match] || parsedData[match] === 0) ? parsedData[match] : match
    );
  }

  private getParserRegex() {
    let re = '({R[\\d]+})|({Q[\\d]+})|({Outcome})|({Outcome_[\\d]+})|({Score_absolute})|({Score_per})|({Score_rank})|({Average_Poll_Result})|({Highest_poll_score_Q[\\d]+})|({Most_selected_option_Q[\\d]+})|({Lowest_poll_score_Q[\\d]+})|({Least_selected_option_Q[\\d]+})|({User_poll_score_Q[\\d]+})|({User_selected_option_Q[\\d]+})';
    let leadformItem: any = this.getFirstLeadForm();
    if (leadformItem && leadformItem.fields.length)
      leadformItem.fields.map(field => re += `|({${field.key.toLowerCase()}})`);
    return (new RegExp(re, 'g'));
  }
  /* ############## All About Parser END */

  /* ############## Result Calculation Functions START */
  public formulaFunction(formulaIndex: any) {
    let finalAnswer: any;
    if (!this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex])
      return;
    let excel = this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].excel;
    if (excel && excel.active && excel.jsonData.length) {
      let json = this.parseGraphJSON(JSON.parse(excel.jsonData));
      let container = document.getElementById('handsontable-excel-formula');
      if (container) {
        let hot = new Handsontable(container, {
          data: json,
          formulas: true
        });
        finalAnswer = hot.getDataAtCell(excel.fieldValue.row, excel.fieldValue.column)
      }
      finalAnswer = this.updateExcelOptions(finalAnswer, formulaIndex);

      //Saving and returning the result
      if (this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].value != finalAnswer) {
        this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].value = finalAnswer;
        /** save reult on live */
        this.resultSaver();
      }

      this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].value = finalAnswer;
      if (finalAnswer) finalAnswer = finalAnswer.toString().replace(/Infinity/g, '&infin;');
      if (this.jsonBuilderHelper.isTempName(['template-seven']) && finalAnswer === 0) return ' ';

      return finalAnswer;
    }

    let formula = this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].result;

    if (formula == '')
      return this.jsonBuilderHelper.isTempName(['template-seven']) ? ' ' : '{R' + (parseFloat(formulaIndex) + 1) + '}';
    //Replace R's with Q's
    formula = this.replaceRs(formula);

    try {
      finalAnswer = math.eval(this.createFinalQuestionString(this.getSanitizedFormula(formula)));
    } catch (e) {
      finalAnswer = 0;
    }
    if (finalAnswer == undefined) finalAnswer = '{R' + (parseFloat(formulaIndex) + 1) + '}';

    if (this.jsonBuilderHelper.getJSONBuilt().templateType != 'Graded') {
      var quesNowObject = this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex];
      var lower: any, upper: any;
      if (quesNowObject.range.status) {
        var lowerVal = parseFloat(quesNowObject.range.lower.value);
        var upperVal = parseFloat(quesNowObject.range.higher.value);
        if (isNaN(lowerVal)) lowerVal = 0;
        if (isNaN(upperVal)) upperVal = 0;
        if (isNaN(parseFloat(finalAnswer))) {
          finalAnswer = 0;
        } else {
          if (quesNowObject.range.higher.type == 'Percentage' && quesNowObject.range.lower.type == 'Percentage') {
            lower = (parseFloat(finalAnswer) - (lowerVal / 100) * (parseFloat(finalAnswer)));
            upper = (parseFloat(finalAnswer) + (upperVal / 100) * (parseFloat(finalAnswer)));
            if (isNaN(upperVal)) upper = parseFloat(finalAnswer);
            if (isNaN(lowerVal)) lower = parseFloat(finalAnswer);
            //for number system
            if (this.jsonBuilderHelper.getJSONBuilt().numberSystem === 'EU') {
              let low = lower.toFixed(Number(quesNowObject.decimal)).replace(/[,.]/g, function (m) { return m === ',' ? '.' : ','; });
              let upp = upper.toFixed(Number(quesNowObject.decimal)).replace(/[,.]/g, function (m) { return m === ',' ? '.' : ','; });
              lower = this.addCommasEU(low);
              upper = this.addCommasEU(upp);
            }
            else {
              lower = this.addCommas(lower.toFixed(Number(quesNowObject.decimal)));
              upper = this.addCommas(upper.toFixed(Number(quesNowObject.decimal)));
            }
            finalAnswer = lower + ' ' + this.jsonBuilderHelper.translatedFields['to'] + ' ' + upper;
          }
        }

      } else {
        if (isNaN(parseFloat(finalAnswer)) || finalAnswer == undefined) {
          finalAnswer = 0;
        } else {
          finalAnswer = Number(finalAnswer);
          //for number system
          if (this.jsonBuilderHelper.getJSONBuilt().numberSystem === 'EU') {
            let val1 = finalAnswer.toFixed(Number(quesNowObject.decimal)).replace(/[,.]/g, function (m) { return m === ',' ? '.' : ','; });
            finalAnswer = this.addCommasEU(val1);
          }
          else
            finalAnswer = this.addCommas(finalAnswer.toFixed(Number(quesNowObject.decimal)));
          if (quesNowObject.units.postfix) finalAnswer += quesNowObject.units.postValue;
          if (quesNowObject.units.prefix) finalAnswer = quesNowObject.units.preValue + finalAnswer;
        }
      }
      if (!isNaN(parseFloat(lower)) || !isNaN(parseFloat(upper))) {
        if (quesNowObject.units.postfix) {
          lower += quesNowObject.units.postValue;
          upper += quesNowObject.units.postValue;
        }
        if (quesNowObject.units.prefix) {
          lower = quesNowObject.units.preValue + lower;
          upper = quesNowObject.units.preValue + upper;
        }

        finalAnswer = lower + ' ' + this.jsonBuilderHelper.translatedFields['to'] + ' ' + upper;
      }
    }

    if (this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].value != finalAnswer) {
      this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].value = finalAnswer;
      /** save reult on live */
      this.resultSaver();
    }

    this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].value = finalAnswer;
    if (finalAnswer) finalAnswer = finalAnswer.toString().replace(/Infinity/g, '&infin;');
    if (this.jsonBuilderHelper.isTempName(['template-seven']) && finalAnswer === 0) return ' ';
    return finalAnswer;
  }

  public createFinalQuestionString(genericQuestion: any) {
    var currentQuesNumber: any, j: any;
    for (var i: any = 0; i < genericQuestion.length; i++) {
      if (genericQuestion[i] == 'Q') {
        j = ++i;
        currentQuesNumber = '';
        while (!isNaN(parseFloat(genericQuestion[i])))
          currentQuesNumber += genericQuestion[i++];
        genericQuestion = genericQuestion.substring(0, j - 1) +
          this.getValueOfQuestionNumber(currentQuesNumber) +
          genericQuestion.substring(i);
        i = j - 1 + this.getValueOfQuestionNumber(currentQuesNumber).toString().length;
      }
    }

    // Update Date within Formula
    let dateNow = new Date();
    genericQuestion = genericQuestion.replace(new RegExp('(DD)|(MM)|(YYYY)', 'g'), match => {
      if (match === 'DD') return dateNow.getDate();
      if (match === 'MM') return dateNow.getMonth() + 1;
      if (match === 'YYYY') return dateNow.getFullYear();
    });

    return genericQuestion;
  }

  public getValueOfQuestionNumber(quesNumber: any) {
    this.jsonBuilderHelper.updateTemplateQuestionare();
    let currentQuesObject = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[quesNumber - 1];
    if (currentQuesObject) {
      let currentValue = Number(parseFloat(currentQuesObject.props.currentValue).toString().replace(/,/g, ''));
      if (isNaN(currentValue) || currentValue == null || currentValue == undefined)
        currentValue = 0;
      return currentValue;
    } else {
      return 0;
    }
  }
  /* ############## Result Calculation Functions END */

  /* ############## Graph and Tables Related Functions START */
  public parseGraphJSON(graphJSON: any) {
    return graphJSON.map((row: any) => {
      return row.map((val: any) => {
        if (val) {
          return val.toString().replace(/(Q_[\d]+)/g, (matchQues) => {
            let quesNumber = Number(matchQues.split(/[Q_]/)[2]);
            let currentValue = this.getValueOfQuestionNumber(quesNumber);
            return currentValue ? currentValue : 0;
          }).toString().replace(/(R_[\d]+)/g, (matchRes) => {
            let resultNumber = Number(matchRes.split(/[R_]/)[2]);
            let currentValue = this.getRawResult(resultNumber - 1);
            return currentValue ? currentValue : 0;
          });
        }
      });
    });
  }

  private getRawResult(formulaIndex: any) {
    if (this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex]) {
      let excel = this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].excel;
      // Excel Formula
      if (excel && excel.active && excel.jsonData.length) {
        let json = this.parseGraphJSON(JSON.parse(excel.jsonData));
        let container = document.getElementById('handsontable-excel-formula');
        if (container) {
          let hot = new Handsontable(container, {
            data: json,
            formulas: true
          });
          return hot.getDataAtCell(excel.fieldValue.row, excel.fieldValue.column)
        }
      }
      // Normal Formula
      let formula = this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].result;
      if (formula) {
        formula = this.replaceRs(formula);
        let value = this.createFinalQuestionString(this.getSanitizedFormula(formula));
        try {
          return math.eval(value).toFixed(Number(this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].decimal));
        } catch (e) {
        }
      }
    }
  }

  public emitDataChange() {
    this.emitter.emit({
      event: 'dataChanged'
    });
  }

  /* ############## Graph and Tables Related Functions END */

  // For calculating poll result
  getAvgPollScore() {
    let avgPoll = 0;
    let questions = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion();
    let answeredQuestions = questions.filter(ques => (ques.answered == true && ques.type == 'radio_button'));
    if (answeredQuestions.length) {
      answeredQuestions.forEach(ques => {
        let perc = ques.options.filter(op => op.value == ques.props.currentValue);
        avgPoll = Number(avgPoll) + Number(perc[0].isCorrect);
      });
      avgPoll = avgPoll / answeredQuestions.length;
    }
    avgPoll = Number(avgPoll.toFixed(2));
    this.jsonBuilderHelper.getJSONBuilt().formula[0].value = avgPoll;
    return avgPoll;
  }

  updateExcelOptions(finalAnswer: any, formulaIndex: any) {
    let self: any = this;
    if (this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex].excel) {
      let quesNowObject = this.jsonBuilderHelper.getJSONBuilt().formula[formulaIndex];
      let removeCommaValue = (finalAnswer) ? finalAnswer.toString().replace(/(,)/ig, '') : finalAnswer;
      let finalRandomValue: any = Number(removeCommaValue);
      // Range Result Check, Add Comma's and Decimal
      let lower: any, upper: any;
      if (quesNowObject.range.status) {
        let lowerVal = isNaN(parseFloat(quesNowObject.range.lower.value)) ? 0 : parseFloat(quesNowObject.range.lower.value);
        let upperVal = isNaN(parseFloat(quesNowObject.range.higher.value)) ? 0 : parseFloat(quesNowObject.range.higher.value);
        if (isNaN(parseFloat(finalRandomValue))) {
          finalRandomValue = 0;
        } else {
          finalRandomValue = parseFloat(finalRandomValue);
          if (quesNowObject.range.higher.type == 'Number' && quesNowObject.range.lower.type == 'Number') {
            lower = finalRandomValue - lowerVal;
            upper = finalRandomValue + upperVal;
          } else if (quesNowObject.range.higher.type == 'Percentage' && quesNowObject.range.lower.type == 'Percentage') {
            lower = finalRandomValue - (lowerVal / 100) * finalRandomValue;
            upper = finalRandomValue + (upperVal / 100) * finalRandomValue;
          }
          lower = this.addCommas(lower.toFixed(Number(quesNowObject.decimal)));
          upper = this.addCommas(upper.toFixed(Number(quesNowObject.decimal)));
          if (quesNowObject && quesNowObject.units.postfix) {
            lower += quesNowObject.units.postValue;
            upper += quesNowObject.units.postValue;
          }
          if (quesNowObject && quesNowObject.units.prefix) {
            lower = quesNowObject.units.preValue + lower;
            upper = quesNowObject.units.preValue + upper;
          }
          finalRandomValue = lower + ' to ' + upper;
        }
      } else {
        if (isNaN(parseFloat(finalRandomValue))) {
          if (finalRandomValue == undefined) finalRandomValue = 0;
        } else {
          finalRandomValue = Number(finalRandomValue);
          finalRandomValue = this.addCommas(finalRandomValue.toFixed(Number(quesNowObject.decimal)));
          if (quesNowObject && quesNowObject.units.postfix) finalRandomValue += quesNowObject.units.postValue;
          if (quesNowObject && quesNowObject.units.prefix) finalRandomValue = quesNowObject.units.preValue + finalRandomValue;
        }
      }
      return finalRandomValue;
    }
  }
}
