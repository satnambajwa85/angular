import { Result } from './../../templates/components/result.directive';
import { Injectable, EventEmitter } from '@angular/core';
import { Section, Page, App, Item } from '@builder/models';
import { TemplateValidatorService } from '../../templates/services/templateValidator.service';
import { BuilderService } from './builder.service';
import { BuilderConditions } from './builderConditions.service';
import { environment } from '../../../../environments/environment';
import { SubDomainService } from '../../../shared/services/subdomain.service';
import { CookieService } from '../../../shared/services/index';
import { setTimeout } from 'timers';
import { timeout } from 'q';
import { Subject, BehaviorSubject } from 'rxjs';
declare var jQuery: any;
declare var window: any;
declare var moment: any;
declare let math: any;
@Injectable()
export class JSONBuilder {
  public JSONTemplate: App;
  public selectedControl: Item;
  public selectedSection: Section;
  public selectedPage: Page;
  public liveCalcs: any[] = [];
  public pages: any = {
    Landing: {},
    Questionnaire: {},
    Result: {}
  }
  public selectedModel: any = 'Page';
  public templateQuestionare: Item[] = [];
  public templateSections: Section[] = [];
  public templateQuestionareWithEmittedLeadFormQuestion: Item[] = [];
  public changed: boolean;
  radio_settimout: any;
  public questions: any = [];
  public questionIndex: any = [];
  public questionProgressWidth: any = [];
  public questionsWidth: any = '';
  public tvs: TemplateValidatorService;
  public selectedFormula: any;
  public leadFormUniqueNames: any = {};
  public conditional: any = {
    conditionalVar: false,
    optionIndex: -1,
    buttonText: 'Learn More',
    url: 'http://outgrow.co',
    image: '',
    links: {
      heading: '',
      cta: {     //Its title and desription is at option.title and option.description respectively
        ctaVisible: true,
        message: 'Thanks for submitting',
        open_in_tab: true
      },
      share: {
        visible: false,
        isFacebook: true,
        isTwitter: true,
        isLinkedIn: true,
        isVKontakte: true,
        isWhatsapp: false,
        isMail: false,
        isMessenger: false,
        title: '',
        description: '',
        shareImg: '',
        url: 'http://outgrow.co'
      },
      like: {
        visible: false,
        isFacebook: true,
        isTwitter: true,
        isVKontakte: true,
        fbUrl: 'http://outgrow.co',
        twitterHandle: 'outgrowco',
        vkProfile: '460614642'
      }
    }
  };
  public devMode: boolean = false;
  public controlChangeDetector: boolean = true;
  public parsersProcessed: number = 0;
  public totalParsers: number = 0;
  public features: any;
  public translatedFields: any = {};
  public graded: any = {
    rank: ''
  };
  cta_engagement_click: boolean = false;
  public leadFormVisibility: boolean;
  public visibleLeadData: any = {};
  public checkVideo: Subject<boolean> = new BehaviorSubject<boolean>(true);
  public outcome_selectize_init: Subject<any> = new BehaviorSubject<any>(null);
  public view_embeded_tab: Subject<any> = new BehaviorSubject<any>(null);

  // public video_view: Subject<any> = new BehaviorSubject<any>(null);
  public video_view_all: Subject<boolean> = new BehaviorSubject<boolean>(false);
  public isClipboardSupported: boolean = true;
  commonEmitter: EventEmitter<any> = new EventEmitter();
  constructor(public _BuilderService: BuilderService,
    public builderConditions: BuilderConditions, public subDomainService: SubDomainService, public _cookieService: CookieService
  ) { }

  getClickButton(page: any) {
    page = this.getPage(page);
    for (let section of page.sections) {
      for (let item of section.items) {
        if (item.type === 'click_button') {
          return item;
        }
      }
    }
  }

  setTemplate(template: App) {
    this.JSONTemplate = template;
    this.setBuilderConditions(this.JSONTemplate.template);
    for (let page of template.pages) {
      this.pages[page.type] = page;
      if (((this.JSONTemplate.template === 'template-seven' && this.JSONTemplate.pages[0].visible) || this.JSONTemplate.template !== 'template-seven') && !this.selectedPage)
        this.selectedPage = page;
      if (page.type === 'Questionnaire') {
        for (let section of page.sections) {
          /**section  */
          if (section.visible)
            this.templateSections.push(section);

          if (this.JSONTemplate.template === 'template-seven' && !this.selectedSection && !this.JSONTemplate.pages[0].visible) {
            this.selectedPage = page;
            this.selectedModel = 'Section';
            this.selectedSection = section;
            this.selectedModel = 'Control';
            this.selectedControl = section.items[0];
          }
          /**Items  */
          for (let item of section.items) {
            this.templateQuestionare.push(item);
            if (item.type != 'leadform_question')
              this.templateQuestionareWithEmittedLeadFormQuestion.push(item);
          }
        }
      }
    }
    this.getVisibleLeadForm();
    this.setQuestionsData();
  }
  setBuilderConditions(template: string) {
    this.builderConditions.initializeBuilderConditions(template);
  }
  setQuestionsData() {
    this.questions = [];
    let questionPage = this.getPage('Questionnaire');
    let index = 0;
    for (let section of questionPage.sections) {
      if (section.visible) {
        for (let item of section.items) {
          if (item.visible) {
            this.questions.push(item);
            this.questionIndex[item._id] = index++;
          }
        }
      }
    }
    if (this.getJSONBuilt().template === 'one-page-card-new' || this.getJSONBuilt().template === 'one-page-card') {
      this.questionsWidth = (100) / (this.questions.length);
      for (let question of this.questions) {
        this.questionProgressWidth[question._id] = Math.round(this.questionsWidth * (this.questionIndex[question._id] + 1));
      }
    }
  }

  getQuestionsList() {
    let questions: Item[] = [];
    for (let page of this.JSONTemplate.pages) {
      if (page.type === 'Questionnaire') {
        for (let section of page.sections) {
          if (section.type === 'LeadFormQ' && section.visible === false) {
          } else {
            for (let item of section.items) {
              if (item.visible)
                questions.push(item);
            }
          }
        }
      }
    }
    return questions;
  }
  getQuestions() {
    let questionPage = this.getPage('Questionnaire');
    let sections = {};
    for (let section of questionPage.sections.filter(s => s.type !== 'LeadFormQ')) {
      sections[section._id] = section.items
    }
    return sections;
  }

