import { JSONBuilder } from './../../../services/JSONBuilder.service';
import { Component, Input, OnInit, AfterViewInit, OnChanges } from '@angular/core';
import { FormulaService } from '../../../services/formula.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';
import { FeatureAuthService } from '../../../../../shared/services/feature-access.service';

declare var jQuery: any;
@Component({
    selector: 'editor_custom_html',
    templateUrl: './editor_custom_html.template.html'
})
export class EditorCustomHtml implements OnInit, AfterViewInit, OnChanges {
    @Input('control') control: any;
    @Input('section') section: any;
    public tempName: any = '';
    constructor(public formulaService: FormulaService,
        public _itemTrackService: JSONItemTracker,
        public _featureAuthService: FeatureAuthService,
        public _JSONBuilder: JSONBuilder
    ) { }
    ngOnInit() {
        this.tempName = this._JSONBuilder.getJSONBuilt().template.split('-', 3).join('-');
    }
    ngOnChanges() {
        //
    }
    ngAfterViewInit() {
        setTimeout(() => {
            jQuery('.ques-title2').css('height', jQuery('.ques-title2').prop('scrollHeight'));
        }, 100);
    }
    textAreaAdjust(event: any) {
        jQuery('.ques-title2').css('height', jQuery('.ques-title2').prop('scrollHeight'));
    }

}