import { Component,ViewEncapsulation } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';

@Component({
  selector: 'editor-logo',
  templateUrl:'./assets/html/editor_logo.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorLogo {
  control: any;

  constructor(public jsonBuilderHelper: JSONBuilder) {
    this.control = jsonBuilderHelper.getSelectedControl;
  }
}
