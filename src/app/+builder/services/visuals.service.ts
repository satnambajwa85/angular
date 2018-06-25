import { Script } from './../../../shared/services/script.service';
import { Section } from '@builder/models';
import { FeatureAuthService } from './../../../shared/services/feature-access.service';
import { Injectable } from '@angular/core';
import { JSONBuilder } from './JSONBuilder.service';

@Injectable()
export class VisualsService {

    constructor(public jsonBuilderHelper: JSONBuilder, public _script: Script) { }

    public getResultsAndFormulas() {
        let questions: any[] = [];
        let results = this.jsonBuilderHelper.getJSONBuilt().formula.map((val: any, index: any) => {
            return 'R' + Number(index + 1);
        });
        this.jsonBuilderHelper.getTemplateQuestionareWithEmittedLeadFormQuestion().map((question: any, index: any) => {
            if ((question.type == 'textfield' && (question.config.type == 'text' || question.config.type == 'email')) || (question.type == 'calendar' && !question.isIconPresent)) return;
            else return 'Q' + Number(index + 1);
        }).forEach((item: any) => {
            if (item) questions.push(item)
        });
        return [questions, results];
    }

    public gradedRandomPercentages(len: any) {
        let vals = [], maxIndividualValue = 100 / len;
        for (let i = 0; i < ((len % 2) ? len - 1 : len); i++)
            vals.push(Number(((i % 2) ? (maxIndividualValue * 2) - vals[i - 1] : (Math.random() * (maxIndividualValue) + 1)).toFixed(2)));
        if ((len % 2)) vals.push(Number(maxIndividualValue.toFixed(2)));
        for (let i = vals.length; i; i--) {           // to randomize vals
            let j = Math.floor(Math.random() * i);
            [vals[i - 1], vals[j]] = [vals[j], vals[i - 1]];
        }
        return vals;
    }

    public getUpdatedVideoVisuals(visuals: any, videoLink: string): any {
        if (visuals && videoLink) {
            visuals.videoLink = visuals.youtubeLink = "";

            // CHECKS FOR YOUTUBE LINK
            if ((videoLink.split('/')[2] == 'youtube.com' || videoLink.split('/')[2] == 'www.youtube.com') && videoLink.includes('embed'))
                visuals.youtubeLink = videoLink;
            else if (videoLink.split('/')[2] == 'youtube.com' || videoLink.split('/')[2] == 'www.youtube.com')
                visuals.youtubeLink = "https://www.youtube.com/embed/" + videoLink.split('watch?v=')[1];
            else if (videoLink.split('/')[2] == 'youtu.be')
                visuals.youtubeLink = "https://www.youtube.com/embed/" + videoLink.split('youtu.be/')[1];

            // CHECK FOR VIMEO LINK   https://vimeo.com/223768305 --> https://player.vimeo.com/video/223768305
            else if (videoLink.split('/')[2] == 'vimeo.com' || videoLink.split('/')[2] == 'www.vimeo.com')
                visuals.youtubeLink = "https://player.vimeo.com/video/" + videoLink.split('vimeo.com/')[1];

            // CHECK FOR WISTIA LINK https://venturepact.wistia.com/medias/smyu6n7e4v --> smyu6n7e4v
            else if (videoLink.split('/')[2] && videoLink.split('/')[2].includes('wistia.com') && videoLink.split('/')[4]) {
                visuals.videoWistiaLink = videoLink.split('/')[4].split('?')[0];
                this._script.loadScriptFromSrc(`https://fast.wistia.com/embed/medias/${visuals.videoWistiaLink}.jsonp`).then(data => { });
                this._script.loadScriptFromSrc("https://fast.wistia.com/assets/external/E-v1.js").then(data => { });
            }
            else if (/(.mp4|.ogg|.WebM)/.test(videoLink))
                visuals.videoLink = videoLink;

            if (visuals.youtubeLink || visuals.videoLink)
                visuals.videoWistiaLink = '';
        }
    }

