import { Component, OnInit, AfterViewInit, OnDestroy, ViewEncapsulation} from '@angular/core';
import { FormControl, Validators,FormBuilder,FormGroup } from '@angular/forms';
import { JSONBuilder } from '../../../../services/JSONBuilder.service';
import { BuilderService } from '../../../../services/builder.service';
declare var JSHINT: any;
declare var jQuery: any;
declare var bootbox: any;
@Component({
  selector: 'config-customJS-code',
  templateUrl: './assets/html/customJS.component.html',
  styleUrls:['./assets/css/customJs.component.css'],
  encapsulation: ViewEncapsulation.None
  
})
export class CustomJSCodeComponent implements OnInit, AfterViewInit, OnDestroy{
  changed: boolean = true;
  selectedItem;
  previous:any={value:'',name:''};
  scripts:Array<any>=[];
  $saveScriptSubscriber : any;
  customjs:boolean = true;
  constructor(public _jsonBuilderService: JSONBuilder,
      public _builderService: BuilderService,
      public _fb:FormBuilder) { }
  scriptForm:FormGroup;

  errorList:Array<Object> = [];
  ngOnInit() {
    this.scriptForm=this._fb.group(this.getScriptModel());
    this.scripts=JSON.parse(JSON.stringify(this._jsonBuilderService.getJSONBuilt().scripts));
    if(this.scripts.length==0){
      this.setDefault();
    }
    this.restoreForm(0);
  }
  setDefault(){
    let counter=this.getNextNumber();
    this.scripts=[...this.scripts,{name:'Sample script '+counter,_id:0}];
    this.selectedItem=this.scripts.length-1;
    this.scriptForm.get('name').setValue('Sample script '+counter);
    this.scriptForm.get('value').setValue('');
    this.changed=true;
  } 
  getNextNumber(){
    if(this.scripts.length===0) return 1;
    try{
      let str=JSON.stringify(this.scripts);
      let counters=str.match(/(Sample script )([0-9])/igm);
      if(!counters || counters.length==0) return 1;
      let lastItem = counters[counters.length-1];
      return (parseInt(lastItem.match(/(?!Sample script )([0-9]+)/igm)[0]) +1)  
    }catch(e){
      console.log(e);
    }
  }
  getScriptModel(){
    return {
      value:['',Validators.required],
      name:['',Validators.compose([Validators.required,Validators.minLength(3)])],
    }
  }
  ngAfterViewInit() {
      // console.log("deskhds",this.scripts[this.selectedItem].name);
      jQuery('#CustomJsEditor').numberedtextarea();
  }
  saveJSscript(script,buttonLabel) {
    if(!((script.value && this.previous['value'] != script.value) || (script.name && this.previous['name'] != script.name))){
      return;
    }  
    if (!((/<\/?(script).*?>(\r?\n|\r)*?/).test(script.value))) {
      buttonLabel.textContent = "Please wait...";
      this._jsonBuilderService.animInit();      
      let obj={app_id: this._jsonBuilderService.getJSONBuilt()._id};
      let index = this.selectedItem;
      obj['scriptData']=(this.scripts[this.selectedItem]._id == 0) ? 
                (Object.assign(script,{status:'APPROVED',operation:'ADD'})):
                Object.assign(script,{'_id':this.propertyVerifier(this.scripts,index,'_id')?
                    this.scripts[index]._id:null,status:'APPROVED',operation:'UPDATE'});
      this.$saveScriptSubscriber = this._builderService.saveCustomScript(obj).subscribe((response) => {
        jQuery('#customJsError').hide();
        this.scripts[index]=(response.scripts && Object.prototype.toString.call(response.scripts)=="[object Array]") ? response.scripts[index] : this.scripts ;
        this.restoreForm(index);
        this._jsonBuilderService.debounce(this._jsonBuilderService.animLoad(),1000);
        buttonLabel.textContent = "Submit Code";
       // this.callBootbox('Your script has been submitted and approved. See it in action on your live calculator')      
      },(error)=>{
        console.log("Script Not Added");
        buttonLabel.textContent = "Submit Code";
      });
    }
    else 
      this.callBootbox('Script tags are not permitted');

  }
  callBootbox(message: String){
      bootbox.dialog({
        closeButton: false,
        message: `<button type="button" class="bootbox-close-button close" data-dismiss="modal"
                               aria-hidden="true"><i class='material-icons'>close</i></button>
                            
                              <div class="bootbox-body-right cust-js-popup">
                              <span class="icons-js"><img src="https://cdn.filestackcontent.com/dLSvqcodSSKqlf8nYNNV" alt="https://cdn.filestackcontent.com/dLSvqcodSSKqlf8nYNNV"/></span>
                                <p>${message}.</p>
                              </div>
                  `,
      });
  }
  retainPreviousText(){
      this.scriptForm.get('value').setValue(this.scripts[this.selectedItem].value);
  }
  ngOnDestroy(){
      if(this.$saveScriptSubscriber){
        this.$saveScriptSubscriber.unsubscribe();
      }
      this._jsonBuilderService.getJSONBuilt().scripts=this.scripts;
  }
  removeScript(index){
    let obj = {app_id: this._jsonBuilderService.getJSONBuilt()._id};
    if(this.scripts[index]._id === 0){
      this.scripts.splice(index,1);
      jQuery('#customJsError').hide();
      this.settingsAfterDelete();
    }
    else{
      obj['scriptData'] = Object.assign(this.scriptForm.value,{operation:'REMOVE',_id:this.scripts[index]._id}); 
      this._jsonBuilderService.animInit();
      this.$saveScriptSubscriber = this._builderService.saveCustomScript(obj).subscribe((response)=>{
        this.scripts.splice(index,1);
        this.settingsAfterDelete();
        this._jsonBuilderService.debounce(this._jsonBuilderService.animLoad(),1000);
      });
    }
  }
  addNewScript(){
    if(!this.demoScriptAdded()){
      this.setDefault();
      this.restoreForm(this.selectedItem);      
    }
    else if(this.scripts[this.selectedItem].value){
      jQuery('#customJsError').show();
    }else{
      jQuery('#customJsError').show();
      jQuery('#customJsError').html(` <div class="error-notice"> <div class="oaerror danger custom-js-style">   <i class="material-icons">report_problem</i>
      Script is not saved. Save your work before proceeding.</div> </div>`);
    }
  }
  demoScriptAdded(){
    let str = JSON.stringify(this.scripts);
    let demoExists=str.match(/("_id":0)/igm);
    if(!demoExists || demoExists.length==0)
      return false;
    return true;
  }
  settingsAfterDelete(){
    if(this.scripts.length==0){
      this.setDefault();
    }else{
      this.selectedItem = this.selectedItem==0 ? 0 : this.selectedItem-1;
      this.restoreForm(this.selectedItem);
    }
  
  }
  restoreForm(index){
    this.selectedItem=index;
    let obj = this.scripts[index];
    this.changed=(obj && obj.value) ? false : true;
    this.scriptForm.get('value').setValue(obj?obj.value:'');
    this.scriptForm.get('name').setValue(obj?obj.name:'');
    this.previous['value']=this.scripts[this.selectedItem].value; 
    this.previous['name']=this.scripts[this.selectedItem].name;

  }
  propertyVerifier(element,index,property){
    if(Object.prototype.toString.call(element) == "[object Array]"){
      return (element[index] && element[index][property]) 
    }
  }
  selectScript(index){
    if(this.demoScriptAdded()){
      (this.scripts[this.selectedItem].value) && jQuery('#customJsError').show();
      jQuery('#customJsError').show();
      jQuery('#customJsError').html(` <div class="error-notice"> <div class="oaerror danger custom-js-style">   <i class="material-icons">report_problem</i>
      Script is not saved. Save your work before proceeding.</div> </div>`);
      return;
    }
    this.restoreForm(index);
  }
  autoSave(script){
    console.log(script,this.previous);
    if((script.value && this.previous['value'] != script.value) || (script.name && this.previous['name'] != script.name)){
      this.saveJSscript(script,{});
      //console.log(script,this.previous);
    }else{
      console.log("No change");
    }
  }
  // softWrap(){
  //   if(this.scriptForm.get('value').value && this.scriptForm.get('softwrap').value){
  //     let scriptData=this.scriptForm.get('value').value;
  //     scriptData=scriptData.replace(/(\n)\1*/igm,'\n');
  //     let splittedData=scriptData.split(';');
  //     this.scriptForm.get('value').setValue(splittedData.join(';\n'));
  //   } 
  // }
  // validate(script){
  //   let results = JSHINT(script);
  //   this.errorList = (JSHINT.errors.length) ? JSHINT.errors : [];
  // }

   addfocus() {
      jQuery('.scriptName').addClass('is-focused');
    }

 
}
