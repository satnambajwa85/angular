import { Injectable } from '@angular/core';
@Injectable()
export class BuilderConditions {
    constructor() {
    }
    // All templates for reference
    templates = ['template-eight', 'template-six', 'template-five', 'template-five-oldresult',
        'experian', 'inline-temp-new', 'template-seven', 'one-page-card-new', 'one-page-card-oldresult',
        'one-page-card', 'sound-cloud-new', 'sound-cloud-v3', 'sound-cloud'];
    templatesName = {
        'one-page-card-new': 'The Chicago',
        'one-page-card-oldresult': 'The Chicago',
        'one-page-card': 'The Chicago',
        'sound-cloud-new': 'The Londoner',
        'sound-cloud-v3': 'The Londoner',
        'template-seven': 'The Seattle',
        'sound-cloud': 'The Londoner',
        'inline-temp-new': 'The Greek',
        'inline-temp': 'The Greek',
        'experian': 'The Tokyo',
        'template-five': 'The Madrid',
        'template-five-oldresult': 'The Madrid',
        'template-six': 'The Stockholm',
        'template-eight': 'The Venice'
    };
    templatesImages = {
        'one-page-card-new': 'https://cdn.filestackcontent.com/olTvgdNSfyh02HVKfriY',
        'one-page-card-oldresult': 'https://cdn.filestackcontent.com/olTvgdNSfyh02HVKfriY',
        'one-page-card': 'https://cdn.filestackcontent.com/olTvgdNSfyh02HVKfriY',
        'sound-cloud-new': 'https://cdn.filestackcontent.com/WStZFzlFR3C7Ti4xmuJ6',
        'sound-cloud-v3': 'https://cdn.filestackcontent.com/WStZFzlFR3C7Ti4xmuJ6',
        'template-seven': 'https://cdn.filestackcontent.com/MvyTapbUT6yrt22g5KHr',
        'sound-cloud': 'https://cdn.filestackcontent.com/WStZFzlFR3C7Ti4xmuJ6',
        'inline-temp-new': 'https://cdn.filestackcontent.com/ur3J4BWtTyCNGsW552El',
        'inline-temp': 'https://cdn.filestackcontent.com/ur3J4BWtTyCNGsW552El',
        'experian': 'https://cdn.filestackcontent.com/5lPXYxmbSrI5Allkdtl0',
        'template-five': 'https://cdn.filestackcontent.com/sRVCCDqqReSBAHeutnXO',
        'template-five-oldresult': 'https://cdn.filestackcontent.com/sRVCCDqqReSBAHeutnXO',
        'template-six': 'https://cdn.filestackcontent.com/FGKdrBgpSRaq1qGQORoB',
        'template-eight': 'https://cdn.filestackcontent.com/Ev516OdRAiZhP1kcJgtc'
    };

    // Conditions: [Not Available] => means these Conditions 'Not Available' for these templates in Array.
    // Conditions: [Available] => means these Conditions 'Available' for these templates in Array.


