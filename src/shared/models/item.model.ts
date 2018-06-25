import { ResultDisclaimer } from './../../templates/controls/resultdisclaimer/resultdisclaimer.component';
import { Serializable } from './serializeable.interface';
import { ITEMS } from './itemNames.store';
declare var jQuery: any;
export class Item implements Serializable<Item> {

  _id: string = '';
  order: number = 0;
  type: string = '';
  name: string = '';
  condition: string = '';
  columneLayout: string = '1';
  imageWidth: string = '';
  showButton: boolean = false;
  optionObj: any[] = [];
  visible: boolean = true;
  isIconPresent: boolean = false;
  touched: boolean = false;
  answered: boolean = false;
  defaultClass: string = '';
  hideDuplicates: Boolean = false;
  formulaIndex: string = '';
  imageVisible: boolean = false;
  optionImageVisible: boolean = false;
  imageURL: string = 'https://cdn.filestackcontent.com/m5ovgp6OTaGFDRFk8dRJ';
  imageName: string = '';
  postfix: string = '';
  redirect_url: string = 'http://outgrow.co';
  scaleArray: any = [];
  disclaimer_pages: any = {
    landing: false,
    question: false,
    result: true
  };
  analytics_segmentation: any = {
    enabled: false,
    fb_event: 'ViewContent',
    fb_tag: 'Tag',
    fb_value: '55',
    ga_eventCategory: 'Category',
    ga_eventAction: 'Action',
    ga_eventLabel: 'Label',
    ga_eventValue: '55',
    fb_ans_event: 'ViewContent',
    fb_ans_tag: 'Tag',
    fb_ans_value: '55',
    ga_ans_eventCategory: 'Category',
    ga_ans_eventAction: 'Action',
    ga_ans_eventLabel: 'Label',
    ga_ans_eventValue: '55',
  };
  video: any = {
    visible: false,
    youtubeLink: 'https://www.youtube.com/embed/N-P_8ACSHas',
    videoWistiaLink: '',
    videoLink: ''
  };
  props: any = {
    title: '',
    followUpText: 'true', // it is also used for isPrimary for cta selection
    postTitle: '',
    currentValue: '',
    currentLink: [],
    currentLabel: '',
    defaultValue: '',
    correctMessage: 'Correct',
    errorMessage: 'Incorrect',
    helpText: '',
    minVal: 10,
    maxVal: 500,
    steps: 1,
    scale: false,
    unit: '',
    postfix: false,
    email_lead: false
  };
  config: any = {
    type: 'text',
    showHelp: false,
    showControl: '',
    attr: {
      class: '',
      style: '',
      width: '',
      height: '',
      logoClass: 'horz'

    },
    validations: {
      required: {
        status: false,
        message: 'This question is mandatory'
      },
      minLength: {
        status: false
      },
      maxLength: {
        status: false
      }
    },
    maxSelections: '',
    direction: '',
    placeholder: 'Default Placeholder'
  };
  options: any = [
    {
      type: '',
      label: 'Option',
      value: 1,
      selected: false,
      defualtselected: false,
      icon: '',
      isCorrect: false,
      previousIcons: [],
      title: '',
      description: '',
      hashIndex: 0,
      imageURL: 'https://cdn.filestackcontent.com/m5ovgp6OTaGFDRFk8dRJ',
      imageName: '',
      links: {
        heading: 'Share Your Results',
        sharePopupTitle: 'Your share title goes here',
        sharePopupDescription: 'Your share description goes here',
        cta: {     //Its title and desription is at option.title and option.description respectively
          ctaVisible: false,
          message: 'Thank You For Submitting!',
          open_in_tab: true
        },
        share: {
          visible: false,
          isFacebook: true,
          isTwitter: false,
          isLinkedIn: false,
          isVKontakte: false,
          isWhatsapp: false,
          isMail: false,
          isMessenger: false,
          title: 'Share title goes here | via @outgrowco',
          description: 'Share description goes here',
          shareImg: '',
          url: 'http://outgrow.co',
          showAsPopup: false
        },
        like: {
          visible: false,
          isFacebook: true,
          isTwitter: false,
          isVKontakte: false,
          fbUrl: 'http://facebook.com/outgrowco',
          twitterHandle: 'outgrowco',
          vkProfile: '460614642',
          showAsPopup: false
        }
      },
      visuals: {
        visible: true,
        type: 'image',
        // graph: {
        //   type: 'bar',
        //   rawJSON: '',
        //   title: 'Chart Title',
        //   xAxis: 'XAxis Title',
        //   yAxis: 'YAxis Title',
        //   colors: ['#1483b7'],
        //   legend: true,
        //   legendPosition: 'bottom',
        //   axis: true,
        //   grid: true
        // },
        videoLink: '',
        youtubeLink: 'https://www.youtube.com/embed/N-P_8ACSHas',
        videoWistiaLink: '',
        imageLink: 'https://dlvkyia8i4zmz.cloudfront.net/DcgzVVEJTPaZYy1WF9s5_img.gif',
        imageName: 'default.jpg'
      },
      attr: {
        class: '',
        style: '',
        lower: '>=',
        upper: '<'
      },
      productFetchConditions: []
    }
  ];
  fields: any = [
    {
      type: 'fullName',
      name: 'My Name is',
      placeholder: 'John Doe',
      value: '',
      key: 'fullname',
      unique: false,
      subType: 'fullname',
      fileName: '',
      fieldsArray: [],
      emailValidator: false,
      validations: {
        required: {
          status: true,
          message: 'Field is Required'
        },
        minLength: {
          status: false
        },
        maxLength: {
          status: false
        }
      },
      icon: '',
      attr: {
        class: 'false', // using this for by default checked CheckBox in leadform
        style: '',
      }
    },
    {
      type: 'email',
      name: 'My Email is',
      placeholder: 'John@outgrow.co',
      value: '',
      key: 'email',
      subType: 'email',
      unique: false,
      fileName: '',
      fieldsArray: [],
      emailValidator: false,
      validations: {
        required: {
          status: true,
          message: 'Field is Required'
        },
        minLength: {
          status: false
        },
        maxLength: {
          status: false
        }
      },
      icon: '',
      attr: {
        class: 'false', // using this for by default checked CheckBox in leadform
        style: '',
      }
    }
  ];

