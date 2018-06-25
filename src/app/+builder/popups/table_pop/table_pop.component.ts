import { element } from 'protractor';
import { Http, RequestOptions } from '@angular/http';
import { Component, OnInit, AfterViewInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormulaService } from '../../services/formula.service';
import { JSONBuilder } from '../../services/JSONBuilder.service';
import { ComponentService } from '../../services/component.service';
import { VisualsService } from './../../services/visuals.service';
import { BuilderService } from './../../services/builder.service';
import * as XLSX from 'xlsx';
import { Builder } from 'selenium-webdriver';
declare let jQuery: any;
declare let math: any;
declare let Handsontable: any;
declare let Highcharts: any;
@Component({
  selector: 'table-pop',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './assets/html/table_pop.component.html',
  styleUrls: ['./assets/css/handsontable.full.min.css',
    './assets/css/design.css'
  ]
})

export class TablePopComponent implements OnInit, AfterViewInit, OnDestroy {
  data: any[] = [];
  hot: any;
  mapForRandomValues: any = {};
  variables: any = {};
  table_prop: boolean = true;
  visuals: any;
  constResultList: any;
  constQuestionList: any;
  tableData: any = [];
  uploadData: any = [];
  jsonIcons: boolean = false;
  dataLoader: boolean = false;
  jsonError: boolean = false;
  jsonConnected: boolean = false;
  tableshow: boolean = false;
  a: any = { b: 10 };
  headers: any;

  constructor(public jsonBuilderHelper: JSONBuilder,
    public formulaService: FormulaService,
    public componentService: ComponentService,
    public visualsService: VisualsService,
    public http: Http,
    public _builderService: BuilderService) {
  }

  ngOnInit(): any {
    this.jsonBuilderHelper.updateTemplateQuestionare();
    [this.constQuestionList, this.constResultList] = this.visualsService.getResultsAndFormulas();
    this.visuals = JSON.parse(JSON.stringify(this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals));
    if (this.jsonBuilderHelper.isTempType(['Graded'])) {
      this.showGradedTable();
    }
    if (this.visuals.table.hasOwnProperty('JsonFeed')) {
      if (this.visuals.table.JsonFeed.JsonFeedstatus == 'Connected') {
        this.jsonConnected = true;
      }
    }



  }

  showGradedTable() {
    this.tableData = [];
    let randomPercentages = this.visualsService.gradedRandomPercentages(this.constQuestionList.length);
    let randomCorrect = Math.floor((Math.random() * (this.constQuestionList.length) + 1));
    this.tableData.push(['Score', 'People'])
    if (this.visuals.table.title == 'percentage')
      randomPercentages.forEach((element, index) => {
        this.tableData.push([index + 1, element + '%',
        randomCorrect == (index + 1) ? 'correct' : 'incorrect']);
      });
    else
      this.constQuestionList.forEach((element, index) => {
        this.tableData.push([index + 1, Math.floor((Math.random() * (200) + 1)),
        randomCorrect == (index + 1) ? 'correct' : 'incorrect']);
      });
  }

  ngAfterViewInit(): any {
    if (this.jsonBuilderHelper.isTempType(['Numerical'])) {

      if (this.visuals.table.tempRawJSON) {
        try {
          this.data = JSON.parse(this.visuals.table.tempRawJSON);
        } catch (e) {
        }
      } else if (this.visuals.table.rawJSON) {
        try {
          this.data = JSON.parse(this.visuals.table.rawJSON);
        } catch (e) {
        }
      }
      else {
        this.data.push(['', 'Top Notch', 'Good', 'Budget', 'Poor (flat price)']);
        this.data.push(['Price ($)', '200', '150', '=(3*Q_1+3*Q_2)', '=(2*Q_2+2*Q_1)']);
        this.data.push(['After Discount ($)', '220', '130', '90', '45']);
      }
      setTimeout(() => {
        this.initExcelSheet();
      }, 500);
    }
    jQuery('#table-modal').on('shown.bs.modal', function () {
      jQuery(document).off('focusin.bs.modal');
    });
    jQuery('#table-modal').on('hidden.bs.modal', () => {
      if (this.jsonBuilderHelper.isTempType(['Numerical'])) {
        //console.log(this.hot.getSourceData());
        this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals.table.tempRawJSON = JSON.stringify(this.hot.getSourceData());

      }
      this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals = this.visuals;
      this.componentService.tableExcel.tablePop = false;
    });
    jQuery(".btn-jason-trigger").click(function () {
      jQuery(".jason-feed").show();
      jQuery(".btn-jason-trigger").addClass('active');
    });
    jQuery(".icon-div-close").click(function () {
      jQuery(".jason-feed").hide();
      jQuery(".btn-jason-trigger").removeClass('active');
    });


  }

  ngOnDestroy(): void {
    if (this.hot)
      this.hot.destroy();
  }

