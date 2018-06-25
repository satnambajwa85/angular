import { BuilderService } from './../../../../services/builder.service';
import { JSONBuilder } from './../../../../services/JSONBuilder.service';
import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Script } from '../../../../../../shared/services/script.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SubDomainService } from '../../../../../../shared/services/subdomain.service';
import { PromotionChecklistService } from '../../../../../../shared/services/promotion-checklist.service'

declare var ProgressBar: any;
declare var jQuery: any;

@Component({
	selector: 'config-promotion-checklist',
	templateUrl: './assets/html/promotion-checklist.component.html',
	styleUrls: [
		'./assets/css/promotion-checklist.component.css',
		'./assets/css/circle.css'
	],
	encapsulation: ViewEncapsulation.None
})

export class PromotionChecklistComponent {

	loading = false;

	appId: String = '';
	companyId: String = '';

	goals: any = [];

	promoListItems: any = [];
	displayItems: any = [];
	calcStrategies: any = {
		company_id: '',
		strategies: [],
		score: 0
	};
	reachmeter: Number = 0;
	reachmeterClass: string = 'p0';
	reachmeterText: String = '';

	filter: any = {
		goals: []
	}

	sort: any = {
		score: 1
	};

	constructor(
		private _script: Script,
		private route: ActivatedRoute,
		private subDomainService: SubDomainService,
		private promotionChecklistService: PromotionChecklistService,
		private jsonBuilderService: JSONBuilder
	) {

	}

	ngOnInit() {
		this.getAppAndCompanyId();
		this.stickyDiv();
	}

	getAppAndCompanyId() {
		this.appId = localStorage.getItem('project') || this.jsonBuilderService.getJSONBuilt()._id;
		this.companyId = this.calcStrategies.company_id = this.subDomainService.subDomain.company_id;
		this.getPromotionGoals();
	}

	getPromotionGoals() {
		this.loading = true;
		this.promotionChecklistService.getPromotionGoals(this.appId)
			.subscribe(
				(success: any) => {
					this.goals =
					     success.promotionCheckList.goals.map(goal => new Object({ name: goal, checked: true }))
					this.loading = this.promoListItems.length ? false : true;
		            this.getPromotionListItems();
				},
				(error: any) => this.loading = false && this.getPromotionListItems()
			)
	}

	getPromotionListItems() {
		this.loading = true;
		this.promotionChecklistService.getPromotionList(this.appId)
			.subscribe(
				(success: any) => {
					this.loading = false;
					this.promoListItems = success;
					this.updateDisplayModel();
				},
				(error: any) => this.loading = false
			)
		return true;
	}

	updateDisplayModel(force = false, push = false) {
		
		if (force) this.displayItems = this.promoListItems

		if (!this.displayItems.length) this.filterBy();
		
		this.populateUpdateModel(push);
	}

	populateUpdateModel(push) {

		let totalScore = 0,
			doneScore = 0;
		this.calcStrategies.strategies = [];

		this.promoListItems.forEach(item => {
			if (item.active) {
				this.calcStrategies.strategies.push({ strategy: item.strategy._id })
				doneScore += item.strategy.score;
			}
			totalScore += item.strategy.score;
		});

		this.calcStrategies.score = doneScore;

		this.reachmeter = totalScore ? Math.floor((doneScore * 100) / totalScore) : 0;
		this.reachmeterClass = `p${this.reachmeter}`;
		this.setReachMeterText();

		if (push) this.pushChanges();
	}

	setReachMeterText () {
		switch(true) {
			case this.reachmeter > 0 && this.reachmeter <= 40:
				this.reachmeterText = 'You can do better.';
				break;
			case this.reachmeter >= 41 && this.reachmeter <= 70:
				this.reachmeterText = "You're almost there, keep going!"
				break;
			case this.reachmeter >= 71 && this.reachmeter <= 99:
				this.reachmeterText = ' Great job, keep it up!'
				break;
			case this.reachmeter == 100:
				this.reachmeterText = 'Whoa! You have nailed it.'
				break;
		}
	}

	pushChanges() {
		this.promotionChecklistService.updateCalcStrategies(this.calcStrategies, this.appId)
			.subscribe(
				(success: any) => { /*console.log('Item updated', success)*/ },
				(error: any) => console.log(error)
			)
	}

	updateCalcStrategies(id, event) {
		console.log('>>>>>>>>>>>>>>>>>>>>>', event);
		for (let index in this.promoListItems) {
			if (this.promoListItems[index].strategy._id === id) {
				this.promoListItems[index].active = event.target.checked ? true : false;
				break;
			}
		}
		this.updateDisplayModel(false, true);
	}

	filterBy() {
		this.filter.goals = this.goals.filter(goal => goal.checked).map(goal => goal.name)

		/*if (this.filter.goals.length === 0) {
			this.updateDisplayModel(true)
			return;
		}*/

        this.displayItems =
			this.promoListItems
			    .filter(item => this.filter.goals.some(goal => item.strategy.goals.indexOf(goal) !== -1))
	}

	clearFilter() {
		this.goals.forEach(goal => goal.checked = false)
		this.filter.goals = [];
		this.updateDisplayModel(true);
	}

	sortBy(param) {
		this.sort.score = -this.sort.score;
		
		for (let i = 0; i < this.displayItems.length - 1; i++)
			for (let j = 0; j < this.displayItems.length - i - 1; j++) {
				
				if (
					(this.sort[param] === 1 && this.displayItems[j].strategy.score < this.displayItems[j+1].strategy.score)
					|| (this.sort[param] === -1 && this.displayItems[j].strategy.score > this.displayItems[j+1].strategy.score)
				) {
					let temp = this.displayItems[j];
					this.displayItems[j] = this.displayItems[j+1];
					this.displayItems[j+1] = temp;
				}
			}
	}

	toggleDescription(className) {
		if (document.getElementsByClassName(className)[0]) {
			if (document.getElementsByClassName(className)[0].innerHTML === 'add') {
				document.getElementsByClassName(className)[0].innerHTML = 'remove'
				return;
			}
			document.getElementsByClassName(className)[0].innerHTML = 'add'
		}
	}

	stickyDiv() {
		var s = jQuery("#sticker");
		var pos = s.position();                    
		jQuery(window).scroll(function() {
			var windowpos = jQuery(window).scrollTop();

			if (windowpos >= pos.top) {
				s.addClass("stick");
			} else {
				s.removeClass("stick"); 
			}
		});
	}


}