import { FroalaService } from './../../../services/froala.service';
import { Component, Input, OnInit, ViewEncapsulation, AfterViewInit, OnDestroy, OnChanges } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { ShareOutcomeService } from './../../../services/shareOutcome.service';

declare var jQuery: any;
declare var math: any;

@Component({
  selector: 'editor-wysiwyg',
  templateUrl: './assets/html/editor_wysiwyg.component.html',
  encapsulation: ViewEncapsulation.None,
})

export class EditorWysiwyg implements AfterViewInit, OnInit, OnChanges {
  control: any;
  @Input() controls: any;
  @Input() element: any;
  leadExists: boolean = false;
  froalaHeader: any = {};
  froalaSubHeader: any = {};

  constructor(public jsonBuilderHelper: JSONBuilder, public _outcomeService: ShareOutcomeService, private froalaService: FroalaService) {
    this.froalaService.getEmitter().subscribe(change => change === 'advanceEditor' && this.initWysiwyg());
    if (jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical')
      this.control = jsonBuilderHelper.getSelectedControl();
  }
  ngOnInit() {
    if (this.controls != undefined)
      this.control = this.controls;
  }

  ngOnChanges() {
    if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation') {  /* For Recommendation calc */
      if (!this._outcomeService.getSelectedFormula().hasOwnProperty('_id'))
        this._outcomeService.getSelectedFormula()._id = 'formula' + Math.floor((Math.random() * 1000) * this.jsonBuilderHelper.getJSONBuilt().formula.length).toString();
      this.control = this._outcomeService.getSelectedFormula();
    }
    this.initWysiwyg();
  }

  ngAfterViewInit() {
    this.leadExists = (this.jsonBuilderHelper.getOtherVisibleLeadForm() === 'Result') ? true : false;
  }

  initWysiwyg() {
    this.froalaHeader.options = this.froalaSubHeader.options = false;
    setTimeout(() => {
      this.froalaHeader.options = this.froalaService.getOptions({ handler: this.froalaHeader, isAddVariable: true ,includeScores:true});
      this.froalaSubHeader.options = this.froalaService.getOptions({ header: this.froalaSubHeader, isAddVariable: true,includeScores:true});
    });

  }
}