    private builderCondition = Object.freeze({
        // for switching calc types e.g to numerical, graded, recomm etc
        'templatesTypes': {
            // Condition: [Available]
            'inline-temp': ['Recommendation', 'Numerical'],
            'inline-temp-new': ['Recommendation', 'Numerical'],
            'one-page-card': ['Recommendation', 'Numerical', 'Graded'],
            'one-page-card-new': ['Recommendation', 'Numerical', 'Graded', 'Poll', 'Ecom'],
            'one-page-card-oldresult': ['Recommendation', 'Numerical', 'Graded'],
            'template-five': ['Graded', 'Numerical', 'Recommendation'],
            'template-five-oldresult': ['Graded', 'Numerical'],
            'experian': ['Numerical'],
            'sound-cloud-new': ['Numerical'],
            'sound-cloud-v3': ['Numerical'],
            'template-seven': ['Numerical'],
            'sound-cloud': ['Numerical'],
            'one-page-slider': ['Numerical'],
            'template-six': ['Recommendation', 'Numerical', 'Graded', 'Poll'],
            'template-eight': ['Recommendation', 'Numerical', 'Graded', 'Poll']
        },
        // For templates listing for choose layout on /templates route.
        'template': {
            // Condition: [Available]
            // Empty means everything is available
            'Ecom': ['one-page-card-new'],
            'Graded': ['one-page-card-new', 'template-five', 'template-six', 'template-eight'],
            'Numerical': [],
            'Recommendation': ['one-page-card-new', 'inline-temp-new', 'template-six', 'template-eight', 'template-five'],
            'Poll': ['one-page-card-new', 'template-six', 'template-eight']
        },
        // for switching calculator e.g [Numerical <=> Graded] etc.
        'templateCalcTypeControls': {
            // Conditions: // FOCUS => [Not Available]
            // Empty means everything is available
            'Ecom': { 'controls': [], 'convertTo': '' },
            'Poll': { 'controls': [], 'convertTo': '' },
            'Graded': { 'controls': ['textfield', 'selectbox', 'slider'], 'convertTo': 'radio_button' },
            'Numerical': { 'controls': [], 'convertTo': '' },
            'Recommendation': { 'controls': ['slider'], 'convertTo': 'checkbox' }
        },
        // for Changing Template e.g [One-page-card-new <=> sound-cloud-new] etc.
        'templateControls': {
            // Conditions: // FOCUS => [Not Available] 
            // Empty means everything is available
            'one-page-slider': [],
            'one-page-card': [],
            'one-page-card-new': [],
            'one-page-card-oldresult': [],
            'inline-temp': ['slider', 'checkbox', 'radio_button', 'custom_html', 'rating'],
            'inline-temp-new': ['slider', 'checkbox', 'radio_button', 'rating'],
            'sound-cloud': ['custom_html', 'leadform_question'],
            'sound-cloud-new': ['custom_html', 'leadform_question'],
            'sound-cloud-v3': ['custom_html', 'leadform_question'],
            'template-seven': ['custom_html', 'leadform_question'],
            'template-five': [],
            'template-five-oldresult': [],
            'experian': ['leadform_question', 'leadform_result', 'custom_html'],
            'template-six': [],
            'template-eight': []
        }
    });

    /* ############## Runtime Conditions Start ############## */
    templatesTypes(condition: string, template: string) {
        return <boolean>(this.builderCondition['templatesTypes'][template].indexOf(condition) >= 0) ? true : false;
    }
    // These methods will return Array.
    templateControls(template: string) {
        return this.builderCondition['templateControls'][template];
    }
    template(condition: string) {
        return this.builderCondition['template'][condition];
    }
    // This method will return Object
    templateCalcTypeControls(condition: string) {
        return this.builderCondition['templateCalcTypeControls'][condition];
    }
    /* ############## Runtime Conditions End ############## */

