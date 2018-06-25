import { EditorEcom } from './page/component/subComponents/editor_ecom.component';
import { EditorPollResult } from './page/component/subComponents/editor_poll_result.component';
import { directiveModule } from './../../../templates/components/directive.module';
import { FroalaService } from './../../services/froala.service';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import { NgModule } from '@angular/core';
import { EDITORS } from './editor';
import { Switch } from '../switch.component';
import { Editor } from './editor.component';
import { UrlShortner } from '../../services/UrlShortner.service';
import { JSONElement } from '../../services/JSONElement.service';
import { FormulaService } from '../../services/formula.service';
import { AddSection } from './page/component/addsection.component';
import { EditorLeadForm } from './leadform/editor_leadform.component';
import { CommonEditor } from './common/common_properties.component';
import { EditorWysiwyg } from './wysiwyg/editor_wysiwyg.component';
import { Selectize } from './section_leadform/component/selectize.component';
import { SharedModule } from '../../../../shared/modules/shared.module';
import { PipesModule } from '../../../templates/pipes/pipes.module';
import { RouterModule } from '@angular/router';
import { ConditionalResultComponent } from './page/component/conditional_result_editor.component';
import { VisualsEditorComponent } from './page/component/visuals_editor.component';
import { EditorOutcome } from './page/component/subComponents/editor_outcome.component';
import { EditorService } from './../../services/editor.service';
import { EditorNumerical } from './page/component/subComponents/editor_numerical.component';
import { EditorGraded } from './page/component/subComponents/editor_graded.component';
import { JSONItemTracker } from './../../services/JSONUpdateItemTracker.service';
import { QuestionRedirectUrlComponent } from './question-redirect-url/question-redirect-url.component';

@NgModule({
  imports: [FroalaEditorModule.forRoot(), FroalaViewModule.forRoot(), RouterModule,
    SharedModule, PipesModule, directiveModule],
  exports: [Editor],
  declarations: [Editor, EDITORS, CommonEditor, EditorLeadForm, EditorOutcome, EditorGraded, EditorEcom, AddSection, EditorWysiwyg, Selectize, Switch, ConditionalResultComponent, VisualsEditorComponent, EditorNumerical, EditorPollResult, QuestionRedirectUrlComponent],
  providers: [UrlShortner, JSONElement, FormulaService, EditorService, JSONItemTracker]

})

export class EditorModule {
  //code
}
