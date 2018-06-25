import { Serializable } from './serializeable.interface';
import { Page } from './page.model';

export class App implements Serializable<App> {
	_id: string = '';
	company: String = '';
	users: any = [];
	isNew: boolean = false;
	name: string = '';
	tag: string = '';
	syncing: string = 'not_syncing';
	emailCount: number = 3;
	templateType: string = 'Numerical';
	message: string = 'Thank You For Submitting!';
	title: string = 'Outgrow';
	spredsheetUrl: string = '';
	version: string = 'V1';
	leadSubmitted: boolean = false;
	leadSubmittedQ: boolean = false;
	leadSubmittedR: boolean = false;
	numberSystem: string = 'US';
	hiddenValues: any = {};
	localeCode: string = 'en';
	indexToSearchEngine: boolean = true;
	robotsFollow: boolean = true;
	fbBtnText: string = 'Continue with';
	publishing_gif: boolean = false;
	versioning: any = {
		resultV2: false
	};
	progressBar: Object = {
		visible: true,
		auto: true,
		perc: 25, // in ecom, used for number of similar recommendations to show
		bulletStyle: false
	}
	custom_script: Object = {
		value: '',
		status: 'PENDING',
		comments: ''
	};
	premade_data: any = {
		is_premade: false,
		app_id: null,
		app_url: ''
	};
	currency: any = {
		symbol: '$',
		prefix: true
	};
	scripts: Array<any> = [];
	styles: Array<any> = [];
	ga: string = '';
	ga_enable: boolean = false;
	isDemo: boolean = false;
	highlight: boolean = false;
	fbPixel: string = '';
	fbPixel_enable: boolean = false;
	favicon: string = '';
	description: string = 'Default Meta Description';
	public: boolean = false;
	showLiveCalc: boolean = false;
	visible: boolean = true;
	poweredby: boolean = true;
	realTime: boolean = false;
	realTimeHeading: string = 'Result Heading goes here';
	realTimeResult: string = '0';
	themeColor: string = 'cp1';
	theme: any = {};
	isAppSumoCreated: boolean = false;
	analytics_segmentation: any = {
		welcome_page: false,
		questions_page: false,
		result_page: false
	};
	cta: any = {
		shareType: 'cta',
		shareButtonName: '',
		shareTitle: '',
		facebookUrl: 'http://www.facebook.com/outgrowco',
		twitterUrl: 'outgrowco'
	};
	customColor: any = {};
	template: string = '';
	isVariableCta: boolean = false;
	formula: any = [];
	url: any = '';
	navigate_Url: any = 'https://outgrow.co';
	mode: string = 'PRIVATE';
	status: string = 'DEV';
	changed: boolean = true;
	liveApp: string = '';
	embedTitle: string = 'Get Started';
	embedBgColor: string = '#fb5f66';
	embedTextColor: string = '#ffffff';
	embedLinkColor: string = '#fb5f66';
	embedBorderRadius: string = '0';
	embedFontSize: string = '12';
	seo_text: any = {
		inEmbed: false,
		showText: false,
		text: ""
	}
	seoImage: string = '';
	seoImageName: string = '';
	shortUrl: string = '';
	error_url = '';
	RTL: boolean = false;
	open_in_tab: boolean = true;
	cookie_enabled: boolean = true;
	froalaAdvance: boolean = true;
	fbComments: boolean = false;
	embedHeader: boolean = false;
	embedFooter: boolean = false;
	GQans: boolean = false;
	embedScheduling: boolean = false;
	embedTimed: boolean = true;
	embedExit: boolean = false;
	is_gdpr: boolean = false;
	gdpr_text: any = `<p>This website stores cookies on your computer. These cookies are used to improve your experience and provide more
	personalized services to you, both on this website and through other media. To find out more about the cookies
	we use, see our <a href="https://outgrow.co/privacy-policy/" target="_blank">Privacy Policy.</a></p>`;
	embedTimeFormat: any = '0';
	embedTimeValue: any = '5';
	embedCookieDays: any = '10';
	fbCommentsUrl: string = 'https://www.facebook.com/OutgrowCo/posts/1732789986763030';
	parentApp: string;
	login: any = 0;
	user_id: any = '';
	user_name: any = '';
	fb_app_id: any = '';
	user_temp_code: any = '';
	socket_id: any = '';
	createdAt: any = '';
	recomBased: any = {
		multipleOutcome: false,
		noOfOutcome: 2
	};
	instant_article: boolean = false;
	gifUrl: any = {};
	public pages: Page[] = [];
	question_redirect_status: boolean = false;
	question_redirect_new_tab: boolean = true;
	question_redirect_url: string = 'http://outgrow.co';

