import { FroalaService } from './../../../../services/froala.service';
import { CompanyService } from './../../../../../../shared/services/company.service';
//TODO changes have not been made.
import { Component, AfterViewInit, ViewEncapsulation, OnInit, DoCheck, OnDestroy } from '@angular/core';
import { CalcEmail } from "../../../../models/calc_email.model";
import { JSONBuilder } from "../../../../services/JSONBuilder.service";
import { FormulaService } from "../../../../services/formula.service";
import { BuilderService } from "../../../../services/builder.service";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { CustomValidator } from "../../../../../templates/services/customValidation";
import { CookieService } from './../../../../../../shared/services/cookie.service';
import { SubDomainService } from './../../../../../../shared/services/subdomain.service';
import { FeatureAuthService } from "../../../../../../shared/services/feature-access.service";
import { RemoveTags } from '../../../../../templates/pipes/RemoveTags.pipe';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';

declare var jQuery: any;
declare var window: any;
declare var bootbox: any;
@Component({
  selector: 'config-email',
  // template:'hello this is email',
  templateUrl: './assets/html/email.template.html',
  styleUrls: ['./assets/css/wysiwyg.css'],
  encapsulation: ViewEncapsulation.None,
})

export class ConfigEmailComponent implements AfterViewInit, OnInit, DoCheck, OnDestroy {
  options: any;
  finishCalcEmail: CalcEmail;
  emailForm: FormGroup;
  AddUserForm: FormGroup;
  currentCount: number;
  isFocused: string;
  happened: boolean = false;
  isSendToUser: Boolean = false;
  isSendToSelf: Boolean = false;
  loaderMail: Boolean = false;
  loader: Boolean = false;
  currentCompany: any;
  HTMLeditor: Boolean = false;
  usersObj = [];
  formSubmitted: Boolean = false;
  isRemoveUnsubscribeEnabled: Boolean = false;
  outcomeSubOptions: any = {};
  outcomeMessageOptions: any = {};
  _saveEvent: any;
  emailMessage: any;
  storage: any;
  emailFormSelf: FormGroup;
  outcomeBasedForm: FormGroup;

  constructor(public jsonBuilderHelper: JSONBuilder,
    public formulaService: FormulaService,
    public _builderService: BuilderService,
    public fb: FormBuilder,
    public _cookieService: CookieService,
    public _featureAuthService: FeatureAuthService,
    public _subDomainService: SubDomainService,
    public _companyService: CompanyService,
    public froalaService: FroalaService
  ) {
    this.currentCompany = _subDomainService.currentCompany;
    this.storage = JSON.parse(this._cookieService.readCookie('storage'));
    this.initEmail();
    this.isRemoveUnsubscribeEnabled = this._featureAuthService.features.confirmation_emails.remove_unsubscribe && this._featureAuthService.features.confirmation_emails.active;
    this._saveEvent = {
      'froalaEditor.contentChanged': (e: any, editor: any) => {
        this.onFieldBlur(this.finishCalcEmail)
      },
      'froalaEditor.blur': (e: any, editor: any) => {
        this.onFieldBlur(this.finishCalcEmail)
      }
    }
  }

  initEmail() {
    this.jsonBuilderHelper.getJSONBuilt().users = this.jsonBuilderHelper.getJSONBuilt().users.filter((ele) => ele);
    /* email default Text*/
    this.emailtext();

    this.finishCalcEmail = new CalcEmail({
      app: this.jsonBuilderHelper.getJSONBuilt()._id, type: 'Finish', email: this.storage && this.storage.user.emails[0].email, subject: this.jsonBuilderHelper.getJSONBuilt().name, message: this.emailMessage, sendFromName: 'John Doe',
      notifyTeam: {
        sendFrom: 'hey',
        subject: '',
        message: '',
        sendFromName: ''
      }
    });
    this.validateEmail();
  }

  validateEmail() {
    let validators: any[] = [];
    validators.push(Validators.required);
    validators.push(CustomValidator.emailFormat);
    this.emailForm = this.fb.group({
      email: [this.finishCalcEmail.email, Validators.compose(validators)],
    });

    this.emailFormSelf = this.fb.group({
      emailSelf: [this.finishCalcEmail.notifyTeam.sendFrom, Validators.compose(validators)]
    });

    this.AddUserForm = this.fb.group({
      email: [null, Validators.compose(validators)],
      name: [null, Validators.required]
    });
  }

