import { Component, Input, ViewEncapsulation, OnChanges} from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
declare var jQuery: any;
@Component({
  selector: 'editor-counter',
  templateUrl: './assets/html/editor_counter.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorCounter implements OnChanges {
  @Input() control: any;

  constructor(
    public jsonBuilderHelper: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker
  ) {
    this.control = jsonBuilderHelper.getSelectedControl();
  }

  ngOnChanges() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedItems(this.control);
  }
}