  initExcelSheet(): any {
    this.updateVariables();
    let container = document.getElementById('og-excel-table');
    this.hot = new Handsontable(container, {
      data: this.data,
      rowHeaders: true,
      colHeaders: true,
      width: 818,
      height: 418,
      rowHeights: 26,
      renderAllRows: true,
      contextMenu: true,
      formulas: {
        variables: this.variables
      },

      afterChange: (change, source) => {
        if (source != 'loadData') { }
      }
    });
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

  generateNewRowData() {
    let randomQuesValues = this.constQuestionList.map((val: any) => {
      return "=(Q_" + Number(val.split('Q')[1]) + ")";
    });
    let resultValues = this.constResultList.map((val: any) => {
      return "=(R_" + Number(val.split('R')[1]) + ")";
    });
    return ['TitleNew'].concat(randomQuesValues, resultValues);
  }


  getRandomQuestionVal(quesNumber: number) {
    let ques = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[quesNumber - 1];
    if (ques) {
      if (ques.type == 'slider' || (ques.type == 'textfield' && ques.config.type == 'number') || ques.type == 'rating') {
        let min = parseFloat(ques.props.minVal);
        let max = parseFloat(ques.props.maxVal);
        return Number((Math.random() * (max - min) + min).toFixed(Number(this.visuals.table.decimal)));
      } else
        return Number(Number(ques.options[Math.floor(Math.random() * ques.options.length)].value).toFixed(Number(this.visuals.table.decimal)));
    }
  }

  onChangeDecimalPlaces($value: any) {
    this.visuals.table.decimal = $value;
    this.updateVariables();
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

  saveData(): any {
    if (this.jsonBuilderHelper.isTempType(['Numerical']))
      this.visuals.table.rawJSON = JSON.stringify(this.hot.getSourceData());
    this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals = this.visuals;
    this.table_prop = false
  }

  // getVisuals() {
  //   if (this.componentService.graph.conditionalIndex >= 0)   //Conditional
  //     return this.jsonBuilderHelper.getJSONBuilt().pages.find((page: any) => page.type == 'Result')
  //       .sections.find((section: any) => section.type == 'Result')
  //       .items[this.componentService.graph.formulaIndex]
  //       .options[this.componentService.graph.conditionalIndex].visuals;
  //   else    //Result
  //     return this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals;
  // }

  uploadXls(evt) {
    /* wire up file reader */
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
      this.uploadData = (XLSX.utils.sheet_to_formulae(ws));
      let newData = [];
      let noR = this.uploadData[this.uploadData.length - 1].split('=')[0].match(/([A-Za-z]+)([0-9]+)/)[2];
      for (let j = 0; j < noR; j++) {
        newData.push(['', '']);
      }
      this.uploadData.map(val => {
        let i = Number(val.split('=')[0].match(/([A-Za-z]+)([0-9]+)/)[2]) - 1;
        let j = this.getcolumnNumber(val.split('=')[0].match(/([A-Za-z]+)([0-9]+)/)[1]);
        let value = val.split('=')[1].toUpperCase().replace(/"|'/g, '');
        if (i == 0 || j == 0) {
          newData[i][j] = value;
        } else {
          newData[i][j] = '=' + value;
        }
      });
      this.data = newData;
      if (this.visuals.table.hasOwnProperty('JsonFeed')) {
        if (this.visuals.table.JsonFeed.JsonFeedstatus == 'Connected') {
          this.visuals.table.JsonFeed.JsonFeedstatus = 'Disconnected';
          this.visuals.table.JsonFeed.autoUpdate = false;

        }
      }
      if (this.hot)
        this.hot.destroy();
      setTimeout(() => this.initExcelSheet(), 500);
      jQuery(".jason-feed").hide();

      jQuery(".btn-jason-trigger").removeClass('active');
    };
    reader.readAsBinaryString(target.files[0]);
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
    this.dataLoader = true;
    this.jsonIcons = false;
    this._builderService.fetchJson(this.visuals.table.JsonFeed.jsonUrl).subscribe(tableData => {
      if (tableData.hasOwnProperty('success') && !tableData['success']) {
        this.jsonError = true;
        this.jsonIcons = false;
        this.dataLoader = false;
      } else {
        this.dataLoader = false;
        this.data = tableData;
        this.jsonConnected = true;
        this.jsonIcons = false;
        if (this.hot)
          this.hot.destroy();
        setTimeout(() => this.initExcelSheet(), 500);
        this.visuals.table.JsonFeed.JsonFeedstatus = 'Connected';
      }
    }, (error) => {
      this.jsonError = true;
      this.jsonIcons = false;
      this.dataLoader = false;
    });
  }

  resetjsonfeed() {
    this.visuals.table.JsonFeed.jsonUrl = '';
    this.jsonIcons = false;
    this.jsonError = false;

  }

  statuschange() {
    if (this.visuals.table.JsonFeed.JsonFeedstatus == 'Connected') {
      this.visuals.table.JsonFeed.JsonFeedstatus = 'Disconnected';
      this.visuals.table.JsonFeed.autoUpdate = false;
    } else {
      this.visuals.table.JsonFeed.JsonFeedstatus = 'Connected';

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

}