  ngDoCheck() {
    let self = this;
    let froalaOptions = { includeScores: true, showNoTags: true, isResultHeadings: true, includeOutcomeDesc: true };
    if (this.currentCount === 0 || this.currentCount != this.froalaService.allValidVariables(froalaOptions).length) {
      if (jQuery('textarea#froala-editorFinish, textarea#froala-editorNotifyMe, textarea#froala-editorSubject, textarea#froala-editorNotifyMeSubject').data('froala.editor'))
        jQuery('textarea#froala-editorFinish, textarea#froala-editorNotifyMe, textarea#froala-editorSubject, textarea#froala-editorNotifyMeSubject').froalaEditor('destroy');

      this.currentCount = this.froalaService.allValidVariables(froalaOptions).length;
      this.updateOptions();
      jQuery('textarea#froala-editorFinish, textarea#froala-editorNotifyMe, textarea#froala-editorSubject, textarea#froala-editorNotifyMeSubject').on('froalaEditor.buttons.refresh', function (e: any, editor: any) {
        self.updateOptions();
      });

      jQuery.FroalaEditor.DefineIcon('questions', { NAME: 'input' });
      jQuery.FroalaEditor.RegisterCommand('questions', {
        title: 'Add Variable',
        type: 'dropdown',
        focus: true,
        undo: true,
        icon: 'questions',
        refreshAfterCallback: true,
        options: this.options,
        callback: function (cmd: any, val: any) {
          this.html.insert(val);
        },
        refresh: function ($btn: any) { },
        refreshOnShow: function ($btn: any, $dropdown: any) { }
      });

      let options = ['bold', '|', 'italic', '|', 'underline', '|', 'color', '|', 'fontSize', '|', 'insertLink'];
      this.HTMLeditor && options.push('|', 'html');
      if (this.jsonBuilderHelper.getJSONBuilt().template.split('-', 2).join('-') != 'sound-cloud') {
        options.push('|', 'questions');
        jQuery('textarea#froala-editorFinish, textarea#froala-editorNotifyMe').froalaEditor({
          toolbarButtons: options,
          shortcutsEnabled: ['bold', 'italic', 'underline'],
          pastePlain: true,
        });
      } else {
        jQuery('textarea#froala-editorFinish, textarea#froala-editorNotifyMe').froalaEditor({
          toolbarButtons: options,
          shortcutsEnabled: ['bold', 'italic', 'underline'],
          pastePlain: true,
        });
      }

      jQuery('textarea#froala-editorSubject, textarea#froala-editorNotifyMeSubject').froalaEditor({
        toolbarButtons: ['questions'],
        pastePlain: true,
      });

      if (!this._featureAuthService.features.confirmation_emails.active) {
        jQuery('textarea#froala-editorFinish, textarea#froala-editorNotifyMe').on('froalaEditor.mouseup', function (e: any, editor: any, mouseupEvent: any) {
          this.onClick();
        });
        jQuery('textarea#froala-editorFinish, textarea#froala-editorNotifyMe').froalaEditor('edit.off');
      }

      jQuery('textarea#froala-editorFinish').on('froalaEditor.contentChanged', function (e: any, editor: any) {
        self.finishCalcEmail.message = e.currentTarget.value;
        if (!self.happened) {
          self.happened = true;
          self.onFieldBlur(self.finishCalcEmail);
        }
      });

      jQuery('textarea#froala-editorSubject').on('froalaEditor.contentChanged', function (e: any, editor: any) {
        self.finishCalcEmail.subject = e.currentTarget.value;
        if (!self.happened) {
          self.happened = true;
          self.onFieldBlur(self.finishCalcEmail);
        }
      });

      jQuery('textarea#froala-editorNotifyMeSubject').on('froalaEditor.contentChanged', function (e: any, editor: any) {
        self.finishCalcEmail.notifyTeam.subject = e.currentTarget.value;
        if (!self.happened) {
          self.happened = true;
          self.onFieldBlur(self.finishCalcEmail);
        }
      });

      jQuery('textarea#froala-editorNotifyMe').on('froalaEditor.contentChanged', function (e: any, editor: any) {
        self.finishCalcEmail.notifyTeam.message = e.currentTarget.value;
        if (!self.happened) {
          self.happened = true;
          self.onFieldBlur(self.finishCalcEmail);
        }
      });
    }
  }

