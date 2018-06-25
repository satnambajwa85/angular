import { JSONElement } from './../../../services/JSONElement.service';
import { FormulaService } from './../../../services/formula.service';
import { FroalaService } from './../../../services/froala.service';
import { JSONItemTracker } from './../../../services/JSONUpdateItemTracker.service';
import { JSONBuilder } from './../../../services/JSONBuilder.service';
import { Component, OnInit, Input } from '@angular/core';
declare var ga: any;
declare var jQuery: any;

@Component({
  selector: 'editor-rating',
  templateUrl: './editor_rating.component.html',
  styles: []
})
export class EditorRating implements OnInit {

  @Input() control: any;
  froalaHelpText: any = {};
  isQuestionInResults: boolean = false;
  sliderMax: number = 10;
  constructor(
    public jsonBuilderHelper: JSONBuilder,
    public _ItemTrackService: JSONItemTracker,
    public froalaService: FroalaService,
    public formulaService: FormulaService,
    public jsonElementHandler: JSONElement
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

  ngOnInit() {
    if (this.jsonBuilderHelper.getJSONBuilt().template == 'template-seven') {
      this.sliderMax = 5;
    } else this.sliderMax = this.control.props.minVal == 1 ? 10 : 11;
  }
  ngOnChanges() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedItems(this.control);
    this.initWysiwyg();
  }

  ngAfterViewInit() {
    let self = this;
    jQuery('body').on('click', function (e: any) {
      if (!jQuery('.option-icons.open').is(e.target)
        && jQuery('.option-icons.open .btn').has(e.target).length === 0

        && jQuery('.open').has(e.target).length === 0
      ) {
        jQuery('.option-icons').removeClass('open');
      }
    });
  }
  OpenChangeIcon() {
    jQuery('.choose-icon').parents('.iconopen').toggleClass('open');
  }
  OpenPreviousIcon() {
    if (jQuery(".option-icons").hasClass('open')) {
      jQuery('.option-icons').removeClass('open');
    }
    jQuery('.optionicon').toggleClass('open');
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
    }
  }

  onRatingValChange(ev: any, type: any) {
    let self = this;
    if (type == 'defaultStars') {
      if (Number(ev.target.value) >= 0 && Number(ev.target.value) <= Number(this.control.props.maxVal)) {
        this.control.props.defaultValue = Number(ev.target.value);
      } else if (ev.target.value < 0 || ev.target.value == '') {
        this.control.props.defaultValue = 0;
      } else {
        this.control.props.defaultValue = Number(this.control.props.maxVal);
        ev.target.value = Number(this.control.props.maxVal);
      }
      jQuery('.rating' + self.control._id).addRating({
        fieldId: self.control._id,
        default: self.control.props.defaultValue,
        max: self.control.props.maxVal,
        icon: self.control.props.unit
      },
        (success) => {
          self.control.showButton = true;
        });
    }
    if (type == 'maxVal') {
      if (Number(ev.target.value) < 3) {
        this.control.props.maxVal = 3;
      } else if (this.control.props.minVal == 1 && Number(ev.target.value) > 10) {
        this.control.props.maxVal = 10;
      } else if (this.control.props.minVal == 0 && Number(ev.target.value) > 11) {
        this.control.props.maxVal = 11;
      } else {
        this.control.props.maxVal = Number(ev.target.value);
        if (Number(this.control.props.defaultValue) > Number(this.control.props.maxVal)) {
          this.control.props.defaultValue = Number(this.control.props.maxVal);
        }
      }
      ev.target.value = this.control.props.maxVal;
      jQuery('.rating' + self.control._id).addRating({
        fieldId: self.control._id,
        default: self.control.props.defaultValue,
        max: self.control.props.maxVal,
        icon: self.control.props.unit
      },
        (success) => {
          self.control.showButton = true;
        });
    }
    if (type == 'type') {
      if (ev.target.checked) {
        this.control.config.type = 'stars';
        this.control.props.minVal = 1;
        this.control.config.validations.required.status = false;
      }
      else {
        this.control.props.defaultValue = '';
        this.control.config.type = 'opscale';
      }
    }
    if (type == 'minVal') {
      if (ev.target.checked) {
        this.control.props.minVal = 1;
        if (this.jsonBuilderHelper.getJSONBuilt().template == 'template-seven') {
          this.sliderMax = 5;
        } else {
          this.sliderMax = 10;
        }
      }
      else {
        if (this.jsonBuilderHelper.getJSONBuilt().template == 'template-seven') {
          this.sliderMax = 5;
        } else {
          this.sliderMax = 11;
        }
        this.control.props.minVal = 0;
      }
      if (this.control.props.maxVal > this.sliderMax)
        this.control.props.maxVal = this.sliderMax;
      jQuery('.rating' + self.control._id).addRating({
        fieldId: self.control._id,
        default: self.control.props.defaultValue,
        max: self.control.props.maxVal,
        icon: self.control.props.unit
      },
        (success) => {
          self.control.showButton = true;
        });
    }
    this.control.props.currentValue = this.control.props.defaultValue;
    this.control.props.currentLabel = this.control.props.defaultValue;
    this.jsonBuilderHelper.updateFormGroup();
  }

  isQuestionInFormula() {
    let quesIndex = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().indexOf(this.jsonBuilderHelper.getSelectedControl());
    this.isQuestionInResults = this.formulaService.isQuestionInResults(quesIndex);
    if (this.isQuestionInResults) {
      this.control.config.validations.required.status = true;
      return true;
    }
    return false;
  }

  changeIcon(ev) {
    this.control.props.unit = ev.target.value;
    let self = this;
    jQuery('.rating' + self.control._id).addRating({
      fieldId: self.control._id,
      default: self.control.props.defaultValue,
      max: self.control.props.maxVal,
      icon: self.control.props.unit
    },
      (success) => {
        self.control.showButton = true;
      });
  }

}
