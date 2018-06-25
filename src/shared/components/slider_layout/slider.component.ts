import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectionStrategy } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SimpleChanges } from '@angular/core/src/metadata/lifecycle_hooks';
declare var jQuery: any;

@Component({
    selector: 'slider-pane',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.css'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    // animations: [
    //     trigger('slide', [
    //         state('active', style({ transform: 'translateX(33.3%)' })),
    //         //state('inactive', style({ transform: 'translateX(-50%)' })),
    //         transition('* => *', animate(300))
    //     ])]
})
export class SliderComponent implements OnInit {
    @Input() activeItem = 'first';
    constructor() {
    }
    ngOnChanges(changes:SimpleChanges){
        console.log(">>>>>>>>>>",changes,">>>>>",jQuery('#'+this.activeItem));
    }
    ngOnInit() {
    }



}
