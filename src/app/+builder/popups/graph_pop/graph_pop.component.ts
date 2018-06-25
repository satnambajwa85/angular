import { BuilderService } from './../../services/builder.service';
import { parse } from 'url';
import { Http } from '@angular/http';
import { Component, OnInit, AfterViewInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormulaService } from '../../services/formula.service';
import { JSONBuilder } from '../../services/JSONBuilder.service';
import { ComponentService } from '../../services/component.service';
import { VisualsService } from './../../services/visuals.service';
import * as XLSX from 'xlsx';
declare let jQuery: any;
declare let math: any;
declare let Handsontable: any;
declare let Highcharts: any;
@Component({
  selector: 'graph-pop',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './assets/html/graph_pop.component.html',
  styleUrls: ['./assets/css/handsontable.full.min.css',
    './assets/css/design.css'
  ]
})

export class GraphPopComponent implements OnInit, AfterViewInit, OnDestroy {
  data: any[] = [];
  hot: any;
  mapForRandomValues: any = {};
  variables: any = {};
  table_prop: boolean = true;
  visuals: any;
  constResultList: any;
  constQuestionList: any;
  colorChangeIndex: number = 0;
  colors: any;
  isPieValid: boolean = true;
  chartInstance: any;
  uploadData: any = [];
  graphIcons: boolean = false;
  graphLoader: boolean = false;
  graphError: boolean = false;
  graphConnected: boolean = false;
  tableData: any = [];
  graphshow: boolean = false;
  constructor(public jsonBuilderHelper: JSONBuilder,
    public formulaService: FormulaService,
    public componentService: ComponentService,
    public visualsService: VisualsService,
    public _builderService: BuilderService) {
  }


  ngOnInit(): any {
    this.jsonBuilderHelper.updateTemplateQuestionare();
    [this.constQuestionList, this.constResultList] = this.visualsService.getResultsAndFormulas();
    this.visuals = JSON.parse(JSON.stringify(this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals));
    if (this.visuals.graph.tempColors)
      this.colors = JSON.parse(JSON.stringify(this.visuals.graph.tempColors));
    else if (this.visuals.graph.colors)
      this.colors = JSON.parse(JSON.stringify(this.visuals.graph.colors));

    if (this.visuals.graph.hasOwnProperty('JsonFeed')) {
      if (this.visuals.graph.JsonFeed.JsonFeedstatus == 'Connected') {
        this.graphConnected = true;
      }
    }
  }

  ngAfterViewInit(): any {
    if (this.jsonBuilderHelper.isTempType(['Numerical'])) {
      if (this.visuals.graph.tempRawJSON) {
        try {
          this.data = JSON.parse(this.visuals.graph.tempRawJSON);
        } catch (e) {
        }
      } else if (this.visuals.graph.rawJSON) {
        try {
          this.data = JSON.parse(this.visuals.graph.rawJSON);
        } catch (e) {
        }
      }
      else {
        this.data.push(['', 'Top Notch', 'Good', 'Budget', 'Poor (flat price)']);
        this.data.push(['Price ($)', '200', '150', '=(3*Q_1+3*Q_2)', '=(2*Q_2+2*Q_1)']);
        this.data.push(['After Discount ($)', '220', '130', '90', '45']);
      }
      this.colorPickerInit();
      setTimeout(() => this.initExcelSheet(), 500);
      setTimeout(() => this.createChart(), 1000);
    } else if (this.jsonBuilderHelper.isTempType(['Graded'])) {
      setTimeout(() => this.createGradedChart(), 500);
    }
    jQuery('#graph-modal-new').on('shown.bs.modal', function () {
      jQuery(document).off('focusin.bs.modal');
    });
    jQuery('#graph-modal-new').on('hidden.bs.modal', () => {
      if (this.jsonBuilderHelper.isTempType(['Numerical'])) {
        this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals.graph.tempRawJSON = JSON.stringify(this.hot.getSourceData())
        this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals.graph.tempColors = this.colors;
        this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals = this.visuals;

      }
      this.componentService.graph.graphPop = false;
    });
    jQuery(".btn-jason-trigger").click(function () {

      jQuery(".btn-jason-trigger").addClass('active');

      jQuery(".jason-feed").show();
    });
    jQuery(".icon-div-close").click(function () {

      jQuery(".btn-jason-trigger").removeClass('active');

      jQuery(".jason-feed").hide();
    });
  }

  ngOnDestroy(): void {
    if (this.hot)
      this.hot.destroy();
    this.chartInstance.destroy();
  }

