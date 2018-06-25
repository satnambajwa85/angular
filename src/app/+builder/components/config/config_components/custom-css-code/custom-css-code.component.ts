import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { BuilderService } from '../../../../services/builder.service';
declare var JSHINT: any;
declare var jQuery: any;
declare var bootbox: any;
@Component({
  selector: 'config-customCSS-code',
  templateUrl: './assets/html/customCSS.component.html',
  styleUrls: ['./assets/css/customCSS.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class CustomCSSCodeComponent implements OnInit, AfterViewInit {
  changed: boolean = true;
  selectedItem;
  previous: string;
  styles: Array<any> = [];
  $saveScriptSubscriber: any;
  scriptForm: FormGroup;
  errorList: Array<Object> = [];
  oldCSS: any = '';
  stylesData = {
    _id: '',
    value: '',
    status: '',
    name: '',
    place: '',
    comments: '',
    operation: ''
  };
  buttontext: string = 'Submit';
  constructor(public _jsonBuilderService: JSONBuilder,
    public _builderService: BuilderService,
    public _fb: FormBuilder) { }

  ngOnInit() {
    this.styles = JSON.parse(JSON.stringify(this._jsonBuilderService.getJSONBuilt().styles));
    if (this.styles.length > 0) {
      // Data Found
      this.stylesData['_id'] = this.styles[0]._id;
      this.stylesData['value'] = this.styles[0].value;
      this.stylesData['status'] = this.styles[0].status;
      this.stylesData['name'] = this.styles[0].name;
      this.stylesData['place'] = this.styles[0].place;
      this.stylesData['comments'] = this.styles[0].comments;
      this.stylesData['operation'] = 'UPDATE';
      this.buttontext = 'Update';
      this.oldCSS = this.styles[0].value;
    } else {
      // No Data Found
      this.stylesData['_id'] = '';
      this.stylesData['value'] = '';
      this.stylesData['status'] = 'APPROVED';
      this.stylesData['name'] = '';
      this.stylesData['place'] = 'Header';
      this.stylesData['comments'] = '';
      this.stylesData['operation'] = 'ADD';
      this.buttontext = 'Submit';
      this.oldCSS = '';
    }
    this.stylesData['app_id'] = this._jsonBuilderService.getJSONBuilt()._id;
  }

  ngAfterViewInit() {
    jQuery('#CustomCssEditor').numberedtextarea();
  }

  validateAndSave($event: any, flag: boolean) {
    if (flag) {
      this.stylesData['value'] = $event.target.value;
    }
    if (!((/<\/?(style).*?>(\r?\n|\r)*?/).test(this.stylesData['value']))) {
      this.saveCSS(flag);
    } else {
      this.callBootbox('Style tags are not permitted');
    }
  }

  saveCSS(flag: boolean) {
    this._jsonBuilderService.animInit();
    let message = 'Your custom style script has been added. Run your ' + (this._jsonBuilderService.getJSONBuilt().templateType === 'Numerical' ? 'Calculator' : (this._jsonBuilderService.getJSONBuilt().templateType === 'Poll' ? 'Poll' : 'Quiz')) + ' to see your changes.';
    if (this.stylesData['operation'] === 'UPDATE') {
      message = 'Your custom style script has been updated successfully. Run your ' + (this._jsonBuilderService.getJSONBuilt().templateType === 'Numerical' ? 'Calculator' : (this._jsonBuilderService.getJSONBuilt().templateType === 'Poll' ? 'Poll' : 'Quiz')) + ' to see your changes.';
    }
    this._builderService.saveCustomCSS(this.stylesData).subscribe((response) => {
      this.stylesData['_id'] = response.styles[0]._id;
      this.stylesData['operation'] = 'UPDATE';
      this.buttontext = 'Update';
      this._jsonBuilderService.getJSONBuilt().styles[0] = response.styles[0];
      this._jsonBuilderService.debounce(this._jsonBuilderService.animLoad(), 1000);
      if (!flag) {
        this.callBootbox(message);
      }
    }, (error) => {
      console.log('Styles Not Added');
    });
  }

  callBootbox(message: String) {
    bootbox.dialog({
      closeButton: false,
      message: `
        <button type="button" class="bootbox-close-button close" data-dismiss="modal" aria-hidden="true">
          <i class='material-icons'>close</i>
        </button>
        <div class="bootbox-body-right cust-js-popup">
          <span class="icons-js"><img src="https://cdn.filestackcontent.com/INifwJ47Qp6ZPM8mYokF" alt="https://cdn.filestackcontent.com/INifwJ47Qp6ZPM8mYokF"/></span>
          <p>${message}</p>
        </div>
      `,
    });
  }
}
