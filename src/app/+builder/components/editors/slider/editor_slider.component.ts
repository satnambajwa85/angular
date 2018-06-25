import { environment } from './../../../../../../environments/environment';
import { FroalaService } from './../../../services/froala.service';
import { AfterViewInit } from '@angular/core';
import { FormulaService } from './../../../services/formula.service';
import { FeatureAuthService } from './../../../../../shared/services/feature-access.service';
import { Component, Input, ViewEncapsulation, OnChanges, OnDestroy } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { TemplateRendererService } from './../../../../templates/services/templateRenderer.service';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;
declare var filepicker: any;

@Component({
  selector: 'editor-slider',
  templateUrl: './assets/html/editor_slider.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorSlider implements OnChanges, OnDestroy, AfterViewInit {

  @Input() control: any;
  filePickerKey: any = environment.FILE_PICKER_API;
  froalaHelpText: any = {};
  constructor(
    public jsonBuilderHelper: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public _templateRenderer: TemplateRendererService,
    public _featureAuthService: FeatureAuthService,
    public formulaService: FormulaService,
    public froalaService: FroalaService
  ) {
    this.control = jsonBuilderHelper.getSelectedControl();
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
  }

  initWysiwyg() {
    this.froalaHelpText.options = false;
    setTimeout(() => {
      this.froalaHelpText.options = this.froalaService.getOptions({ handler: this.froalaHelpText, isAddVariable: true });
    });
  }

  onChange(control: any) {
    control.config.validations.required.status = !control.config.validations.required.status;
    this.jsonBuilderHelper.updateFormGroup();
  }

  onChangeDescription(control: any) {
    control.config.showHelp = !control.config.showHelp;
    let helpText = control.props.helpText;
     helpText = helpText.replace(/&nbsp;|<\/?p[^>]*>/ig,"").trim();
    if(control.config.showHelp && helpText == "") {
      control.props.helpText = "This is question help text";
    }
    if (control.config.showHelp) {
      jQuery('.show-check').parents('.type-details').find('.div-check').fadeIn('slow');
      this.initWysiwyg();
    } else {
      jQuery('.show-check').parents('.type-details').find('.div-check').fadeOut('slow');
    }
  }

  ngAfterViewInit() {
  }
  ngOnChanges() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedItems(this.control);
    this.initWysiwyg();
  }

  onSliderValChange($event: any, type: any) {
    if (type == 'minVal') {
      this.control.props.minVal = $event.target.value;
    } else if (type == 'maxVal') {
      this.control.props.maxVal = $event.target.value;
    } else if (type == 'defaultValue') {
      this.control.props.defaultValue = $event.target.value;
    } else if (type == 'steps') {
      this.control.props.steps = $event.target.value;
    }
    //Handle Unset of steps
    if (!this.control.props.steps) {
      this.control.props.steps = 1;
    }
    //Handle Unset of Min/Max Value
    if (!this.control.props.minVal) {
      this.control.props.minVal = 0;
    }
    if (!this.control.props.maxVal) {
      this.control.props.maxVal = 0;
    }
    if (!this.control.props.defaultValue) {
      this.control.props.defaultValue = this.control.props.minVal;
    }
    //Handle out of bounds Min/Max values
    if (parseFloat(this.control.props.maxVal) < parseFloat(this.control.props.minVal)) {
      this.control.props.maxVal = parseFloat(this.control.props.minVal);
    }
    if (parseFloat(this.control.props.minVal) > parseFloat(this.control.props.maxVal)) {
      this.control.props.minVal = parseFloat(this.control.props.maxVal);
    }
    //Handle out of bounds default values
    if (parseFloat(this.control.props.defaultValue) > parseFloat(this.control.props.maxVal)) {
      this.control.props.defaultValue = this.control.props.maxVal;
    } else if (parseFloat(this.control.props.defaultValue) < parseFloat(this.control.props.minVal)) {
      this.control.props.defaultValue = this.control.props.minVal;
    }
    var grid_snap: Boolean = false;
    if ((parseFloat(this.control.props.maxVal) - parseFloat(this.control.props.minVal)) / (parseFloat(this.control.props.steps)) < 11) {
      grid_snap = true;
    }
    this.appendGrid();
    // var sliderRef: any = jQuery('#' + this.control._id).data('ionRangeSlider');
    var sliderJson: any = {
      min: parseFloat(this.control.props.minVal),
      max: parseFloat(this.control.props.maxVal),
      step: parseFloat(this.control.props.steps),
      grid: this.control.props.scale,
      grid_snap: (grid_snap && this.control.props.scale),
      from: parseFloat(this.control.props.defaultValue)
    };
    if (this.control.props.postfix) {
      sliderJson["postfix"] = this.control.props.unit;
      sliderJson["prefix"] = '';
    } else {
      sliderJson["prefix"] = this.control.props.unit;
      sliderJson["postfix"] = '';
    }
    // sliderRef.update(sliderJson);
    this.jsonBuilderHelper.commonEmitter.emit({ msg: 'update slider', value: this.control.props.defaultValue, id: this.control._id });
  }

  toggleScale($event: any, control: any) {
    control.props.scale = !control.props.scale;
    this.onSliderValChange($event, 'scale');
  }

  callGA(str: string, control: any = {}) {
    switch (str) {
      case "HELPTEXT":
        if (control.config.showHelp) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ToggleHelpTextOn');
          // _kmq.push(['record', 'Builder Toggle Help Text On']);
        }
        else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ToggleHelpTextOff');
          // _kmq.push(['record', 'Builder Toggle Help Text Off']);
        }
        break;

      case "SCALE":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'NumericScaleToggle');
        // _kmq.push(['record', 'Builder Numeric Scale Toggle']);
        break;
    }
  }

  onPostfixChange($event: any) {
    if ($event.target.value == 'postfix') {
      this.control.props.postfix = true;
    } else {
      this.control.props.postfix = false;
    }
    this.onSliderValChange($event, 'postfix');
  }

  ngOnDestroy() {
    this._templateRenderer.computeMinMax();
  }

  openLogicPopup() {
    if (this._featureAuthService.features.logic_jump.active)
      jQuery('#logic-jump').modal('toggle');
    else {
      this._featureAuthService.setSelectedFeature("logic_jump", null);
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('.modal-backdrop').addClass('added');
    }
  }

  // Functions for Scale
  appendGrid() {
    if (this.control.props.scale) {
      let grid_snap: Boolean = false;
      if ((parseFloat(this.control.props.maxVal) - parseFloat(this.control.props.minVal)) / (parseFloat(this.control.props.steps)) < 11) {
        grid_snap = true;
      }
      let a = {
        grid_snap: (grid_snap && this.control.props.scale),
        step: parseFloat(this.control.props.steps),
        min: parseFloat(this.control.props.minVal),
        max: parseFloat(this.control.props.maxVal),
        grid_num: 4
      };
      let b;
      b = a.max - a.min;
      let c = a.grid_num, e = 0;
      a.grid_snap ? (c = Math.ceil(b / a.step), e = this.toFixed(a.step / (b / 100))) : e = this.toFixed(100 / c);
      // let multiplier = Math.ceil((a.grid_snap) ? a.step : (a.max - a.min) / c);
      let multiplier = (a.grid_snap) ? a.step : (a.max - a.min) / c;
      this.control.scaleArray = [];
      for (b = 0; b < c + 1; b++) {
        let scaleVal = (b * multiplier) + a.min;
        scaleVal = (scaleVal > a.max) ? a.max : scaleVal;
        let scaleWidth = (scaleVal - a.min) / (a.max - a.min);
        let scaleObj: any = {};
        scaleObj['scaleVal'] = this.prettify(Number(scaleVal.toFixed(2)));
        scaleObj['scaleWidth'] = Math.round(scaleWidth * 100) + '%';
        this.control.scaleArray.push(scaleObj);
      }
    }
  }

  toFixed(a: any) {
    a = a.toFixed(9);
    return +a;
  }

  prettify(num: any, fixed?: any) {
    console.log('num=>', num);
    if (num < 1000) return num;
    if (num === null) { return null; } // terminate early
    if (num === 0) { return '0'; } // terminate early
    fixed = (!fixed || fixed < 0) ? 0 : fixed; // number of decimal places to show
    var b = (num).toPrecision(2).split("e"), // get power
      k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
      c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3)).toFixed(1 + fixed), // divide by power
      d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
      e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
    return e;
  }
}
