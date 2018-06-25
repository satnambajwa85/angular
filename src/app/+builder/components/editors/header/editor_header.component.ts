import { Component, ViewEncapsulation } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';

@Component({
  selector: 'editor-header',
  templateUrl:'./assets/html/editor_header.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorHeader {
  control: any;

  constructor(public jsonBuilderHelper: JSONBuilder){
    this.control = jsonBuilderHelper.getSelectedControl();
  }
}
