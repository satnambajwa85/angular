import { FroalaService } from './../../../services/froala.service';
import { FormulaService } from './../../../services/formula.service';
import { TemplateRendererService } from './../../../../templates/services/templateRenderer.service';
import { Component, ViewEncapsulation, DoCheck, OnDestroy, OnChanges, Input } from '@angular/core';
import { JSONElement } from '../../../services/JSONElement.service';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { Section, Page, App, Item } from '@builder/models';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;
@Component({
  selector: 'editor-radiobutton',
  templateUrl: './assets/html/editor_radiobutton.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorRadioButton implements DoCheck, OnDestroy, OnChanges {
  @Input() control: any;
  public froalaHelpText: any = {};
  constructor(
    public jsonBuilderHelper: JSONBuilder,
    public jsonElementHandler: JSONElement,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    public _templateRenderer: TemplateRendererService,
    public formulaService: FormulaService,
    public froalaService: FroalaService
  ) {
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    this.control = jsonBuilderHelper.getSelectedControl();
  }

  initWysiwyg() {
    this.froalaHelpText.options = false;
    setTimeout(() => {
      this.froalaHelpText.options = this.froalaService.getOptions({ handler: this.froalaHelpText, isAddVariable: true });
    });
  }

  ngDoCheck() {
    this.control = this.jsonBuilderHelper.getSelectedControl();
  }
  add_Option_In_Dropdown() {
    let item = new Item;
    this.control.options.push(item.getOption());
    this.jsonBuilderHelper.updateFormGroup();
  }

  delete_Option_From_Items(options: any, index: any) {
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
    }
    else {
      jQuery('.show-check').parents('.type-details').find('.div-check').fadeOut('slow');
      jQuery('.helptext-control').froalaEditor('destroy');
    }
  }
  onChange(control: any) {
    control.config.validations.required.status = !control.config.validations.required.status;
    this.jsonBuilderHelper.updateFormGroup();
  }
  onChangeControl() {
    if (this.jsonBuilderHelper.getSelectedControl().type === 'checkbox') {
      this.jsonBuilderHelper.changeControl('radio_button');
    } else {
      this.jsonBuilderHelper.changeControl('checkbox');
    }
  }
  seAsDefault(options: any, option: any) {
    for (let option of options) {
      if (option.defualtselected === true) {
        option.defualtselected = false;
      }
    }
    option.defualtselected = true;

  }

  ngOnChanges() {
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

      case "DELETE":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Builder Remove Value');
        // _kmq.push(['record', 'Builder Remove Value']);
        break;

      case "SETDEFAULT":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Builder Set Value Default');
        // _kmq.push(['record', 'Builder Set Value Default']);
        break;

      case "ADDOPTION":
        ga('markettingteam.send', 'event', 'Builder', 'Click', 'Builder Add Option Click');
        // _kmq.push(['record', 'Builder Add Option Click']);
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

  onKeyDown(index: any, $event: any) {
    if ($event.keyCode == 9 && this.control.options.length == index + 1) {
      this.add_Option_In_Dropdown();
    }
  }
  ngOnDestroy() {
    this._templateRenderer.computeMinMax();
    jQuery('.helptext-control').froalaEditor('destroy');
  }
}
