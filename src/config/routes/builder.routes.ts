import {Routes} from '@angular/router';
import {BuilderParentComponent} from '../../site/+builder/builderParent.component';
import {BuilderComponent} from '../../site/+builder/builder.component';
import {PreviewComponent} from '../../site/templates/templateAll/preview.component';
import {Template} from '../../site/templates/templateAll/template.component';
import {SampleCodeComponent} from '../../site/templates/templateAll/sampleCode.component';

export const BUILDER_ROUTES: Routes = [
  {
    path: '',
    component: BuilderParentComponent,
    children: [
      {
        path: '',
        component: BuilderComponent
      },
      {
        path: ':name',
        component: BuilderComponent
      }
    ]
  }
];

export const PREVIEW_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: PreviewComponent
      },
      {
        path: 'previewFrame',
        component: Template
      }
    ]
  }
];

export const SAMPLE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: ':type',
        component: SampleCodeComponent,
      }
    ]
  }
];
