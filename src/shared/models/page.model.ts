
import { Serializable } from './serializeable.interface';
import { Section } from './section.model';

export class Page implements Serializable<Page> {
	_id: string = '';
	description: string = '';
	defaultClass: string = '';
	bgImage: string = '';
	bgName: string = '';
	bgImageVisible: boolean = true;
	bgColor: string = '';
	type: string = '';
	align: string = '';
	visible: boolean = true;
	analytics_segmentation: any = {
		enabled: false,
		fb_event: 'ViewContent',
		fb_tag: 'Tag',
		fb_value: '55',
		ga_eventCategory: 'Category',
		ga_eventAction: 'Action',
		ga_eventLabel: 'Label',
		ga_eventValue: '55',
	};
	sections: Section[] = [];

	constructor(type?: string, bgImage?: string, bgColor?: string, defaultClass?: string) {
		this.type = type;
		this.bgImage = bgImage;
		this.bgColor = bgColor;
		this.defaultClass = defaultClass;
	}

	//add sections to page
	public addSections(...sections: any[]) {
		for (let section in sections) {
			sections[section].order = Number(section) + 1;
			if (this.sections.length != 0 && this.sections[this.sections.length - 1].type === 'LeadFormQ') {
				this.sections.splice(this.sections.length - 1, 0, sections[section]);
			} else {
				this.sections.push(sections[section]);
			}
		}
	}

	deserialize(input: any): Page {
		let self: any = this;
		for (let prop in input) {
			if (prop === 'sections') {
				for (let section in input[prop]) {
					self.sections.push(new Section().deserialize(input[prop][section]));
				}
			} else
				self[prop] = input[prop];
		}
		return self;
	}

}