  ngOnInit() {
    let self = this;
    !this._builderService.isDemo && this.getCompanyUsers();
    this.updateOptions();
    this.jsonBuilderHelper.updateTemplateQuestionare();
    this.isSendToUser = this._featureAuthService.features.confirmation_emails.to_user;
    this.isSendToSelf = this._featureAuthService.features.confirmation_emails.to_self;

    this._builderService.calcEmail({ app: this.jsonBuilderHelper.getJSONBuilt()._id })
      .subscribe((response: any[]) => {
        if (response.length) {
          response.forEach((res) => {
            setTimeout(function () {
              self.finishCalcEmail = new CalcEmail(res);

              if (!self.finishCalcEmail.notifyTeam.sendFrom) {
                self.finishCalcEmail.notifyTeam.sendFrom = (self.storage && self.storage.user.emails[0].email);
              }
              if (!self.finishCalcEmail.customNotifyMail && !self.finishCalcEmail.notifyTeam.message)
                self.finishCalcEmail.notifyTeam.message = `<p>Hey Admin,</p><p><br></p><p>You got a new lead on calculator  ${self.jsonBuilderHelper.getJSONBuilt().name}.</p><p><br></p><p>Some of the details are:</p><p><br></p><p>Name: {fullname}</p><p>Email: {email}</p><p><br></p><p>Thanks,</p><p><br></p><p>Outgrow Team</p>`;

              jQuery('textarea#froala-editorFinish').froalaEditor('html.set', (self.finishCalcEmail.message));
              jQuery('textarea#froala-editorNotifyMe').froalaEditor('html.set', (self.finishCalcEmail.notifyTeam.message));
              jQuery('textarea#froala-editorSubject').froalaEditor('html.set', (self.finishCalcEmail.subject));
              jQuery('textarea#froala-editorNotifyMeSubject').froalaEditor('html.set', (self.finishCalcEmail.notifyTeam.subject));
              self.loader = true;

              /** Outcome Based Email Processing */
              if (self.jsonBuilderHelper.isTempType(['Recommendation']))
                self.outcomeBasedEmails();
            });
            return;
          });
        }
        else {
          this.loader = true;
        }
      },
        (error: any) => { console.log(error); }
      );
    this.HTMLeditor = this._featureAuthService.features.custom_styling.html_editor;
  }

  outcomeBasedEmails() {
    let outcomeEmails: any[] = []; let self: any = this, validationsObj: any = {};
    for (let outcomeIndex in this.jsonBuilderHelper.getJSONBuilt().formula) {
      let emailObj = this.finishCalcEmail.resultEmails.find((email) => email.resultValue == this.jsonBuilderHelper.getJSONBuilt().formula[outcomeIndex].value);

      if (!emailObj) {
        /** make new email object for outcome */
        emailObj = {
          resultName: this.jsonBuilderHelper.getJSONBuilt().formula[outcomeIndex].name.replace(/(<([^>]+)>)/ig, ''),
          resultValue: this.jsonBuilderHelper.getJSONBuilt().formula[outcomeIndex].value,
          sendFrom: this.storage && this.storage.user.emails[0].email,
          subject: this.jsonBuilderHelper.getJSONBuilt().name,
          message: this.emailMessage,
          sendFromName: 'John Doe'
        };
      } else {
        emailObj.resultName = this.jsonBuilderHelper.getJSONBuilt().formula[outcomeIndex].name.replace(/(<([^>]+)>)/ig, '');
      }

      validationsObj[`email_${outcomeIndex}`] = [null, Validators.compose([Validators.required, CustomValidator.emailFormat])];

      outcomeEmails.push(emailObj);
    }

    this.outcomeBasedForm = this.fb.group(validationsObj);

    /** Assign this array to result emails for remaing deleted outcome entry updation */
    this.finishCalcEmail.resultEmails = outcomeEmails;

    this.outcomeSubOptions.options = this.outcomeMessageOptions.options = false;
    this.outcomeSubOptions.options = this.froalaService.getEmailOptions({ handler: this.outcomeSubOptions, isOnlyAddVariable: true, event: this._saveEvent });
    this.outcomeMessageOptions.options = this.froalaService.getEmailOptions({ handler: this.outcomeMessageOptions, isAddVariable: true, event: this._saveEvent });
  }