	constructor(type?: string, tempName?: string) {
		// code
		this.templateType = type ? type : 'Numerical';
		this.template = tempName;
	}
	//add a page
	public addPages(...pages: any[]) {
		for (let page in pages)
			this.pages.push(pages[page]);
	}

	public setThemeColor(color: string) {
		this.themeColor = color;
	}
	public setVersion(ver: string) {
		this.version = ver;
	}
	public setVersioning() {
		this.versioning['resultV2'] = true;
	}
	public tintToggle(status) {
		this.theme.tintToggle = status;
	}

	public setUrl(url: string) {
		this.url = url;
	}

	public setName(appName: string) {
		this.name = appName;
	}

	public setTemplateName(tempName: string) {
		this.template = tempName;
	}
	public setTemplateType(temp_type: string) {
		this.templateType = temp_type;
	}

	public setNavigateUrl(nav_url: string) {
		this.navigate_Url = nav_url;
	}

	public setCompany(id: String) {
		this.company = id;
	}

	public duplicateFormula(formula: any) {
		let newFormula = JSON.parse(JSON.stringify(formula));
		delete newFormula._id;
		this.formula.push(newFormula);
		return this.formula.length - 1;
	}

	public addformula(name?: string, value?: string, result?: string, html?: string,
		heading?: string, textCTA?: string, href?: string, range?: string,
		prefix?: boolean, postfix?: boolean, isValid?: boolean,
		ButtonHeading?: string, links?: any[], visuals?: any, open_in_tab: boolean = true
	) {
		/*  -- In recomended calc ---
			name -> subheading
			value -> value
			result -> imagepath
			html -> description
			decimal -> Heading
			unit-prevalue -> CTA html
			unit-postvalue -> CTA href
			range-status -> img show or hide
			unit-prefix -> like button show/hide
			unit-postfix -> share button show/hide
			isValid -> button show/hide
			heading -> button heading

		*/


		/*  -- In Graded calc ---
		value -> result value
			result -> result value
		decimal -> decimal
		unit-prefix -> Show Score As he proceeds with the questions
		unit-postfix -> Show Score Realtime
		range-status -> Reveal Scores
		unit-preValue -> Score percntaf
		unit-PostValue -> Score Rank
		*/

		/*  -- In Poll calc ---
		value -> Average Poll Percentage
		unit-postfix -> Show No of voters
		unit-preValue -> Stringified object of highest percentages and labels with highest percentages
		*/

		let formula_name = (name) ? name : '';
		let formula_value = (value) ? value : '';
		let formula_result = (result) ? result : '';
		let formula_html = (html) ? html : '';
		let formula_decimal = (heading) ? heading : '';
		let formula_title = '';
		let formula_pre = (textCTA) ? textCTA : '';
		let formula_post = (href) ? href : '';
		let rangeStatus = (range) ? true : false;
		let formula_prefix = (prefix) ? prefix : ((this.templateType == 'Numerical') ? true : false);
		let formula_postfix = (postfix) ? postfix : ((this.templateType == 'Numerical') ? true : false);
		let formula_isValid = (isValid) ? true : (isValid == false) ? false : true;
		let formula_buttonHeading = (ButtonHeading) ? ButtonHeading : '';
		let formula_links = (links) ? links : this.addlinks();
		let formula_visuals = (visuals) ? visuals : this.addVisuals();

		console.log('link', this.templateType, formula_links);

		this.formula.push({
			name: formula_name,
			html: formula_html,
			title: formula_title,
			result: formula_result,
			decimal: formula_decimal,
			imageName: '',
			isValid: formula_isValid,
			value: formula_value,
			units: {
				prefix: formula_prefix,
				preValue: formula_pre,
				postfix: formula_postfix,
				postValue: formula_post,
				open_in_tab: open_in_tab,
				sharePopupLike: false,
				sharePopupShare: false,
				sharePopUpTitle: 'Your share title goes here',
				sharePopUpDesc: 'Your share description goes here'
			},
			excel: {
				active: false,
				jsonData: ``,
				fieldName: ``,
				fieldValue: {
					row: 0,
					column: 0
				},
				JsonFeed: {
					jsonUrl: '',
					autoUpdate: false,
					JsonFeedstatus: ''
				}

			},
			range: {
				status: rangeStatus, //fixed ->false range ->true
				lower: {
					type: 'Number', // Number Per
					value: 0.0
				},
				higher: {
					type: 'Number',
					value: 0.0
				}
			},
			links: formula_links,
			heading: '',
			visuals: formula_visuals
		});
		// let html: string = this.formula[this.formula.length - 1].html;
		// this.formula[this.formula.length - 1].html = html.replace('/{R[0-9]}/gi', '{R' + (this.formula.length - 1) + '}');
		return this.formula.length - 1;
	}

