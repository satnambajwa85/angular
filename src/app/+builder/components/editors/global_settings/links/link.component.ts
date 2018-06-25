import { Item } from './../../../../models/item.model';
import { Component, ViewEncapsulation, Input, OnInit, OnChanges } from '@angular/core';
import { JSONItemTracker } from '../../../../services/JSONUpdateItemTracker.service';

@Component({
    selector: 'links',
    templateUrl: './link.template.html',
    encapsulation: ViewEncapsulation.None
})

export class Link implements OnInit, OnChanges {
    @Input('control') control;
    @Input('type') type;
    @Input('coltype') coltype;
    links: any[] = [];
    cols: any = [];
    constructor(private _itemTrackService: JSONItemTracker) { }
    ngOnInit() {
        this.links = this.control.options;
    }
    ngOnChanges() {
        if (this.type == "Footer") {
            this.cols = [];
            switch (this.coltype) {
                case '1': {
                    this.cols = ['1'];
                    this.prepareFunction(this.coltype);
                    break;
                }
                case '2': {
                    this.cols = ['1', '2'];
                    for (let item of this.cols) {
                        this.prepareFunction(item);
                    }
                    break;
                }
                case '3': {
                    this.cols = ['1', '2', '3'];
                    for (let item of this.cols) {
                        this.prepareFunction(item);
                    }
                    break;
                }
                case '4': {
                    this.cols = ['1', '2', '3', '4'];
                    for (let item of this.cols) {
                        this.prepareFunction(item);
                    }
                    break;
                }
            }
        }
        this._itemTrackService.setUnSavedItems(this.control);
    }
    prepareFunction(col) {
        if (this.links && this.links.length) {
            const items = this.links.filter(d => d.title == col);
            if (items.length <= 0) {
                this.addLink(col);
            }
        } else {
            this.addLink(col);
        }

    }
    addLink(val) {
        let option = new Item().getOption();
        option.value = "https://outgrow.co";
        option.label = `${this.type} Link`;
        if (val != '0') {
            option.title = val;
        }
        this.links.push(option);
    }

    getLinks(col: any) {
        let list = [];
        let i = 0;
        for (let item of this.links) {
            if (item.title == col) {
                list.push(i);
            }
            i++;
        }
        return list;
    }
    upHeaderFun(index: any) {
        const pi = this.links[index - 1];
        this.links[index - 1] = this.links[index];
        this.links[index] = pi;
    }
    downHeaderFun(index: any) {
        const ni = this.links[index + 1];
        this.links[index + 1] = this.links[index];
        this.links[index] = ni;
    }
    checkIndex(col, i) {
        const itemList = this.getLinks(col);
        if (itemList[0] == i) {
            return 'f';
        } else if (itemList[itemList.length - 1] == i) {
            return 'l';
        } else {
            return 'm';
        }

    }
    checkItem(col) {
        const itemList = this.getLinks(col);
        if (itemList.length == 1) {
            return 'o';
        } else {
            return 'm';
        }
    }
    deleteLink(index: any) {
        this.links.splice(index, 1);
    }

    upFun(col, k) {
        if (k != 0) {
            let pi = -1;
            let i = 0;
            while (i < k) {
                if (this.links[i].title == col) {
                    pi = i;
                }
                i++;
            }
            if (pi != -1) {
                const pitem = this.links[pi];
                this.links[pi] = this.links[k];
                this.links[k] = pitem;
            }
        }

    }
    downFun(col, k) {
        if (k < this.links.length - 1) {
            let ni = -1;
            let i = this.links.length - 1;
            while (i > k) {
                if (this.links[i].title == col) {
                    ni = i;
                }
                i--;
            }
            if (ni != -1) {
                const downLink = this.links[ni];
                this.links[ni] = this.links[k];
                this.links[k] = downLink;
            }
        }
    }

    textAlign(val, i) {
        this.links[i].type = val;
    }

    changeAlign(align: string) {
        this.control.postfix = align;
    }

    checkUrlFormat(index: any) {
        if (/^(tel:)/i.test(this.links[index].value)) {
            this.links[index].value = this.links[index].value;
            return;
        }
        if (/^(mailto:)/i.test(this.links[index].value)) {
            this.links[index].value = this.links[index].value;
            return;
        }
        if (!/^(f|ht)tps?:\/\//i.test(this.links[index].value)) {
            this.links[index].value = 'http://' + this.links[index].value;
        } else {
            this.links[index].value = this.links[index].value;
        }
    }
}
