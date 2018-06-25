import { Injectable } from '@angular/core';

@Injectable()
export class ComponentService {
  public visualsIniter: boolean = false;
  public visualsIniterT7: boolean = true;
  public tableExcel: any = {
    tablePop: false
  };
  public graph: any = {
    graphPop: false,
    conditionalIndex: undefined,
    formulaIndex: 0
  };

  public isConditonalVisual: boolean = false;
  public conditionalVisuals: any = {
    visible: false,
    type: '',
    graph: {
      type: '',
      rawJSON: '',
      title: '',
      xAxis: '',
      yAxis: '',
      colors: []
    },
    videoLink: '',
    youtubeLink: '',
    videoWistiaLink: '',
    imageLink: ''
  };

  public graded: any = {
    builderMessage: 'correct'
  };

  constructor() {
  }
}