  getQuestionsCount() {
    let questions: Item[] = [];
    for (let page of this.JSONTemplate.pages) {
      if (page.type === 'Questionnaire') {
        for (let section of page.sections) {
          if (section.type !== 'LeadFormQ') {
            for (let item of section.items) {
              questions.push(item);
            }
          }
        }
      }
    }
    return questions.length;
  }
  getLandingPageItemsList(json: any) {
    let items = [];
    json.pages[0].sections.forEach(section => {
      section.items.forEach((item) => {
        items.push(item);
      })
    });
    return items;
  }
  updateOtherLeadFormFields(leadform: any) {
    let saveItem: any[] = [];
    for (let page of this.getJSONBuilt().pages) {
      if (page !== this.selectedPage) {
        let filteredsections = page.sections.filter((section) => {
          return section.type === 'LeadForm' || section.type === 'LeadFormQ' || section.type === 'Content Area';
        });
        filteredsections.forEach((section) => {
          section.items.map((item) => {
            if (item.type === 'leadform' || item.type === 'leadform_question') {
              item.props.postfix = leadform.props.postfix;
              item.props.email_lead = leadform.props.email_lead;
              item.props.unit = leadform.props.unit;
              item.fields = leadform.fields;
              item.hideDuplicates = leadform.hideDuplicates;
              saveItem.push(item);
            }
          });
        });
      }
    }
    this._BuilderService.updateChanges({ app: '', sections: '', items: saveItem, page: '' }, this.getJSONBuilt().socket_id || 'blank', this.getJSONBuilt()._id).subscribe(
      (response: any) => {
        //if(response.success)
        //this._ItemTrackService.resetUnsavedData();
      },
      (error: any) => {
        console.log(error);
      }
    );

  }
  allowInThisPage(page: any, desc: any) {
    return false;
    // if (desc.disclaimer_pages) {
    //   switch (page.type) {
    //     case 'Questionnaire': return desc.disclaimer_pages.question;
    //     case 'Result': return desc.disclaimer_pages.result;
    //     case 'Landing': return desc.disclaimer_pages.landing;
    //   }
    // } else {
    //   return true;
    // }
  }
  updateOtherLeadFormSection(leadSection: any) {
    let saveSection: any[] = [];
    for (let page of this.getJSONBuilt().pages) {
      if (page !== this.selectedPage) {
        let filteredsections = page.sections.filter((section) => {
          return section.type === 'LeadForm' || section.type === 'LeadFormQ';
        });
        filteredsections.forEach((section) => {
          section.title = leadSection.title;
          saveSection.push(section);
        });
      }
    }
    this._BuilderService.updateChanges({ app: '', sections: saveSection, items: '', page: '' },
      this.getJSONBuilt().socket_id || 'blank', this.getJSONBuilt()._id).subscribe(
        (response: any) => {
          //if(response.success)
          //this._ItemTrackService.resetUnsavedData();
        },
        (error: any) => {
          console.log(error);
        }
      );
  }

  reorder(order: string[], indexing?: boolean) {
    let sectionItems: any[] = this.selectedSection.items;
    for (let control in sectionItems) {
      if (sectionItems[control].type != 'leadform_question' && !indexing) {
        for (let index in order) {
          if (sectionItems[control].order == order[index]) {
            sectionItems[control].order = Number(index) + 1;
            break;
          }
        }
      } else if (sectionItems[control].type != 'leadform_question' && indexing) {
        sectionItems[control].order = Number(control) + 1;
      }
    }
  }
  updateCheckboxField(fields: any) {
    let field1; fields = JSON.parse(JSON.stringify(fields));
    fields.forEach((field) => {
      if (field.type === 'others' && field.subType === 'checkbox') {
        field1 = fields.splice(fields.indexOf(field), 1)[0];
        fields.push(field1);
      }
    });
    return fields;
  }
  // get question No.
  getQuestionNo() {
    let items: any = [];
    for (let page of this.JSONTemplate.pages) {
      if (page.type === 'Questionnaire') {
        for (let section of page.sections) {
          if (section.type !== 'LeadFormQ') {
            for (let item of section.items) {
              items.push(item);
            }
          }
        }
        break;
      }
    }
    let index = jQuery.inArray(this.selectedControl, items);
    return index + 1;

  }
  // hide other LeadForm
  hideOtherLeadForm(lead_on_page?: any, index?: number, direction?: any) {
    let sections: Section[] = [];
    let leadsection: Section;
    let items: Item[] = [];
    let editorControl: any = {
      click_button: {},
      leadform: {}
    };
    for (let page of this.JSONTemplate.pages) {
      if (page.type === lead_on_page) { //show currently selected page leadform
        this.setSelectedPage(page);
        this.setSelectedModel('Section');
        if (page.type === 'Questionnaire') { //in case of Questionnaire page consider 'section' also ... it requires
          for (let section1 of page.sections) {
            if (section1.type === 'LeadFormQ') {
              section1.visible = true;
              section1.items[0].visible = true;
              sections.push(section1);
              items.push(section1.items[0]);
              editorControl['leadform_question'] = section1.items[0];
              this.setSelectedSection(section1);
              leadsection = section1;
              //before/after question
              let index1 = jQuery.inArray(section1, page.sections);
              if (index1 === 0) {
                page.sections.push(section1);
                page.sections.splice(index1, 1);
              }
              //before/after question
            }
          }
        } else {
          for (let section1 of page.sections) { //these page requires click button also
            for (let item of section1.items) {
              if (item.type === 'leadform') {
                item.visible = true;
                item.config.direction = direction;
                items.push(item);
                editorControl['leadform'] = item;
                leadsection = section1;
                this.setSelectedSection(section1);
              }
              if (item.type === 'click_button' && (direction != 'beforeResult' || this.isTempName(['sound-cloud-v3', 'template-seven']))) {
                item.visible = false;
                items.push(item);
                editorControl['click_button'] = item;
              }
            }
            if (this.getJSONBuilt().versioning.resultV2 && this.isTempType(['Recommendation']) && direction == 'withResult') {
              this.getJSONBuilt().formula.map((formula: any) => formula.isValid = false);
            }
          }
        }
      } else { //hide all the pages leadform
        if (page.type === 'Questionnaire') {
          for (let section1 of page.sections) {
            if (section1.type === 'LeadFormQ') {
              section1.visible = false;
              section1.items[0].visible = false;
              sections.push(section1);
              items.push(section1.items[0]);
            }
          }
        } else {
          for (let section1 of page.sections) {
            for (let item of section1.items) {
              if (item.type === 'leadform') {
                item.visible = false;
                items.push(item);
              }
              if (item.type === 'click_button') {
                // if (page.type != 'Result') {
                item.visible = true;
                items.push(item);
                // }
              }
            }
          }
        }
      }
      //the end
    }
    let unsaveddata = {
      app: '',
      sections: sections,
      items: items,
      page: ''
    };
    this._BuilderService.updateChanges(unsaveddata, this.getJSONBuilt().socket_id || 'blank', this.getJSONBuilt()._id).subscribe(
      (response: any) => {
        //if(response.success)
        //this._ItemTrackService.resetUnsavedData();
      },
      (error: any) => {
        console.log(error);
      }
    );
    let data: any[] = [];
    data.push(leadsection);
    data.push(editorControl);
    return data;
  }
  hideOtherLeadForm1(lead_on_page?: any, index?: number) {
    let sections: Section[] = [];
    let items: Item[] = [];
    for (let page of this.JSONTemplate.pages) {
      if (page !== this.selectedPage) {
        if (page.type === 'Questionnaire') {
          for (let section1 of page.sections) {
            if (section1.type === 'LeadFormQ') {
              section1.visible = false;
              section1.items[0].visible = false;
              sections.push(section1);
              items.push(section1.items[0]);
            }
          }
        } else {
          for (let section1 of page.sections) {
            for (let item of section1.items) {
              if (item.type === 'leadform') {
                item.visible = false;
                items.push(item);
              }
              if (item.type === 'click_button') {
                if (page.type != 'Result') {
                  item.visible = true;
                  items.push(item);
                }
              }
            }
          }
        }
      }
    }
    this.getVisibleLeadForm();
    let unsaveddata = {
      app: '',
      sections: sections,
      items: items,
      page: ''
    };
    this._BuilderService.updateChanges(unsaveddata, this.getJSONBuilt().socket_id || 'blank', this.getJSONBuilt()._id).subscribe(
      (response: any) => {
        //if(response.success)
        //this._ItemTrackService.resetUnsavedData();
      },
      (error: any) => {
        console.log(error);
      }
    );
  }
  //get visible leadform
  getOtherVisibleLeadForm(): any {
    let pageType: string = '';
    let data = this.getVisibleLeadForm();
    if (!jQuery.isEmptyObject(data['page'][0])) {
      pageType = data['page'][0].type;
    }
    return pageType;
  }

