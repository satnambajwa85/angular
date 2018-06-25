import { environment } from './../../../../../../environments/environment';
import { FroalaService } from './../../../services/froala.service';
import { FeatureAuthService } from './../../../../../shared/services/feature-access.service';
import { EditorService } from './../../../services/editor.service';
import { Component, ViewEncapsulation, Input, OnChanges, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { BuilderService } from '../../../services/builder.service';
import { FormulaService } from '../../../services/formula.service';
import { TemplateRendererService } from './../../../../templates/services/templateRenderer.service';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;
declare var filepicker: any;

@Component({
  selector: 'editor-textfield',
  templateUrl: './assets/html/editor_textfield.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class EditorTextField implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  isQuestionInResults: boolean = false;
  @Input() control: any;
  filePickerKey:any = environment.FILE_PICKER_API;
  froalaHelpText: any = {}
  constructor(public jsonBuilderHelper: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public formulaService: FormulaService,
    public _templateRenderer: TemplateRendererService,
    public _featureAuthService: FeatureAuthService,
    public _editorService: EditorService,
    public froalaService: FroalaService
  ) {
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    //    this.control = jsonBuilderHelper.getSelectedControl();
  }

  ngOnInit(): void {
    // this.updateMandatoryDisable();
  }

  ngAfterViewInit() {
    this.initWysiwyg();
  }

  initWysiwyg() {
    this.froalaHelpText.options = false;
    setTimeout(() => {
      this.froalaHelpText.options = this.froalaService.getOptions({ handler: this.froalaHelpText, isAddVariable: true });
    });
  }
  updateMandatoryDisable() {
    /*to disable Mandatory button*/
    // this.isQuestionInResults = false;
    // for (let quesIndex in this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()) {
    //   if (this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[quesIndex] == this.jsonBuilderHelper.getSelectedControl() &&
    //     this.jsonBuilderHelper.getSelectedControl().config.type == "number")
    //     this.isQuestionInResults = this.formulaService.isQuestionInResults(quesIndex);
    // }
    // if (this.isQuestionInResults)
    //   this.control.config.validations.required.status = true;
  }

  onChange(control: any) {
    control.config.validations.required.status = !control.config.validations.required.status;
    this.jsonBuilderHelper.updateFormGroup();
  }
  onChange1(control: any) {
    if (this.isQuestionInResults) {
      this._editorService.showPopup();
    }
  }
  typeChange() {
    this.jsonBuilderHelper.updateFormGroup();
    this.updateMandatoryDisable();
  }
  onChangeDescription(control: any) {
    control.config.showHelp = !control.config.showHelp;
    let helpText = control.props.helpText;
    helpText = helpText.replace(/&nbsp;|<\/?p[^>]*>/ig,"").trim();
   if(control.config.showHelp && helpText == "") {
     control.props.helpText = "This is question help text";
   }
    if (control.config.showHelp === true) {
      jQuery('.show-check').parents('.switch').find('.div-check').fadeIn('slow');
      this.initWysiwyg();
    } else {
      jQuery('.show-check').parents('.switch').find('.div-check').fadeOut('slow');
    }
  }

  ngOnChanges() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedItems(this.control);
    this.initWysiwyg();
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

      case "MANDATE":
        if (control.config.validations.required.status) {
          ga('markettingteam.send', 'event', 'Builder', 'Check', 'MarkAsMandatory');
          // _kmq.push(['record', 'Builder Mark As Mandatory']);
        }
        else {
          ga('markettingteam.send', 'event', 'Builder', 'Check', 'UnmarkAsMandatory');
          // _kmq.push(['record', 'Builder Unmark As Mandatory']);
        }
        break;
    }
  }

  ngOnDestroy() {
    if (this.control.config.type == 'number')
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

  isQuestionInFormula() {
    let quesIndex = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().indexOf(this.jsonBuilderHelper.getSelectedControl());
    this.isQuestionInResults = this.formulaService.isQuestionInResults(quesIndex);
    if (this.isQuestionInResults) {
      this.control.config.validations.required.status = true;
      return true;
    }
    return false;
  }

  changeDefaultValue(ev) {
    let val = this.checkDefaultValue(ev);
    if (this.control.config.type === 'number' && !isNaN(Number(val)) && val != '') {
      this.control.props.defaultValue = Number(val);
    } else
      this.control.props.defaultValue = val;

    ev.target.value = this.control.props.defaultValue;
    this.jsonBuilderHelper.commonEmitter.emit({type: 'textfieldDefaultValChanged'});
  }

  checkDefaultValue(ev) {
    let val1 = ev.target.value.trim();
    if (this.control.config.type === 'number') {
      if (this.jsonBuilderHelper.getJSONBuilt().numberSystem === "EU") {
        val1 = val1.replace(/[^0-9-,]/g, '');
      }
      else {
        val1 = val1.replace(/[^0-9-.]/g, '');
      }
      if(val1 != '') {
        if (Number(val1) > this.control.props.maxVal) {
          val1 = this.control.props.maxVal;
        }
        else if (Number(val1) < this.control.props.minVal) {
          val1 = this.control.props.minVal;
        }
      }
    }
    if (this.control.config.type === 'text') {
      if (val1.length > this.control.props.maxVal) {
        val1 = val1.slice(0, this.control.props.maxVal);
      }
    }
    return val1;
  }

}