  constructor(type?: string, title?: string, helpText?: string, placeholder?: string, defaultClass?: string, minVal?: number, maxVal?: number, followUpText?: string, imageURL?: string) {
    //generate unique id on creation
    this._id = 'q_' + Math.floor(Math.random() * (100000 - 2 + 1)) + 2;
    //do rest stuff
    this.type = type;
    this.props.title = title || '';
    this.props.followUpText = followUpText || '';
    this.props.helpText = helpText || '';
    this.config.placeholder = placeholder || this.config.placeholder;
    this.defaultClass = defaultClass || this.defaultClass;
    this.order = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
    this.props.minVal = minVal || 10;
    this.props.maxVal = maxVal || 500;
    this.imageURL = imageURL || this.imageURL;
    //auto assign names on item creation based oon type
    this.name = ITEMS[type];
  }

  public setResulTTitle(title: string) {
    this.props.title = title;
  }
  public setItemType(type: string) {
    this.type = type;
  }
  public setCurrentValue(value: string) {
    this.props.currentValue = value;
  }
  public setFormulaIndex(index: string) {
    this.formulaIndex = index;
  }

  public setVisibility(visible: boolean) {
    this.visible = visible;
  }

  public setScale(scale: boolean) {
    this.props.scale = scale;
  }

  public setLeadPlaceholder() {
    this.fields[0].placeholder = 'Name';
    this.fields[1].placeholder = 'Email';
  }

  public setOptionImageVisibility(visible: boolean, width: string) {
    this.config.attr.width = width;
    this.optionImageVisible = visible;
  }
  public qustionImageVisibility(visible: boolean) {

    this.imageVisible = visible;
  }
  public setTitle(title: string) {
    this.props.title = title;
  }

  public setPostTitle(postTitle: string) {
    this.props.postTitle = postTitle;
  }

  public setHelptext(helpText: string) {
    this.props.helpText = helpText;
  }

  public setPlaceHolder(placeholder: string) {
    this.config.placeholder = placeholder;
  }

  public setOptions(...options: any[]) {
    for (let option in options)
      this.options.push(options[option]);
  }

  public getField() {
    return JSON.parse(JSON.stringify(this.fields[0]));
  }

  public getOption() {
    return this.options[0];
  }

  public addOptions(addOptions: any[]) {
    let defaultOption = this.options[0];
    this.options = [];
    for (let option in addOptions) {
      defaultOption.type = addOptions[option].type;
      defaultOption.selected = addOptions[option].selected;
      defaultOption.label = addOptions[option].label;
      defaultOption.icon = addOptions[option].icon;
      defaultOption.title = addOptions[option].title;
      defaultOption.hashIndex = option;
      this.options.push(Object.assign({}, defaultOption));
    }
  }

  public addFieldToCheckbox(addOptions: any[]) {
    let defaultOption = this.options[0];
    this.options = [];
    for (let option in addOptions) {
      defaultOption.label = addOptions[option].label;
      defaultOption.icon = addOptions[option].icon;
      defaultOption.imageURL = addOptions[option].imageURL || defaultOption.imageURL;
      defaultOption.value = addOptions[option]['value'] ? addOptions[option].value : Number(option) + 1;
      defaultOption.hashIndex = option;
      this.options.push(Object.assign({}, defaultOption));
    }
  }

  public addFieldToEcomCheckbox(addOptions: any[]) {
    let defaultOption = this.options[0];
    this.options = [];
    for (let option in addOptions) {
      defaultOption.label = addOptions[option].label;
      defaultOption.icon = addOptions[option].icon;
      defaultOption.imageURL = addOptions[option].imageURL || defaultOption.imageURL;
      defaultOption.value = 0;
      defaultOption.hashIndex = option;
      this.options.push(Object.assign({}, defaultOption));
    }
  }

  public addLinksToFooter(addLinks: any[]) {
    let defaultOption = this.options[0];
    // let defaultOption = this.options[0];
    this.options = [];
    for (let option in addLinks) {
      defaultOption.label = addLinks[option].label;
      defaultOption.value = addLinks[option].value;
      defaultOption.title = addLinks[option].title ? addLinks[option].title : '';
      this.options.push(Object.assign({}, defaultOption));
    }
  }

  deserialize(input: any): Item {
    let self: any = this;
    for (let prop in input) {
      if (typeof input[prop] === 'object') {

        if (prop === 'options' && input[prop].length < 1) {
          self[prop].splice(0, 1);
        }
        if (prop === 'fields' && input[prop].length < 2) {
          self[prop].splice(0, 2);
        }
        jQuery.extend(true, self[prop], input[prop]);

      } else {
        self[prop] = input[prop];
      }
    }
    return self;
  }

  updateTextFieldForT7(subType: string, placeholder: string, prefix: string, postFix: string) {
    this.config.attr.style = prefix;
    this.postfix = postFix;
    this.config.placeholder = placeholder;
    this.config.type = subType;
  }

  setResultLeadformPosition(placement: string) {
    this.config.direction = placement;
  }
}