  getVisibleLeadForm(): any {
    this.visibleLeadData = {};
    this.leadFormVisibility = false;
    let leadsection: Section[] = [];
    let leaditem: Item[] = [];
    let leadpage: Page[] = [];
    for (let page of this.JSONTemplate.pages) {
      for (let section of page.sections) {
        for (let item of section.items) {
          if ((item.type === 'leadform' || (section.visible === true && item.type === 'leadform_question')) && item.visible === true) {
            leadpage.push(page);
            leadsection.push(section);
            leaditem.push(item);
            this.leadFormVisibility = true;
            break;
          }
        }
      }
    }
    let lead: any = {
      page: leadpage,
      section: leadsection,
      item: leaditem
    };
    this.setQuestionsData();
    this.visibleLeadData = lead;
    return lead;
  }
  setChanged(value: boolean) {
    this.changed = value;
  }
  getChanged() {
    return this.changed;
  }
  addNewChild(childTemplate: any) {
    this.selectedSection.items.push(childTemplate);
  }

  sort(order: string[]) {
    this.reorder(order);
    this.selectedSection.items.sort((a, b) => ((a.order < b.order) ? -1 : ((a.order > b.order) ? 1 : 0)));
    this.setQuestionsData();
  }
  getCustomHtml() {
    return this.selectedSection.items.find((item) => item.type === 'custom_html');
  }
  getJSONBuilt(): App {
    return this.JSONTemplate;
  }

  setSelectedControl(control: Item) {
    this.selectedControl = control;
  }

  setSelectedSection(section: Section) {
    this.selectedSection = section;

  }


  setSelectedPage(page: Page) {
    // if (page.type == 'Questionnaire' && this.selectedModel == 'Page') return;
    // if(this.getJSONBuilt().template === 'one-page-card' && page.type === 'Questionnaire') {
    //   console.log('yyyyyyyyoooooo',page);
    //   this.selectedControl = this.getJSONBuilt().pages[1].sections[0].items[0];
    //   this.setSelectedModel('Control');
    // }else {
    this.selectedPage = page;
    // }
    //window.location.hash = '#' + page.type;
  }

  getSelectedControl() {

    return this.selectedControl;
  }

  getSelectedSection() {
    return this.selectedSection;
  }

  getSelectedPage() {
    return this.selectedPage;
  }

  /** */
  setControlChangeDetector(value: boolean) {
    this.controlChangeDetector = value;
  }

  getControlChangeDetector(): boolean {
    return this.controlChangeDetector;
  }



  resetQuestions() {
    for (let page of this.JSONTemplate.pages) {
      if (page.type === 'Questionnaire') {
        for (let section of page.sections) {
          for (let item of section.items) {
            // if (!this.isTempType(['Graded'])) {
            //   if (item.type === 'radio_button' || item.type === 'checkbox') {
            //     item.props.currentLabel = '';
            //     item.touched = false;
            //     item.options.map((option: any) => { option.selected = false; return option; });
            //     item.optionObj = item.options.filter((option: any) => { return option.selected; });
            //     let default_option = item.options.find((option: any) => { return option.defualtselected; });
            //     if (default_option) {
            //       item.props.currentValue = default_option.value;
            //     } else {
            //       item.props.currentValue = '';
            //     }
            //   }
            //   if (item.type === 'textfield') {
            //     item.props.currentLabel = '';
            //     item.props.currentValue = item.props.defaultValue;
            //     item.props.postfix = true;
            //     item.showButton = false;
            //     jQuery('#' + item._id).val('');
            //   }
            //   if (item.type === 'slider') {
            //     item.props.currentLabel = '';
            //     item.showButton = false;
            //     item.props.currentValue = item.props.defaultValue;
            //     let sliderRef: any = jQuery('#' + item._id).data('ionRangeSlider');
            //     let sliderJson: any = {
            //       from: parseFloat(item.props.defaultValue)
            //     };
            //     sliderRef.update(sliderJson);
            //   }
            //   if (item.type === 'selectbox') {
            //     item.props.currentLabel = item.options[0].label;
            //     item.props.currentValue = item.options[0].value;
            //     //  let default_option =  item.options.find((option) => { return option.defualtselected; } );
            //     //  if (default_option) {
            //     //     jQuery('#' + item._id)[0].selectize.setValue(default_option.hashIndex);
            //     //     item.props.currentValue = default_option.hashIndex;
            //     //   } else {
            //     //     jQuery('#' + item._id)[0].selectize.setValue(item.options[0].hashIndex);
            //     //     item.props.currentValue = item.options[0].hashIndex;
            //     //   }
            //     //   jQuery('#' + item._id)[0].selectize.close();
            //   }
            // }
            //console.log("lead in ques hide", this.getJSONBuilt().leadSubmittedQ);
            if (this.getJSONBuilt().leadSubmittedQ && item.visible && item.type === 'leadform_question') {
              item.visible = false;
              section.visible = false;
            }
          }
          // reset validation
          // if (section.type !== 'LeadFormQ' && !this.isTempType(['Graded'])) {
          //   this.tvs.updateFormGroup(section);
          // }
        }

      }
      if (this.getJSONBuilt().leadSubmittedR && page.type === 'Result') {
        for (let section of page.sections) {
          if (section.type === 'LeadForm') {
            for (let item of section.items) {
              if (!this.getJSONBuilt().versioning.resultV2) {
                if (item.type === 'click_button') {
                  item.visible = true;
                  jQuery('.lf-submitted').addClass('hide');
                }
                if (item.type === 'leadform' || item.type === 'cta_likes' || item.type === 'cta_shares') {
                  item.visible = false;
                }

              } else {
                if (item.type === 'click_button') {
                  item.visible = false;
                  jQuery('.lf-submitted').addClass('hide');
                }
                if (item.type === 'leadform') {
                  item.visible = false;
                }
              }

            }
          }
        }
      }
      if (this.getJSONBuilt().leadSubmittedQ && page.type === 'Result') {
        for (let section of page.sections) {
          if (section.type === 'LeadForm') {
            for (let item of section.items) {
              if (item.type === 'leadform' && item.config.direction == 'beforeResult') {
                item.visible = false;
              }
            }
          }
        }
      }
    }
  }

