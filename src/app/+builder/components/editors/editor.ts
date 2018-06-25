import { EditorProductMapping } from './page/component/subComponents/editor_productMapping.component';
import { Link } from './global_settings/links/link.component';
import { EditorPoll } from './poll/editor_poll.component';
import { EditorRating } from './rating/editor_rating.component';
import { EditorSelectBox } from './selectbox/editor_selectbox.component';
import { EditorNumericTextField } from './numericTextfield/editor_numerictextfield.component';
import { EditorTextField } from './textfield/editor_textfield.component';
import { EditorRadioButton } from './radiobutton/editor_radiobutton.component';
import { EditorTextArea } from './textarea/editor_textarea.component';
import { EditorHeader } from './header/editor_header.component';
import { EditorButton } from './button/editor_button.component';
import { EditorLogo } from './logo/editor_logo.component';
import { EditorSlider } from './slider/editor_slider.component';
import { CommonEditor } from './common/common_properties.component';
import { EditorPage } from './page/editor_page.component';
import { EditorResultPage } from './page/editor_resultPage.component';
import { EditorRTResultPage } from './page/editor_RTresultPage.component';
import { EditorLeadForm } from './leadform/editor_leadform.component';
import { EditorCheckbox } from './checkbox/editor_checkbox.component';
import { EditorDate } from './date/editor_date.component';
import { EditorCounter } from './counter/editor_counter.component';
import { EditorWysiwyg } from './wysiwyg/editor_wysiwyg.component';
import { EditorSection } from './section/editor_section.component';
import { EditorSectionLeadform } from './section_leadform/editor_section_leadform.component';
import { EditorSectionLeadformPage } from './section_leadform/editor_section_leadform_page.component';
import { EditorOutcomeSettings } from './page/component/editor_outcome_settings.component';
import { EditorRecommended } from './recommended/editor_recommended.component';
import { GlobalSettingsComponent } from './global_settings/global_settings.component';
import { EditorCustomHtml } from './custom_html/editor_custom_html.component';
import { EditorGradedControl } from './graded/editor_graded_control.component';
import { EditorCalendar } from './calendar/editor_calendar.component';


export const EDITORS: any[] = [
  GlobalSettingsComponent,
  EditorSelectBox,
  EditorTextField,
  EditorNumericTextField,
  EditorRadioButton,
  EditorTextArea,
  EditorHeader,
  EditorButton,
  EditorLogo,
  EditorSlider,
  CommonEditor,
  EditorPage,
  EditorResultPage,
  EditorRTResultPage,
  EditorLeadForm,
  EditorCheckbox,
  EditorDate,
  EditorCounter,
  EditorWysiwyg,
  EditorSection,
  EditorSectionLeadform,
  EditorSectionLeadformPage,
  EditorRecommended,
  EditorOutcomeSettings,
  EditorCustomHtml,
  EditorGradedControl,
  EditorRating,
  EditorPoll,
  Link,
  EditorCalendar,
  EditorProductMapping];