  getCompanyUsers() {
    this._companyService.getCompanyUsersForEmail(this.currentCompany.id).subscribe(
      (response) => {
        response.forEach((user) => {
          let userOb = {};
          userOb['name'] = user.name;
          userOb['email'] = user.emails.find(email => email.is_primary).email;
          userOb['role'] = user.user_company.role;
          this.usersObj.push(userOb);
        });
        this.usersObj = this._unionBy(this.usersObj, this.jsonBuilderHelper.getJSONBuilt().users, 'email');
        this.defaultAdmin(this.finishCalcEmail.notifyMe);
      },
      (error) => {
        console.log('error', error);
      });
  }

  addUserToMail(event: any, user: any) {
    if (event.target.checked) {
      this.jsonBuilderHelper.getJSONBuilt().users.push(user);
    } else {
      this.jsonBuilderHelper.getJSONBuilt().users = this.jsonBuilderHelper.getJSONBuilt().users.filter(usr => usr.email != user.email);
    }
    if (!this.jsonBuilderHelper.getJSONBuilt().users.length)
      this.finishCalcEmail.notifyMe = false;
    this.saveData();
  }

  getSelection(u: any) {
    return (this.jsonBuilderHelper.getJSONBuilt().users.find(o => o.email === u.email) != undefined) ? true : false;
  }

  updateSendMailUser(notify: boolean) {
    if (!notify) {
      this.jsonBuilderHelper.getJSONBuilt().users = [];
      this.saveData();
    } else {
      this.defaultAdmin(notify);
    }
  }

  defaultAdmin(notify) {
    if (notify && !this.jsonBuilderHelper.getJSONBuilt().users.length)
      this.jsonBuilderHelper.getJSONBuilt().users.push(this.usersObj.find(u => u.role === 'ADMIN'));
    this.saveData();
  }

  saveData() {
    let obj = { app: this.jsonBuilderHelper.getJSONBuilt(), page: '', sections: [], items: [] };
    this._builderService.updateChanges(obj, this.jsonBuilderHelper.getJSONBuilt().socket_id || 'blank', this.jsonBuilderHelper.getJSONBuilt()._id).subscribe(
      (response: any) => {
        // console.log('--->>');
      },
      (error: any) => {
        console.log(error);
      }
    );
  }

