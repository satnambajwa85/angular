import { Component, AfterViewInit, OnInit, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { JSONBuilder } from '../../../../../services/JSONBuilder.service';
import { Integrations } from './../../../../../../../shared/models/integrations';
import { IntegrationService } from './../../../../../../../shared/services/integration.service';
import { CookieService } from './../../../../../../../shared/services/cookie.service';
import { ConfigIntegrationsComponent } from './../integrations.component';
import { Script } from './../../../../../../../shared/services/script.service';
import { FeatureAuthService } from '../../../../../../../shared/services/feature-access.service';
import { SubDomainService } from '../../../../../../../shared/services/subdomain.service';

declare var jQuery: any;
declare var window: any;
declare var Clipboard: any;
declare var bootbox: any;

@Component({
	selector: 'og-facebook-chatbot',
	templateUrl: 'facebookChatbot.component.html',
	styleUrls: ['./../../../assets/css/component_config.style.css', './../../../../../../../../assets/css/sahil-hover.css']
}) 

export class FacebookChatbotComponent implements OnInit {

	isConfigured: Boolean = false;
	configuration: Integrations;
	config: { active: boolean, access_token: string, list_id: string, page_id: string, share_link: string, page_name: string } = { active: false, access_token: '', list_id: '', page_id: '', share_link: '', page_name:'' };
	pendingLeads: any;
	isLeadsPending: boolean = false;
	calcType: string;
	calcAllFileds: any = [];
	crmAllFileds: any = [];
	insertFields: any = [];
	mapFields: any = [];
	viewMappedData: any = [];
	mapError: string = '';
	isMapError: boolean = false;
	isDisabled: boolean = false;
	isTokenExpired: boolean = false;
	isMapped: boolean = false;
	isLoading: Boolean = false;
	pageList: any = [];
	shareLink: string = '';
	selectedPage: any;
	reconfig:boolean = false;
	isConnected:boolean = false;

	@Output() notify = new EventEmitter();
  	constructor(
    private _integrationService: IntegrationService,
    private jsonBuilderHelper: JSONBuilder,
    private _script: Script,
    private fb: FormBuilder,
    private _subdomainService: SubDomainService,
    private _featureAuthService: FeatureAuthService,
    private _cookieService: CookieService) {}
  	ngOnInit() {
  	}
  	
  	openAuthModal(reconfig=null) {
		
		if (!this._featureAuthService.features.integrations['fb_messenger']) {
			return;
		}
	    if(this.isConfigured && !reconfig){
				console.log(this.isConfigured,"LLLLLLLLLLLL");
	    	this.getPageList('chatbot', true);
	    }
	    else {
				//jQuery('#chatbot-auth').modal('show');
				console.log(this.isConfigured,"LLLLLLLLLLLL");
				jQuery('#chatbot-new').modal('show');
				this.reconfig = true;
			}
  	}
  
  	connect(activate = false) {
	    if (!this._featureAuthService.features.integrations['fb_messenger']) {
	      return;
	    }
		  this.isMapped = false;
	   	if(this.isConfigured && !this.reconfig && activate){
	    	this.getPageList('chatbot', true);
	    }
	    else{
		    jQuery('#chatbot-auth').modal('hide');
		    jQuery('#chatbot-new').modal('hide');
		    let data = {};
		    this._integrationService.getLink(data, 'chatbot')
		      .subscribe((response) => {
		        let companyId: string = <string>this._subdomainService.subDomain.company_id;
		        this._cookieService.createCookie('comp', companyId, 3);
				    let newWindow = window.open(response, 'GoogleWindow', 'width=600, height=500,scrollbars=yes');
		        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
		          jQuery('#popup-block').modal('show');
		        }
						let self = this;
		        let interval = setInterval(function () {
		          let cookie = self._cookieService.readCookie('comp');
		          if (cookie === 'success') {
					  if(newWindow)	newWindow.close();
					  this.reconfig = false;
		            self.notify.emit({
		              action: 'connect'
		            });
		            self.getPageList('chatbot', true);
					window.toastNotification('You have successfully integrated with Facebook Messenger');
		            clearInterval(interval);
		          } else if (cookie === null) {
					  this.reconfig = false;
		            clearInterval(interval);
		            newWindow.close();
				  }
				  else{
					this.reconfig = false;
				  }
		        }, 5000);
		      }, (error) => {
		        console.log(error);
		      });
	    }
  	}

  	getPageList(type, test=null) {
		if(this.config.page_id == "") test = null;
        this._integrationService.getList(type, {test:test})
            .subscribe((data: any) => {
							console.log(data);
							this.isConnected = true;
            	if(data && data.length > 0){
            		this.pageList = data;
            		this.isDisabled = this.config.page_id ? false : true;
            		if(this.config.page_id){
            			this.selectedPage = {
            				'id': this.config.page_id,
										'access_token': this.config.access_token,
										'this.selectedPage.name': this.config.page_name
									};
								}                         
								this.isConfigured = true;
							//	this.isMapped = true;
								this.reconfig = false;
            		jQuery('#chatbot-new').modal('show');
            	}
            	else  window.toastNotification('No page is found in your account');
            },
            (error) => {
            	this.isConfigured = false;
               console.log('Errorrrr',error);
            })
    }

  	selectPage(pageId){
  		this.selectedPage = this.pageList.find(x=> x.id === pageId);
  		this.isDisabled = pageId == 0 ? true: false;
  	}

  	activate(checked: boolean) {
	    this.calcAllFileds = [];
	    this.crmAllFileds = [];
	    this.insertFields = [];
	    this.isMapped = false;
	    // this.getFields();
	}
  
  	test() {
		let data = {
  		"page_id": this.selectedPage.id,
			"page_access_token": this.selectedPage.access_token,
			"page_name": this.selectedPage.name,
			"calc_id": this.jsonBuilderHelper.getJSONBuilt()._id
			}
			jQuery('#fb_btn').html('PLEASE WAIT...').attr('disabled', true);
  		this._integrationService.sendTestLeads('chatbot', data, this.jsonBuilderHelper.getJSONBuilt()._id)
  			.subscribe((response) => {
  				if(response.success){
						jQuery('#fb_btn').html('connect').attr('disabled', false);
						console.log(response);
						this.shareLink = response.share_link;
						this.config.active = true;
						this.isMapped = true;
						this.isMapError = false;
						this.config.page_id = this.selectedPage.id ; 
  				}
  				else{
						//jQuery('.btn-test').html('Connect').attr('disabled', false);
  					this.mapError = response.message;
						this.isMapError = true;
						jQuery('#fb_btn').html('connect').attr('disabled', false);
  				}

  			},(error) => {

  			})
  	}

  	updateIntegrationStatus(checked: boolean) {
	    let data = {
	      'chatbot': checked
	    }
	    this._integrationService.updateCalcIntegrations(data, this.jsonBuilderHelper.getJSONBuilt()._id)
	      .subscribe((result) => {
	        this.notify.emit({
	          action: 'activate'
	        });
	        let toastText = '';
	        if (checked) {
	          toastText = 'Integration Activated !! The leads from this calculator will be sent to Slack channel';
	        } else {
	          toastText = 'Integration Deactivated !! The leads from this calculator will not be sent to Slack channel';
	          
	        }
	        window.toastNotification(toastText);
	        this.close();
	      }, (error) => {
	        console.log(error);
	      });
  	}


  	returnFeatureAccess() {
		let isIntegrartion: Boolean = this._featureAuthService.features.integrations['fb_messenger'];
	    if (isIntegrartion) return true; 
	    else return false;
  	}

  	premiumPopup(feature: string) {
	    this._featureAuthService.setSelectedFeature(feature, 'fb_messenger');
	    jQuery('.' + feature).addClass('activegreen limited-label');
	    jQuery('#premiumModal').modal('show');
	    jQuery('.modal-backdrop').insertAfter('#premiumModal');
  	}

  	close() {
	    jQuery('#chatbot-auth').modal('hide');
	    //jQuery('#slack').modal('hide');
	    this.crmAllFileds = [];
	    this.calcAllFileds = [];
	    this.insertFields = [];
	    this.isMapped = false;
	    this.isLoading = false;
	    this.mapError = '';
		this.isMapError = false;    
		this.reconfig = false;
  	}

  	sync() {
      let self = this;
      jQuery('.sync-leads-sf').html('Please Wait..');
        this._integrationService.syncCalcLeads('slack', this.jsonBuilderHelper.getJSONBuilt()._id)
          .subscribe((result) => {
            if (result.success) {
                self.notify.emit({
                  action:'synLeads'
                });
                jQuery('.sync-leads-slack').remove();
                window.toastNotification('Data has been synced with Slack');
            }
            else {
                jQuery('.sync-leads-slack').html('Sync (' + this.pendingLeads + ')');
                jQuery('#syncError-modal').modal('show');
            }
          }, (error) => {
              jQuery('.sync-leads-slack').html('Sync (' + this.pendingLeads + ')');
              jQuery('#syncError-modal').modal('show');
        });
    }

    shareLinkModal(){
    	this.isMapped = true;
    	this.shareLink = this.shareLink ? this.shareLink : this.config.share_link;
    	jQuery('#chatbot').modal('show');
    }

  	closeMapped() {
	    jQuery('#chatbot-new').modal('hide');
		}
		
		copyLink() {
			// clipboard.copy(this.shareLink);
			let self = this;
			new Clipboard('.cpy-chtbtn', {
				text: function(trigger) {
						return self.shareLink;
				}
			});
			window.toastNotification('Copied to Clipboard');
  	}

} 