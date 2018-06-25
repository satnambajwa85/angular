import { Serializable } from './serializeable.interface';


export class EcomProductFetchCondition implements Serializable<EcomProductFetchCondition> {
	fieldName: string = '';
	operator: string = '';
	operation: string = '';
	value: string = '';
	constructor(fieldName?: string, operation?: string, operator?: string, value?: string) {
		this.fieldName = fieldName || 'title';
		this.operator = operator || '$eq';
		this.operation = operation || '$and';
		this.value = value || '';
	}
	//add items to page

	deserialize(input: any): EcomProductFetchCondition {
		let self: any = this;
		for (let prop in input) {
			self[prop] = input[prop];
		}
		return self;
	}
}