  activateToggled(ev: any) {
    this.isSendToUser = this._featureAuthService.features.confirmation_emails.to_user && this._featureAuthService.features.confirmation_emails.active;
    if (this.isSendToUser) {
      this.finishCalcEmail.sendEmail = !this.finishCalcEmail.sendEmail;
      this.onFieldBlur(this.finishCalcEmail);
    }
    else {
      ev.target.checked = false;
      if (this.finishCalcEmail.sendEmail) {
        this.finishCalcEmail.sendEmail = false;
        this.onFieldBlur(this.finishCalcEmail);
      }
      this._featureAuthService.setSelectedFeature('confirmation_emails', 'to_user');
      jQuery('.confirmation_emails').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }

  notifyMeToggled(ev: any) {
    this.isSendToSelf = this._featureAuthService.features.confirmation_emails.to_self && this._featureAuthService.features.confirmation_emails.active;
    if (this.isSendToSelf) {
      this.finishCalcEmail.notifyMe = !this.finishCalcEmail.notifyMe;
      this.finishCalcEmail.customNotifyMail = true;
      this.onFieldBlur(this.finishCalcEmail);
      this.updateSendMailUser(this.finishCalcEmail.notifyMe);
    }
    else {
      ev.target.checked = false;
      if (this.finishCalcEmail.notifyMe) {
        this.finishCalcEmail.notifyMe = false;
        this.onFieldBlur(this.finishCalcEmail);
      }
      this._featureAuthService.setSelectedFeature('confirmation_emails', 'to_self');
      jQuery('.confirmation_emails').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }

  sendTestMessage() {
    this.loaderMail = true;
    let email = this.storage && this.storage.user.emails[0].email;
    this._builderService.sendTestMail({ calcId: this.jsonBuilderHelper.getJSONBuilt()._id, email: email }).subscribe((res) => {
      this.jsonBuilderHelper.getJSONBuilt().emailCount = this.jsonBuilderHelper.getJSONBuilt().emailCount + 1;
      this.saveData();
      this.loaderMail = false;
      this.poppUp(email);
    }, (err) => {
      console.log('error', err);
    });
    // bhaiyya email bhejna hai
  }

  poppUp(email: string) {
    bootbox.dialog({
      closeButton: false,
      message: `<button type="button" class="bootbox-close-button close" data-dismiss="modal" aria-hidden="true"><i class='material-icons'>close</i></button>
                  <div class="bootbox-body-left">
                      <div class="mat-icon">
                        <i class="material-icons">error</i>
                      </div>
                  </div>
                  <div class="bootbox-body-right sent-email">
                    A test email has been sent to ${email}.
                  </div>`,
      buttons: {
        success: {
          label: "OK",
          className: "btn btn-ok btn-hover",
          callback: function () {
            // jQuery('#myonoffswitch').attr('checked', false);
          }
        }
      }
    });
  }

  ngAfterViewInit() {
    jQuery('textarea#froala-editorFinish').froalaEditor('html.set', (this.finishCalcEmail.message));
    jQuery('textarea#froala-editorNotifyMe').froalaEditor('html.set', (this.finishCalcEmail.notifyTeam.message));
    /* selectize js */
    let self = this;
    jQuery('.email-selectize').selectize();
    jQuery('.email-replyto-selectize').selectize({
      plugins: ['remove_button'],
      delimiter: ',',
      persist: false,
      create: function (input: any) {
        return {
          value: input,
          text: input
        };
      }
    });
    this.currentCount = 0;
    if (this.isRemoveUnsubscribeEnabled) {
      jQuery('#remove_unsubscribe').addClass('onoffText');
    } else {
      jQuery('#remove_unsubscribe').removeClass('onoffText');
    }
  }

  onFieldBlur(value: CalcEmail, type?: string) {
    if (type)
      this.checkSaveRequest(type);
    let self = this;

    this._builderService.saveCalcEmail(value)
      .subscribe(
        (response: any) => {
          self.happened = false;
          self.jsonBuilderHelper.getJSONBuilt().changed = true;
          value._id = response._id;
          self.jsonBuilderHelper.debounce(self.jsonBuilderHelper.animLoad(), 1800);
        },
        (error: any) => { console.log(error); }
      );
  }

  checkSaveRequest(type: string) {
    if (type == 'emailForm' && !this.emailForm.valid)
      this.finishCalcEmail.sendEmail = false;
    else if (type == 'emailFormSelf' && !this.emailFormSelf.valid)
      this.finishCalcEmail.notifyMe = false;
  }

  /* arguments
     includeScores,
     showNoTags,
     isResultHeadings
  */

  updateOptions() {
    var options: any = {};
    let froalaOptions = { includeScores: true, showNoTags: true, isResultHeadings: true, includeOutcomeDesc: true };
    for (var variable in this.froalaService.allValidVariables(froalaOptions))
      options[this.froalaService.allValidVariables(froalaOptions)[variable]] = this.froalaService.allValidVariablesWysiywigList(froalaOptions)[variable];
    this.options = options;
  }

  onClick() {
    if (!this._featureAuthService.features.confirmation_emails.active) {
      this._featureAuthService.setSelectedFeature('confirmation_emails');
      jQuery('.confirmation_emails').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }

  _unionBy(arr1, arr2, attrName) {
    let arr_Elems = arr1.concat(arr2);
    let array_Result = [];
    let array_Uniq = [];
    arr_Elems.map((arr_Elem) => {
      if (array_Uniq.indexOf(arr_Elem[attrName]) == -1) {
        array_Uniq.push(arr_Elem[attrName])
        array_Result.push(arr_Elem);
      }
    });
    return array_Result;
  }

  openAddUserPopup() {
    if (this._featureAuthService.features.confirmation_emails.add_users_to_self)
      jQuery('#add-userEmail').modal('toggle');
    else {
      this._featureAuthService.setSelectedFeature('confirmation_emails', 'add_users_to_self');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
      jQuery('.modal-backdrop').addClass('added');
    }
  }

  addUserEmail() {
    this.jsonBuilderHelper.getJSONBuilt().users.push(this.AddUserForm.value);
    this.usersObj.push(this.AddUserForm.value);
    this.AddUserForm.reset();
    this.formSubmitted = false;
    jQuery('#add-userEmail').modal('toggle');
  }

  /*=======Removed Unsubscibe link (Added by Muzaffar Kamal)=======*/
  /*=======This method will gives the option to add or remove the Unsubscribe link in email */
  removeUnsubscribeLink(ev: any) {
    if (this.isRemoveUnsubscribeEnabled) {
      this.finishCalcEmail.is_unsubsribed_removed = !this.finishCalcEmail.is_unsubsribed_removed;
      this.onFieldBlur(this.finishCalcEmail);
    }
    else {
      ev.target.checked = false;
      this._featureAuthService.setSelectedFeature('confirmation_emails', 'remove_unsubscribe');
      jQuery('.confirmation_emails').addClass('activegreen limited-label');
      jQuery('#premiumModal').modal('show');
      jQuery('.modal-backdrop').insertAfter('#premiumModal');
    }
  }
  /*====End of the method===*/
  ngOnDestroy() {
    jQuery('div.wysiwyg').froalaEditor('destroy');
  }

  outcomeBasedEmailsToggle() {
    let self: any = this;
    this.finishCalcEmail.resultBasedEmail = !this.finishCalcEmail.resultBasedEmail;
    this.onFieldBlur(this.finishCalcEmail);
    setTimeout(() => {
      self.currentCount = 0;
    }, 10);
  }

  emailtext() {
    if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Numerical') {
      this.emailMessage = `<p>Hi {fullname},
                    Thank you for completing our ${this.jsonBuilderHelper.getJSONBuilt().name} calculator. 
                    We wanted to send you a summary of your results.
                     Your result was {R1} and you can find more information below.</p>
                     <p>Feel free to reply to this email directly with any questions.</p>
                     <p>All the best!</p>
                     <p> ${this._builderService.isDemo ? `builder-demo` : this.currentCompany.name} Team</p><p>Summary:</p><p>R1 title: {R1}</p>
                     <p>R2 title: {R2}</p><p>.</p><p>Q1 title: {Q1}</p><p>Q2 title: {Q2}</p>`;
    } else if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Recommendation') {
      this.emailMessage = `<p>Hi {fullname},
                          </p><p>Thank you for completing our ${this.jsonBuilderHelper.getJSONBuilt().name} quiz. 
                          We wanted to send you a summary of your quiz. 
                          Your outcome was {Outcome}</p><p>and you can find more information below.</p>
                          <p>Feel free to reply to this email directly with any questions.</p>
                          <p>All the best!</p><p> ${this._builderService.isDemo ? `builder-demo` : this.currentCompany.name}</p><p>Team</p>
                          <p>Summary:<br>Outcome: {Outcome}<br><br><br>Q1 title: {Q1}<br>Q2 title: {Q2}</p>`;
    } else if (this.jsonBuilderHelper.getJSONBuilt().templateType == 'Poll') {
      this.emailMessage = `<p>Hi {fullname},
                          </p><p>Thank you for completing our ${this.jsonBuilderHelper.getJSONBuilt().name} poll. 
                          We wanted to send you a summary of your poll. 
                          Your Poll Score was {Average_Poll_Result}</p><p>and you can find more information below.</p>
                          <p>Feel free to reply to this email directly with any questions.</p>
                          <p>All the best!</p><p> ${ this._builderService.isDemo ? `builder-demo` : this.currentCompany.name} </p><p>Team</p>
                          <p>Summary:<br>Poll Score: {Average_Poll_Result}<br><br><br>Q1 title: {Q1}<br>Q2 title: {Q2}</p>`;
    } else {
      this.emailMessage = `<p>Hi {fullname},
                          </p><p>Thank you for completing our ${this.jsonBuilderHelper.getJSONBuilt().name} quiz. 
                          We wanted to send you a summary of your quiz. 
                          Your score was {Score_absolute}</p><p>and you can find more information below.</p>
                          <p>Feel free to reply to this email directly with any questions.</p>
                          <p>All the best!</p><p>${ this._builderService.isDemo ? `builder-demo` : this.currentCompany.name}</p><p>Team</p>
                          <p>Summary:<br>Score: {Score}<br><br><br>Q1 title: {Q1}<br>Q2 title: {Q2}</p>`;
    }
  }

  emailIndexing(index: Number) {
    return `email_${index}`;
  }
}
