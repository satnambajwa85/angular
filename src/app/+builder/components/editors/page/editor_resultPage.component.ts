import { Component, OnInit, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { EditorOutcome } from './component/subComponents/editor_outcome.component';
import { EditorNumerical } from './component/subComponents/editor_numerical.component';

declare var jQuery: any;

@Component({
  selector: 'editor_result_page',
  templateUrl: './assets/html/editor_resultPage.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorResultPage implements OnInit, AfterViewInit {
  constructor(public jsonBuilderHandler: JSONBuilder) {}
  ngOnInit() {}

  ngAfterViewInit() {
    jQuery('.type-details-head').on('click', function () {
      jQuery(this).parent().toggleClass('tab-collapse');
    });

    jQuery(document).on('click', '.result-area ', function () {
      jQuery('.result-area-tab').removeClass('hide');
      jQuery('.details-area-tab').addClass('hide');
      jQuery('.result-area').css('color', '#5c6165 ');
      jQuery('.details-area').css('color', '#999')
    })

    jQuery(document).on('click', '.details-area', function () {
      jQuery('.result-area-tab').addClass('hide');
      jQuery('.details-area-tab').removeClass('hide');
      jQuery('.result-area').css('color', '#999')
      jQuery('.details-area').css('color', '#5c6165 ')
    })

    jQuery(document).on('click', '.flip-container', function () {
      jQuery(this).addClass('hover').siblings('.flip-container').removeClass("hover");
    });
  }
}