    public getGradedDevGraphDetails(constQuestionList: any, visuals: any) {
        let values = [], xAxisCategories = [];

        if (constQuestionList.length <= 10) {
            const randomPercentages = this.gradedRandomPercentages(constQuestionList.length);
            const randomCorrect = Math.floor((Math.random() * (constQuestionList.length) + 1));
            constQuestionList.forEach((element, index) => {
                values.push(
                    {
                        name: randomCorrect == (index + 1) ? "Your Score" : "Other's Score",
                        y: visuals.graph.titleColor == 'percentage' ? randomPercentages[index] : Math.floor((Math.random() * (200) + 1)), // if absolute select random number between 1 to 200
                        color: randomCorrect == (index + 1) ? visuals.graph.colors[0] : visuals.graph.colors[1]
                    }
                );
            });
            xAxisCategories = constQuestionList.map(val => val.substr(1));
        } else if (constQuestionList.length <= 30) {
            const randomPercentages = this.gradedRandomPercentages(Math.ceil(constQuestionList.length / 2));
            const randomCorrect = Math.floor((Math.random() * (Math.ceil(constQuestionList.length / 2)) + 1));
            let tempXAxisCategories = [];
            xAxisCategories = constQuestionList.map(val => val.substr(1));
            constQuestionList.forEach((val, index: number) => {
                if ((index % 2) == 0) {
                    if (xAxisCategories[index + 1])
                        tempXAxisCategories.push(`${xAxisCategories[index]} to ${xAxisCategories[index + 1]}`);
                    else
                        tempXAxisCategories.push(xAxisCategories[index]);
                    values.push(
                        {
                            name: randomCorrect == (Math.floor(index / 2) + 1) ? "Your Score" : "Other's Score",
                            y: visuals.graph.titleColor == 'percentage' ? randomPercentages[(Math.floor(index / 2))] : Math.floor((Math.random() * (200) + 1)), // if absolute select random number between 1 to 200
                            color: randomCorrect == (Math.floor(index / 2) + 1) ? visuals.graph.colors[0] : visuals.graph.colors[1]
                        }
                    );
                }
            });
            xAxisCategories = tempXAxisCategories;
        } else {
            const randomPercentages = this.gradedRandomPercentages(Math.ceil(constQuestionList.length / 5));
            const randomCorrect = Math.floor((Math.random() * (Math.ceil(constQuestionList.length / 5)) + 1));
            let tempXAxisCategories = [];
            xAxisCategories = constQuestionList.map(val => val.substr(1));
            constQuestionList.forEach((val, index: number) => {
                if ((index % 5) == 0) {
                    if (xAxisCategories[index + 5])
                        tempXAxisCategories.push(`${xAxisCategories[index]} to ${xAxisCategories[index + 5]}`);
                    else
                        tempXAxisCategories.push(`${xAxisCategories[index]} to ${xAxisCategories[index + (constQuestionList.length - 1 - index)]}`);
                    values.push(
                        {
                            name: randomCorrect == (Math.floor(index / 5) + 1) ? "Your Score" : "Other's Score",
                            y: visuals.graph.titleColor == 'percentage' ? randomPercentages[(Math.floor(index / 5))] : Math.floor((Math.random() * (200) + 1)), // if absolute select random number between 1 to 200
                            color: randomCorrect == (Math.floor(index / 5) + 1) ? visuals.graph.colors[0] : visuals.graph.colors[1]
                        }
                    );
                }
            });
            xAxisCategories = tempXAxisCategories;
        }
        return [values, xAxisCategories];
    }

    public getGradedGraphDetails(data: any, visuals: any, graphNow: any) {
        let countSum = 0;
        data.map(item => countSum += item.count);
        let xAxisCategories: any[] = [], values: any[] = [];
        if (data.length <= 10) {        // if number of bars in graphs is less than or equal to 10 
            data.forEach(element => {
                xAxisCategories.push(element._id);
                values.push(
                    this.jsonBuilderHelper.getJSONBuilt().formula[0].value == element._id ?
                        {
                            name: "Your Score",
                            y: visuals.graph.titleColor == 'percentage' ? Number(((element.count / countSum) * 100).toFixed(2)) : Number(element.count),
                            color: graphNow.colors[0]
                        }
                        : {
                            name: "Other's Score",
                            y: visuals.graph.titleColor == 'percentage' ? Number(((element.count / countSum) * 100).toFixed(2)) : Number(element.count),
                            color: graphNow.colors[1]
                        }
                );
            });
        } else if (data.length <= 30) {     // if number of bars in graphs is greater than 10 and less than equal to 30
            data.forEach((element, index: number) => {
                if ((index % 2) == 0) {
                    let avgCount = 0;
                    if (data[index + 1]) {
                        xAxisCategories.push(`${data[index]._id} to ${data[index + 1]._id}`);
                        avgCount = (Number(data[index].count) + Number(data[index + 1].count)) / 2;
                    } else {
                        xAxisCategories.push(data[index]._id);
                        avgCount = Number(data[index].count);
                    }
                    values.push(
                        this.jsonBuilderHelper.getJSONBuilt().formula[0].value == element._id ?
                            {
                                name: "Your Score",
                                y: visuals.graph.titleColor == 'percentage' ? Number(((avgCount / countSum) * 100).toFixed(2)) : Number(avgCount),
                                color: graphNow.colors[0]
                            }
                            : {
                                name: "Other's Score",
                                y: visuals.graph.titleColor == 'percentage' ? Number(((avgCount / countSum) * 100).toFixed(2)) : Number(avgCount),
                                color: graphNow.colors[1]
                            }
                    );
                }
            });
        } else {        // if number of bars in graphs is greater than 30
            data.forEach((element, index: number) => {
                if ((index % 5) == 0) {
                    let avgCount = 0;
                    if (data[index + 5]) {
                        xAxisCategories.push(`${data[index]._id} to ${data[index + 5]._id}`);
                        for (let i = index; i < index + 5; i++)
                            avgCount += Number(data[i].count);
                        avgCount /= 5;
                    } else {
                        let lastIndex = index + (data.length - 1 - index);
                        xAxisCategories.push(`${data[index]._id} to ${data[lastIndex]._id}`);
                        for (let i = index; i < lastIndex; i++)
                            avgCount += Number(data[i].count);
                        avgCount /= lastIndex - index;
                    }
                    values.push(
                        this.jsonBuilderHelper.getJSONBuilt().formula[0].value == element._id ?
                            {
                                name: "Your Score",
                                y: visuals.graph.titleColor == 'percentage' ? Number(((avgCount / countSum) * 100).toFixed(2)) : Number(avgCount),
                                color: graphNow.colors[0]
                            }
                            : {
                                name: "Other's Score",
                                y: visuals.graph.titleColor == 'percentage' ? Number(((avgCount / countSum) * 100).toFixed(2)) : Number(avgCount),
                                color: graphNow.colors[1]
                            }
                    );
                }
            });
        }

        return [values, xAxisCategories];
    }
}