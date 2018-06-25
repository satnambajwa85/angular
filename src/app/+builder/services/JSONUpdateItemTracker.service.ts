import { Injectable } from '@angular/core';
import { Section, Page, App, Item } from '@builder/models';

declare var jQuery: any;
export class JSONItemTracker {
  public UnSavedItems: Item[] = [];
  public UnSavedSections: Section[] = [];
  public UnSavedPage: Page;
  public UnSavedData: any={app:{},page:{},sections:[],items:[]};

  setUnSavedItems(trackitem: Item) {
    let index = jQuery.inArray(trackitem, this.UnSavedItems);

    if (index !== -1) {
      this.UnSavedItems[index] = trackitem;
    }
    else {
      this.UnSavedItems.push(trackitem);
    }
    this.UnSavedSections = [];
    this.UnSavedPage = undefined;
  }

  setUnSavedSections(trackSection: Section) {
    let index = jQuery.inArray(trackSection, this.UnSavedSections);

    if (index !== -1) {
      this.UnSavedSections[index] = trackSection;
    }
    else {
      this.UnSavedSections.push(trackSection);
    }

    this.UnSavedPage = undefined;
    this.UnSavedItems = [];
  }

  setUnSavedPage(trackPage: any) {
    this.UnSavedSections = [];
    this.UnSavedItems = [];
    this.UnSavedPage = trackPage;
  }

  getUnSavedData() {
    return {
      app: '',
      sections: this.UnSavedSections,
      items: this.UnSavedItems,
      page: (this.UnSavedPage==undefined)?'':this.UnSavedPage
    };
  }

  resetUnsavedData() {
    this.UnSavedPage = undefined;
    this.UnSavedSections = [];
    this.UnSavedItems = [];
  }
}
