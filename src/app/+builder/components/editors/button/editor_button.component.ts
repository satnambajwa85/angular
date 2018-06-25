import { Component, ViewEncapsulation} from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';

@Component({
  selector: 'editor-button',
  templateUrl: './assets/html/editor_button.component.html' ,
  encapsulation: ViewEncapsulation.None
})

export class EditorButton {
  control: any;

  constructor(public jsonBuilderHelper: JSONBuilder){
    this.control = jsonBuilderHelper.getSelectedControl;
  }
}
