import { Component } from '@angular/core';
import { JSONBuilder } from '../services/JSONBuilder.service';
import { JSONElement } from '../services/JSONElement.service';
import { ITEMS, GRADED_ITEMS, RECOMMENDED_ITEMS, INLINE_ITEMS, INLINE_RECOMMENDED_ITEMS, RECOMMENDED_ITEMS_NEW, ITEMS_NEW } from '../models/itemNames.store';

declare var jQuery: any;

@Component({
  selector: 'switch',
  template: `
				<select 
					class="select-default" 
					(change)="onChange($event)" 
					data-width="fit"
					class="form-control"
				>
			        <option *ngFor="let control of controls" value="{{control.value}}" 
						[selected]="jsonBuilderHelper.getSelectedControl().type==control.value || (jsonBuilderHelper.getSelectedControl().type=='rating' && jsonBuilderHelper.getSelectedControl().config.type==control.value)">{{control.name}}
					</option>
			    </select>
	`,
})
export class Switch {
  controls: any[] = [];
  constructor(public jsonElementHandler: JSONElement, public jsonBuilderHelper: JSONBuilder) {
    let templateName: string = jsonBuilderHelper.getJSONBuilt().template;
    let appType: string = jsonBuilderHelper.getJSONBuilt().templateType;
    let switchItems: any = [];
    if (templateName.split('-', 2).join('-') === 'inline-temp') {
      if (appType === 'Recommendation') {
        switchItems = INLINE_RECOMMENDED_ITEMS;
      } else {
        switchItems = INLINE_ITEMS;
      }

    } else {
      if (appType === 'Recommendation') {
        switchItems = RECOMMENDED_ITEMS;
      } else if (appType === 'Graded') {
        switchItems = GRADED_ITEMS;
      }
      else {
        switchItems = ITEMS;
      }
    }
    for (var property in switchItems) {
      if (switchItems.hasOwnProperty(property)) {
        this.controls.push({
          value: property,
          name: switchItems[property]
        });
      }
    }
  }

  onChange($event: any) {
    console.log('On chnage called');
    let self = this;
    let control = $event.target.value;
    this.jsonBuilderHelper.changeControl(control);
    // if (control == 'checkbox' || control == 'radio_button') {
    //   setTimeout(function () { self.setImageSize(); }, 10);
    // }
    if (this.jsonBuilderHelper.isTempType(['Poll']))
      this.jsonBuilderHelper.updateGradedFormula();
  }

  setImageSize() {
    let self = this;
    for (let item in this.jsonBuilderHelper.getQuestionsList()) {
      if (this.jsonBuilderHelper.getQuestionsList()[item].type == 'checkbox' || this.jsonBuilderHelper.getQuestionsList()[item].type == 'radio_button') {
        let width = jQuery(".slide_" + item + " div.pic-selector").length;
        if (width > 4)
          width = 24;
        else
          width = (100 / width) - 1;
        jQuery(".slide_" + item + " div.pic-selector").css('width', width + '%');
      }
    }

  }
}
