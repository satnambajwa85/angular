import { FroalaService } from './../../../services/froala.service';
import { EditorService } from './../../../services/editor.service';
import { FeatureAuthService } from './../../../../../shared/services/feature-access.service';
import { Component, Input, ViewEncapsulation, OnChanges, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { JSONElement } from '../../../services/JSONElement.service';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { Section, Page, App, Item } from '@builder/models';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { FormulaService } from '../../../services/formula.service';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;
@Component({
  selector: 'editor-selectbox',
  templateUrl: './assets/html/editor_selectbox.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorSelectBox implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  @Input() control: any;
  inputType: string;
  blue: string = 'blue';
  isQuestionInResults: boolean = false;
  public froalaHelpText: any = {};
  constructor(
    public jsonBuilderHelper: JSONBuilder,
    public jsonElementHandler: JSONElement,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public formulaService: FormulaService,
    public _featureAuthService: FeatureAuthService,
    public _editorService: EditorService,
    public froalaService: FroalaService
  ) {
    // this.control = jsonBuilderHelper.getSelectedControl();
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    this.inputType = (jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical' ? 'number' : 'text');
  }

  initWysiwyg() {
    this.froalaHelpText.options = false;
    setTimeout(() => {
      this.froalaHelpText.options = this.froalaService.getOptions({ handler: this.froalaHelpText, isAddVariable: true });
    });
  }

  ngOnInit() {

    /*to disable Mandatory button*/
    // for (let quesIndex in this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()) {
    //   if (this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion()[quesIndex] == this.jsonBuilderHelper.getSelectedControl())
    //     this.isQuestionInResults = this.formulaService.isQuestionInResults(quesIndex);
    // }
    // if(this.isQuestionInResults)
    //   this.control.config.validations.required.status=true;

    jQuery(".choice").addClass("select-empty");
    jQuery(".choice").change(function () {
      if (jQuery(this).val() == "default" || jQuery(this).val() == null) {
        jQuery(this).addClass("select-empty");
      } else {
        jQuery(this).removeClass("select-empty");
      }
    });
    jQuery(".choice").change();
    this.initWysiwyg();
  }

  ngAfterViewInit() {
  }

  add_Option_In_Dropdown(autoAdd: Boolean = false) {
    let item = new Item;
    let getOption: any = item.getOption();
    if (autoAdd)
      getOption.label = '';
    getOption.value = this.control.options.length + 1;
    getOption.hashIndex = this.control.options.length;
    this.control.options.push(getOption);
    this.jsonBuilderHelper.updateFormGroup();
    jQuery('#' + this.control._id)[0].selectize.addOption({ value: getOption.hashIndex, text: getOption.label });
    jQuery('#' + this.control._id)[0].selectize.refreshOptions(false);
  }

  delete_Option_From_Items(options: any, index: any) {
    jQuery('#' + this.control._id)[0].selectize.removeOption(options[index].hashIndex);
    jQuery('#' + this.control._id)[0].selectize.refreshOptions(false);
    for (let option in options) {
      if (option > index) {
        jQuery('#' + this.control._id)[0].selectize.updateOption(options[option].hashIndex, { value: options[option].hashIndex - 1, text: options[option].label });
        options[option].hashIndex = options[option].hashIndex - 1;
      }
    }
    options.splice(index, 1);
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
      jQuery('.helptext-control').froalaEditor('destroy');
    }
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
  seAsDefault(options: any, opt: any, status: boolean) {
    for (let option of options) {
      if (option.defualtselected === true) {
        option.defualtselected = false;
      }
      if (option.selected === true) {
        option.selected = false;
      }
    }
    opt.defualtselected = status;
    opt.selected = status;
    if (status === true) {
      jQuery('#' + this.control._id)[0].selectize.setValue(opt.value);
    } else {
      jQuery('#' + this.control._id)[0].selectize.setValue(options[0].value);
    }
  }

  ngOnChanges() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedItems(this.control);
    this.initWysiwyg();
    // this.autoDeleteEmptyOptions();
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

      case "DELETE":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Builder Remove Value');
        // _kmq.push(['record', 'Builder Remove Value']);
        break;

      case "ADDOPTION":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Builder Add Option Click');
        // _kmq.push(['record', 'Builder Add Option Click']);
        break;

      case "SETDEFAULT":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Builder Set Value Default');
        // _kmq.push(['record', 'Builder Set Value Default']);
        break;

      case "UNSETDEFAULT":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Builder Unset Value Default');
        // _kmq.push(['record', 'Builder Unset Value Default']);
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

  onOptionValChange(index: any, option: any, $event: any) {
    // jQuery('#' + this.control._id)[0].selectize.updateOption(option.value, { value: $event.target.value, text: option.label });
    option.value = $event.target.value;
    if (this.control.options.length == index + 1) {
      // this.add_Option_In_Dropdown(true);
    }
  }

  onOptionLabelChange(index: any, option: any) {
    jQuery('#' + this.control._id)[0].selectize.updateOption(option.hashIndex, { value: option.hashIndex, text: option.label });
    if (this.control.options.length == index + 1) {
      // this.add_Option_In_Dropdown(true);
    }
  }

  onKeyDown(index: any, $event: any) {
    if ($event.keyCode == 9 && this.control.options.length == index + 1) {
      this.add_Option_In_Dropdown(false);
    }
  }

  move_option_up(index: any) {
    this.control.options[index].hashIndex--;
    this.control.options[index - 1].hashIndex++;
    this.control.options[index] = this.control.options.splice(index - 1, 1, this.control.options[index])[0];
    jQuery('#' + this.control._id)[0].selectize.updateOption(index, { value: this.control.options[index].hashIndex, text: this.control.options[index].label });
    jQuery('#' + this.control._id)[0].selectize.updateOption(index - 1, { value: this.control.options[index - 1].hashIndex, text: this.control.options[index - 1].label });
    jQuery('#' + this.control._id)[0].selectize.refreshOptions();
  }

  move_option_down(index: any) {
    this.control.options[index].hashIndex++;
    this.control.options[index + 1].hashIndex--;
    this.control.options[index] = this.control.options.splice(index + 1, 1, this.control.options[index])[0];
    jQuery('#' + this.control._id)[0].selectize.updateOption(index, { value: this.control.options[index].hashIndex, text: this.control.options[index].label });
    jQuery('#' + this.control._id)[0].selectize.updateOption(index + 1, { value: this.control.options[index + 1].hashIndex, text: this.control.options[index + 1].label });
    jQuery('#' + this.control._id)[0].selectize.refreshOptions();
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

  ngOnDestroy() {
    jQuery('.helptext-control').froalaEditor('destroy');
    // this.autoDeleteEmptyOptions();
  }

  autoDeleteEmptyOptions() {
    // Auto Delete Default Options from Control
    let options: any = JSON.parse(JSON.stringify(this.control.options));
    let deleteIndex: number = -1;
    for (let option in options) {
      // if (this.control.options[option].label == 'Option' && parseInt(this.control.options[option].value) == parseInt(option) + 1) {
      if (this.control.options.length > 1 && options[option].label === '') {
        deleteIndex++;
        this.delete_Option_From_Items(this.control.options, parseInt(option) - deleteIndex);
      }
    }
  }

  isQuestionInFormula() {
    let quesIndex = this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().indexOf(this.jsonBuilderHelper.getSelectedControl());
    this.isQuestionInResults = this.formulaService.isQuestionInResults(quesIndex);
    if (this.isQuestionInResults) {
      // this.control.config.validations.required.status = true;
      return true;
    }
    return false;
  }

  // Upload Options to Radio/Checkbox/Dropdown via CSV
  handleFile(event: any) {
    //   this.control.options = [];
    //   let field: any = [];
    //   let file: File = event.target.files[0];
    //   let fileExt = file.name.split('.').pop();
    //   if (fileExt === 'csv') {
    //     // jQuery('.spining' + index).removeClass('hide');
    //     let myReader: FileReader = new FileReader();
    //     let self = this;
    //     myReader.onload = function (e) {
    //       field.fileName = file.name;
    //       field.fieldsArray = [];
    //       let arr = myReader.result.split(/\n|,/);
    //       for (let j = 0; j < arr.length; j++) {
    //         let obj = {};
    //         arr[j] = arr[j].trim();
    //         if (arr[j] == '') continue;
    //         obj['text'] = arr[j];
    //         field.fieldsArray.push(obj);
    //       }
    //       let index = 0;
    //       for (let opt of field.fieldsArray) {
    //         let item = new Item;
    //         let getOption: any = item.getOption();
    //         getOption.label = opt.text;
    //         getOption.value = ++index;
    //         getOption.hashIndex = self.control.options.length;
    //         self.control.options.push(getOption);
    //         self.jsonBuilderHelper.updateFormGroup();
    //         jQuery('#' + self.control._id)[0].selectize.addOption({ value: getOption.hashIndex, text: getOption.label });
    //         jQuery('#' + self.control._id)[0].selectize.refreshOptions(false);
    //       }
    //     };
    //     myReader.onerror = function (e) {
    //       console.log(myReader.error);
    //     };
    //     myReader.readAsText(file);
    //   } else {
    //     // File Not CSV
    //   }
  }

  updatePlaceholder() {
    if (this.jsonBuilderHelper.isTempName(['inline-temp-new']) && this.jsonBuilderHelper.getJSONBuilt().versioning.resultV2) {
      jQuery('#' + this.control._id)[0].selectize.settings.placeholder = this.control.config.placeholder?this.control.config.placeholder:' ';
      jQuery('#' + this.control._id)[0].selectize.updatePlaceholder();
    }
  }

}
