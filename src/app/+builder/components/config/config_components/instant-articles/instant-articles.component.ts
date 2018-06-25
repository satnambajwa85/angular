import { environment } from './../../../../../../../environments/environment';
import { BuilderService } from './../../../../services/builder.service';
import { JSONBuilder } from './../../../../services/JSONBuilder.service';
import { SubDomainService } from './../../../../../../shared/services/subdomain.service';
import { Component, OnInit } from '@angular/core';
import { SocialSignUp } from '../../../../../../shared/services/helper-service/signup-helper';
import { CookieService } from '../../../../../../shared/services/index';
import { error } from 'util';
declare var Clipboard: any;
declare var window:any;
declare var bootbox:any;
declare var jQuery:any;
@Component({
  selector: 'connect-instant-articles',
  templateUrl: './instant-articles.component.html',
  styles: []
})
export class InstantArticlesComponent implements OnInit {
  pages=[];
  fbLogin:Boolean =true;
  selectedPageIndex=-1;
  labelText='';
  errorMessage='';
  constructor(public _socialSignup:SocialSignUp,
    public _cookieService:CookieService,
    public _subDomainService:SubDomainService,
    public _jsonbuilder:JSONBuilder,
    public _builderService:BuilderService
  ) { } 
    ngOnInit() {
        this.getPages();
    }
    getPages(){
      let company = this._jsonbuilder.getJSONBuilt().company; 
      let app = this._jsonbuilder.getJSONBuilt()._id;     
      let $subscription = this._socialSignup.getAccounts({company,app,type:'facebook'})
      .subscribe(response=>{
          this.pages = response.data || [];
          if(this.pages.length == 0){
            this.errorMessage = 'There are no pages associated with this account. Please create and then refresh..'
          }
          this.fbLogin=false;
          this.pages.length  && this.getAppArticle(app);
          $subscription.unsubscribe();
      },err=>{
         if(err.error.code==190 || err.error.code == 400){
          this.fbLogin = true;
         }
         $subscription.unsubscribe();
      })
    }
    getAppArticle(app){
      let $ref = this._builderService.getAppArticle(app).subscribe((result)=>{
        console.log(result);
        result['instant_articles'] && (this.selectedPageIndex=this.getPageIndex(this.pages,result['instant_articles']['page_id']),
        this.selectedPageIndex!=-1 && (this.labelText=this.getLiveLink()));
        $ref.unsubscribe();
      },error=>{
        $ref.unsubscribe();
      })
    }
    getPageIndex(pages,id){
      return pages.findIndex(page=>page['id']===id);
    }
    getFbLink(){
      let linkOptions={
        redirect_uri:`${environment.APP_DOMAIN}/authorize/instant_articles`,
        auth_type: 'rerequest',
        response_type:'token'
      };
      let link = this._socialSignup.getFacebookLink("email pages_manage_instant_articles pages_show_list publish_pages manage_pages",
              linkOptions);
      let newWindow = window.open(link, 'FacebookWindow', 'width=600, height=500,scrollbars=yes');
      if(!newWindow || newWindow.closed || typeof newWindow.closed=='undefined') {
        jQuery('#popup-block').modal('show');
        console.log("Popup Blocked..");
      }else{
        let _interval=setInterval(()=>{
          if(this._cookieService.readCookie('fbloggedIn') == 'true'){
            newWindow.close();
            this._cookieService.eraseCookie('fbloggedIn');
            this.getPages();
            clearInterval(_interval);
          }
        },1000)
      }
    }
    selectionChange(index){
      this.errorMessage = '';
      this.labelText = '';
      this.selectedPageIndex=index;
      if(index != -1){
        let app = this._jsonbuilder.getJSONBuilt()._id;
        let $subscriber= this._builderService.fbPageForInstantArticle({app,page:this.pages[index]})
        .subscribe((data)=>{
          console.log("response",data);
          this.labelText = this.getLiveLink();
          $subscriber.unsubscribe();
        },err=>{
           console.log("Error",err.error);
           $subscriber.unsubscribe();
        })
      }
    }
    postAppToIA(pageIndex,event){
      this.errorMessage='';
      if(pageIndex!=-1){
        //let url = `${environment.LIVE_PROTOCOL}${this._subDomainService.subDomain.name}.${environment.APP_EXTENSION}/${this._jsonbuilder.getJSONBuilt().url}`
        event.target.disabled=true;
        let app:any = this._jsonbuilder.getJSONBuilt();
        if(!app.gifUrl.mobile){
          this.callBootBox('Generate Gif url');
          event.target.disabled=false;
          return;
        }
        let $subscriber = this._builderService.postAppAsIA({url:this.labelText,title:app.title,
          gifUrl:app.gifUrl.mobile,description:app.description,page:this.pages[pageIndex]})
          .subscribe((data)=>{
            (data.status == 'IN_PROGRESS') && this.checkForStatus(data.id,app._id);
            (data.status != 'IN_PROGRESS') && (this.errorMessage = 'no_error');
            $subscriber.unsubscribe();
            event.target.disabled=false;
          },err=>{
            event.target.disabled=false;
            if(err.error['code']==200){
              this.errorMessage = 'Permission Denied. To post Article, you have to Re-Login';
              this.fbLogin = true;
              return;
            }
            if(Object.prototype.toString.call(err.error.err_errors)==='[object Array]'){
              err.error.err_errors.forEach((err)=>{
                this.errorMessage+=err.message+'\n';
              });
              return;
            }
            if(err.error['code']==10){
              this.errorMessage=`This page doesn't have the permission to post Instant Articles.`;
              return;
            }
            this.errorMessage=err.error.err_message;
            $subscriber.unsubscribe();
          })
      }else{
        this.errorMessage='Please Select Page..'
      }
    }
    checkForStatus(id,app){
      let $ref = this._builderService.checkStatusOfArticle({status_id:id,app}).subscribe((data)=>{
        this.errorMessage = 'no_error';
        $ref.unsubscribe();
      },err=>{
        (err.error.code==190 || err.error.code == 400) && (console.log("Error... Not Configured Properly"));
        if(err.error.err_errors && Object.prototype.toString.call(err.error.err_errors)==='[object Array]'){
          err.error.err_errors.forEach((err)=>{
            this.errorMessage+=err.message+'\n';
          });
        }
        $ref.unsubscribe();
      });
    }
    getFeatureAccess(){
      return false;
    }
    copyButton(value) {
      if(value == -1)
        return;
      let self=this;
      new Clipboard('.copy-url-fb',{
        text:function(trigger){
          return self.labelText;
        }
      });
      window.toastNotification('Copied to Clipboard');
    }
    callBootBox(message){
      bootbox.dialog({
        closeButton: false,
        message: `        <div class="bootbox-body-left">
                              <div class="mat-icon">
                                  <i class="material-icons">error</i>
                              </div>
                          </div>
                          <div class="bootbox-body-right">
                              <p class="">${message}</p>
                          </div>

                  `,
                  buttons: {
                    cancel: {
                      label: "Cancel",
                      className: "btn-cancel btn-cancel-hover"
                    },
            
                    success: {
                      label: "OK",
                      className: "btn btn-ok btn-hover",
                      callback: function () {
                        
                      }
                    }
                  }
      });
    }
    checkForLiveApp(){
      let isPublic = (this._jsonbuilder.getJSONBuilt()['mode']==='PUBLIC');
      if(!this._jsonbuilder.getJSONBuilt()['liveApp'] || !isPublic){
        this.callBootBox(`The quiz/calculator/poll should be live in order to Publish as an Instant Article`);
        !isPublic && jQuery('#instant-article-switch :input').attr('disabled',true);
      }else{
        jQuery('#instant-article-switch :input').attr('disabled',false);                
      }
    }
    ngAfterViewInit(){
      let isPublic = (this._jsonbuilder.getJSONBuilt()['mode']==='PUBLIC');
      if(!this._jsonbuilder.getJSONBuilt().liveApp || !isPublic){
        jQuery('#instant-article-switch :input').attr('disabled',true);
      }else{
        jQuery('#instant-article-switch :input').attr('disabled',false);        
      }
    }
    getLiveLink(){
      let link='';
      if(environment.STATIC_DOMAIN){
        link=`${environment.LIVE_PROTOCOL}livec.${environment.LIVE_EXTENSION}/${this._jsonbuilder.getJSONBuilt().url}`;
      }else{
        link=`${environment.LIVE_PROTOCOL}${this._subDomainService.subDomain.name}.${environment.LIVE_EXTENSION}/${this._jsonbuilder.getJSONBuilt().url}`;
      }
     
      return link;
    }
}
