import { Component, Input, ViewEncapsulation, OnInit, OnChanges } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;
@Component({
  selector: 'editor-numerictextfield',
  templateUrl: './assets/html/editor_numerictextfield.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class EditorNumericTextField implements OnInit, OnChanges {
  @Input() control: any;

  constructor(
    public jsonBuilderHelper: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker
  ) {
    this.control = jsonBuilderHelper.getSelectedControl();
  }

  ngOnInit() {
    //
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
    if (control.config.showHelp === true) {
      jQuery('.show-check').parents('.type-details').find('.div-check').fadeIn('slow');
    } else
      jQuery('.show-check').parents('.type-details').find('.div-check').fadeOut('slow');
  }

  ngOnChanges() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedItems(this.control);
  }
  callGA(str: string, control: any = {}) {
    switch (str) {
      case "HELPTEXT":
        if (control.config.showHelp){
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
}