  colorPickerInit() {
    let self = this;
    jQuery('.graph-color-picker').ColorPickerSliders({
      sliders: false,
      flat: true,
      swatches: false,
      hsvpanel: true,
      previewformat: 'hex',
      size: 'large',
      placement: 'top',
      color: self.colors[self.colorChangeIndex],
      onchange: function (container, color) {
        setTimeout(() => self.colors[self.colorChangeIndex] = '#' + color.tiny.toHex(), 100);
      }
    });

    jQuery('.graph-color-picker-single').ColorPickerSliders({
      sliders: false,
      flat: true,
      swatches: false,
      hsvpanel: true,
      previewformat: 'hex',
      size: 'large',
      placement: 'top',
      color: self.visuals.graph.defaultColor,
      onchange: function (container, color) {
        self.visuals.graph.defaultColor = '#' + color.tiny.toHex();
      }
    });
  }

  multiColor(colorIndex: number) {
    this.colorChangeIndex = colorIndex;
    jQuery('.graph-theme-modal').removeClass('hide');
    jQuery('.graph-color-picker').trigger("colorpickersliders.updateColor", this.colors[this.colorChangeIndex]);
  }

  singleColor() {
    jQuery('.graph-color-picker-single-modal').removeClass('hide');
    jQuery('.graph-color-picker-single').trigger("colorpickersliders.updateColor", this.visuals.graph.defaultColor);
  }

  CloseTintModal() {
    jQuery('.theme-modal').addClass('hide');
    this.createChart();
  }