  changeControl(newControl: any) {
    this.tvs.ratingControls = [];
    //index of old control in array
    let index = jQuery.inArray(this.selectedControl, this.selectedSection.items);
    //replace oldControl with newControl at index

    if (newControl == 'stars' || newControl == 'opscale') {
      let self = this;
      let oldControl = this.selectedSection.items[index].config.type;
      this.selectedSection.items[index].props.unit = 'star';
      this.selectedSection.items[index].config.type = newControl;
      this.selectedSection.items[index].type = 'rating';
      this.selectedSection.items[index].props.defaultValue = 0;
      this.selectedSection.items[index].props.minVal = 1;
      this.selectedSection.items[index].props.maxVal = (newControl == 'stars' || this.getJSONBuilt().template == 'template-seven') ? 5 : 10;
      if (oldControl == 'opscale') {
        this.selectedSection.items[index].props.unit = 'star';
        jQuery('.rating' + this.selectedControl._id).addRating({
          fieldId: this.selectedControl._id,
          max: this.selectedControl.props.maxVal,
          default: this.selectedControl.props.defaultValue,
          icon: this.selectedControl.props.unit
        },
          (success) => {
            let control = this.tvs.getFormGroups()[this.getSelectedSection()._id].controls[this.selectedControl._id];
            let nestedControl = control.get(this.selectedControl._id);
            nestedControl.setValue(success);
            // this.selectedControl.props.currentLabel = success;
            // this.selectedControl.props.currentValue = success;
            this.selectedControl.showButton = true;
          }
        )
      }
    } else {
      this.selectedSection.items[index].type = newControl;
      if (newControl == 'calendar') {
        this.selectedSection.items[index].config.placeholder = 'YYYY/MM/DD';
      }
      if (newControl == 'slider' || newControl == 'selectbox')
        this.selectedSection.items[index].config.validations.required.status = false;
      if (newControl == 'radio_button' || newControl == 'checkbox') {
        this.selectedSection.items[index].props.currentValue = '';
        this.selectedSection.items[index].props.currentLabel = '';
      }
      if (newControl == 'textfield') {
        this.selectedSection.items[index].props.currentValue = '';
        this.selectedSection.items[index].props.currentLabel = '';
        this.selectedSection.items[index].props.defaultValue = '';
        this.selectedSection.items[index].config.type = 'text';
      }
    }

    if (this.JSONTemplate.templateType == 'Graded')
      this.selectedControl.options.map((option: any) => { option.isCorrect = false; });

    if (this.JSONTemplate.templateType == 'Poll' && newControl == 'radio_button')
      this.selectedControl.options.map((option: any) => { option.value = 'poll_' + (Math.floor((Math.random() * 10000000) + 1)) + Date.now(); });

    this.tvs.updateFormGroup(this.selectedSection);
  }

  deleteControl() {
    //index of old control in arra
    let index = jQuery.inArray(this.selectedControl, this.selectedSection.items);
    //replace oldControl with newControl at index
    this.selectedSection.items.splice(index, 1);
    //update question data
    this.setQuestionsData();
    //choose the next selected element from template section
    if (this.selectedSection.items.length > 0) {
      this.selectedControl = this.selectedSection.items[0];
    } else {
      // this.selectedControl = undefined;
      //index of old section
      let index1 = jQuery.inArray(this.selectedSection, this.selectedPage.sections);
      //replace oldsection with new section at index
      this.selectedPage.sections.splice(index1, 1);
      if (this.selectedPage.sections.length > 0) {
        //set control to first section
        this.selectedSection = this.selectedPage.sections[0];
      } else { //
      }
    }
  }

  deleteSection() {
    //Remove all Items
    this.selectedSection.items.splice(0, this.selectedSection.items.length);

    //update question data
    this.setQuestionsData();
    //Remove Section
    let index = jQuery.inArray(this.selectedSection, this.selectedPage.sections);
    //replace oldsection with new section at index
    this.selectedPage.sections.splice(index, 1);
    if (this.selectedPage.sections.length > 0) {
      //set control to first section
      this.selectedSection = this.selectedPage.sections[0];
    }
  }

  multiSectionSort(sectionIndex: number, itemIndex: number, order: string[]) {
    let secindex: any = sectionIndex - 1;
    for (let section in this.selectedPage.sections) {
      if (this.selectedPage.sections[section].type == 'LeadFormQ' && !this.selectedPage.sections[section].visible && Number(section) == 0) {
        secindex = sectionIndex;
      }
    }
    let sectionItems: any = this.selectedPage.sections[secindex].items;
    sectionItems.splice(itemIndex, 0, this.selectedControl);
    // delete control from out section
    let index = jQuery.inArray(this.selectedControl, this.selectedSection.items);
    //replace oldControl with newControl at index
    this.selectedSection.items.splice(index, 1);
    // sort the result section
    jQuery.each(sectionItems, function (key: any, item: any) {
      if (item.type != 'leadform_question')
        item.order = key + 1;
    });
    //sort the parent array
    this.sort;
    this.tvs.updateFormGroup(this.selectedSection);
    this.tvs.updateFormGroup(this.selectedPage.sections[secindex]);
  }

  addControl(item: Item, index: number) {
    //index of current item
    //let indexs = jQuery.inArray(this.selectedControl, this.selectedSection.items);
    //put it next to current item
    this.selectedSection.items.splice(index + 1, 0, item);
    //update form groups
    this.tvs.updateFormGroup(this.selectedSection);
    //sort the parent array
    this.sort;
    // sort the result section
    jQuery.each(this.selectedSection.items, function (key: any, item: any) {
      item.order = key + 1;
    });

    this.setQuestionsData();
    //return item;
  }

  addNewSection(section: Section, item: Item) {
    let section1 = new Section(section.title, '', section.description);
    section1._id = section._id;
    section1.addItems(item);
    this.JSONTemplate.pages[1].addSections(section1);
    //update form groups
    this.tvs.updateFormGroup(section1);
    this.setQuestionsData();
  }
  updateFormGroupForCheckbox() {
    this.tvs.updateFormGroup(this.selectedSection);
  }
  addNewQuestion(item: Item, index: number) {
    console.log(this.JSONTemplate.pages[1].sections[index - 1]);
    this.JSONTemplate.pages[1].sections[index - 1].addItems(item);
    //update form groups
    this.tvs.updateFormGroup(this.JSONTemplate.pages[1].sections[index - 1]);
    //sort the parent array
    this.sort;
    // sort the result section
    jQuery.each(this.JSONTemplate.pages[1].sections[index - 1].items, function (key: any, item: any) {
      item.order = key + 1;
    });
    this.setQuestionsData();
  }

  setDeleteSectionQuestion(item: Item, id: any, ind: any) {
    let index = this.JSONTemplate.pages[1].sections.findIndex(d => d._id == id)
    this.JSONTemplate.pages[1].sections[index].addItems(item);
    //update form groups
    this.tvs.updateFormGroup(this.JSONTemplate.pages[1].sections[index]);
    //sort the parent array
    this.sort;
    // sort the result section
    jQuery.each(this.JSONTemplate.pages[1].sections[index].items, function (key: any, item: any) {
      item.order = key + 1;
    });
    if (ind == 0 && item.type == 'selectbox') {
      let dir = 'down';
      if (this.getJSONBuilt().template === 'template-six') {
        dir = item.options.length > 10 ? 'up' : 'auto';
      }
      setTimeout(() => {
        jQuery('#' + item._id).selectize({
          allowEmptyOption: true,
          dropdownDirection: dir
        });
      }, 4000);
    }
  }

