import { EcomService } from './../../../../../../templates/services/ecom.service';
import { JSONItemTracker } from './../../../../../services/JSONUpdateItemTracker.service';
import { EcomProductFetchCondition } from './../../../../../models/ecomProductFetchCondition.model';
import { Item } from './../../../../../models/item.model';
import { JSONBuilder } from './../../../../../services/JSONBuilder.service';
import { Component, ViewEncapsulation, Input, OnInit, AfterViewInit } from '@angular/core';

declare var jQuery: any;
@Component({
    selector: 'editor-product-mapping',
    templateUrl: './assets/html/editor_productMapping.component.html',
    encapsulation: ViewEncapsulation.None
})

export class EditorProductMapping implements OnInit, AfterViewInit {
    ecomPopup: Boolean = false;
    @Input() control: any;
    questions: Item[] = [];
    selectObj: any = {
        control: {}, option: {}, conditions: [], limit: 10, fetchData: false
    }
    math: any = Math;
    mappedProducts: any[] = [];
    constructor(
        public jsonBuilderHandler: JSONBuilder,
        public _ItemTrackService: JSONItemTracker,
        public _ecomService: EcomService
    ) {
    }

    ngOnInit() {
        this.getQuestionsList();
    }
    ngAfterViewInit() {
        jQuery('#productEcomMapping').on('hidden.bs.modal', function () {
            jQuery('.navbar-default').removeClass('navbar-zindex');
        });
    }

    getQuestionsList() {
        this.jsonBuilderHandler.getJSONBuilt().pages[1].sections.map((section) => {
            for (let itemIndex in section.items) {
                if (['selectbox', 'radio_button', 'checkbox'].indexOf(section.items[itemIndex].type) !== -1) {
                    this.questions.push(section.items[itemIndex]);
                    if (!Object.keys(this.selectObj.control).length) {
                        this.selectObj.control = section.items[itemIndex];
                        this.selectObj.option = section.items[itemIndex].options[0];
                        this.selectObj.conditions = this.getOptionCondition(this.selectObj.option);
                        this._ItemTrackService.setUnSavedItems(this.selectObj.control);
                    }
                }
            }
        });
    }

    getOptionCondition(option: any) {
        if (this.selectObj.option.productFetchConditions && this.selectObj.option.productFetchConditions.length)
            return option.productFetchConditions;
        else {
            let condition = new EcomProductFetchCondition('title', '');
            this.selectObj.option.productFetchConditions.push(condition);
            return [condition];
        }
    }

    addOrDeleteCondition(type: string, index: number) {
        if (type == 'add')
            this.selectObj.option.productFetchConditions.push(new EcomProductFetchCondition('title', '$and'));
        else
            this.selectObj.option.productFetchConditions.splice(index, 1);
        this.selectObj.conditions = this.selectObj.option.productFetchConditions;
    }

    findProducts() {
        this._ecomService.FetchAllProductsFromProductList(
            this.jsonBuilderHandler.getJSONBuilt()._id,
            '_p',
            this.selectObj.option.productFetchConditions,
            { _type: '_f_map_pds' }
        ).subscribe(
            (response: any) => {
                this.mappedProducts = response._pds;
                this.selectObj.option.value = this.mappedProducts.length;
                this.selectObj.fetchData = false;
            },
            (error: any) => {
                console.log('error  ', error)
            }
        )
    }

    _math(value: any) {
        return Math.ceil((value / 10));
    }

    openEcomMapPopupClose() {
        this.ecomPopup = true;
        this._ItemTrackService.resetUnsavedData();
        this._ItemTrackService.setUnSavedPage(this.jsonBuilderHandler.getSelectedPage());
    }

    optionLabel(option) {
        return (option.label) ? option.label : (this.selectObj.control.optionImageVisible ? `<img src='${option.imageURL}' alt='${option.imageName}' width='20' height='20'>` : `<i class='material-icons'>${option.icon}</i>`);
    }
}
