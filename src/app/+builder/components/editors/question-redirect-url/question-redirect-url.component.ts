import { EditorService } from './../../../services/editor.service';
import { FeatureAuthService } from './../../../../../shared/services/feature-access.service';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'question-redirect-url',
  templateUrl: './question-redirect-url.component.html'
})
export class QuestionRedirectUrlComponent implements OnInit {
@Input() control: any;
  constructor(public jsonBuilderHelper: JSONBuilder,
    public _featureAuthService: FeatureAuthService,
    public _editorService: EditorService) { }

  ngOnInit() {
  }

}