    private staicCondition = Object.freeze({
        // main conditions
        'editors': {
            // Conditions:  [Available]
            'tempTypeChange': ['inline-temp', 'inline-temp-new', 'one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'one-page-slider'],
            'optionsImage': ['one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'template-five', 'template-five-oldresult', 'template-six', 'template-eight'],
            'logicJump': ['one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'template-six', 'template-eight'],
            'sectionalLogicJump': ['experian', 'inline-temp', 'inline-temp-new', 'template-five', 'template-five-oldresult'],
            'controlImage': ['one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'template-six', 'template-eight'],
            'followUpText': ['inline-temp', 'inline-temp-new'],
            'realTimeResult': ['one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'template-six', 'template-eight'],
            'visualEditor': ['one-page-card-new', 'one-page-card-oldresult', 'inline-temp-new', 'experian', 'template-six', 'template-eight', 'template-five', 'template-five-oldresult', 'template-seven'],
            'RTL': ['one-page-card-new', 'one-page-card-oldresult', 'template-five', 'template-five-oldresult'],
            'bgImageInQ': ['sound-cloud-new'],
            'MarkAsMandate': ['template-eight', 'template-six', 'template-five', 'template-five-oldresult', 'experian', 'inline-temp-new', 'template-seven', 'one-page-card-new', 'one-page-card-oldresult', 'one-page-card', 'sound-cloud-new', 'sound-cloud-v3', 'sound-cloud'],
            'redo': ['template-eight', 'template-six', 'template-five', 'template-five-oldresult', 'inline-temp-new', 'one-page-card-new', 'one-page-card-oldresult', 'one-page-card']
        },
        'controls': {
            // Conditions: [Available]
            'normalControl': ['one-page-card', 'sound-cloud', 'inline-temp', 'inline-temp-new', 'one-page-slider'],
            'materialControl': ['one-page-card-new', 'one-page-card-oldresult', 'template-six', 'template-eight', 'sound-cloud-new', 'sound-cloud-v3', 'template-seven', 'template-five', 'template-five-oldresult', 'experian'],
            'normalLead': ['one-page-card', 'template-seven', 'sound-cloud', 'inline-temp', 'inline-temp-new', 'one-page-slider', 'template-six', 'template-eight'],
            'materialLead': ['one-page-card-new', 'one-page-card-oldresult', 'sound-cloud-new', 'sound-cloud-v3', 'template-five', 'template-five-oldresult', 'experian'],
            'normalLeadques': ['one-page-card', 'template-seven', 'inline-temp', 'one-page-slider', 'experian', 'inline-temp-new'],
            'materialLeadques': ['one-page-card-new', 'one-page-card-oldresult', 'template-five', 'template-five-oldresult', 'template-six', 'template-eight'],
            'disclaimer': ['one-page-card', 'inline-temp', 'one-page-slider', 'sound-cloud', 'sound-cloud-new', 'sound-cloud-v3', 'template-seven', 'inline-temp-new', 'template-five', 'template-five-oldresult', 'experian'],
            'disclaimerNew': ['one-page-card-new', 'one-page-card-oldresult', 'template-six', 'template-eight'],
            'resultOutput': ['one-page-card', 'inline-temp', 'one-page-slider', 'sound-cloud', 'sound-cloud-new', 'sound-cloud-v3', 'template-seven', 'inline-temp-new', 'template-five', 'template-five-oldresult', 'experian'],
            'resultOutputNew': ['one-page-card-new', 'one-page-card-oldresult', 'template-six', 'template-eight'],
            'controlImageInside': ['one-page-card'],
            'controlImageOutside': ['one-page-card-new', 'one-page-card-oldresult', 'template-six', 'template-eight'],
            'submitButton': ['one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'template-six', 'template-eight']
        },
        'componentManager': {
            // Conditions: [Available]
            'section': ['inline-temp-new', 'inline-temp', 'one-page-slider', 'sound-cloud-new', 'sound-cloud-v3', 'template-seven', 'template-five', 'template-five-oldresult', 'experian'],
            'addsection': ['inline-temp-new', 'inline-temp', 'template-seven', 'one-page-slider', 'template-five', 'template-five-oldresult', 'experian'],
            'addcustomhtml': ['inline-temp-new', 'one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'template-six', 'template-eight', 'template-five', 'template-five-oldresult'],
            'addleadform': ['inline-temp', 'inline-temp-new', 'one-page-card', 'one-page-card-new', 'one-page-card-oldresult', 'template-five', 'template-five-oldresult', 'one-page-slider', 'template-six', 'template-eight'],
            '+add': ['template-eight', 'template-six', 'template-five', 'template-five-oldresult', 'experian', 'inline-temp-new', 'template-seven', 'one-page-card-new', 'one-page-card-oldresult', 'one-page-card']
        }
    });
    private builderConditions = {};
    initializeBuilderConditions(template: string) {
        let keysArray = ['editors', 'controls', 'componentManager'];
        keysArray.forEach((key) => {
            this.builderConditions[key] = Object.assign({}, this.staicCondition[key]);
            let obj = this.staicCondition[key]; // e.g 'editors' object
            Object.keys(obj).forEach((subKey) => {
                this.builderConditions[key][subKey] = (obj[subKey].indexOf(template) >= 0) ? true : false; // e.g 'editors'->'tempTypeChange' array
            })
        });
    }
    /* ############### PreCalculated Conditions Start ######### */
    editors(condition: string, template: string) {
        return <boolean>(this.builderConditions['editors'][condition]);
    }
    controls(condition: string, template: string) {
        return <boolean>(this.builderConditions['controls'][condition]);
    }
    componentManager(condition: string, template: string) {
        return <boolean>(this.builderConditions['componentManager'][condition]);
    }
    /* ############### PreCalculated Conditions End ######### */
}