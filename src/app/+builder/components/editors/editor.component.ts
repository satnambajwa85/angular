import { Component, OnInit, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { JSONBuilder } from '../../services/JSONBuilder.service';
import { ShareOutcomeService } from './../../services/shareOutcome.service';

declare var jQuery: any;
@Component({
  selector: 'editor',
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    './assets/css/bootstrap.colorpickersliders.style.css',
    './assets/css/selectize.default.css',
    './assets/css/editor.custome.css',
    '../../../../../assets/css/font-awesome.css',
    './assets/css/editor.style.css',
    './assets/css/codeview.style.css'
  ],
  templateUrl: './assets/html/editor.component.html',
})
export class Editor implements OnInit, AfterViewInit {
  title: any;
  switchView: boolean = true;

  constructor(public jsonBuilderHelper: JSONBuilder,
    public _outcomeService: ShareOutcomeService
  ) {
    if (this.jsonBuilderHelper.getJSONBuilt().template.split('-',2).join('-') === 'inline-temp' && this.jsonBuilderHelper.getJSONBuilt().templateType === 'Recommendation') {
      this.switchView = false;
    }
  }
  ngAfterViewInit() {
    let self = this;
    /*Scroller for right panel and left panel */
    windowScroll();
    jQuery(window).on("resize", function () {
      windowScroll();
    });
    function windowScroll() {
      var rightPanelHeight = jQuery(window).height() - 60;
      jQuery('.sidebar-layout').css('height', rightPanelHeight);
    }
  }
  ngOnInit() {
    if (this.jsonBuilderHelper.getSelectedModel() === 'Page') {
      this.title = this.jsonBuilderHelper.getSelectedPage().type;
    } else {
      if (this.jsonBuilderHelper.getSelectedModel() === 'Control') {
        this.title = this.jsonBuilderHelper.getSelectedControl().type;
      }
    }
  }

}
