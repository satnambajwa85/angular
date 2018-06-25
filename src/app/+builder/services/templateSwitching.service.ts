import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { DefaultJSON } from '../../templates/services/DefaultJSON.service';
import { JSONBuilder } from './JSONBuilder.service';
import { BuilderService } from './builder.service';
import { Section, Page, App, Item } from '@builder/models';
@Injectable()
export class TemplateSwitching {
    constructor(public _JSONBuilder: JSONBuilder,
        public _BuilderService: BuilderService,
        public _DefaultJSON: DefaultJSON
    ) { }
    ntoqChange(switchingTo, app: App): Observable<any> {
        let controlsObj = this._JSONBuilder.templateCalcTypeControls(switchingTo);
        let saveItem = [], result = '';
        let switchingFrom = app.templateType;
        let a, b, c, requests = [];
        app.templateType = switchingTo;
        app.changed = true;
        app.realTime = false;
        app.pages.forEach((page) => {
            // modify question based on template Type
            if (page.type === 'Questionnaire') {
                page.sections.forEach((section) => {
                    if (section.type !== 'LeadFormQ') {
                        section.items.map((item, index) => {
                            if (item.type != 'custom_html')
                                result += 'Q' + (index + 1) + '+';
                            item.type = controlsObj.controls.indexOf(item.type) >= 0 ? controlsObj.convertTo : item.type;
                            if (switchingFrom == 'Poll') {
                                item.options = item.options.map((option) => {
                                    option.value = '';
                                    return option;
                                });
                            }
                            let i = 1;
                            if (switchingTo !== 'Recommendation') {
                                item.options = item.options.map((option) => {
                                    i = (switchingTo === 'Numerical') ? i++ : 0;
                                    option.value = i;
                                    return option;
                                });
                            }
                            item.options = item.options.map((option) => {
                                option.type = '';
                                if (switchingTo === 'Poll' && item.type == 'radio_button')
                                    option.value = 'poll_' + (Math.floor((Math.random() * 10000000) + 1)) + Date.now();
                                return option;
                            });
                            saveItem.push(item);
                        });
                    }
                });
                a = this._BuilderService.updateChanges({ app: app, page: '', sections: [], items: saveItem }, 'switch', app._id);
                requests.push(a);
            }
            // modify Result based on template Type
            if (page.type === 'Result') {
                app.formula = [];
                saveItem = saveItem.concat(this.modifyLeadSection(page));
                if (switchingTo === 'Numerical') {
                    console.log('switching to...Numerical');
                    let Resultsection = this._DefaultJSON.getDefaultResultPage(app);
                    let Rsection = page.sections.find(section => section.type === 'Result');
                    c = this._BuilderService.insertItemOrDelete(Rsection._id, Rsection, Resultsection.items, 'insert');
                    requests.push(c);
                }
                if (switchingTo === 'Recommendation') {
                    console.log('switching to...Recommendation');
                    this._DefaultJSON.getDefaultOutComePage(app);
                    let saveSection = page.sections.find(section => section.type === 'Result');
                    c = this._BuilderService.insertItemOrDelete(saveSection._id, saveSection, saveItem, 'delete');
                    requests.push(c);
                }
                if (switchingTo === 'Graded') {
                    console.log('switching to...Graded');
                    app.realTime = false;
                    app.realTimeResult = '{R1}';
                    let Resultsection = this._DefaultJSON.getDefaultResultPage(app);
                    let Rsection = page.sections.find(section => section.type === 'Result');
                    Resultsection.items[0].props.title = Resultsection.items[0].props.title.replace(/({R1}|{Outcome}|{Average_Poll_Result})/g, '{Score_absolute}');
                    app.formula[0].result = result.slice(0, -1);
                    c = this._BuilderService.insertItemOrDelete(Rsection._id, Rsection, Resultsection.items, 'insert');
                    app.formula = [app.formula[0]];
                    requests.push(c);
                }
                if (switchingTo === 'Poll') {
                    console.log('switching to...Poll');
                    let Resultsection = this._DefaultJSON.getDefaultResultPage(app);
                    let Rsection = page.sections.find(section => section.type === 'Result');
                    Resultsection.items[0].props.title = Resultsection.items[0].props.title.replace(/({R1}|{Outcome}|{Score_absolute})/g, '{Average_Poll_Result}');
                    app.formula[0].result = result.slice(0, -1);
                    c = this._BuilderService.insertItemOrDelete(Rsection._id, Rsection, Resultsection.items, 'insert');
                    app.formula = [app.formula[0]];
                    requests.push(c);
                }
                if (switchingTo === 'Ecom') {
                    console.log('switching to...Ecom');
                    //     let Resultsection = this._DefaultJSON.getDefaultResultPage(app);
                    //     let Rsection = page.sections.find(section => section.type === 'Result');
                    //     Resultsection.items[0].props.title = Resultsection.items[0].props.title.replace(/({R1}|{Outcome}|{Score_absolute})/g, '{Average_Poll_Result}');
                    //     app.formula[0].result = result.slice(0, -1);
                    //    c = this._BuilderService.insertItemOrDelete(Rsection._id, Rsection, Resultsection.items, 'insert');
                    //     app.formula = [app.formula[0]];
                    // requests.push(c);
                }
                b = this._BuilderService.updateChanges({ app: app, page: '', sections: [], items: saveItem }, 'switch', app._id);
                requests.push(b);
            }
        });
        return Observable.forkJoin(...requests);
    }

    modifyLeadSection(page) {
        let saveItem = [];
        page.sections.forEach((section) => {
            if (section.type == 'LeadForm') {
                section.items.map((item) => {
                    if (item.type === 'cta_likes') {
                        item.options = item.options.map((option) => {
                            if (option.type === 'Facebook') {
                                option.label = 'http://www.facebook.com/outgrowco';
                                option.title = 'Subscribe to Our Updates';
                            }
                            if (option.type === 'Twitter') {
                                option.label = 'outgrowco';
                                option.title = 'Subscribe to Our Updates';
                            }
                            return option;
                        });
                        saveItem.push(item);
                    }
                    if (item.type === 'cta_shares') {
                        item.options = item.options.map((option) => {
                            option.label = 'How much should you pay for a video campaign? | via @outgrowco';
                            option.icon = 'Video campaigns can be expensive and many agencies will take you for a ride. See how much you should actually be paying!';
                            option.title = 'Share Your Results';
                            return option;
                        });
                        saveItem.push(item);
                    }
                });
            }
        });
        return saveItem;
    }
}
