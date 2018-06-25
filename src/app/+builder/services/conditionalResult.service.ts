import { Injectable } from '@angular/core';
import { JSONBuilder } from './JSONBuilder.service';
import { Item } from '@builder/models';
import { TemplateRendererService } from '../../templates/services/templateRenderer.service';

declare var jQuery: any;

@Injectable()
export class ConditionalResultService {
  
  public front: number = 0;
  public rear: number = 10;

  constructor(public jsonBuilderHelper: JSONBuilder, public templateRenderer: TemplateRendererService) {
  }

  addNewCondition(control: any) {
    let item = new Item();
    let option = item.getOption();
    if (this.jsonBuilderHelper.isTempName(['template-seven'])) {
      option.links.share.title = 'Load Payback Calculator';
      option.links.share.description = 'Find out how much do you need to pay each month to payback your loan?';
    }
    option._id = 'option_' + Math.floor(Math.random() * 10000).toString();
    if (this.jsonBuilderHelper.isTempType(['Graded']))
      option.label = `<p><span class='fr-deletable var-tag' contenteditable='false'>{Score_absolute}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;</p>`;
    else if (this.jsonBuilderHelper.isTempType(['Poll']))
      option.label = `<p><span class='fr-deletable var-tag' contenteditable='false'>{Average_Poll_Result}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;</p>`;
    else
      option.label = `<p><span class='fr-deletable var-tag' contenteditable='false'>{R` + Number(this.templateRenderer.getStaticControls().Result.Result.items.indexOf(control) + 1) + `}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;</p>`;
    option.icon = control.props.helpText;
    option.attr.class = control.options[control.options.length - 1].attr.style;
    option.attr.style = control.options[control.options.length - 1].attr.style;
    // option.attr.style = control.props.maxVal;
    option.hashIndex = control.options.length;
    /** add dumy _id */
    option._id = 'option_' + Math.floor(Math.random() * 10000).toString();
    control.options.push(option);
    this.rear += 1;
    if((this.rear - this.front) >10)
      this.front +=10;
    // this.updateToFixed(control);
  }

  deleteCondition(control: any, index) {
    if(this.rear == control.options.length) {
      this.rear -= 1;
      if(this.rear == this.front)
        this.front -=10;
    }
    if (index == control.options.length - 1) {
      control.options[control.options.length - 2].attr.style = control.props.maxVal;
    } else {
      control.options[index + 1].attr.class = control.options[index - 1].attr.style;
    }

    control.options.splice(index, 1);
    // this.updateToFixed(control);
    this.jsonBuilderHelper.getSelectedControl().isIconPresent = false;
    setTimeout(() => {
      this.jsonBuilderHelper.getSelectedControl().isIconPresent = true;
    }, 100);
  }

  loadInitialConditions() {
    this.front = 0;
    let resultItem = this.jsonBuilderHelper.getSelectedControl();
    if (resultItem.config.showHelp) {
      if (resultItem.options.length <= 10) {
        this.rear = resultItem.options.length;
      } else {
        this.rear = 10;
      }
    }
  }

  loadMoreConditions() {
    this.front += 10;
    let resultItem = this.jsonBuilderHelper.getSelectedControl();
    if (resultItem.config.showHelp) {
      if ((resultItem.options.length - this.rear) <= 10) {
        this.rear = resultItem.options.length;
      } else {
        this.rear += 10;
      }
    }
  }

  loadPreviousConditions() {
    this.rear = this.front;
    let resultItem = this.jsonBuilderHelper.getSelectedControl();
    if (resultItem.config.showHelp) {
      this.front -= 10; 
    }
  }

  /*
    updateToFixed(control: any) {
      // for diable to_fixed
      //    if (Number(optionIndex) == (control.options.length - 1)) {
      //      slider.update({
      //        to_fixed: false
      //      });
      //    } else {
      //      slider.update({
      //        to_fixed: true
      //      });
      //    }
      //
      for (let option in control.options) {
        let slider = jQuery('#' + 'slider' + control._id + option).data("ionRangeSlider");
        if (slider) {
          slider.update({
            from_fixed: false, to_fixed: false
          });
        }
      }
  
      let optionIndex = 0;
      let slider = jQuery('#' + 'slider' + control._id + optionIndex).data("ionRangeSlider");
      if (slider) {
        slider.update({
          from_fixed: true
        });
      }
  
      optionIndex = control.options.length - 1;
      slider = jQuery('#' + 'slider' + control._id + optionIndex).data("ionRangeSlider");
      if (slider) {
        slider.update({
          to_fixed: true
        });
      }
    }*/
}
