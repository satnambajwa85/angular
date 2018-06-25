declare var jQuery: any;
export class CalcEmail {

    _id: string = '';
    app: string = '';
    type: string = 'Finish';
    email: string = 'team@videoagency.com';
    sendFromName: String = '';
    subject: string = 'Your Video Production Estimate';
    message: string = '';
    sendEmail: boolean = false;
    notifyMe: boolean = false;
    customNotifyMail: boolean = false;
    notifyTeam: {
        sendFrom: '',
        subject: '',
        message: string,
        sendFromName: ''
    };
    is_unsubsribed_removed : boolean = false;
    resultBasedEmail: boolean = false;
    resultEmails: any[] = [];

    constructor(data: any) {
        let self: any = this;
        for (let prop in data) {
            if (typeof data[prop] === 'object') {
                self[prop] = data[prop] || self[prop];
                for (let obj in data[prop]) {
                    self[prop][obj] = data[prop][obj] || self[prop][obj];
                }
            } else {
                self[prop] = data[prop] || self[prop];
            }
        }
    }
}