  setSelectedModel(type: any) {
    let template = this.getJSONBuilt().template;
    if (template === 'template-seven' && type === 'Page' && this.selectedPage.type === 'Questionnaire') {
      let page = this.getJSONBuilt().pages[1];
      this.selectedPage = page;
      this.selectedModel = 'Section';
      this.selectedSection = page.sections[0];
      this.selectedModel = 'Control';
      this.selectedControl = page.sections[0].items[0];
      return;
    }
    let soundCloudCondition = (template === 'sound-cloud' && type === 'Section' && this.getSelectedSection() && ['LeadForm', 'LeadFormQ', 'Content Area'].indexOf(this.getSelectedSection().type) < 0);
    let Conditions = (template === 'template-six' || template === 'one-page-card-new' || template === 'template-eight') && type === 'Section' && this.getSelectedSection() && ['LeadForm', 'LeadFormQ', 'Content Area'].indexOf(this.getSelectedSection().type) < 0;
    //console.log('soundCloudCondition',Conditions);
    if (soundCloudCondition || Conditions) {
      this.setSelectedControl(this.getJSONBuilt().pages[1].sections[0].items[0]);
      this.selectedModel = 'Control';
    } else {
      this.selectedModel = type;
    }
  }

  getSelectedModel(): any {
    return this.selectedModel;
  }

  addResultSection(section: Section): any {

    let defaultClasses = '';

    if (this.getJSONBuilt().template.split('-', 2).join('-') == 'inline-temp')
      defaultClasses = 't4-default-result-outer tr-bold-new tr-capital';
    else if (this.getJSONBuilt().template == 'sound-cloud')
      defaultClasses = 'temp2-default-result-outer tr-bold-new tr-capital';
    else if (this.getJSONBuilt().template == 'sound-cloud-new' || this.getJSONBuilt().template == 'sound-cloud-v3')
      defaultClasses = 'temp2-default-result-outer tr-bold-new tr-capital';
    else if (this.getJSONBuilt().template == 'one-page-card')
      defaultClasses = 't3-default-result-outer tr-bold-new  tr-capital';
    let text = `<p>RESULT HEADING GOES HERE</p>`;
    if (this.getJSONBuilt().template.split('-', 2).join('-') == 'inline-temp') {
      text = `<p>RESULT HEADING GOES HERE</p>`;
    }
    //<p>{R` + (this.getJSONBuilt().formula.length) + `}</p>
    let itemNew: any;
    if (this.getJSONBuilt().template === 'template-seven') {
      itemNew = new Item('result_output', `
            <p><span class='fr-deletable var-tag' contenteditable='false'>{R` + (this.getJSONBuilt().formula.length) + `}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;</p>`,
        `<p>Total Interest: </p>`, '', defaultClasses);
    } else {
      itemNew = new Item('result_output', `
      <p><span class='fr-deletable var-tag' contenteditable='false'>{R` + (this.getJSONBuilt().formula.length) + `}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;</p>`,
        text + `<p>Result description text goes here</p>`, '', defaultClasses);
    }
    //itemNew.setFormulaIndex(formulaIndex.toString());
    if (itemNew.options[0]) {
      itemNew.options[0].label = `<p><span class='fr-deletable var-tag' contenteditable='false'>{R` + (this.getJSONBuilt().formula.length) + `}<a href='#' class='tag_delete'><img src='../assets/images/builder/X.png'></a></span>&nbsp;</p>`;
      itemNew.options[0].icon = itemNew.props.helpText;
    }
    itemNew.options.push(itemNew.options[0]);
    itemNew.setVisibility(true);
    section.addItems(itemNew);
    return { item: section.items[section.items.length - 1], index: section.items.length - 1 };
  }

  duplicateResultItem(section: Section, item: Item): any {
    let defaultClasses = '';
    if (this.getJSONBuilt().template.split('-', 2).join('-') == 'inline-temp')
      defaultClasses = 't4-default-result-outer tr-bold-new tr-capital';
    else if (this.getJSONBuilt().template == 'sound-cloud')
      defaultClasses = 'temp2-default-result-outer tr-bold-new tr-capital';
    else if (this.getJSONBuilt().template == 'sound-cloud-new')
      defaultClasses = 'temp2-default-result-outer tr-bold-new tr-capital';
    else if (this.getJSONBuilt().template == 'one-page-card')
      defaultClasses = 't3-default-result-outer tr-bold-new tr-capital';
    let itemNew = new Item('result_output', item.props.title, item.props.helpText, '', defaultClasses);
    itemNew.setVisibility(true);

    itemNew.props.minVal = item.props.minVal;
    itemNew.props.maxVal = item.props.maxVal;
    itemNew.options = item.options;
    itemNew.config = item.config;

    section.addItems(itemNew);
    return { item: section.items[section.items.length - 1], index: section.items.length - 1 };
  }

  deleteResultSection(section: Section, formulaIndex: any) {
    this.reorganizeResults(formulaIndex);
    section.items.forEach(function (item, index) {
      item.setFormulaIndex(index.toString());
    });
    section.items.splice(formulaIndex, 1);
  }

  reorganizeResults(formulaIndex: any) {
    //reduce indices
    this.JSONTemplate.formula = this.JSONTemplate.formula.map((formula) => {
      formula.result = formula.result.replace(/(R[\d]+)/g, (match) => {
        let index = Number(match.split(/[R]/)[1]) - 1;
        if (index > formulaIndex) {
          return `R${index}`;
        } else {
          return match;
        }
      });
      return formula;
    });
    //replace results
    this.JSONTemplate.formula = this.JSONTemplate.formula.map((formula) => {
      let replacableResult = `R${formulaIndex + 1}`;
      if (formula.result.indexOf(replacableResult) !== -1) {
        formula.result = formula.result.replace(new RegExp(replacableResult, 'g'), `(${this.JSONTemplate.formula[formulaIndex].result})`);
      }
      return formula;
    });
  }

  getTemplateQuestionare(): any[] {
    return [this.templateQuestionare, this.templateSections];
  }

  updateTemplateQuestionare() {
    this.templateSections = [];
    this.templateQuestionare = [];
    for (let section of this.JSONTemplate.pages[1].sections) {
      this.templateSections.push(section);
      for (let item of section.items) {
        this.templateQuestionare.push(item);
      }
    }
  }



  getTemplateQuestions(): any[] {
    let templateQuestions: Item[] = [];
    let templateSections: Section[] = [];
    for (let page of this.JSONTemplate.pages) {
      if (page.type === 'Questionnaire') {
        for (let section of page.sections) {
          if (section.visible)
            templateSections.push(section)

          for (let item of section.items) {
            if (item.visible)
              templateQuestions.push(item);
          }
        }
      }
    }
    return [templateQuestions, templateSections];
  }

  getTemplateQuestionareWithEmittedLeadFormQuestion(): Item[] {
    //First Updates the questionare list and then returns
    this.templateQuestionareWithEmittedLeadFormQuestion = [];
    for (let page of this.JSONTemplate.pages) {
      if (page.type === 'Questionnaire') {
        for (let section of page.sections) {
          for (let item of section.items) {
            if (['leadform_question', 'custom_html'].indexOf(item.type) < 0)
              this.templateQuestionareWithEmittedLeadFormQuestion.push(item);
          }
        }
      }
    }
    return this.templateQuestionareWithEmittedLeadFormQuestion;
  }

  getTemplateQuestionareForLogicJump(): any[] {
    //First Updates the questionare list and then returns
    let templateQuestionareForLogicJump: Item[] = [];
    let templateSectionsForLogicJump: Section[] = [];

    for (let page of this.JSONTemplate.pages) {
      if (page.type === 'Questionnaire') {
        for (let section of page.sections) {
          /** sections that are visible */
          if (section.visible && section.type !== 'LeadFormQ')
            templateSectionsForLogicJump.push(section);
          /** all items in sections */
          for (let item of section.items) {
            if (['leadform_question'].indexOf(item.type) < 0)
              templateQuestionareForLogicJump.push(item);
          }
        }
      }
    }
    return [templateQuestionareForLogicJump, templateSectionsForLogicJump];
  }


