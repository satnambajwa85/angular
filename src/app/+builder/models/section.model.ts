import { Serializable } from './serializeable.interface';
import { Item } from './item.model';


export class Section implements Serializable<Section> {
	_id: string = '';
	title: string = 'Title';
	condition: string = '';
	description: string = '';
	showDesc: boolean = true;
	buttonTitle: string = 'Next';
	previousIcons: string[] = [];
	icon: string = '';
	showIcon: boolean = true;
	defaultClass: string = '';
	fullWidth: boolean = false;
	order: string = '';
	visible: boolean = true;
	type: string = '';
	items: Item[] = [];


	constructor(title?: string, defaultClass?: string, description?: string, showDesc?: boolean) {
		//generate unique id on creation
		this._id = 's_' + Math.floor(Math.random() * (100000 - 2 + 1)) + 2;
		//do rest of the stuff
		this.type = title;
		if (title === 'LeadForm' || title === 'LeadFormQ') {
			this.title = 'How can we get in touch?';
		} else {
			this.title = title;
		}

		this.defaultClass = defaultClass;
		this.description = description;
		// this.showDesc = showDesc;
	}
	//add items to page
	public addItems(...items: any[]) {
		for (let item in items) {
			items[item].order = this.items.length + 1;
			this.items.push(items[item]);
		}
	}
	public setVisibility(visible: boolean) {
		this.visible = visible;
	}
	public setVisibilityOfShowDesc(showDesc: boolean) {
		this.showDesc = showDesc;
	}
	deserialize(input: any): Section {
		let self: any = this;
		for (let prop in input) {
			if (typeof input[prop] === 'object') {
				for (let item in input[prop]) {
					self.items.push(new Item().deserialize(input[prop][item]));
				}
			} else {
				self[prop] = input[prop];
			}
		}
		return self;
	}

}
