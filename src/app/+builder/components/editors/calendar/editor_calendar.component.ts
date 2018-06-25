import { FormulaService } from './../../../services/formula.service';
import { FroalaService } from './../../../services/froala.service';
import { JSONItemTracker } from './../../../services/JSONUpdateItemTracker.service';
import { JSONBuilder } from './../../../services/JSONBuilder.service';
import { Component, OnInit, Input } from '@angular/core';
declare var jQuery: any;
declare var ga: any;
@Component({
  selector: 'editor-calendar',
  templateUrl: './editor_calendar.component.html',
  styleUrls: ['./editor_calendar.component.css']
})
export class EditorCalendar implements OnInit {
  @Input() control: any;
  froalaHelpText: any = {};
  isQuestionInResults: boolean = false;
  sliderMax: number = 10;
  constructor(
    public jsonBuilderHelper: JSONBuilder,
    public _ItemTrackService: JSONItemTracker,
    public froalaService: FroalaService,
    public formulaService: FormulaService
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
    if (control.config.showHelp) {
      jQuery('.show-check').parents('.type-details').find('.div-check').fadeIn('slow');
      this.initWysiwyg();
    } else {
      jQuery('.show-check').parents('.type-details').find('.div-check').fadeOut('slow');
    }
    let helpText = control.props.helpText;
     helpText = helpText.replace(/&nbsp;|<\/?p[^>]*>/ig,"").trim();
    if(control.config.showHelp && helpText == "") {
      control.props.helpText = "This is question help text";
    }
  }

  ngOnInit() {
  }
  ngOnChanges() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedItems(this.control);
    this.initWysiwyg();
  }

  ngAfterViewInit() {
    let self = this;
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

  onWeekdayChange(ev) {
    this.control.props.steps = Number(ev.target.value);
    this.reinitCalendar();
  }

  onPlaceholderChange(ev) {
    this.control.config.placeholder = ev.target.value;
  }

  toggleDisabledDays(ev) {
    this.control.props.scale = ev.target.checked;
    this.reinitCalendar();
  }

  disablingDays(ev, day) {
    if(ev.target.checked) {
      this.control.props.currentLink.push(day.toString());
    } else {
      this.control.props.currentLink.splice(this.control.props.currentLink.indexOf(day.toString()), 1);
    }
    this.reinitCalendar();
  }

  ifChecked(num) {
    return this.control.props.currentLink.indexOf(Number(num).toString()) >= 0;
  }

  reinitCalendar() {
    this.jsonBuilderHelper.commonEmitter.emit({type : 'reInitCalendar', id: this.control._id})
  }

  toggleTimePicker(ev) {
    this.control.props.postfix = ev.target.checked;
    this.reinitCalendar();
  }

  toggleRange(ev ){
    let self = this;
    if(ev.target.checked) {
      this.control.isIconPresent = ev.target.checked;
      self.jsonBuilderHelper.updateFormGroup();
      setTimeout(() => {
        jQuery('#datetimepickerRange'+self.control._id).datetimepicker();
        self.reinitCalendar();
      });
    } else {
      jQuery('#datetimepickerRange'+this.control._id).data("DateTimePicker").destroy();
      this.control.isIconPresent = ev.target.checked;
      this.jsonBuilderHelper.updateFormGroup();
      this.reinitCalendar();
    }
    
    
  }
}