  addFormula(): any {
    return this.JSONTemplate.addformula();
  }
  // builder condition
  templateCalcTypeControls(condition: string) {
    return this.builderConditions.templateCalcTypeControls(condition);
  }
  templatesImages() {
    return this.builderConditions.templatesImages;
  }
  editors(condition: string) {
    return this.builderConditions.editors(condition, this.getJSONBuilt().template);
  }
  controls(condition: string) {
    return this.builderConditions.controls(condition, this.getJSONBuilt().template);
  }
  componentManager(condition: string) {
    return this.builderConditions.componentManager(condition, this.getJSONBuilt().template);
  }
  templatesTypes(condition: string) {
    return this.builderConditions.templatesTypes(condition, this.getJSONBuilt().template);
  }
  templateControls(template: string) {
    return this.builderConditions.templateControls(template);
  }
  template(condition: string) {
    return this.builderConditions.template(condition);
  }
  duplicateFormula(formula: any): any {
    return this.JSONTemplate.duplicateFormula(formula);
  }
  setValidatorService(instance: TemplateValidatorService) {
    this.tvs = instance;
  }

  updateFormGroup() {
    this.tvs.updateFormGroup(this.selectedSection);
  }
  /*Animation funtions*/
  animInit() {
    jQuery('.save_icon').removeClass('hide');
    if (jQuery('.elem').parent().hasClass('green-bg')) {
      jQuery('.elem').parent().removeClass('green-bg');
    }
    jQuery('.saving').html('Saving');
    jQuery('#live-btn').prop('disabled', true);
    jQuery('.elem').addClass('elem-rotate').html('<i class="material-icons">donut_large</i>').fadeIn('slow');
    jQuery('#live-btn').prop('disabled', true);
  }
  animLoad() {
    jQuery('.saving').html('all changes are saved');
    jQuery('#live-btn').prop('disabled', false);
    jQuery('.elem').removeClass('elem-rotate').html('<i class="material-icons green-color">check</i>').fadeIn('slow');
    jQuery('.elem').parent().addClass('green-bg');

    // setTimeout(function () {
    //   // jQuery('.elem').parent().removeClass('green-bg');
    //   // jQuery('.elem').html('<i class="material-icons">save</i>').fadeIn('slow');
    //   jQuery('.save_icon').addClass('hide');
    // }, 700);

  }

