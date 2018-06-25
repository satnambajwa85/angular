import { ConditionalResultService } from './../services/conditionalResult.service';
import { Component, OnInit, AfterViewInit, Input, ViewEncapsulation, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { JSONElement } from '../services/JSONElement.service';
import { JSONBuilder } from '../services/JSONBuilder.service';
import { FormulaService } from '../services/formula.service';
import { BuilderService } from '../services/builder.service';
import { JSONItemTracker } from '../services/JSONUpdateItemTracker.service';
import { FeatureAuthService } from '../../../shared/services/feature-access.service';
import { VisualsService } from '../services/visuals.service';
import { Util } from '../../../config/utils';
import { Http } from '@angular/http';

declare var jQuery: any;
declare var math: any;
declare var Handsontable: any;
import * as XLSX from 'xlsx';
import { parse } from 'url';


@Component({
  selector: 'formula-pop',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './assets/html/formula_pop.component.html',
  styleUrls: ['./assets/css/handsontable.full.min.css', './assets/css/jquery.formula.css', './assets/css/formula.css',]
})

export class FormulaPopComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fieldName') fieldName: ElementRef;
  private excelDefault: any = {
    active: false,
    fieldName: '',
    fieldValue: {}
  };
  elements: any[];
  formula: any;
  html: any;
  isSyntaxError: boolean = false;
  formulaIndex: any = 0;
  finalRandomValue: any = 0;
  error: any;
  validQuestions: any = [];
  possibleMinVal: any = 0;
  possibleMaxVal: any = 0;
  isExpectedResult: boolean = true;
  flashError: boolean = false;
  constResultList: any;
  constQuestionList: any;
  mapForRandomValues: any = {};
  variables: any = {};
  jsonhide: boolean = false;
  /* EXCEL FORMULA VARS */
  excel: any = this.excelDefault;
  hot: any;
  computedFieldValue: string = ''
  excelError: any;
  excelFlag: boolean = false;
  formulaIcons: boolean = false;
  formulaLoader: boolean = false;
  formulajsonError: boolean = false;
  formulajsonConnected: boolean = false;
  tableData: any = [];

  constructor(
    public condtionalResult: ConditionalResultService,
    public featureAuthService: FeatureAuthService,
    private visualsService: VisualsService,
    public jsonBuilderHelper: JSONBuilder,
    public jsonElementHandler: JSONElement,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public formulaService: FormulaService,
    public http: Http) { }

  // //General Functions
  // nthIndexOf = function (theString: any, s: any, n: any) {
  //   var i = -1;
  //   while (n-- > 0 && -1 != (i = theString.indexOf(s, i + 1)));
  //   return i;
  // };

  jQueryStuff() {
    let self = this;

    jQuery('#formula.formula-item').hover(function () {
      jQuery(this).find('div.for-output-boxdetail').css('display', 'block');
    }, function () {
      jQuery(this).find('div.for-output-boxdetail').css('display', 'none');
    });

    jQuery('#formula-modal-new').on('hidden.bs.modal', function () {
      self.jsonBuilderHelper.getJSONBuilt().formula[self.formulaIndex].html = jQuery('#formula').html();
      self.formulaService.correctAllInvalidQuestions(self.jsonBuilderHelper.getJSONBuilt().formula[self.formulaIndex].result, self.formulaIndex);
      self.formulaIndex = 0;
      jQuery('#formula-area').val('');
      if (self.excel && self.excel['active']) {
        if (self.hot) self.hot.destroy()
        self.excel = self.excelDefault
      }
    });

  }

  ngOnInit(): any {
    this.jsonBuilderHelper.updateTemplateQuestionare();
    jQuery('#formula-modal-new').on('shown.bs.modal', (e: any) => {
      this.formulaIndex = jQuery('.formula-final').data('formula');
      this.excel = JSON.parse(JSON.stringify(this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].excel));
      this.excel['active'] ? setTimeout(() => this.initExcelSheet(), 500) : this.modelInit();
      if (this.excel.hasOwnProperty('JsonFeed')) {
        if (this.excel.JsonFeed.JsonFeedstatus == 'Connected') {
          this.formulajsonConnected = true;
        }
      }
      jQuery(document).off('focusin.bs.modal');
    });
  }

  ngOnDestroy(): void {
    this.destroyHotInstance();
  }

  destroyHotInstance() {
    if (this.hot) {
      this.hot.destroy();
    }
  }

  ngAfterViewInit(): any {
    this.jQueryStuff();
    jQuery(".json-btn").click(function () {
      jQuery(".jason-feed").show();
    });
    jQuery(".icon-div-close").click(function () {
      jQuery(".jason-feed").hide();
    });

    // jQuery(".upload-btn-area > .upload-btn").click(function(){
    //     jQuery(".upload-btn-area > .upload-btn").removeClass("active");
    //     jQuery(this).addClass("active");
    // });


  }

  /* Drag and Drop Formula Builder  */

  modelInit() {
    //set value in text area and focus on it
    jQuery('#formula-area').val(this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].result).focus();

    //questions all and not allowed ones and enable drag
    let i = 0;
    this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()
      .forEach((question) => {
        if (!((['leadform_question', 'text-area', 'textfield'].indexOf(question.type) != -1 && ['text', 'email'].indexOf(question.config.type) != -1) || (['calendar'].indexOf(question.type) >= 0 && !question.isIconPresent)))
          this.validQuestions.push(i);

        let index = i + 1;
        let drag = document.getElementById('Q_' + index);
        drag.ondragstart = (e) => e.dataTransfer.setData("text/plain", "Q" + index);
        drag.ondragend = (e) => { this.checkValidity(); this.clearSelection(); }
        drag.onclick = (e) => e.preventDefault();

        i++;
      });

    //results all and enable drag
    i = 0;
    this.jsonBuilderHelper.getJSONBuilt().formula
      .forEach((formula) => {
        if (!formula.result || i == this.formulaIndex) { }
        else {
          let index = i + 1;
          let drag = document.getElementById('R_' + index);
          drag.ondragstart = (e) => e.dataTransfer.setData("text/plain", "R" + index);
          drag.ondragend = (e) => { this.checkValidity(); this.clearSelection(); }
          drag.onclick = (e) => e.preventDefault();
        }
        i++;
      });

    //set headings
    if (this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].name != "")
      jQuery('.formula-left-subheading').html(this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].name);
    else
      jQuery('.formula-left-subheading').html('Result #' + (this.formulaIndex + 1));

    //update
    this.updateFormulaUIComponents();

    //check validity
    if (this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].result)
      this.checkValidity();
  }

  onChangeDecimalPlaces($value: any) {
    this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].decimal = $value;
    if (this.excel['active']) {
      this.updateExcelOptions();
    } else {
      this.updateFormulaUIComponents();
    }
  }

  refreshClick() {
    if (!this.error) this.updateFormulaUIComponents();
  }

  applyFormula(event?: any) {
    if (!this.excel['active']) this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].excel['active'] = false;
    this.updateMinMaxInResultOutput();
    this.jsonBuilderHelper.getTemplateQuestionare()[0].forEach((item: any) => this._ItemTrackService.setUnSavedItems(item));
    this._ItemTrackService.setUnSavedPage(this.jsonBuilderHelper.getSelectedPage());
    this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].html = jQuery('#formula-area').val();
    this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].result = jQuery('#formula-area').val().replace(/\s/g, '');
    this.formulaService.correctAllInvalidQuestions(this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].result, this.formulaIndex);
    this.jsonBuilderHelper.getSelectedControl().isIconPresent = false;
    setTimeout(() => this.jsonBuilderHelper.getSelectedControl().isIconPresent = true, 100);
  }

  stripNumbers() {
    this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].units.postValue = this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].units.postValue.replace(/[0-9]+/g, '');
    this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].units.preValue = this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].units.preValue.replace(/[0-9]+/g, '');
  }

  updateMinMaxInResultOutput() {
    this.updateFormulaUIComponents();

    if (this.possibleMinVal > this.possibleMaxVal) {
      let temp = this.possibleMinVal;
      this.possibleMinVal = this.possibleMaxVal;
      this.possibleMaxVal = temp;
    }
    // this.possibleMaxVal = parseFloat(Number(this.possibleMaxVal).toFixed(2));
    // this.possibleMinVal = parseFloat(Number(this.possibleMinVal).toFixed(2));

    this.jsonBuilderHelper.getSelectedControl().props.minVal = this.possibleMinVal;
    this.jsonBuilderHelper.getSelectedControl().props.maxVal = this.possibleMaxVal;
    if (this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].result.toString().trim() == '') {
      if (this.jsonBuilderHelper.getSelectedControl().options.length == 1) {
        this.jsonBuilderHelper.getSelectedControl().options[0].attr.class = !isNaN(this.possibleMinVal) ? this.possibleMinVal : 0;
        this.jsonBuilderHelper.getSelectedControl().options[0].attr.style = !isNaN(this.possibleMaxVal) ? this.possibleMaxVal : 0;
      } else if (this.jsonBuilderHelper.getSelectedControl().options.length == 2) {
        let half = (isNaN(this.possibleMinVal) || isNaN(this.possibleMaxVal)) ? 0 : (Number(this.possibleMinVal) + Number(this.possibleMaxVal)) / 2;
        half = Number(parseFloat(half.toFixed(2)));
        this.jsonBuilderHelper.getSelectedControl().options[0].attr.class = !isNaN(this.possibleMinVal) ? this.possibleMinVal : 0;
        this.jsonBuilderHelper.getSelectedControl().options[0].attr.style = !isNaN(Number(half)) ? Number(half) : 0;

        this.jsonBuilderHelper.getSelectedControl().options[1].attr.class = !isNaN(Number(half)) ? Number(half) : 0;
        this.jsonBuilderHelper.getSelectedControl().options[1].attr.style = !isNaN(this.possibleMaxVal) ? this.possibleMaxVal : 0;
      }
    } else {
      // this.jsonBuilderHelper.getSelectedControl().options[0].attr.class = !isNaN(this.possibleMinVal) ? this.possibleMinVal : 0;
      // this.jsonBuilderHelper.getSelectedControl().options[this.jsonBuilderHelper.getSelectedControl().options.length - 1].attr.style = !isNaN(this.possibleMaxVal) ? this.possibleMaxVal : 0;
    }
  }

  updateFormulaUIComponents(): any {
    let self = this;
    let rawFormula = jQuery('#formula-area').val();
    //replace R's with Q's
    rawFormula = this.replaceRs(rawFormula);

    var quesNowObject = this.jsonBuilderHelper.getJSONBuilt().formula[self.formulaIndex];
    var currentQuesNumber: any;
    var quesArray: any = [], j: number = 0;
    var lowerRangeValues: any = [], a: number = 0;
    var higherRangeValues: any = [], b: number = 0;
    this.finalRandomValue = 0;
    jQuery('#random-ques-nums')[0].innerHTML = '';
    jQuery('#random-ques-titles')[0].innerHTML = '';
    jQuery('#final-result-range')[0].innerHTML = '';

    // Alternatively they could also be Number
    this.jsonBuilderHelper.getJSONBuilt().formula[self.formulaIndex].range.lower.type = 'Percentage';
    this.jsonBuilderHelper.getJSONBuilt().formula[self.formulaIndex].range.higher.type = 'Percentage';

    try {
      for (let i: any = 0; i < jQuery('.formula-questions').find('a').length; i++) {
        if (jQuery('.formula-questions')[0].children[i].className.indexOf('disable') > -1) {
          var startIndex = jQuery('.formula-questions')[0].children[i].className.indexOf(' disable');
          jQuery('.formula-questions')[0].children[i].className = jQuery('.formula-questions')[0].children[i].className.substring(0, startIndex) + '' + jQuery('.formula-questions')[0].children[i].className.substring(startIndex + ' disable'.length);
        }
      }
    } catch (e) { }
    //DISABLE CLASS------

    this.formulaService.updateFormulaValidity(rawFormula, self.formulaIndex);

    let mapForRandomValues: any = {};
    let mapForRandomQuestions: any = {};
    for (var i: any = 0; i < rawFormula.length; i++) {
      if (rawFormula[i] == 'Q') {
        i++;
        currentQuesNumber = '';
        while (!isNaN(parseFloat(rawFormula[i]))) currentQuesNumber += rawFormula[i++];
        var currentQuesObject: any = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[currentQuesNumber - 1];
        var randNumber = 0;
        if (currentQuesObject) {
          if (currentQuesObject.type == 'slider' || (currentQuesObject.type == 'textfield' && currentQuesObject.config.type == 'number') || currentQuesObject.type == 'rating') {
            if (currentQuesNumber in mapForRandomValues) randNumber = mapForRandomValues[currentQuesNumber]; else {
              let min = parseFloat(currentQuesObject.props.minVal);
              let max = parseFloat(currentQuesObject.props.maxVal);
              // randNumber = Math.floor(Math.random() * (max - min + 1)) + min;
              randNumber = Number((Math.random() * (max - min) + min).toFixed(Number(quesNowObject.decimal)));
              mapForRandomValues[currentQuesNumber] = randNumber;
            }
          } else if (currentQuesObject.type == 'calendar' && currentQuesObject.isIconPresent) {
            if (currentQuesNumber in mapForRandomValues) randNumber = mapForRandomValues[currentQuesNumber]; else {
              randNumber = Number((Math.random() * 100).toFixed(0));
              mapForRandomValues[currentQuesNumber] = randNumber;
            }
          } else {
            if (currentQuesNumber in mapForRandomValues) randNumber = mapForRandomValues[currentQuesNumber]; else {
              randNumber = Math.floor(Math.random() * currentQuesObject.options.length);
              mapForRandomValues[currentQuesNumber] = randNumber;
            }
          }
          quesArray[j++] = randNumber;

          /* range Values Calculation --START*/
          let minIndex: number, maxIndex: number;
          var minVal: number = Number.POSITIVE_INFINITY;
          var maxVal: number = Number.NEGATIVE_INFINITY;
          for (var t = 0; t < currentQuesObject.options.length; t++) {
            if (parseFloat(currentQuesObject.options[t].value) <= minVal) { minVal = currentQuesObject.options[t].value; minIndex = t };
            if (parseFloat(currentQuesObject.options[t].value) >= maxVal) { maxVal = currentQuesObject.options[t].value; maxIndex = t };
          }
          lowerRangeValues[a++] = minIndex;
          higherRangeValues[b++] = maxIndex;

          if (currentQuesObject.type == 'calendar' && currentQuesObject.isIconPresent) {
            if (currentQuesNumber in mapForRandomValues) randNumber = mapForRandomValues[currentQuesNumber]; else {
              randNumber = Number((Math.random() * 100).toFixed(0));
              mapForRandomValues[currentQuesNumber] = randNumber;
            }
          }
          /* range Values Calculation --END*/

          if (!(jQuery('.formula-questions')[0].children[currentQuesNumber - 1].className.indexOf('disable') > -1)) jQuery('.formula-questions')[0].children[currentQuesNumber - 1].className += ' disable';

          if (!(currentQuesNumber in mapForRandomQuestions)) {
            mapForRandomQuestions[currentQuesNumber] = '';
            jQuery('#random-ques-nums')[0].innerHTML += '<th>Q' + currentQuesNumber + '</th>';
            if (currentQuesObject.type == 'slider' || (currentQuesObject.type == 'textfield' && currentQuesObject.config.type == 'number') || currentQuesObject.type == 'rating' || (currentQuesObject.type == 'calendar' && currentQuesObject.isIconPresent)) {
              //jQuery('#random-ques-titles')[0].innerHTML += '<td> (' + math.bignumber(randNumber.toPrecision(2)) + ')</td>';
              jQuery('#random-ques-titles')[0].innerHTML += '<td> (' + math.bignumber(randNumber) + ')</td>';
            } else if (currentQuesObject.type == 'textfield') {
              jQuery('#random-ques-titles')[0].innerHTML += '<td> (' + "Doesn't Exist" + ')</td>';
            } else {
              jQuery('#random-ques-titles')[0].innerHTML += '<td> (' + currentQuesObject.options[randNumber].label + ')</td>';
            }
          }
        }
      }
    }

    this.updateFinalResultRange(rawFormula, quesNowObject, lowerRangeValues, higherRangeValues);
    this.updateFinalRandomValue(rawFormula, quesNowObject, quesArray);

    if (this.jsonBuilderHelper.getJSONBuilt().formula[self.formulaIndex].range.higher.type == 'Number') {
      jQuery('#rangeType option[value="Number"]').attr("selected", "selected");
      jQuery('#rangeType option[value="Percentage"]').removeAttr("selected");
    } else {
      jQuery('#rangeType option[value="Percentage"]').attr("selected", "selected");
      jQuery('#rangeType option[value="Number"]').removeAttr("selected");
    }
  }

  isExpectedResults() {
    let rawFormula = jQuery('#formula-area').val();
    rawFormula = this.replaceRs(rawFormula);
    if (rawFormula.match(/[-:\/\?]/g))
      this.isExpectedResult = false;
    else
      this.isExpectedResult = true;
  }

  createFinalQuestionString(genericQuestion: any, quesArray: any, lowerOrHigherOrRandom: any) {
    var itterator = 0;
    var currentQuesNumber: any, j: any;
    for (var i: any = 0; i < genericQuestion.length; i++) {
      if (genericQuestion[i] == 'Q') {
        j = ++i;
        currentQuesNumber = '';
        while (!isNaN(parseFloat(genericQuestion[i])))
          currentQuesNumber += genericQuestion[i++];
        var val = this.getValueOfQuestionNumber(currentQuesNumber, quesArray[itterator], lowerOrHigherOrRandom);
        genericQuestion = genericQuestion.substring(0, j - 1) + val + genericQuestion.substring(i);
        i = j - 1 + val.toString().length;
        itterator++;
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

  getValueOfQuestionNumber(quesNumber: any, optionSelectedIndex: any, lowerOrHigherOrRandom: any) {
    var currentQuesObject = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[quesNumber - 1];
    if (currentQuesObject && !((currentQuesObject.type == 'textfield' && (currentQuesObject.config.type == 'text' || currentQuesObject.config.type == 'email')) || (currentQuesObject.type == 'calendar' && !currentQuesObject.isIconPresent))) {
      if (currentQuesObject.type == 'slider' || (currentQuesObject.type == 'textfield' && currentQuesObject.config.type == 'number') || currentQuesObject.type == 'rating') {
        if (lowerOrHigherOrRandom == 'lower')
          return currentQuesObject.props.minVal; else if (lowerOrHigherOrRandom == 'higher')
          return currentQuesObject.props.maxVal; else if (lowerOrHigherOrRandom == 'random')
          return optionSelectedIndex;
      } else if (currentQuesObject.type == 'checkbox') {
        if (lowerOrHigherOrRandom == 'lower')
          return currentQuesObject.options[optionSelectedIndex].value.replace(/,/g, '');
        else if (lowerOrHigherOrRandom == 'higher') {
          let sum: number = 0;
          for (let option of currentQuesObject.options) {
            sum += parseFloat(option.value);
          }
          return sum;
        }
        else if (lowerOrHigherOrRandom == 'random')
          return currentQuesObject.options[optionSelectedIndex].value.replace(/,/g, '');
      } else if (currentQuesObject.type == 'calendar') {
        if (lowerOrHigherOrRandom == 'lower') {
          return optionSelectedIndex;
        } else if (lowerOrHigherOrRandom == 'higher') {
          return optionSelectedIndex;
        } else if (lowerOrHigherOrRandom == 'random')
          return optionSelectedIndex;
      }
      else
        return currentQuesObject.options[optionSelectedIndex].value.replace(/,/g, '');
    } else {
      return 0;
    }
  }

  updateFinalResultRange(rawFormula: any, quesNowObject: any, lowerRangeValues: any, higherRangeValues: any) {
    let rangeMinValue, rangeMaxValue;
    try {
      rangeMinValue = math.eval(this.createFinalQuestionString(this.formulaService.getSanitizedFormula(rawFormula), lowerRangeValues, 'lower'));
      rangeMaxValue = math.eval(this.createFinalQuestionString(this.formulaService.getSanitizedFormula(rawFormula), higherRangeValues, 'higher'));
      if (typeof rangeMinValue === "boolean") {
        if (rangeMinValue) {
          rangeMinValue = 1;
        } else {
          rangeMinValue = 0
        }
      }
      if (typeof rangeMaxValue === "boolean") {
        if (rangeMaxValue) {
          rangeMaxValue = 1;
        } else {
          rangeMaxValue = 0
        }
      }
    } catch (e) {
      rangeMaxValue = 0;
      rangeMinValue = 0;
    }

    if (rangeMinValue === undefined || rangeMaxValue === undefined) {
      if (this.isExpectedResult) {
        if (rawFormula.length !== 0)
          jQuery('#final-result-range')[0].innerHTML = '<li>Invalid</li>';
        else
          jQuery('#final-result-range')[0].innerHTML = '<li></li>';
        this.possibleMinVal = 0;
        this.possibleMaxVal = 0;
      }
    } else {
      if (quesNowObject.range.status) {
        var lowerVal = parseFloat(quesNowObject.range.lower.value);
        var upperVal = parseFloat(quesNowObject.range.higher.value);
        if (isNaN(lowerVal)) lowerVal = 0;
        if (isNaN(upperVal)) upperVal = 0;

        if (quesNowObject.range.higher.type == 'Percentage' && quesNowObject.range.lower.type == 'Percentage') {
          rangeMinValue = (parseFloat(rangeMinValue) - (lowerVal / 100) * (parseFloat(rangeMinValue)));
          rangeMaxValue = (parseFloat(rangeMaxValue) + (upperVal / 100) * (parseFloat(rangeMaxValue)));
        }
      }
      if (!(isNaN(rangeMinValue) || isNaN(rangeMaxValue))) {
        this.possibleMinVal = Number(rangeMinValue.toFixed(Number(quesNowObject.decimal)));
        this.possibleMaxVal = Number(rangeMaxValue.toFixed(Number(quesNowObject.decimal)));
        if (Number(rangeMinValue) > Number(rangeMaxValue)) {
          let temp = rangeMinValue;
          rangeMinValue = rangeMaxValue;
          rangeMaxValue = temp;
        }
        rangeMinValue = this.formulaService.addCommas(rangeMinValue.toFixed(Number(quesNowObject.decimal)));
        rangeMaxValue = this.formulaService.addCommas(rangeMaxValue.toFixed(Number(quesNowObject.decimal)));
        if (quesNowObject && quesNowObject.units.postfix) {
          rangeMinValue += quesNowObject.units.postValue;
          rangeMaxValue += quesNowObject.units.postValue;
        }
        if (quesNowObject && quesNowObject.units.prefix) {
          rangeMinValue = quesNowObject.units.preValue + rangeMinValue;
          rangeMaxValue = quesNowObject.units.preValue + rangeMaxValue;
        }
      }
      jQuery('#final-result-range')[0].innerHTML = '<li>' + rangeMinValue + '</li>' + '<li>-</li>' + '<li>' + rangeMaxValue + '</li>';
    }
  }

  updateFinalRandomValue(rawFormula: any, quesNowObject: any, quesArray: any) {
    try {
      this.finalRandomValue = math.eval(this.createFinalQuestionString(this.formulaService.getSanitizedFormula(rawFormula), quesArray, 'random'));
      if (this.finalRandomValue === undefined) this.finalRandomValue = 0;
    } catch (e) {
      this.finalRandomValue = 0;
    }

    let lower: any, upper: any;
    if (quesNowObject.range.status) {
      var lowerVal = isNaN(parseFloat(quesNowObject.range.lower.value)) ? 0 : parseFloat(quesNowObject.range.lower.value);
      var upperVal = isNaN(parseFloat(quesNowObject.range.higher.value)) ? 0 : parseFloat(quesNowObject.range.higher.value);
      if (isNaN(parseFloat(this.finalRandomValue))) {
        this.finalRandomValue = 0;
      } else {
        this.finalRandomValue = parseFloat(this.finalRandomValue);
        if (quesNowObject.range.higher.type == 'Number' && quesNowObject.range.lower.type == 'Number') {
          lower = this.finalRandomValue - lowerVal;
          upper = this.finalRandomValue + upperVal;
        } else if (quesNowObject.range.higher.type == 'Percentage' && quesNowObject.range.lower.type == 'Percentage') {
          lower = this.finalRandomValue - (lowerVal / 100) * this.finalRandomValue;
          upper = this.finalRandomValue + (upperVal / 100) * this.finalRandomValue;
        }

        lower = this.formulaService.addCommas(lower.toFixed(Number(quesNowObject.decimal)));
        upper = this.formulaService.addCommas(upper.toFixed(Number(quesNowObject.decimal)));

        if (quesNowObject && quesNowObject.units.postfix) {
          lower += quesNowObject.units.postValue;
          upper += quesNowObject.units.postValue;
        }
        if (quesNowObject && quesNowObject.units.prefix) {
          lower = quesNowObject.units.preValue + lower;
          upper = quesNowObject.units.preValue + upper;
        }
        this.finalRandomValue = lower + ' to ' + upper;
      }
    } else {
      if (isNaN(parseFloat(this.finalRandomValue))) {
        if (this.finalRandomValue == undefined) this.finalRandomValue = 0;
      } else {
        this.finalRandomValue = Number(this.finalRandomValue);
        this.finalRandomValue = this.formulaService.addCommas(this.finalRandomValue.toFixed(Number(quesNowObject.decimal)));
        if (quesNowObject && quesNowObject.units.postfix) this.finalRandomValue += quesNowObject.units.postValue;
        if (quesNowObject && quesNowObject.units.prefix) this.finalRandomValue = quesNowObject.units.preValue + this.finalRandomValue;
      }
    }
  }

  checkValidity() {
    //capitlize Qs, Rs and maintain cursor position
    this.isExpectedResults();
    let rawFormula = jQuery('#formula-area').val();
    let capitalisedFormula = rawFormula.replace(/((Q|R)[\d]+)/gi, (match) => match.toUpperCase());
    //support for capital X
    capitalisedFormula = capitalisedFormula.replace(/X/gi, (match) => match.toLowerCase());
    if (rawFormula != capitalisedFormula) {
      let startPos = jQuery('#formula-area').prop('selectionStart');
      jQuery('#formula-area').val(capitalisedFormula);
      this.createSelection(document.getElementById('formula-area'), startPos, startPos);
    }

    //check for validity
    rawFormula = capitalisedFormula;
    if (rawFormula.trim() == '') {
      this.error = "Formula Can't be Empty";
      return;
    }
    //replace R's with Q's
    rawFormula = this.replaceRs(rawFormula);
    //check for assignmnet case =
    if (!this.charPos(rawFormula, '=')) {
      this.error = "Assignments Not Allowed";
      return;
    }
    //check for Q1Q2Q3 case
    if (/[0-9]+(Q|R)/g.test(rawFormula)) {
      this.error = "Wrong Formula";
      return;
    }

    //replace Q's with values
    rawFormula = rawFormula.replace(/(Q[\d]+)/g, (match) => {
      let index = Number(match.split(/[Q]/)[1]);
      if (this.validQuestions.indexOf(index - 1) != -1)
        return 5;
      return match;
    });

    //replace Q's with values
    rawFormula = rawFormula.replace(/(DD)|(MM)|(YYYY)/g, match => 5);

    //test for validity
    try {
      math.eval(this.formulaService.getSanitizedFormula(rawFormula));
      this.error = false;
    }
    catch (e) {
      this.error = e.message.substr(0, e.message.indexOf('(') != -1 ? e.message.indexOf('(') : 28);
      return;
    }

    if (this.featureAuthService.features.formula_operators.simple_operators) {
      let acceptedOperators = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '/', '*', ')', '(', '.', ',', ' ', 'x', 'X'];
      for (let ch of rawFormula) {
        if (acceptedOperators.indexOf(ch) == -1) {
          this.error = "You can only use basic operators.To use others upgrade your account.";
          this.flashError = true;
          setTimeout(() => {
            this.flashError = false;
          }, 1500);
          return;
        }
      }
    }
  }

  replaceRs(formula) {
    let invalidRs: any = [];
    //let formulaIndex = this.jsonBuilderHelper.getJSONBuilt().formula.findIndex(x => x.result==formula);
    while (true) {
      formula = formula.replace(/(R[\d]+)/g, (match) => {
        let index = Number(match.split(/[R]/)[1]) - 1;
        if (index >= 0 && (index < this.jsonBuilderHelper.getJSONBuilt().formula.length && index != this.formulaIndex)) {
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

  addQuestion(label: string) {
    let cursorPosStart = jQuery('#formula-area').prop('selectionStart');
    let cursorPosEnd = jQuery('#formula-area').prop('selectionEnd');
    let v = jQuery('#formula-area').val();
    let textBefore = v.substring(0, cursorPosStart);
    let textAfter = v.substring(cursorPosEnd, v.length);
    jQuery('#formula-area').val(textBefore + label + textAfter);
    cursorPosEnd = cursorPosStart + label.length;
    this.createSelection(document.getElementById('formula-area'), cursorPosEnd, cursorPosEnd);

    this.checkValidity();
  }

  clearSelection() {
    let cursorPosEnd = jQuery('#formula-area').prop('selectionEnd');
    this.createSelection(document.getElementById('formula-area'), cursorPosEnd, cursorPosEnd);
  }

  createSelection(field, start, end) {
    if (field.createTextRange) {
      let selRange = field.createTextRange();
      selRange.collapse(true);
      selRange.moveStart('character', start);
      selRange.moveEnd('character', end);
      selRange.select();
      field.focus();
    } else if (field.setSelectionRange) {
      field.focus();
      field.setSelectionRange(start, end);
    } else if (typeof field.selectionStart != 'undefined') {
      field.selectionStart = start;
      field.selectionEnd = end;
      field.focus();
    }
  }

  showPremiumPopup() {
    jQuery('#premiumModal').modal('show');
    jQuery('.modal-backdrop').insertAfter('#premiumModal');
    jQuery('.modal-backdrop').addClass('added');
  }

  showPremiumFormulaPopup() {
    jQuery('#formula-modal-new').modal('hide');
    this.featureAuthService.setSelectedFeature('formula_operators', 'all_operators');
    setTimeout(() => {
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }, 500);
  }

  updateVariables() {
    this.constQuestionList.map((val: any) => {
      let randVal = this.getRandomQuestionVal(val.split('Q')[1]);
      this.variables["Q_" + val.split('Q')[1]] = randVal;
      this.mapForRandomValues[val.split('Q')[1]] = randVal;
    });
    this.constResultList.map((val: any) => {
      let randVal = this.getResultsValue(val.split('R')[1]);
      this.variables["R_" + val.split('R')[1]] = randVal;
    });
  }

  getRandomQuestionVal(quesNumber: number) {
    let ques = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[quesNumber - 1];
    if (ques) {
      if (ques.type == 'slider' || (ques.type == 'textfield' && ques.config.type == 'number') || ques.type == 'rating') {
        let min = parseFloat(ques.props.minVal);
        let max = parseFloat(ques.props.maxVal);
        return Number((Math.random() * (max - min) + min).toFixed(Number(0)));
      } else
        return Number(Number(ques.options[Math.floor(Math.random() * ques.options.length)].value).toFixed(Number(0)));
    }
  }

  getResultsValue(resultNumber: number) {
    let formula = this.formulaService.replaceRs(this.jsonBuilderHelper.getJSONBuilt().formula[resultNumber - 1].result);
    if (!formula) return 'No Formula';
    formula = formula.replace(/(Q[\d]+)/g, (match) => {
      let index = Number(match.split(/[Q]/)[1]);
      return this.mapForRandomValues[index] ? this.mapForRandomValues[index] : match;
    });
    try {
      let ans = (math.eval(this.formulaService.getSanitizedFormula(formula)));
      return ans;
    } catch (e) {
      return "error";
    }
  }

  /* Excel Formula Builder  */

  initExcelSheet(): any {
    let self = this;
    let container = document.getElementById('og-formula-builder-excel');
    [this.constQuestionList, this.constResultList] = this.visualsService.getResultsAndFormulas();
    this.updateVariables();
    var data = (!this.excel['jsonData'] || this.excel['jsonData'] === '') ? [
      ["2008", 10, 11, 12, 13],
      ["2009", 20, 11, 14, 13],
      ["2010", 30, 15, 12, 13]
    ] : JSON.parse(this.excel['jsonData']);
    this.hot = new Handsontable(container, {
      data: data,
      rowHeaders: true,
      colHeaders: true,
      width: 520,
      height: 400,
      rowHeights: 26,
      minCols: 26,
      minRows: 60,
      renderAllRows: true,
      // allowRemoveRow: this.data.length > 2 ? true : false,
      fillHandle: {
        autoInsertRow: false,
      },
      contextMenu: {
        callback: function (key, options) {

        }
      },
      formulas: {
        variables: this.variables
      },

      afterChange: (change, source) => {
        if (source != 'loadData') {
          self.getFieldVal(self.excel.fieldName);
          self.updateExcelOptions();
        }
      }
    });
    setTimeout(() => {
      // Excel Computations
      if (self.jsonBuilderHelper.getJSONBuilt().formula[self.formulaIndex].excel && self.excel.fieldName) {
        self.getFieldVal(self.excel.fieldName);
        self.updateExcelOptions();
      }
    }, 0);
  }

  saveExcel() {
    this.jsonhide = false;
    this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].excel = this.excel;
    this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].excel.jsonData = JSON.stringify(this.hot.getSourceData());
    // this.destroyHotInstance();
    jQuery(".upload-btn-area > .upload-btn").removeClass("active");
  }

  switchType(type: string) {
    if (type == 'excel') {
      this.excel['active'] = true;
      setTimeout(() => this.initExcelSheet(), 500);
    } else if (type == 'dnd') {
      if (this.excel['active']) {
        this.excel['active'] = false;
        setTimeout(() => { this.modelInit() });
        if (this.hot) this.hot.destroy()
      }
    }
  }

  getFieldVal(str) {
    try {
      let column = Util.getExcelcolumnNumber(str.match(/^\D+/).toString());
      let row = Number(str.replace(/^\D+/, ''))
      this.computedFieldValue = this.hot.getDataAtCell(row - 1, column)
      if (row && column && !isNaN(Number(this.computedFieldValue))) {
        this.excel['fieldName'] = str;
        this.excel['fieldValue'] = { row: row - 1, column };
        this.excelError = false;
        this.excelFlag = true;
      } else {
        this.excelError = 'Invalid Cell Number';
        this.excelFlag = false;
      }
    } catch (e) {
      console.log('Error: ', e);
      this.excelError = 'Invalid Field Value';
      this.excelFlag = false;
    }
  }

  uploadXls(evt) {
    /* wire up file reader */
    let uploadData = [];
    const target: DataTransfer = <DataTransfer>(evt.target);
    // if (target.files.length != 1) { throw new Error("Cannot upload multiple files on the entry") };
    const reader = new FileReader();
    reader.onload = (e: any) => {
      /* read workbook */
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });

      /* grab first sheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      // /* save data */
      uploadData = (XLSX.utils.sheet_to_formulae(ws));
      let newData = [];
      let noR = uploadData[uploadData.length - 1].split('=')[0].match(/([A-Za-z]+)([0-9]+)/)[2];
      for (let j = 0; j < noR; j++) {
        newData.push(['', '']);
      }
      uploadData.map(val => {
        let i = Number(val.split('=')[0].match(/([A-Za-z]+)([0-9]+)/)[2]) - 1;
        let j = this.getcolumnNumber(val.split('=')[0].match(/([A-Za-z]+)([0-9]+)/)[1]);
        let value = val.split('=')[1].toUpperCase().replace(/"|'/g, '');
        if (i == 0 || j == 0) {
          newData[i][j] = value;
        } else {
          newData[i][j] = '=' + value;
        }
      });
      this.excel['jsonData'] = JSON.stringify(newData);
      this.jsonhide = false;
      if (this.excel.hasOwnProperty('JsonFeed')) {

        if (this.excel.JsonFeed.JsonFeedstatus == 'Connected') {

          this.formulajsonConnected = false;
          this.excel.JsonFeed.JsonFeedstatus = 'Disconnected';
          this.excel.JsonFeed.autoUpdate = false;
          this.excel.JsonFeed.jsonUrl = '';
        }
      }
      if (this.hot)
        this.hot.destroy();
      setTimeout(() => this.initExcelSheet(), 500);
    };
    reader.readAsBinaryString(target.files[0]);
    jQuery(".upload-btn-area > .upload-btn").removeClass("active");

  }

  getcolumnNumber(col: string) {
    let newCol = col.split('').reverse();
    let num = 0;
    for (let i = 0; i < newCol.length; i++) {
      num = num + ((newCol[i].charCodeAt(0) - 64) * Math.pow(26, i));
    }
    return num - 1;
  }
  fetchJson() {

    this.formulaLoader = true;
    this.formulaIcons = false;
    let headers = new Headers();
    this._builderService.fetchJson(this.excel.JsonFeed.jsonUrl)
      .subscribe(tableData => {
        this.formulaLoader = false;
        if (tableData.hasOwnProperty('success') && !tableData['success']) {
          this.formulajsonError = true;
          this.formulaIcons = false;
        } else {

          this.excel['jsonData'] = JSON.stringify(tableData);
          this.formulajsonConnected = true;
          this.formulaIcons = false;
          if (this.hot)
            this.hot.destroy();
          setTimeout(() => this.initExcelSheet(), 500);
          this.excel.JsonFeed.JsonFeedstatus = 'Connected';

        }

      }, (error) => {
        this.formulajsonError = true;
        this.formulaIcons = false;
        this.formulaLoader = false;
      })
  }
  resetjsonfeed() {
    this.excel.JsonFeed.jsonUrl = '';
    this.formulaIcons = false;
    this.formulajsonError = false;

  }

  statuschange(event) {
    if (this.excel.JsonFeed.JsonFeedstatus == 'Connected') {
      this.excel.JsonFeed.JsonFeedstatus = 'Disconnected';
      this.excel.JsonFeed.autoUpdate = false;
    } else {
      this.excel.JsonFeed.JsonFeedstatus = 'Connected';

    }

  }
  urlValidation(url) {
    let re = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
    if (!re.test(url)) {
      return false;
    } else {
      return true;
    }
  }
  hideJson() {
    this.jsonhide = false;
    jQuery(".upload-btn-area > .upload-btn").removeClass("active");

  }

  updateExcelOptions() {
    let self: any = this;
    if (this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex].excel && this.excelFlag) {
      let quesNowObject = this.jsonBuilderHelper.getJSONBuilt().formula[this.formulaIndex];
      console.log('this.computedFieldValue', this.computedFieldValue);
      let removeCommaValue = (this.computedFieldValue) ? this.computedFieldValue.toString().replace(/(,)/ig, '') : this.computedFieldValue;
      this.finalRandomValue = Number(removeCommaValue);
      // Range Result Check, Add Comma's and Decimal
      let lower: any, upper: any;
      if (quesNowObject.range.status) {
        let lowerVal = isNaN(parseFloat(quesNowObject.range.lower.value)) ? 0 : parseFloat(quesNowObject.range.lower.value);
        let upperVal = isNaN(parseFloat(quesNowObject.range.higher.value)) ? 0 : parseFloat(quesNowObject.range.higher.value);
        if (isNaN(parseFloat(this.finalRandomValue))) {
          this.finalRandomValue = 0;
        } else {
          this.finalRandomValue = parseFloat(this.finalRandomValue);
          if (quesNowObject.range.higher.type == 'Number' && quesNowObject.range.lower.type == 'Number') {
            lower = this.finalRandomValue - lowerVal;
            upper = this.finalRandomValue + upperVal;
          } else if (quesNowObject.range.higher.type == 'Percentage' && quesNowObject.range.lower.type == 'Percentage') {
            lower = this.finalRandomValue - (lowerVal / 100) * this.finalRandomValue;
            upper = this.finalRandomValue + (upperVal / 100) * this.finalRandomValue;
          }
          lower = this.formulaService.addCommas(lower.toFixed(Number(quesNowObject.decimal)));
          upper = this.formulaService.addCommas(upper.toFixed(Number(quesNowObject.decimal)));
          if (quesNowObject && quesNowObject.units.postfix) {
            lower += quesNowObject.units.postValue;
            upper += quesNowObject.units.postValue;
          }
          if (quesNowObject && quesNowObject.units.prefix) {
            lower = quesNowObject.units.preValue + lower;
            upper = quesNowObject.units.preValue + upper;
          }
          this.finalRandomValue = lower + ' to ' + upper;
        }
      } else {
        if (isNaN(parseFloat(this.finalRandomValue))) {
          if (this.finalRandomValue == undefined) this.finalRandomValue = 0;
        } else {
          this.finalRandomValue = Number(this.finalRandomValue);
          this.finalRandomValue = this.formulaService.addCommas(this.finalRandomValue.toFixed(Number(quesNowObject.decimal)));
          if (quesNowObject && quesNowObject.units.postfix) this.finalRandomValue += quesNowObject.units.postValue;
          if (quesNowObject && quesNowObject.units.prefix) this.finalRandomValue = quesNowObject.units.preValue + this.finalRandomValue;
        }
      }
      setTimeout(() => jQuery('#final-result-range-xls')[0].innerHTML = '<li>' + self.finalRandomValue + '</li>', 500);
    }
  }

  charPos(str, char) {
    let charIndexs: any = [];
    let validFormula: boolean = true
    charIndexs = str.split("").map(function (c, i) { if (c == char) return i; }).filter(function (v) { return v >= 0; });
    for (let index of charIndexs) {
      if (str[index - 1] == '=' || str[index + 1] == '=') {
        // console.log('Condtional Operator Used');
      } else {
        validFormula = false;
      }
    }
    return validFormula;
  }
}
