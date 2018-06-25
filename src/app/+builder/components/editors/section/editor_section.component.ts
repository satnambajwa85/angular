import { FroalaService } from './../../../services/froala.service';
import { Component, Input, ViewEncapsulation, AfterViewInit, OnChanges, OnInit } from '@angular/core';
import { JSONBuilder } from '../../../services/JSONBuilder.service';
import { BuilderService } from '../../../services/builder.service';
import { JSONItemTracker } from '../../../services/JSONUpdateItemTracker.service';

declare var jQuery: any;
declare var ga: any;
// declare var _kmq: any;

@Component({
  selector: 'editor-section',
  templateUrl: './assets/html/editor_section.component.html',
  encapsulation: ViewEncapsulation.None
})

export class EditorSection implements AfterViewInit, OnChanges, OnInit {
  @Input() section: any;
  public froalaSectionTitle: any = {};
  tempName:string;
  iconArray: string[] = ['android', 'devices', 'desktop_mac', 'tablet', 'business', 'call', 'call_end',
    'chat', 'chat_bubble', 'comment', 'contact_mail', 'contact_phone', 'forum',
    'import_contacts', 'import_export', 'invert_colors_off', 'live_help',
    'location_off', 'location_on', 'no_sim', 'phonelink_erase', 'phonelink_lock',
    'phonelink_ring', 'phonelink_setup', 'portable_wifi_off', 'present_to_all',
    'ring_volume', 'rss_feed', 'screen_share', 'speaker_phone', 'stay_current_landscape',
    'stay_current_portrait', 'swap_calls', 'textsms', 'add_circle', 'archive', 'clear',
    'content_copy', 'content_cut', 'content_paste', 'create', 'delete_sweep', 'drafts',
    'filter_list', 'flag', 'font_download', 'forward', 'gesture', 'inbox', 'link', 'low_priority',
    'mail', 'move_to_inbox', 'weekend', 'access_alarm', 'devices', 'airplanemode_active',
    'airplanemode_inactive', 'battery_alert', 'battery_charging_full', 'bluetooth',
    'brightness_auto', 'brightness_medium', 'sd_storage', 'settings_system_daydream',
    'storage', 'attach_file', 'attach_money', 'border_color', 'bubble_chart'
  ];

  constructor(
    public _JSONBuilder: JSONBuilder,
    public _builderService: BuilderService,
    public _ItemTrackService: JSONItemTracker,
    private froalaService: FroalaService
  ) {
    this.emitterHandler();
  }

  ngOnInit() {
    this.tempName = this._JSONBuilder.getJSONBuilt().template;
    this.initWysiwyg();
  }

  emitterHandler() {
    this.froalaService.getEmitter().subscribe(change => {
      change === 'advanceEditor' && this.initWysiwyg()
    });
  }


  initWysiwyg() {
    this.froalaSectionTitle.options = false;
    setTimeout(() => {
      this.froalaSectionTitle.options = this.froalaService.getOptions({ handler: this.froalaSectionTitle, isAddVariable: false });
    });
  }
  ngAfterViewInit() {
    //after editor initialized..
    jQuery('.option-icons .btn').on('click', function () {
      jQuery(this).parent().addClass('open');
    });


    jQuery('.choose-icon').on('click', function () {
      jQuery(this).parent().addClass('open');
    });
    jQuery('body').on('click', function (e: any) {
      if (!jQuery('.choose.open').is(e.target)
        && jQuery('.choose.open .material-icon-dropdown').has(e.target).length === 0
        && jQuery('.choose.open').has(e.target).length === 0
      ) {
        jQuery('.choose').removeClass('open');
      }
    });
  }
  onChangeDescription(section: any) {
    section.showDesc = !section.showDesc;
  }
  onChangeShowIcon(section: any) {
    section.showIcon = !section.showIcon;
  }
  changeIcon(section: any, event: any) {
    section.icon = event.target.value;
    //store previously selected Icons
    //option.previousIcons.push(event.target.value);
    if (section.previousIcons.indexOf(event.target.value) === -1) {

      if (event.target.value !== '') {
        if (section.previousIcons.length > 2) {
          section.previousIcons.splice(0, 1);
          section.previousIcons.push(event.target.value);
        } else {
          section.previousIcons.push(event.target.value);
        }
      }
    }
  }

  ngOnChanges() {
    this._ItemTrackService.resetUnsavedData();
    this._ItemTrackService.setUnSavedSections(this.section);
  }

  callGA(str: string, section: any = {}) {
    switch (str) {
      case "HELPTEXT":
        if (section.showDesc) {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ToggleHelpTextOn');
          // _kmq.push(['record', 'Builder Toggle Help Text On']);
        }
        else {
          ga('markettingteam.send', 'event', 'Builder', 'Toggle', 'ToggleHelpTextOff');
          // _kmq.push(['record', 'Builder Toggle Help Text Off']);
        }
        break;
    }
  }
}