  debounce(func: any, wait: number) {
    let timeout: any;
    return function () {
      let context = this;
      let later = function () {
        timeout = null;
        func.apply(context);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  isEmpty(obj: any) {
    if (obj == null || obj.length === 0 || typeof obj !== "object") return true;

    if (obj.length > 0) return false;

    for (let key in obj)
      if (key != '_id' && obj[key] != "") return false;

    return true;
  }

  getLandingPageHeading(type: any) {

    let landingPage = this.getJSONBuilt().pages.filter((page: any) => page.type == 'Landing');
    if (landingPage) {
      let contentAreaSection = landingPage[0].sections.filter((section: any) => section.type == 'Content Area');
      if (contentAreaSection) {
        if (type == 'main-heading') {
          let mainHeading = contentAreaSection[0].items.filter((item: any) => item.type == 'header');
          return jQuery('<textarea/>').html(mainHeading[0].props.title.replace(/<(?:.|\n)*?>/gm, '')).text();
        }

        else if (type == 'sub-heading') {
          let subHeading = contentAreaSection[0].items.filter((item: any) => item.type == 'sub_header');
          return jQuery('<textarea/>').html(subHeading[0].props.title.replace(/<(?:.|\n)*?>/gm, '')).text();
        }
      }
    }
  }

  checkCTALikesExists() {
    let resultPage = this.getJSONBuilt().pages.filter((page: any) => page.type == 'Result');
    if (resultPage) {
      let leadform_section = resultPage[0].sections.filter((section: any) => section.type == 'LeadForm');
      if (leadform_section) {
        let cta_shares = leadform_section[0].items.filter((item: any) => item.type == 'cta_shares');
        let cta_likes = leadform_section[0].items.filter((item: any) => item.type == 'cta_likes');
        if (cta_shares || cta_likes) {
          return true;
        }
      }
    }
    return false;
  }
  /*End of Animation funtions*/

  updateFormulas(order: any[]) {
    this.JSONTemplate.formula.forEach((formula) => {
      formula.result = formula.result.replace(/(Q[\d]+)/g, (match) => {
        let qNumber = match.split(/[Q]/)[1];
        return order.indexOf(qNumber) != -1 ? ('Q' + (order.indexOf(qNumber) + 1)) : match;
      });
    });
  }

  updateAllSectionsFormulas(previousItems: Item[]) {
    let currentItems: Item[] = this.getTemplateQuestionareWithEmittedLeadFormQuestion();
    let sortingObj = {};

    previousItems.map((item, index) => {
      let currentIndex = currentItems.findIndex((control) => item._id == control._id);
      sortingObj[index + 1] = currentIndex + 1;
    })

    this.JSONTemplate.formula.forEach((formula) => {
      formula.result = formula.result.replace(/(Q[\d]+)/g, (match) => {
        let qNumber = match.split(/[Q]/)[1];
        return sortingObj[qNumber] ? ('Q' + (sortingObj[qNumber])) : match;
      });
    });
  }

  uniqueNameGenerator(control: Item) {
    this.leadFormUniqueNames = {};
    let self: any = this;
    if (control && control.fields && control.fields.length)
      control.fields.forEach(function (field) {
        // check for result outputs
        if (self.leadFormUniqueNames.hasOwnProperty(field.type)) {
          let itemObj: any;
          let i: number = 1;
          while (itemObj == undefined) {
            if ((self.leadFormUniqueNames[field.type + '_' + i]))
              i++;
            else {
              self.leadFormUniqueNames[field.type + '_' + i] = field;
              itemObj = field.key = field.type + '_' + i;
            }
          }
        } else {
          self.leadFormUniqueNames[field.type] = field;
          field.key = field.type;
        }
      });
    //console.log('control in ', control, self.leadFormUniqueNames);
  }

  getLeadUniqueNames() {
    return this.leadFormUniqueNames;
  }

  getDefault(name: any) {
    if (this.getJSONBuilt().template == 'one-page-slider' && (this.getJSONBuilt().templateType == 'Numerical')) {
      if (name == 'lpHeading') {
        return 'CALCULATE THE RISK OF YOU GETTING A HEART DISEASE';
      } else if (name == 'lpSubHeading') {
        return 'Heart problems are at an all time high. See if your lifestyle makes you susceptible.';
      }
    }
    else if (this.getJSONBuilt().template == 'one-page-card' && (this.getJSONBuilt().templateType == 'Numerical')) {
      if (name == 'lpHeading') {
        return 'How much should you pay for a video campaign?';
      } else if (name == 'lpSubHeading') {
        return 'Video campaigns can be expensive and many agencies will take you for a ride. See how much you should actually be paying!';
      }
    }
    else if (this.getJSONBuilt().template.split('-', 2).join('-') == 'inline-temp' && (this.getJSONBuilt().templateType == 'Numerical')) {
      if (name == 'lpHeading') {
        return 'How much should you pay for a video campaign?';
      } else if (name == 'lpSubHeading') {
        return 'Video campaigns can be expensive and many agencies will take you for a ride. See how much you should actually be paying!';
      }
    }
    else if (this.getJSONBuilt().template == 'sound-cloud') {
      if (name == 'lpHeading') {
        return 'How much should you pay for a video campaign?';
      } else if (name == 'lpSubHeading') {
        return 'Video campaigns can be expensive and many agencies will take you for a ride. See how much you should actually be paying!';
      }
    }
    else if (this.getJSONBuilt().templateType == 'Recommendation') {
      if (name == 'lpHeading') {
        return 'Where to build your Startup?';
      } else if (name == 'lpSubHeading') {
        return 'See which emerging tech hub you should head to!';
      }
    }
  }

  indexOfPage(type: string) {
    let index: number = 0;
    for (let page in this.JSONTemplate.pages) {
      if (this.JSONTemplate.pages[page].visible) {
        if (this.JSONTemplate.pages[page].type == type) break;
        else index++;
      }
    }
    return index;
  }
  /** check condition in template */

  isTempType(templates: any[]) {
    return templates.indexOf(this.getJSONBuilt().templateType) === -1 ? false : true;
  }

  isTempName(tempNames: any[]) {
    return tempNames.indexOf(this.getJSONBuilt().template) === -1 ? false : true;
  }

  updateGradedFormula() {
    if (this.isTempType(['Graded'])) {
      let result = '';
      this.getTemplateQuestionareWithEmittedLeadFormQuestion().forEach((item: any, index: number) => result += 'Q' + (index + 1) + '+');
      this.getJSONBuilt().formula[0].result = result.slice(0, -1);
    } else if (this.isTempType(['Poll'])) {
      let result: string = '', radio_count: number = 0;
      this.getTemplateQuestionareWithEmittedLeadFormQuestion().forEach((item: any, index: number) => {
        if (item.type == 'radio_button') {
          result += 'Q' + (index + 1) + '+'; radio_count = radio_count + 1;
        }
      });
      this.getJSONBuilt().formula[0].result = `${result.slice(0, -1)}/${radio_count}`;
    }
  }
  //random ID generation
  randomId(length: number): string {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * length)];
    return result;
  }

  showLeadFormSCV3() {
    // jQuery('.result-mid.result-comm').addClass('opc');
    // jQuery('#my-btn').addClass('hide');
    // jQuery('.leadform-outer.new-lead ').animate({

    // });
    // let height = jQuery('.leadform-outer.new-lead').height();
    // jQuery('.result-fixed .t2-scroller-outer').css('height', height);
    // jQuery('.result-fixed .t2-scroller-outer').addClass('new-block');

    jQuery(document).find('#my-btn').hide();
    jQuery('.result-mid.result-comm').addClass('opc');
    jQuery('#my-btn').addClass('hide');
    jQuery('.leadform-outer.new-lead ').fadeIn();
    jQuery('.result-fixed .t2-scroller-outer').addClass('new-block');
  }

  previewURL() {
    let previewImgUrl = '';
    if (this.getJSONBuilt().seoImage != '') {
      previewImgUrl = this.getJSONBuilt().seoImage;
    } else if (this.getJSONBuilt().mode === 'PUBLIC') {
      // previewImgUrl = 'http://1.bp.blogspot.com/-nh5y10UTIo8/VejqJhiD10I/AAAAAAAAABM/A3AveNPQzU8/s1600/launch-poster.jpg';
      if (this.getJSONBuilt().shortUrl) {
        previewImgUrl = `http://api.screenshotlayer.com/api/capture?access_key=` + environment.SCREENSHOTLAYER_API + `&url=` + this.getJSONBuilt().shortUrl + `&viewport=1200x630&fullpage=1&delay=3`;
      } else {
        previewImgUrl = 'https://cdn.filestackcontent.com/S0wVfeBIRUeyNpzw7fQG';
      }
      // previewImgUrl = `http://process.filestackapi.com/${environment.FILE_PICKER_API}/urlscreenshot=delay:4000/${this.getJSONBuilt().shortUrl}`;
      // } else previewImgUrl = 'https://cdn.filestackcontent.com/S0wVfeBIRUeyNpzw7fQG';
    } else {
      if (this.getJSONBuilt().shortUrl) {
        previewImgUrl = `http://api.screenshotlayer.com/api/capture?access_key=` + environment.SCREENSHOTLAYER_API + `&url=` + this.getJSONBuilt().shortUrl + `&viewport=1200x630&fullpage=1&delay=3`;
      } else {
        previewImgUrl = 'https://cdn.filestackcontent.com/S0wVfeBIRUeyNpzw7fQG';
      }
      // previewImgUrl = this.getBGImage();
    }
    return previewImgUrl;
  }

  getPage(pageName: string) {
    return this.getJSONBuilt().pages.find(page => page.type === pageName);
  }

  getParameterByName(name: any, url: any) {
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  // insertScript() {
  //   if (this.JSONTemplate.custom_script['status'] === 'APPROVED' && this.JSONTemplate.status == 'LIVE') {
  //     console.log("Loading custom scripts");
  //     let script = document.createElement('script');
  //     script.text = this.JSONTemplate.custom_script['value'];
  //     document.head.appendChild(script);
  //   }
  // }
  insertScript() {
    if (this.JSONTemplate.status == 'LIVE' && this.JSONTemplate.scripts && this.JSONTemplate.scripts.length > 0) {
      this.JSONTemplate.scripts.forEach((customJs, index) => {
        if (customJs['status'] === 'APPROVED') {
          console.log("Loading custom script", customJs);
          let script = document.createElement('script');
          script.text = customJs['value'];
          document.head.appendChild(script);
        }
      })
    }

  }

  getCommonEmitter() {
    return this.commonEmitter;
  }

  getLiveURL() {
    let url: any = '';
    if (environment.LIVE_PROTOCOL === 'https://') {
      if (environment.STATIC_DOMAIN) {
        url = 'https://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.getJSONBuilt().url;
      } else {
        url = 'https://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.getJSONBuilt().url;
      }
    } else {
      if (environment.STATIC_DOMAIN) {
        url = '//' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.getJSONBuilt().url;
      } else {
        url = '//' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.getJSONBuilt().url;
      }
    }
    return url;
  }

  getProgessbarWidth(dotIndex: any) {
    let width = (100) / (this.getQuestionsList().length);
    return [width + '%', Math.round(width * (dotIndex + 1)) + '%'];
  }

  getDataForEmbed(callBack) {
    let heading: string = '';
    let subhead: string = '';
    let logoURL: string = '';
    let landingPage = this.getJSONBuilt().pages.filter((page: any) => page.type == 'Landing');
    let questionPage = this.getJSONBuilt().pages.filter((page: any) => page.type == 'Questionnaire');
    if (landingPage && landingPage[0].visible) {
      let contentAreaSection = landingPage[0].sections.filter((section: any) => section.type == 'Content Area');
      let logoSection = landingPage[0].sections.filter((section: any) => section.type == 'Logo Heading');
      if (contentAreaSection) {
        // Main Heading
        let mainHeading = contentAreaSection[0].items.filter((item: any) => item.type == 'header');
        heading = mainHeading[0].props.title.replace(/<(?:.|\n)*?>/gm, '');
        // Sub Heading
        let subHeading = contentAreaSection[0].items.filter((item: any) => item.type == 'sub_header');
        subhead = subHeading[0].props.title.replace(/<(?:.|\n)*?>/gm, '');
      }
      if (logoSection) {
        let logo = logoSection[0].items.filter((item: any) => item.type == 'logo');
        logoURL = logo[0].props.title;
      }
    } else {
      const questionOne: any = questionPage[0].sections[0].items[0];
      heading = questionOne.props.title.replace(/<(?:.|\n)*?>/gm, '');
    }
    callBack && callBack(heading, subhead, landingPage[0].bgImage, landingPage[0].bgImageVisible, landingPage[0].visible, logoURL);
  }

  getBGImage() {
    let landingPage = this.getJSONBuilt().pages.filter((page: any) => page.type == 'Landing');
    return landingPage[0].bgImage;
  }

  getVerClass() {
    const createdAt = new Date(moment(this.JSONTemplate.createdAt).format('YYYY-MM-DD'));
    const today = new Date('2018-01-23');
    if (createdAt >= today) {
      return 'control-ver2';
    } else {
      return 'control-ver1';
    }
  }

  videoCheck(caller: boolean, addVideo: any = false, timeOut: any = 0) {
    timeOut = timeOut != 0 ? timeOut : 100;
    if (this.JSONTemplate.template === 'template-eight') {
      timeOut = 600;
    }
    setTimeout(() => {
      let videoUrl = this._cookieService.readCookie('video_url_' + this.getJSONBuilt()._id);
      let url = videoUrl ? JSON.parse(videoUrl) : [];
      let flg: boolean = false;
      if (url.length) {
        if (addVideo) {
          jQuery('#' + url[url.length - 1].id).attr('src', url[url.length - 1].url);
        } else {
          for (let item of url) {
            let visible = jQuery('#' + item.id).is(':visible');
            if (!visible) {
              jQuery('#' + item.id).attr('src', '');
            } else {
              jQuery('#' + item.id).attr('src', item.url);
              flg = true;
            }
          }
          if (flg) {
            this.checkVideo.next(false);
          } else if (caller) {
            this.checkVideo.next(false);
          } else {
            this.checkVideo.next(true);
          }
        }
      }
    }, timeOut);
  }

  checkReplaceFbAppId() {
    return ((['.outgrow.', '.rely.', '.safacademy.'].find(d => (window.location.host).includes(d))) ? false : this.getJSONBuilt().fb_app_id ? true : false);
  }

  leadgenPopupCheck() {
    setTimeout(() => {
      if (jQuery('.lead-popup').is(':visible')) {
        jQuery('html').addClass('leadPopupVisibleNow');
        if (!this.devMode) {
          jQuery('.lead-popup').removeClass('disappear').addClass('appear testClass');
        }
      }
    }, 500);
  }

  hideOrShowVideo(show: number, hide: number, timeOut: any = 0) {
    console.log('Hide show called');
    if (this.JSONTemplate.template === 'template-eight') {
      timeOut = 600;
    }
    console.log('Video view emit fire');
    // let link = (show != -1) ? (this.getQuestionsList()[show].video.youtubeLink ? this.getQuestionsList()[show].video.youtubeLink : this.getQuestionsList()[show].video.videoLink ? this.getQuestionsList()[show].video.videoLink : this.getQuestionsList()[show].video.videoWistiaLink) : '';
    // show != -1 ? this.video_view.next({ id: 'videoId' + this.getQuestionsList()[show]._id, visible: true }) : '';
    // hide != -1 ? this.video_view.next({ id: 'videoId' + this.getQuestionsList()[hide]._id, visible: false }) : '';
    this.video_view_all.next(true);
    //this.video_view.next(null);
    // show != -1 ? jQuery('#' + 'videoId' + this.getQuestionsList()[show]._id).attr('src', link) : '';
    // hide != -1 ? jQuery('#' + 'videoId' + this.getQuestionsList()[hide]._id).attr('src', '') : '';
  }

  outocmeSelectizeSubjectEmit(control: any) {
    this.outcome_selectize_init.next(control);
  }
  //redirect user from last question
  redirectStausChnage() {
    this.getJSONBuilt().question_redirect_status = !this.getJSONBuilt().question_redirect_status;
  }
  setUrlTab() {
    this.getJSONBuilt().question_redirect_new_tab = !this.getJSONBuilt().question_redirect_new_tab;
  }
  checkUrl(url: any) {
    this.getJSONBuilt().question_redirect_url = this.checGivenkUrl(url);
  }

  checGivenkUrl(url: any) {
    if (/^(tel:)/i.test(url)) {
      return url;
    }
    if (/^(mailto:)/i.test(url)) {
      return url;
    }
    if (!/^(f|ht)tps?:\/\//i.test(url)) {
      url = "http://" + url;
      return url;
    }
    return url;
  }

  isItLastQuestion(control) {
    let index = this.questions.findIndex(d => d._id == control._id);
    if (['template-eight', 'one-page-card-new', 'template-six'].findIndex(d => d == this.getJSONBuilt().template.trim()) != -1 && index != -1) {
      if (index !== (this.questions.length - 1) && (index + 1) == (this.questions.length - 1) && (this.questions[index + 1].type == 'leadform_question')) {
        return true;
      }
      return (index == (this.getQuestionsList().length - 1)) && ['template-eight', 'one-page-card-new', 'template-six'].findIndex(d => d == this.getJSONBuilt().template) != -1 ? true : false;
    } else {
      return false;
    }
  }

  bothLeadGenAvailable(section) {
    let leadData = this.visibleLeadData;
    if (leadData && leadData.page[0]) {
      if (section.type == 'Content Area' && leadData.page[0].type == 'Landing') {
        let leadItem = leadData.item[0];
        return leadItem.props.unit === 'changed' && leadItem.props.email_lead && leadItem.props.postfix;
      } else return false;
    } else return false;
  }

  // ctaEngagment(fromFB: boolean = false) {
  //   this._analyticService.updateCalcVisitor(fromFB ? 'Clicked on FB login' : 'Clicked on URL').subscribe(
  //     (response) => {
  //       this.cta_engagement_click = true;
  //     },
  //     (error) => { console.log('error', error); }
  //   );
  // }

  setHideAndShow(show, hide, timeOut) {
    setTimeout(() => {
      let link = (show != -1) ? (this.getQuestionsList()[show].video.youtubeLink ? this.getQuestionsList()[show].video.youtubeLink : this.getQuestionsList()[show].video.videoLink ? this.getQuestionsList()[show].video.videoLink : this.getQuestionsList()[show].video.videoWistiaLink) : '';
      show != -1 ? jQuery('#' + 'videoId' + this.getQuestionsList()[show]._id).attr('src', link) : '';
      hide != -1 ? jQuery('#' + 'videoId' + this.getQuestionsList()[hide]._id).attr('src', '') : '';
    }, timeOut);
  }

  isGDPR() {
    return this.JSONTemplate.is_gdpr;
  }

  createWindow(newTarget: Boolean = false) {
    return window.open('', newTarget ? '_blank' : '_parent');
  }

  leadgenAsPopupVisible() {
    let leadData = this.visibleLeadData;
    if (this.leadFormVisibility) {
      let leadItem = leadData.item[0];
      if (leadData.page[0].type == 'Result' && leadItem.config.direction === 'beforeResult') {
        return true
      }
    }
    return false;
  }
}
