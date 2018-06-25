import { Component, Input ,OnInit, ViewEncapsulation} from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
declare var jQuery : any;
@Component({
  selector: 'editor-date',
  templateUrl: './assets/html/editor_date.component.html' ,
  encapsulation: ViewEncapsulation.None
})

export class EditorDate implements OnInit {
  control: any;

  constructor(public jsonBuilderHelper: JSONBuilder) {
    this.control = jsonBuilderHelper.getSelectedControl();
  }
  ngOnInit() {
    jQuery('.date').datepicker();
  }
}