  initExcelSheet(): any {
    let self = this;
    this.updateVariables();
    let container = document.getElementById('og-excel-table');
    this.hot = new Handsontable(container, {
      data: this.data,
      rowHeaders: true,
      colHeaders: true,
      width: 600,
      height: 425,
      rowHeights: 26,
      renderAllRows: true,
      allowRemoveRow: this.data.length > 2 ? true : false,
      fillHandle: {
        autoInsertRow: false,
      },
      contextMenu: {
        callback: function (key, options) {
          if (key == 'row_above') {
            self.colors.splice(options.start.row - 1, 0, "#48cd45");
          } else if (key == 'row_below') {
            self.colors.splice(options.end.row, 0, "#48cd45");
          } else if (key == 'remove_row') {
            self.colors.splice(options.start.row - 1, options.end.row - options.start.row + 1);
          }
          self.createChart();
          if (self.hot) {
            self.hot.updateSettings({
              allowRemoveRow: self.data.length > 2 ? true : false
            });
          }
          if (self.data.length <= 2) {
            self.visuals.graph.isDefaultColor = true;
          }
        }
      },
      formulas: {
        variables: this.variables
      },

      afterChange: (change, source) => {
        if (source != 'loadData') {
          this.createChart();
        }
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

  toggleGraphColorType(status: boolean) {
    this.visuals.graph.isDefaultColor = status;
    this.createChart();
  }

  getRandomQuestionVal(quesNumber: number) {
    let ques = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[quesNumber - 1];
    if (ques) {
      if (ques.type == 'slider' || (ques.type == 'textfield' && ques.config.type == 'number') || ques.type == 'rating') {
        let min = parseFloat(ques.props.minVal);
        let max = parseFloat(ques.props.maxVal);
        return Number((Math.random() * (max - min) + min).toFixed(Number(this.visuals.graph.decimal)));
      } else
        return Number(Number(ques.options[Math.floor(Math.random() * ques.options.length)].value).toFixed(Number(this.visuals.graph.decimal)));
    }
  }

  getResultsValue(resultNumber: number) {
    let formula = this.formulaService.replaceRs(this.jsonBuilderHelper.getJSONBuilt().formula[resultNumber - 1].result);
    let excel = this.jsonBuilderHelper.getJSONBuilt().formula[resultNumber - 1].excel;
    // Excel Formula
    if (excel && excel.active && excel.jsonData.length) {
      return 'Excel Formula'
    }
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
    if (this.jsonBuilderHelper.isTempType(['Numerical'])) {
      this.visuals.graph.rawJSON = JSON.stringify(this.hot.getSourceData());
      this.visuals.graph.colors = this.colors;
    }
    this.table_prop = false;
    this.jsonBuilderHelper.getJSONBuilt().formula[this.componentService.graph.formulaIndex].visuals = this.visuals;
  }

  getDataSet(data: any): any {
    let dataSet = [];
    data.forEach((row: any, index: number) => {
      if (index) {  //to skip the first row
        let values = [];
        row.splice(1).forEach((val: any, itemIndex: number) => {
          let yData = isNaN(val) ? 0 : Number(val);
          values.push({
            name: data[0][itemIndex + 1],
            y: Number(yData.toFixed(Number(this.visuals.graph.decimal))),
            color: (this.visuals.graph.type == 'pie' && !this.visuals.graph.isDefaultColor) ? '' : (this.visuals.graph.isDefaultColor ? this.visuals.graph.defaultColor : this.colors[index - 1])
          });
        });
        //The if is used so that we take in only first row in case of PIE Charts
        if (this.visuals.graph.type != 'pie' || index == 1) {
          dataSet.push({
            data: values,
            name: row[0],
            color: this.visuals.graph.isDefaultColor ? this.visuals.graph.defaultColor : this.colors[index - 1]
          });
        }
      }
    });
    return dataSet;
  }

  onChangeDecimalPlaces($value: any) {
    this.visuals.graph.decimal = $value;
    this.createChart();
  }

  onChangePrefix(type: any, $value: any) {
    if (type === 'preValue') {
      this.visuals.graph.preValue = $value;
    }
    if (type === 'postValue') {
      this.visuals.graph.postValue = $value;
    }
    this.createChart();
  }

  toggleGraphType(type: string) {
    this.visuals.graph.type = type;
    if (this.visuals.graph.type !== 'line') {
      this.visuals.graph.polar = false;
    }
    if (this.jsonBuilderHelper.isTempType(['Numerical']))
      this.createChart();
    else if (this.jsonBuilderHelper.isTempType(['Graded']))
      this.createGradedChart();
  }

  updateStacking() {
    this.visuals.graph.stacking = (this.visuals.graph.stacking) ? '' : 'normal';
  }

  createChart() {
    let self = this;
    let hotData = this.hot.getData();
    let graphType = this.visuals.graph.type;
    this.isPieValid = (hotData.length > 2 || graphType == 'pie') ? false : true;

    if (this.chartInstance)
      this.chartInstance.destroy();
    this.updateChartOptions();
    this.chartInstance = Highcharts.chart('container', {
      chart: {
        type: graphType,
        backgroundColor: '#fff',
        polar: self.visuals.graph.polar,
        reflow: false,
        // spacingBottom: 40,
        // marginBottom: 90,
      },
      scrollbar: {
        liveRedraw: false
      },
      tooltip: {
        valuePrefix: self.visuals.graph.preValue,
        valueSuffix: self.visuals.graph.postValue,
        formatter: function () {
          let tooltip = ''
          if (graphType !== 'pie')
            tooltip += self.visuals.graph.xAxis + ' ' + this.x + '<br>';
          tooltip += '<p>' + (this.series.userOptions.name == null ? '' : this.series.userOptions.name) + (self.visuals.graph.preValue ? self.visuals.graph.preValue : '') + self.formulaService.addCommas(this.y) + (self.visuals.graph.postValue ? self.visuals.graph.postValue : '') + '</p>';
          return tooltip;
        }
      },
      title: {
        text: null
      },
      xAxis: {
        categories: hotData[0].slice(1).map(x => x ? x : ''),
        lineWidth: 0,
        minorGridLineWidth: 0,
        lineColor: 'transparent',
        title: {
          text: this.visuals.graph.axis ? this.visuals.graph.xAxis : '',
          style: {
            color: '#444444',
            width: 370,
          }
        },
        labels: {
          style: {
            // color: this.visuals.graph.textColor,
            color: '#444444',
          }
        }
      },
      yAxis:
        {
          min: 0,
          title: {
            text: this.visuals.graph.axis ? this.visuals.graph.yAxis : '',
            style: {
              color: '#444444',
              width: 370,
            }
          },
          alternateGridColor: this.visuals.graph.grid ? '#f6f7f9' : '',
          labels: {
            style: {
              // color: this.visuals.graph.textColor,
              color: '#444444',
            }
          }
        },
      legend: {
        // reversed: true,
        // enabled: this.visuals.graph.legend,
        // enabled: true,
        // verticalAlign : this.visuals.graph.legendPosition,
        // enabled: this.visuals.graph.legend,
        // verticalAlign: this.visuals.graph.legendPosition,
        // y: 35,
        // width: 400,
        // floating: false,
        // x: 60,
        // borderWidth: 0,
        // align: 'center',
        // layout: 'horizontal',
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          groupPadding: 0,
          shadow: false,
          stacking: (graphType == 'line' || graphType == 'pie') ? '' : this.visuals.graph.stacking,
          showInLegend: false,
        },
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: false
          },
          showInLegend: true,
          legend: {
            reversed: true,
            y: 35,
            width: 400,
            floating: false,
            x: 60,
            borderWidth: 0,
            align: 'center',
            layout: 'horizontal',
          },
        },
        line: {
          showInLegend: this.jsonBuilderHelper.isTempName(['experian'])
        },
        bar: {
          showInLegend: false
        },
        series: {
          // pointWidth: graphType == 'column' ? 20 : 10,
          stacking: (graphType == 'line' || graphType == 'pie') ? '' : this.visuals.graph.stacking,
        },
        // series: {
        //   pointWidth: 30
        // }
      },
      series: this.getDataSet(hotData)
    });
  }

  getGradedDevGraphDetails() {
    let values = [], xAxisCategories = [];

    if (this.constQuestionList.length <= 10) {
      const randomPercentages = this.visualsService.gradedRandomPercentages(this.constQuestionList.length);
      const randomCorrect = Math.floor((Math.random() * (this.constQuestionList.length) + 1));
      this.constQuestionList.forEach((element, index) => {
        values.push(
          {
            name: randomCorrect == (index + 1) ? "Your Score" : "Other's Score",
            y: this.visuals.graph.titleColor == 'percentage' ? randomPercentages[index] : Math.floor((Math.random() * (200) + 1)), // if absolute select random number between 1 to 200
            color: randomCorrect == (index + 1) ? this.visuals.graph.colors[0] : this.visuals.graph.colors[1]
          }
        );
      });
      xAxisCategories = this.constQuestionList.map(val => val.substr(1));
    } else if (this.constQuestionList.length <= 30) {
      const randomPercentages = this.visualsService.gradedRandomPercentages(Math.ceil(this.constQuestionList.length / 2));
      const randomCorrect = Math.floor((Math.random() * (Math.ceil(this.constQuestionList.length / 2)) + 1));
      let tempXAxisCategories = [];
      xAxisCategories = this.constQuestionList.map(val => val.substr(1));
      this.constQuestionList.forEach((val, index: number) => {
        if ((index % 2) == 0) {
          if (xAxisCategories[index + 1])
            tempXAxisCategories.push(`${xAxisCategories[index]} to ${xAxisCategories[index + 1]}`);
          else
            tempXAxisCategories.push(xAxisCategories[index]);
          values.push(
            {
              name: randomCorrect == (Math.floor(index / 2) + 1) ? "Your Score" : "Other's Score",
              y: this.visuals.graph.titleColor == 'percentage' ? randomPercentages[(Math.floor(index / 2))] : Math.floor((Math.random() * (200) + 1)), // if absolute select random number between 1 to 200
              color: randomCorrect == (Math.floor(index / 2) + 1) ? this.visuals.graph.colors[0] : this.visuals.graph.colors[1]
            }
          );
        }
      });
      xAxisCategories = tempXAxisCategories;
    } else {
      const randomPercentages = this.visualsService.gradedRandomPercentages(Math.ceil(this.constQuestionList.length / 5));
      const randomCorrect = Math.floor((Math.random() * (Math.ceil(this.constQuestionList.length / 5)) + 1));
      let tempXAxisCategories = [];
      xAxisCategories = this.constQuestionList.map(val => val.substr(1));
      this.constQuestionList.forEach((val, index: number) => {
        if ((index % 5) == 0) {
          if (xAxisCategories[index + 5])
            tempXAxisCategories.push(`${xAxisCategories[index]} to ${xAxisCategories[index + 5]}`);
          else
            tempXAxisCategories.push(`${xAxisCategories[index]} to ${xAxisCategories[index + (this.constQuestionList.length - 1 - index)]}`);
          values.push(
            {
              name: randomCorrect == (Math.floor(index / 5) + 1) ? "Your Score" : "Other's Score",
              y: this.visuals.graph.titleColor == 'percentage' ? randomPercentages[(Math.floor(index / 5))] : Math.floor((Math.random() * (200) + 1)), // if absolute select random number between 1 to 200
              color: randomCorrect == (Math.floor(index / 5) + 1) ? this.visuals.graph.colors[0] : this.visuals.graph.colors[1]
            }
          );
        }
      });
      xAxisCategories = tempXAxisCategories;
    }
    return [values, xAxisCategories];
  }

  createGradedChart() {
    let self = this;
    let [values, xAxisCategories] = this.visualsService.getGradedDevGraphDetails(this.constQuestionList, this.visuals);

    let data: any = [{
      name: this.visuals.graph.titleColor == 'percentage' ? 'Percentage of people (%) ' : 'No: of people ',
      data: values
    }];
    let graphType = this.visuals.graph.type;
    if (this.chartInstance) this.chartInstance.destroy();
    this.updateChartOptions();
    this.chartInstance = Highcharts.chart('container', {
      chart: {
        type: graphType,
        backgroundColor: '#fff',
        polar: self.visuals.graph.polar,
        reflow: false,
      },
      title: {
        text: null
      },
      scrollbar: {
        liveRedraw: false
      },
      tooltip: {
        formatter: function () {
          let tooltip = ''
          if (graphType !== 'pie')
            tooltip += 'Score ' + this.x + '<br>';
          tooltip += '<p>' + this.series.name + self.formulaService.addCommas(this.y) + '</p>';
          return tooltip;
        }
      },
      xAxis: {
        categories: xAxisCategories,
        lineWidth: 0,
        minorGridLineWidth: 0,
        lineColor: 'transparent',
        title: {
          text: 'Score',
          style: {
            color: '#444444',
            width: 370,
          }
        },
        labels: {
          style: {
            color: '#444444',
          }
        }
      },
      yAxis:
        {
          min: 0,
          title: {
            text: this.visuals.graph.titleColor == 'percentage' ? 'Percentage' : 'No of people',
            style: {
              color: '#444444',
              width: 370,
            }
          },
          alternateGridColor: this.visuals.graph.grid ? '#f6f7f9' : '',
          labels: {
            style: {
              color: '#444444',
            }
          }
        },
      legend: {},
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          groupPadding: 0,
          shadow: false,
          stacking: graphType != 'line' ? this.visuals.graph.stacking : '',
          showInLegend: false,
        },
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: false
          },
          showInLegend: true,
        },
        line: {
          showInLegend: false
        },
        bar: {
          showInLegend: false
        },
        series: {
          stacking: graphType != 'line' ? this.visuals.graph.stacking : ''
        },
      },
      series: data
    });
  }

  updateChartOptions() {
    Highcharts.setOptions({
      lang: {
        decimalPoint: '.',
        thousandsSep: ','
      }
    });
  }

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
      let self = this;
      this.colors = Array.apply(null, Array(this.data.length - 1)).map(function () { return self.getRandomColor() });
      if (this.hot)
        this.hot.destroy();
      setTimeout(() => this.initExcelSheet(), 500);
      setTimeout(() => this.createChart(), 1000);
      jQuery(".jason-feed").hide();
      jQuery(".btn-jason-trigger").removeClass('active');
      if (this.visuals.graph.hasOwnProperty('JsonFeed')) {
        if (this.visuals.graph.JsonFeed.JsonFeedstatus == 'Connected') {
          this.visuals.graph.JsonFeed.JsonFeedstatus = 'Disconnected';
          this.visuals.graph.JsonFeed.autoUpdate = false;
        }
      }

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

  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  fetchJson() {
    this.graphLoader = true;
    this.graphIcons = false;
    this._builderService.fetchJson(this.visuals.graph.JsonFeed.jsonUrl).subscribe(tableData => {
      if (tableData.hasOwnProperty('success') && !tableData['success']) {
        this.graphError = true;
        this.graphIcons = false;
        this.graphLoader = false;
      } else {
        console.log(tableData);
        this.graphLoader = false;
        this.data = tableData;
        this.graphConnected = true;
        this.graphIcons = false;
        if (this.hot)
          this.hot.destroy();
        setTimeout(() => this.initExcelSheet(), 500);
        setTimeout(() => this.createChart(), 1000);
        this.visuals.graph.JsonFeed.JsonFeedstatus = 'Connected';
      }
    }, (error) => {
      this.graphError = true;
      this.graphIcons = false;
      this.graphLoader = false;
    });
  }
  resetjsonfeed() {
    this.visuals.graph.JsonFeed.jsonUrl = '';
    this.graphIcons = false;
    this.graphError = false;

  }
  statuschange() {
    if (this.visuals.graph.JsonFeed.JsonFeedstatus == 'Connected') {
      this.visuals.graph.JsonFeed.JsonFeedstatus = 'Disconnected';
      this.visuals.graph.JsonFeed.autoUpdate = false;
    } else {
      this.visuals.graph.JsonFeed.JsonFeedstatus = 'Connected';

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
