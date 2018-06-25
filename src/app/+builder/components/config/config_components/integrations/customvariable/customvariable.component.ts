import { Component, OnInit } from '@angular/core';
import { JSONBuilder } from '../../../../../services/JSONBuilder.service';
@Component({
  selector: 'og-customvariable',
  templateUrl: './customvariable.component.html'
})
export class CustomvariableComponent implements OnInit {

  oldVal: string;
  hiddenVal: any = { key: '', value: '' };
  hiddenValueArr: any = [];
  showVariables: boolean = false;
  hidValEditErrShow: boolean = false;
  tempArr: any = [];
  hidValErrMsg: string = '';
  hidValErrShow: boolean = false;
  addingNew: boolean = false;
  editing: boolean = false;
  editingIndex: any = -1;
  changedVal: any = { key: '', value: '' };

  constructor(public jsonBuilderHelper: JSONBuilder) { }

  ngOnInit() {
    for (var ob in this.jsonBuilderHelper.getJSONBuilt().hiddenValues) {
      this.hiddenValueArr.push({ key: ob, value: this.jsonBuilderHelper.getJSONBuilt().hiddenValues[ob] });
    }
  }

  deleteValue(index: any) {
    let key = this.hiddenValueArr[index].key;
    delete this.jsonBuilderHelper.getJSONBuilt().hiddenValues[key];
    this.hiddenValueArr.splice(index, 1);
    this.hidValEditErrShow = false;
    this.editingIndex = -1;
    this.addingNew = false;
  }

  addValue() {
    this.hidValEditErrShow = false;
    this.hidValErrShow = false;
    this.hidValErrMsg = '';
    this.hiddenVal.key = this.hiddenVal.key.toLowerCase();
    this.hiddenVal.value = this.hiddenVal.value.toLowerCase();
    if (this.hiddenValueArr.findIndex(d => d.key == this.hiddenVal.key) != -1) {
      this.hidValErrMsg = 'Duplicate key not allowed';
      this.hidValErrShow = true;
      return;
    }
    if (this.hiddenVal.key == '' || this.hiddenVal.value == '') {
      this.hidValErrMsg = 'Key or value can not be blank';
      this.hidValErrShow = true;
      return;
    }
    this.hiddenValueArr.push(this.hiddenVal);
    this.jsonBuilderHelper.getJSONBuilt().hiddenValues[this.hiddenVal.key] = this.hiddenVal.value;
    this.hiddenVal = { key: '', value: '' };
    this.hidValEditErrShow = false;
    this.addingNew = false;
  }

  editValue(event: any, index: any, type: any) {
    if (this.changedVal.key == '' || this.changedVal.key == undefined || this.changedVal.value == '' || this.changedVal.value == undefined) {
      this.changedVal = this.oldVal;
      this.hidValEditErrShow = true;
      this.hidValErrMsg = 'Key or value can not be blank';
      return;
    } else if (this.tempArr.findIndex(d => d.key == this.changedVal.key) != -1 && this.tempArr.findIndex(d => d.key == this.changedVal.key) != index) {
      this.changedVal = this.oldVal;
      this.hidValEditErrShow = true;
      this.hidValErrMsg = 'Duplicate key not allowed';
      return;
    }
    this.hiddenValueArr[index] = this.changedVal;
    this.jsonBuilderHelper.getJSONBuilt().hiddenValues = {};
    this.hiddenValueArr.map(field => this.jsonBuilderHelper.getJSONBuilt().hiddenValues[field.key] = field.value);
    this.tempArr = [];
    this.editingIndex = -1;
    this.addingNew = false;
  }

  saveOld(event: any, index: any) {
    this.oldVal = this.hiddenValueArr[index];
    this.changedVal = this.oldVal;
    this.editingIndex = index;
    this.hidValEditErrShow = false;
    for (var ob in this.jsonBuilderHelper.getJSONBuilt().hiddenValues) {
      this.tempArr.push({ key: ob });
    }
    this.hidValErrShow = false;
    this.addingNew = false;
  }

  hideInputFields() {
    this.addingNew = false;
    this.hiddenVal.key = '';
    this.hiddenVal.value = '';
  }


}