	/** add Visuals */
	addVisuals() {
		let visualObj: any = {};
		if (this.templateType == 'Numerical' || this.templateType == 'Graded' || this.templateType == 'Poll') {
			visualObj = {
				visible: (this.templateType == 'Poll') ? false : true,
				type: (this.template == 'experian') ? 'graph' : 'image',
				graph: {
					decimal: '0',
					preValue: '$',
					postValue: '/hr',
					type: 'column',
					rawJSON: '',
					tempRawJSON: '',
					title: this.templateType == 'Numerical' ? 'Video Cost' : 'See how others performed',
					titleColor: this.templateType == 'Numerical' ? '#444444' : 'percentage',  // In Graded graphDataType
					textColor: '#444444',
					xAxis: 'Type',
					yAxis: 'Price ($)',
					colors: ['#68bce4 ', '#fe7c60'],
					tempColors: ['#68bce4 ', '#fe7c60'],
					isDefaultColor: false,
					defaultColor: '#1483b7',
					legend: true,
					polar: false,
					legendPosition: 'bottom',
					titlePosition: 'top',
					stacking: '',
					axis: true,
					grid: true,
					rows: '',
					columns: '',
					JsonFeed: {
						jsonUrl: '',
						autoUpdate: false,
						JsonFeedstatus: ''
					}
				},
				table: {
					decimal: '0',
					title: this.templateType == 'Numerical' ? 'Video Cost' : 'percentage', // In Graded graphDataType
					rawJSON: '',
					tempRawJSON: '',
					tableTitle: 'See how others performed',
					rows: '',
					columns: '',
					JsonFeed: {
						jsonUrl: '',
						autoUpdate: false,
						JsonFeedstatus: ''
					}
				},
				videoLink: '',
				youtubeLink: 'https://www.youtube.com/embed/N-P_8ACSHas',
				videoWistiaLink: '',
				imageLink: 'https://dlvkyia8i4zmz.cloudfront.net/DcgzVVEJTPaZYy1WF9s5_img.gif',
				imageName: 'default.jpg'
			}
		}
		else {
			visualObj = {
				videoLink: '',
				imageLink: 'https://dlvkyia8i4zmz.cloudfront.net/DcgzVVEJTPaZYy1WF9s5_img.gif',
				youtubeLink: 'https://www.youtube.com/embed/N-P_8ACSHas',
				videoWistiaLink: '',
				type: 'Image',
				seoImage: ''
			}
		}

		return visualObj;
	}
	/**  add links */
	addlinks() {
		let links = {
			share: ['facebook', 'linkedin', 'twitter', 'vkontakte', 'whatsapp', 'mail', 'messenger'],
			like: ['facebook', 'twitter', 'vkontakte']
		};

		let linksArray = [];
		if (this.templateType != 'Numerical') {
			for (let link in links) {
				links[link].map((obj: any) => {
					linksArray.push({
						type: link,
						socialType: obj,
						visible: true,
						title: (link == 'like') ? (obj == 'facebook' ? 'http://www.facebook.com/outgrowco' : (obj == 'twitter' ? 'outgrowco' : '460614642')) : 'Share title goes here | via @outgrowco',
						description: (link == 'like') ? 'Default Meta Description' : 'Share description goes here',
						heading: (link == 'like') ? 'Subscribe to Our Updates' : 'Share Your Results',
						url: ''
					});
				});
			}
		}
		return linksArray;
	}

	deserialize(input: any): App {
		var self: any = this;
		for (let prop in input) {
			if (prop === 'pages') {
				for (let page in input[prop]) {
					self.pages.push(new Page().deserialize(input[prop][page]));
				}
			} else
				self[prop] = input[prop];
		}
		return self;
	}
}

