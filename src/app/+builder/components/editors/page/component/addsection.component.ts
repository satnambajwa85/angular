import { JSONBuilder } from './../../../../services/JSONBuilder.service';
import { Component, Input, ViewEncapsulation } from '@angular/core';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq:any;
@Component({
  selector: 'add_section',
  template: `
            <div  *ngIf="!control.visible && jsonBuilderHelper.isTempType(['Numerical','Recommendation'])" class="form-label lead-label" [class.no-margin]="!control.visible">Description</div>
            <div class="switch" *ngIf="!control.visible && jsonBuilderHelper.isTempType(['Numerical','Recommendation'])">
                <label>
                    <input type="checkbox" class="show-check" [checked]="control.visible" (change)="toggleSection($event);callGA('TOGGLERESULTDESC')">
                    <span class="lever"></span>
                </label>
            </div>
            <div class="div-check" [class.hide]="!control.visible">
                <editor-wysiwyg [controls]="control"></editor-wysiwyg>
            </div>
    `,
  encapsulation: ViewEncapsulation.None
})

export class AddSection {
  @Input() control: any;

  constructor(public jsonBuilderHelper: JSONBuilder) { }

  toggleSection() {
    this.control.visible = !this.control.visible;
  }

  callGA(opt: string) {
    switch (opt) {
      case "TOGGLERESULTDESC":
        ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'Result Description Toggle');
        // _kmq.push(['record', 'Builder Result Description Toggle']);
        break;
    }
  }
}
