import { environment } from './../../../../../../../environments/environment';
import { SubDomainService } from './../../../../../../shared/services/subdomain.service';
import { JSONBuilder } from './../../../../services/JSONBuilder.service';
import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
declare var Clipboard: any;
declare var window: any;
declare var bootbox: any;
declare var jQuery: any;

@Component({
    selector: 'opinion-email',
    templateUrl: './assets/opinion-email.template.html',
    encapsulation: ViewEncapsulation.None
})

export class OpinionEmailComponent implements OnInit {
    public questionTitle: string = '';
    public questionList: string = '';
    public previewList: string = '';
    public lowerMsg: string = '';
    public upperMsg: string = '';
    public code: string = ``;
    public isVisible: boolean = false;
    public srcUrl = '';
    constructor(public jsonBuilderHelper: JSONBuilder, private subDomainService: SubDomainService) {
        if (environment.LIVE_PROTOCOL === 'https://') {
            if (environment.STATIC_DOMAIN) {
                this.srcUrl = 'https://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
            } else {
                this.srcUrl = 'https://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
            }
        } else {
            if (environment.STATIC_DOMAIN) {
                this.srcUrl = 'http://' + 'livec.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
            } else {
                this.srcUrl = 'http://' + this.subDomainService.subDomain.sub_domain + '.' + environment.LIVE_EXTENSION + '/' + this.jsonBuilderHelper.getJSONBuilt()._id;
            }
        }
    }

    ngOnInit(): void {
        const isLandingPage = this.jsonBuilderHelper.getPage('Landing').visible;
        const isLeadformOnLandingPage = this.jsonBuilderHelper.getVisibleLeadForm().page.length && this.jsonBuilderHelper.getVisibleLeadForm().page[0].type === 'Landing';
        const questionOne = this.jsonBuilderHelper.getPage('Questionnaire').sections[0].items[0];
        if ((!isLandingPage || !isLeadformOnLandingPage) && (['rating', 'radio_button', 'checkbox'].indexOf(questionOne.type) >= 0)) {
            this.isVisible = true;
            this.questionTitle = questionOne.props.title;
            this.questionList = '';
            if (questionOne.type === 'rating') {
                let val = questionOne.props.minVal;
                for (let i = 1; i <= questionOne.props.maxVal; i++) {
                    this.questionList += `<td style="padding: 0;width: auto;border: 1px solid #bac7cd;text-align: center;"><a target="_blank" href="` + this.srcUrl + `?redirectType=opinionEmail&selectedIndex=` + val + `" style="padding: 15px 0;float: left;color: #62696d;text-transform: none;text-align: center;text-decoration: none;display: block;width:100%;font-family: verdana;font-size: 14px;">` + val + `</a></td>`;
                    this.previewList += `<td style="padding: 0;width: auto;border: 1px solid #bac7cd;text-align: center;"><a href="javascript:void(0);" style="padding: 15px 0;float: left;color: #62696d;text-transform: none;text-align: center;text-decoration: none;display: block;width:100%;font-family: verdana;font-size: 14px;">` + val + `</a></td>`;
                    val++;
                }
            } else if (questionOne.type === 'radio_button' || questionOne.type === 'checkbox') {
                for (let i in questionOne.options) {
                    this.questionList += `<td style="padding: 0;width: auto;border: 1px solid #bac7cd;text-align: center;"><a target="_blank" href="` + this.srcUrl + `?redirectType=opinionEmail&selectedIndex=` + i + `" style="padding: 15px 0;float: left;color: #62696d;text-transform: none;text-align: center;text-decoration: none;display: block;width:100%;font-family: verdana;font-size: 14px;">` + questionOne.options[i].label + `</a></td>`;
                    this.previewList += `<td style="padding: 0;width: auto;border: 1px solid #bac7cd;text-align: center;"><a href="javascript:void(0);" style="padding: 15px 0;float: left;color: #62696d;text-transform: none;text-align: center;text-decoration: none;display: block;width:100%;font-family: verdana;font-size: 14px;">` + questionOne.options[i].label + `</a></td>`;
                }
            }
            this.lowerMsg = questionOne.config.attr.style;
            this.upperMsg = questionOne.postfix;
            this.code = `
            <!DOCTYPE HTML>
            <html>
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                </head>
                <body>
                    <div style="margin:0px;padding:0">
                        <table style="float:left;width:100%;border-collapse:collapse;border:0px;background: #f2f5fc;margin-bottom: 20px;">
                            <tbody>
                                <tr>
                                    <td style="border:none;">
                                        <table style="margin:0 auto;width:100%;max-width:600px;border-collapse:collapse;border:0px;">
                                            <tbody>
                                                <tr>
                                                    <td style="padding: 25px;color: #62676d;border:none;">
                                                        <table style="float:left;width:100%;border: 1px solid #d8dde3;border-radius: 5px;background: #fff;padding: 25px;margin-bottom: 15px;border-collapse: separate;">
                                                            <tbody>
                                                                <tr>
                                                                    <td style="border:none;">
                                                                        <table style="float:left;width:100%;border-collapse:collapse;border:0px;margin-bottom: 20px;">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td style="color:#303030;font-size: 16px;font-family: verdana;border:none;">${this.questionTitle}</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                        <table cellpadding="0" cellspacing="0" style="float:left;width:100%;border-collapse:collapse;border: 0;border-spacing: 0;">
                                                                            <tbody>
                                                                                <tr>
                                                                                    ${this.questionList}
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                        <table style="float:left;width:100%;border-collapse:collapse;border:0px;margin-top: 10px;">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td style="color: #2a2a2a;font-size: 11px;text-align: left;font-family: verdana;border:none;">${this.lowerMsg}</td>
                                                                                    <td style="color: #2a2a2a;font-size: 11px;text-align: right;font-family: verdana;border:none;">${this.upperMsg}</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                        <table style="float:left;width:100%;border-collapse:collapse;border:0px;text-align: center;">
                                                            <tbody>
                                                                <tr>
                                                                    <td style="color: #62696d;font-size: 11px;opacity: 0.7;font-family: verdana;border:none;">Powered by Outgrow</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                      </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
            </body>
            </html>`;
        } else {
            this.questionTitle = questionOne.props.title;
            this.questionList = '';
            for (let i = 0; i <= 5; i++) {
                this.previewList += `<td style="padding: 0;width: auto;border: 1px solid #bac7cd;text-align: center;"><a href="javascript:void(0);" style="padding: 15px 0;float: left;color: #62696d;text-transform: none;text-align: center;text-decoration: none;display: block;width:100%;font-family: verdana;font-size: 14px;">` + i + `</a></td>`;
            }
            this.lowerMsg = 'Minimum';
            this.upperMsg = 'Maximum';
            this.code = `Please turn off your welcome page and use first question as Opinion Scale or Rating to continue.`;
        }
    }

    embedSelect() {
        const className = 'code2';
        const self: any = this;
        let copyCode: any = '';
        copyCode = self.code;
        // clipboard.copy(copyCode);
        new Clipboard('.embed2', {
          text: function(trigger) {
              return copyCode;
          }
        });
        window.toastNotification('Copied to Clipboard');
        setTimeout(() => {
            const el = document.getElementsByClassName(className)[0];
            const range = document.createRange();
            range.selectNodeContents(el);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }, 0);
    }

    embedSel() {
        jQuery('.embed2')[0].click();
    }
}
