import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Radio from "@material-ui/core/Radio";
import ContainerNavbar from "../../../../gigaLayout/container-navbar";
import ZqTable from "../../../../utils/Table/table-component";
// import "../../../../scss/billing.scss";
import "../../../../scss/settings.scss";
import Avatar from "react-avatar-edit";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import RestoreOutlinedIcon from "@material-ui/icons/RestoreOutlined";
import removeCircle from "../../../../assets/images/remove_circle.png";
import addCircle from "../../../../assets/images/add_circle.png";
import { SelectPicker } from "rsuite";
import PublishOutlinedIcon from "@material-ui/icons/PublishOutlined";
import LinearProgress from "@material-ui/core/LinearProgress";
import ZqHistory from "../../../../gigaLayout/change-history";
// import { Drawer, DatePicker } from "rsuite";
import moment from "moment";
import axios from "axios";
import ZenForm from '../../../input/form';
import AddData from "./settings.json";
import AddressForm from "./input_name_address.json";
import GSTINForm from './input_gstin.json';
import emailServerForm from './input_email-server.json';
import paymentGatewayForm from './input_payment-gateway.json';
import smsGatewayForm from './input_sms-gateway.json';
import Button from "@material-ui/core/Button";
import { Alert } from 'rsuite';
import Loader from "../../../../utils/loader/loaders";
import UploadSVGIcon from "../../../../assets/icons/settings-logo-upload.svg";
// import profilePicture from '../../../assets/images/profile-large.png';
// import templateCode from './temp';
import CircularProgress from '@material-ui/core/CircularProgress';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Timeline, Drawer } from 'rsuite';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import HistoryIcon from '@material-ui/icons/History';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLogoTab: false,
      baseData: " ",
      src: null,
      crop: {
        unit: '%',
        width: 30,
        height: 30
      },
      logoName: "None",
      shareHoldingVersion: " ",
      logoPictureVersion: "0",
      logoText: " ",
      defaultnumberFormat: true,
      defaultImage: true,
      filterNumbering: " ",
      previewNumberName: "Demand Note",
      previewVersion: " ",
      companyLogo: " ",
      getNumArray: [],
      DemandNoteNumber: " ",

      ReceiptNumber: " ",
      StatementNumber: " ",
      StatementNumberVendor: " ",
      RefundNumberVendor: " ",
      RefundNumber: " ",
      showDefaultLogo: true,
      defNumber: "DN",
      slash: " ",
      defYear: " ",
      slash2: " ",
      defDigits: " ",
      previousLogoPicture: " ",
      // logoPicture: " ",
      logoPicture2: " ",
      loader: false,
      number: " ",
      slash: " ",
      year: " ",
      slash2: " ",
      digits: " ",
      logoPicture: "",
      env: JSON.parse(localStorage.getItem("env")),
      email: localStorage.getItem("email"),
      channel: localStorage.getItem("channel"),
      authToken: localStorage.getItem("auth_token"),
      orgId: localStorage.getItem("orgId"),
      userId: localStorage.getItem("userID"),
      instituteId: localStorage.getItem("instituteId"),
      tab: 0,
      fileSize: "",
      pdfLoaded: 0,
      filename: "",
      // history: false,
      value: new Date(),
      historyData: [
        {
          createdAt: "2020-06-30T12:16:54",
          created_at: "23/07/2020 (02:14 PM)",
          currentData: "",
          description: ["Logo changed by Prabha"],
          entity: "Setting",
          entityInstanceId: "5efb2d36540313064d84f526",
          orgEmail: "demouser233@demoautoparts.com",
          orgId: "5eeb331b4ada2a1f00727980",
          updatedAt: "2020-06-30T12:16:54",
          userId: "justin@webdesignmagics.com",
          userDetails: 'prashanth@wdm.com',
          version: 2,
          __v: 0,
          _id: "5efb2d36540313064d84f527",
        },
        {
          createdAt: "2020-06-30T12:16:54",
          created_at: "23/07/2020 (12:14 PM)",
          currentData: "",
          description: ["Logo changed by Prabha"],
          entity: "Setting",
          entityInstanceId: "5efb2d36540313064d84f526",
          orgEmail: "demouser233@demoautoparts.com",
          orgId: "5eeb331b4ada2a1f00727980",
          updatedAt: "2020-06-30T12:16:54",
          userId: "justin@webdesignmagics.com",
          userDetails: 'prashanth@wdm.com',
          version: 1,
          __v: 0,
          _id: "5efb2d36540313064d84f527",
        },
      ],
      templateData: [
        {
          createdAt: "2020-06-30T12:16:54",
          created_at: "23/07/2020 (02:14 PM)",
          currentData: "",
          description: ["Temaplate has been changed"],
          entity: "Setting",
          entityInstanceId: "5efb2d36540313064d84f526",
          orgEmail: "demouser233@demoautoparts.com",
          orgId: "5eeb331b4ada2a1f00727980",
          updatedAt: "2020-06-30T12:16:54",
          userId: "justin@webdesignmagics.com",
          userDetails: 'prashanth@wdm.com',
          version: 2,
          __v: 0,
          _id: "5efb2d36540313064d84f527",
        },
        {
          createdAt: "2020-06-30T12:16:54",
          created_at: "23/07/2020 (12:14 PM)",
          currentData: "",
          description: ["Template was added"],
          entity: "Setting",
          entityInstanceId: "5efb2d36540313064d84f526",
          orgEmail: "demouser233@demoautoparts.com",
          orgId: "5eeb331b4ada2a1f00727980",
          updatedAt: "2020-06-30T12:16:54",
          userId: "justin@webdesignmagics.com",
          userDetails: 'prashanth@wdm.com',
          version: 1,
          __v: 0,
          _id: "5efb2d36540313064d84f527",
        },
      ],
      history: false,
      resText: "Fetching Data...",
      showHistory: false,
      containerNav: {
        isBack: true,
        name: "Settings",
        isName: true,
        total: 0,
        isTotalCount: false,
        isSearch: false,
        isSort: false,
        isPrint: false,
        isShare: false,
        isNew: false,
        isDownload: false,
        newName: "Send",
        preview: false,
      },
      addressFormData: AddressForm,
      smsGatewayData: smsGatewayForm,
      emailServerFormData: emailServerForm,
      paymentGatewayData: paymentGatewayForm,
      dataDN: [
        {
          label: "None",
          value: "None",
        },
        {
          label: "DN",
          value: "DN",
        },
        {
          label: "DMN",
          value: "DMN",
        }
      ],
      dataRCPT: [
        {
          label: "None",
          value: "None",
        },
        {
          label: "RCPT",
          value: "RCPT",
        },
        {
          label: "RCT",
          value: "RCT",
        },
      ],
      dataSTMT: [
        {
          label: "None",
          value: "None",
        },
        {
          label: "STMT",
          value: "STMT",
        }
      ],
      dataRefund: [
        {
          label: "None",
          value: "None",
        },
        {
          label: "RERCT",
          value: "RERCT",
        }
      ],
      dataSlash: [
        {
          label: "None",
          value: "None",
        },
        {
          label: "/",
          value: "/",
        },
        {
          label: "-",
          value: "-",
        },
      ],
      dataYear: [
        {
          label: "None",
          value: "None",
        },
        {
          label: "YYYY-YY",
          value: "YYYY-YY",
        },
        {
          label: "YY-YY",
          value: "YY-YY",
        },
        {
          label: "yyyy",
          value: "yyyy",
        },
        {
          label: "yy",
          value: "yy",
        },
        {
          label: "mm-yy",
          value: "mm-yy",
        },
        {
          label: "Mmm-yy",
          value: "Mmm-yy",
        },
        {
          label: "ddmmyy",
          value: "ddmmyy",
        },
        {
          label: "ddmmyyyy",
          value: "ddmmyyyy",
        },
        {
          label: "ddMmmyyyy",
          value: "ddMmmyyyy",
        },
      ],
      dataDgts: [
        {
          label: "2",
          value: "2",
        },
        {
          label: "3",
          value: "3",
        },
        {
          label: "4",
          value: "4",
        },
        {
          label: "5",
          value: "5",
        },
      ],

      tablerows: [
        { name: "Shareholder Name 1", sharesHeld: "5000", "%held": "20" },
        { name: "Shareholder Name 2", sharesHeld: "5000", "%held": "24" },
        { name: "Shareholder Name 3", sharesHeld: "5000", "%held": "30" },
        { name: "Shareholder Name 3", sharesHeld: "5000", "%held": "30" },

        // { name: "Shareholder Name 4", "%held": "5000", heldpercentage: "40" },
      ],
      opendialog: false,
      addData: AddData,
      numberingData: 0,
      emailConfigJson: undefined,
      showPreviewConfig: false,
      configFileName: '',
      institutestateName: '',
      institutestateCode: '',
      allState: {},
      loaderStatus: false,
      selectedPaymentGateway: '',
      selectedEmailServer: '',
      selectedSMSGateway: ''
    };
    this.inputFile = React.createRef(this.inputFile);
    this.instituteRef = React.createRef(this.instituteRef);
    this.logoRef = React.createRef(this.logoRef);
    this.emailServerRef = React.createRef(this.emailServerRef);
    this.smsGatewayRef = React.createRef(this.smsGatewayRef);
    this.paymentGatewayRef = React.createRef(this.paymentGatewayRef);
  }

  openLogo = () => {
    this.setState({
      openshareholders: false,
      openESign: false,
      history: true,
      // shareHoldersHistory: false,
    });
  };
  selectTabs = (event, newValue) => {
    this.setState({ tab: newValue }, () => {
      // if (newValue === 1 || newValue === 2) {
      //   this.setState({ isLogoTab: true })
      // }
      // if (newValue === 0 || newValue === 3 || newValue === 4 || newValue === 5) {
      //   this.setState({ isLogoTab: false })
      // }
    })
  };

  fileSelected = (ev, i) => {
    console.log(ev.target.files);
    let file = ev.target.files;
    this.setState({ filename: file[0].name, upload: true }, () => {
      this.onLoad(this.state.pdfLoaded);
    });
  };
  uploadEmailConfigFile = (event) => {
    const jsonFile = event.target.files[0];

    if (!jsonFile) {
      alert("Please select JSON format file.");
      this.setState({ configFileName: '', showPreviewConfig: true });
      return false;
    }

    if (!jsonFile.name.match(/\.(json)$/)) {
      alert("Selected File is invalid. Please Select .json file")
      this.setState({ configFileName: '', showPreviewConfig: true });
      return false;
    }

    if (event.target.files.length > 0) {
      var reader = new FileReader();
      console.log(jsonFile.name)
      reader.onload = (event) => {
        console.log(event)
        var jsonObj = JSON.parse(event.target.result);
        console.log(jsonObj)
        this.setState({ emailConfigJson: jsonObj, configFileName: jsonFile.name, showPreviewConfig: false });
      }
      reader.readAsText(jsonFile);
    }
    else return false
  }

  onLoad = (load) => {
    let loadValue = this.state.pdfLoaded + 5;
    if (this.state.pdfLoaded < 100) {
      this.setState({ pdfLoaded: loadValue }, () => {
        setTimeout(() => {
          this.onLoad(loadValue);
        }, 100);
      });
    } else {
      setTimeout(() => {
        this.props.onUploadConfirm();
      }, 1000);
    }
  };
  selectValueInv = (value, item, event) => {
    console.log(value, "select options");
    this.setState({ number: value })
  };
  selectValueSlash = (value, item, event) => {
    console.log(value, "select slash in INV");
    this.setState({ slash: value })

  }
  selectValueYear = (value, item, event) => {
    console.log(value, "select year format in INV");
    this.setState({ year: value })

  }
  selectValueSlash2 = (value, item, event) => {
    console.log(value, "select slash2 in INV");
    this.setState({ slash2: value })

  }
  selectValueDigits = (value, item, event) => {
    console.log(value, "select no. of digits in INV");
    this.setState({ digits: value })

  }
  openHistory = () => {
    this.setState({ history: true, showHistory: true });
  };
  onCloseForm = () => {
    this.setState({ showHistory: false });
  };
  getChangeHistory = (entityInstanceId) => {

    let api_data = this.state.historyData;
    let historyData = [];
    api_data.sort((data1, data2) => {
      return Number(data2.created_at) - Number(data1.created_at);
    });
    api_data.map((item) => {
      let date = new Date(
        new Intl.DateTimeFormat("en-US", {
          month: "2-digit",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(item["created_at"])
      );
      let descriptionData = item.description["0"].split(",").map((desc, i) => {
        return (
          <p key={i}>
            <div style={{ display: "flex" }}>
              <span className="span-hist" style={{ width: "5%" }}>
                -
              </span>
              {desc}
            </div>
          </p>
        );
      });
      console.log(descriptionData);
      historyData.push({
        description: descriptionData,
        time: moment(date).format("hh:mm"),
        created_at: item["created_at"]
          ? moment(date).format("DD/MM/YYYY (hh:mm A)")
          : "-",
        version: item.version,
        btn: false,
      });
    });
    this.setState({ historyData: historyData });
  };

  closeModel = () => {
    this.setState({ opendialog: false });
  };

  changeNumbering = (e, item, i) => {
    console.log(item)
    this.setState({ defaultnumberFormat: false, defNumber: " ", numberingData: -1 }, () => {
      var defaultNumberName = item.value.split("/");
      // console.log(defaultNumberName[0])
      this.setState({ dataDN: [] }, () => {
        let dataDN = [{ label: "none", value: "none" }]
        let obj = {}
        obj.label = defaultNumberName[0]
        obj.value = defaultNumberName[0]
        dataDN.push(obj)
        // console.log(obj)
        // console.log(dataDN)
        // console.log(dataDN[1].value)

        this.setState({ dataDN: dataDN, previewNumberName: item.name, previewVersion: item.version, defYear: defaultNumberName[1], defDigits: defaultNumberName[2] },
          () => {
            console.log("split name before", this.state.defNumber)
            this.setState({
              defNumber: String(dataDN[1].value)
            }, () => {
              console.log("split name after", this.state.defNumber)
              this.setState({ numberingData: i });
            })
          })
        console.log(i, ":index");
      })



      // e.preventDefault();

    })
  };
  componentDidMount() {
    this.getData();
    // axios.get(`${this.state.env['newMasterId']}/master/get/org-datas?org=${this.state.orgId}`)
    //   .then(res => {
    //     let orgArray = [];
    //     var data = res.data
    //     data.map(item => {
    //       orgArray.push({
    //         'Company Name': item['legalnameofbusiness'],
    //       })
    //     })
    //     console.log(orgArray[0]["Company Name"]);
    //     var firstLetter = orgArray[0]["Company Name"].charAt(0);
    //     console.log(firstLetter);
    //   })
  }
  getData = () => {
    // this.setState({ loader: true, loaderStatus: false })
    axios.get(`${this.state.env['zqBaseUri']}/setup/settings?instituteid=${this.state.instituteId}`)
      .then(res => {
        this.setState({ loader: true, loaderStatus: false });
        // console.log("settings get api response", res.data);
        this.setState({ companyLogo: "A" })
        let instituteDetails = res.data[0]['instituteDetails']
        let emailServer = res.data[0]['emailServer']
        let paymentGateway = res.data[0]['paymentGateway']
        let smsGateway = res.data[0]['smsGateway']
        let logoData = res.data[0].logo.logo[0]
        let logoPicture = logoData;
        let stateArray = [];
        let institutestateName, institutestateCode, selectedEmailServer, selectedSMSGateway, selectedPaymentGateway;
        //  ------------------------------------
        let institudeDetailsObj = Object.keys(instituteDetails)
        let addressFormArray = [];
        AddressForm.map(item => {
          if (item["name"] !== undefined) {
            addressFormArray.push(item["name"])
          }
        })
        // console.log(AddressForm)
        AddressForm.map((item) => {
          institudeDetailsObj.map(objItem => {
            if (item['name'] == objItem) {
              if (item['name'] === "stateName" && objItem === "stateName") {
                item['defaultValue'] = instituteDetails["stateCode"]
                institutestateName = instituteDetails["stateName"]
                institutestateCode = instituteDetails["stateCode"]
              } else {
                item['defaultValue'] = instituteDetails[objItem]
              }
            }
          })
          return
        })

        let result = addressFormArray.filter(item => institudeDetailsObj.indexOf(item) == -1)
        AddressForm.map(item => {
          result.map(i => {
            if (item["name"] === i) {
              item['defaultValue'] = "";
            }
          })
        })

        //  ------------------------------------
        let smsGatewayDetailsObj = Object.keys(smsGateway)
        smsGatewayForm.map((item, key) => {
          smsGatewayDetailsObj.map(objItem => {
            if (item['name'] == objItem) {
              item['defaultValue'] = smsGateway[objItem]
              if (item['name'] === "smsGateway") {
                selectedSMSGateway = smsGateway["smsGateway"];
              }
            }
          })
          return
        })

        //  ------------------------------------
        let emailServerDetailsObj = Object.keys(emailServer)
        emailServerForm.map((item, key) => {
          emailServerDetailsObj.map(objItem => {
            if (item['name'] == "senderEmail") {
              item['defaultValue'] = emailServer["emailAddress"]
            }
            else if (item['name'] == "emailServer") {
              item['defaultValue'] = emailServer["emailServer"]
              selectedEmailServer = emailServer["emailServer"]
            }

          })
          return
        })

        //  ------------------------------------
        let paymentGatewayDetailsObj = Object.keys(paymentGateway)
        paymentGatewayForm.map((item, key) => {
          paymentGatewayDetailsObj.map(objItem => {
            if (item['name'] == objItem) {
              item['defaultValue'] = paymentGateway[objItem]
              if (item['name'] == "paymentGateway") {
                selectedPaymentGateway = paymentGateway["paymentGateway"]
              }
            }
          })
          return
        })

        //  -------------------------------------------------------
        this.setState({
          addressFormData: AddressForm,
          smsGatewayData: smsGatewayForm,
          emailServerFormData: emailServerForm,
          paymentGatewayData: paymentGatewayForm, showPreviewConfig: true, emailConfigJson: emailServer['config'][0],
          loaderStatus: true, institutestateName, institutestateCode, selectedEmailServer, selectedSMSGateway, selectedPaymentGateway,
          logoPicture, defaultImage: true
        }, () => {
          // let logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MEVBMTczNDg3QzA5MTFFNjk3ODM5NjQyRjE2RjA3QTkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MEVBMTczNDk3QzA5MTFFNjk3ODM5NjQyRjE2RjA3QTkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDowRUExNzM0NjdDMDkxMUU2OTc4Mzk2NDJGMTZGMDdBOSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDowRUExNzM0NzdDMDkxMUU2OTc4Mzk2NDJGMTZGMDdBOSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjjUmssAAAGASURBVHjatJaxTsMwEIbpIzDA6FaMMPYJkDKzVYU+QFeEGPIKfYU8AETkCYI6wANkZQwIKRNDB1hA0Jrf0rk6WXZ8BvWkb4kv99vn89kDrfVexBSYgVNwDA7AN+jAK3gEd+AlGMGIBFDgFvzouK3JV/lihQTOwLtOtw9wIRG5pJn91Tbgqk9kSk7GViADrTD4HCyZ0NQnomi51sb0fUyCMQEbp2WpU67IjfNjwcYyoUDhjJVcZBjYBy40j4wXgaobWoe8Z6Y80CJBwFpunepIzt2AUgFjtXXshNXjVmMh+K+zzp/CMs0CqeuzrxSRpbOKfdCkiMTS1VBQ41uxMyQR2qbrXiiwYN3ACh1FDmsdK2Eu4J6Tlo31dYVtCY88h5ELZIJJ+IRMzBHfyJINrigNkt5VsRiub9nXICdsYyVd2NcVvA3ScE5t2rb5JuEeyZnAhmLt9NK63vX1O5Pe8XaPSuGq1uTrfUgMEp9EJ+CQvr+BJ/AAKvAcCiAR+bf9CjAAluzmdX4AEIIAAAAASUVORK5CYII='
          this.setState({ logoPicture2: logoData });
          this.getSettingsData();
        })

      })
  }
  getSettingsData = () => {
    // this.setState({ addressFormData: AddressForm });
    // axios({
    //   url: `https://apidev.zenqore.com/zq/settings?orgId=${this.state.orgId}`,
    //   method: 'GET'
    // }).then(res => {
    //   console.log("settings get api response", res.data);
    //   var numberingDta = res.data.Numbering;
    //   var companyData = res.data.company;
    var numDataArray = [];
    this.setState({
      DemandNoteNumber: 'DN',
      ReceiptNumber: 'RCPT',
      StatementNumber: 'STMT',
      RefundNumber: 'RERCT'
    }, () => {
      numDataArray.push(
        {
          "name": "Demand Note",
          "value": this.state.DemandNoteNumber,
          "version": "v0"
        },
        {
          "name": "Receipt",
          "value": this.state.ReceiptNumber,
          "version": "v0"
        },
        {
          "name": "Statement",
          "value": this.state.StatementNumber,
          "version": "v0"
        },
        {
          "name": "Refund",
          "value": this.state.RefundNumber,
          "version": "v0"
        })
      this.setState({ getNumArray: numDataArray, companyLogo: "A", logoText: "Change Logo", loader: false })
      // console.log(numDataArray)
    });
    //   this.setState({
    //     DemandNoteNumber: numberingDta.InvoiceNumber.value, PDemandNoteNumber: numberingDta.PurchaseInvoiceNumber.value, ReceiptNumber: numberingDta.Quotation.value, StatementNumber: numberingDta.DebitNoteCustomer.value, StatementNumberVendor: numberingDta.DebitNoteVendor.value, RefundNumber: numberingDta.CreditNoteCustomer.value, RefundNumberVendor: numberingDta.CreditNoteVendor.value
    //     , PurOrder: numberingDta.PurchaseOrder.value, JournalNum: numberingDta.Journal.value, PayrollNum: numberingDta.Payroll.value, PaymentNum: numberingDta.payment.value, ReceiptNum: numberingDta.receipt.value,
    //     ReimNum: numberingDta.reimbursement.value, ReversalNum: numberingDta.reversal.value, SettleNum: numberingDta.settlement.value, ContraNum: numberingDta.Contra.value,
    //     logoPicture2: companyData.logo.value, logoPictureVersion: companyData.logo.version, previousLogoPicture: companyData.logo.prev_value, logoText: "Change Logo"
    //   })
  }

  onBeforeFileLoad(elem) {
    //File size is set to 1.5MB
    if (elem.target.files[0].size > 1500000) {
      Alert.error("Image size cannot be greater than 1.5MB !")
      elem.target.value = "";
    };
  }
  submitReply = () => {
    this.setState({ loader: true }, () => { console.log(this.state.logoPicture) })

    console.log(this.state.tablerows)
    let payloadObject = {
      "user_id": this.state.userId,
      "company": {
        "OrgId": this.state.orgId,
        "logo": this.state.logoPicture,
        "E-signature": "signature",
        "ShareholdingPattern": this.state.tablerows
      },
      "Numbering": {
        "InvoiceNumber": "INV/YYYY-YY/001",
        "PurchaseInvoiceNumber": "EXP/YYYY-YY/001",
        "Quotation": "QO/YYYY-YY/001",
        "DebitNoteCustomer": "DBNC/YYYY-YY/001",
        "DebitNoteVendor": "DBNV/YYYY-YY/001",
        "CreditNoteCustomer": "CRNC/YYYY-YY/001",
        "CreditNoteVendor": "CRNV/YYYY-YY/001",
        "PurchaseOrder": "PO/YYYY-YY/001",
        "Journal": "JRNL/YYYY-YY/001",
        "Payroll": "PYRL/YYYY-YY/001",
        "payment": "PYT/YYYY-YY/001",
        "receipt": "RCT/YYYY-YY/001",
        "reimbursement": "ADV/YYYY-YY/001",
        "reversal": "RINV/YYYY-YY/001",
        "settlement": "STL/YYYY-YY/001",
        "Contra": "CNTR/YYYY-YY/001",
      },
      "General": {
        "Currency": "US",
        "Units": "MKS",
        "FinancialYear": "APR-MAR",
        "Termsandcondition": {

          "1": "Terms and conditions Apply as per our Master sales Agreement",
          "2": "Payment is due date mentioned in this invoice. A delay of each day will attract 0.25% interest per day",
          "3": "The third line here"

        }
      }
    };
    console.log(JSON.stringify(payloadObject))
    axios({
      url: `https://apidev.zenqore.com/zq/settings`,
      method: 'PUT',
      data: JSON.stringify(payloadObject),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => {
      console.log("change settings API response", res)
      setTimeout(() => {
        // this.setState({ loader: false });
        window.location.reload();
        this.getSettingsData();
      }, 1500)
      this.setState({ defaultImage: false })
    }).catch(err => {
      this.setState({ loader: false, });
      Alert.error("Failed to upload profile picture. Please try again !")
    })

  }
  changeLogo = () => {
    this.setState({ showDefaultLogo: false })
  }
  clearReply = () => {
    this.setState({ showDefaultLogo: true })

  }
  onSelectFile = e => {
    //getting logo name
    // let logoName = e.target.files[0]["name"];
    // let index = logoName.lastIndexOf(".")
    // logoName = logoName.substr(0, index)
    //get file size
    // let logoSize = e.target.files[0]["size"] / 1000;
    this.setState({ defaultImage: false })

    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        this.setState({ src: reader.result }) // bae64 format of full image
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // If you setState the crop in here you should return false.
  onImageLoaded = image => {
    this.imageRef = image; // the image tag
    let height = this.imageRef.offsetHeight;
    let width = this.imageRef.offsetHeight;
    console.log(width, height)
  };

  onCropComplete = crop => {
    this.makeClientCrop(crop);
  };

  onCropChange = (crop, percentCrop) => {
    // You could also use percentCrop:
    this.setState({ crop }); // cropped part of the whole image
  };

  async makeClientCrop(crop) {
    if (this.imageRef && crop.width && crop.height) {
      const croppedImageUrl = await this.getCroppedImg(
        this.imageRef,
        crop,
        'logo.jpeg'
      );
      this.setState({ croppedImageUrl }, () => { console.log(croppedImageUrl) });

    }
  }

  getCroppedImg(image, crop, fileName) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        blob.name = fileName;
        window.URL.revokeObjectURL(this.fileUrl);
        this.fileUrl = window.URL.createObjectURL(blob);
        resolve(this.fileUrl);
        var reader = new FileReader();
        reader.readAsDataURL(blob);
        const scope = this
        reader.onloadend = function () {
          var base64data = reader.result;
          // console.log(base64data);
          scope.setState({ logoPicture: base64data })
        }
      }, 'image/jpeg');

    });
  }

  onInputChanges = (value, item, event, dataS) => {
    item['defaultValue'] = value
    console.log(dataS)
    if (dataS !== undefined) {
      if (dataS.name == "stateName") {
        this.setState({ institutestateName: item.label, institutestateCode: item.value });
      }
      else if (dataS.name == "paymentGateway") {
        this.setState({ selectedPaymentGateway: item.value });
      }
      else if (dataS.name == "smsGateway") {
        this.setState({ selectedSMSGateway: item.value });
      }
      else if (dataS.name == "emailServer") {
        this.setState({ selectedEmailServer: item.value });
      }
    }

    // this.props.onInputChanges(value, item, event, dataS)
  }

  submitForm = () => {
    // this.setState({ loader: true, loaderStatus: false });
    // if (this.state.emailConfigJson !== undefined) {
    let allRefs = {
      "instituteData": this.instituteRef.current,
      "smsGatewayData": this.smsGatewayRef.current,
      "paymentGatewayData": this.paymentGatewayRef.current,
      "emailServerData": this.emailServerRef.current
    }
    let instituteForm = allRefs.instituteData.formRef.current;
    let smsGatewayFormOne = allRefs.smsGatewayData.formRef.current;
    let paymentGatewayFormOne = allRefs.paymentGatewayData.formRef.current;
    let emailServerFormOne = allRefs.emailServerData.formRef.current;
    const allForms = [...instituteForm, ...smsGatewayFormOne, ...paymentGatewayFormOne, ...emailServerFormOne];
    // console.log(allForms)
    //checking null values
    let errorArray = [];
    let validateArray = []
    //stoe the mandatory fields
    let errorArrayOne = []
    let errorArrayTwo = []
    allForms.forEach(element => {
      if (!element.value) {
        errorArray.push(element.id)
      }
      if (element["id"] === "email" || element["id"] === "senderEmail" || element["id"] === "firstName" || element["id"] === "lastName" ||
        element["id"] === "phoneNumber" || element["id"] === "phoneNumber1" || element["id"] === "phoneNumber2" || element["id"] === "pinCode" || element["id"] === "gstin" ||
        element["id"] === "secretKey") {
        validateArray.push(element["id"])
      }
    })
    //Address Form
    // Object.keys(AddressForm).forEach(item => {
    //   errorArray.forEach(element => {
    //     if (element === AddressForm[item]["name"]) {
    //       if (element === "firstName" || element === "lastName" || element === "stateName" || element === "email" || element === "phoneNumber1") {
    //         AddressForm[item]["error"] = true
    //         errorArrayTwo.push(element)
    //       }
    //     }
    //   })
    // })

    //Validating email,phno,gstin,pincode for Institue Details
    let emailId = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    var phoneNum = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    var pincode = new RegExp("^[1-9][0-9]{5}$");
    let gstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    let pwd = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{8,20})/;
    let alphabets = /^[A-Za-z]+$/
    Object.keys(AddressForm).forEach(item => {
      validateArray.forEach(element => {
        if (element === AddressForm[item]["name"]) {
          if (element === "email") {
            if (!emailId.test(AddressForm[item]["defaultValue"]) && AddressForm[item]["defaultValue"] !== "" && AddressForm[item]["defaultValue"] !== undefined) {
              AddressForm[item]["error"] = true
              errorArrayOne.push(element)
            }
          }
          if (AddressForm[item]["defaultValue"] !== "" && AddressForm[item]["defaultValue"] !== undefined) {
            if (element === "phoneNumber1" || element === "phoneNumber2") {
              if (!phoneNum.test(AddressForm[item]["defaultValue"])) {
                AddressForm[item]["error"] = true
                AddressForm[item]["errorMsg"] = "Invalid Phone Number"
                errorArrayOne.push(element)
              }
            }
          }
          if (element === "pinCode") {
            if (!pincode.test(AddressForm[item]["defaultValue"]) && AddressForm[item]["defaultValue"] !== "" && AddressForm[item]["defaultValue"] !== undefined) {
              AddressForm[item]["error"] = true
              AddressForm[item]["errorMsg"] = "Invalid Pincode"
              errorArrayOne.push(element)
            }
          }
          if (element === "gstin") {
            if (!gstin.test(AddressForm[item]["defaultValue"]) && AddressForm[item]["defaultValue"] !== "" && AddressForm[item]["defaultValue"] !== undefined) {
              AddressForm[item]["error"] = true
              AddressForm[item]["errorMsg"] = "Invalid GSTIN"
              errorArrayOne.push(element)
            }
          }
          if (element === "firstName") {
            if (!alphabets.test(AddressForm[item]["defaultValue"]) && AddressForm[item]["defaultValue"] !== "" && AddressForm[item]["defaultValue"] !== undefined) {
              AddressForm[item]["error"] = true
              AddressForm[item]["errorMsg"] = "Invalid First Name"
              errorArrayOne.push(element)
            }
          }
          if (element === "lastName") {
            if (!alphabets.test(AddressForm[item]["defaultValue"]) && AddressForm[item]["defaultValue"] !== "" && AddressForm[item]["defaultValue"] !== undefined) {
              AddressForm[item]["error"] = true
              AddressForm[item]["errorMsg"] = "Invalid Last Name"
              errorArrayOne.push(element)
            }
          }
        }
      })
    })

    //Email Form
    // Object.keys(emailServerForm).forEach(item => {
    //   errorArray.forEach(element => {
    //     if (element === emailServerForm[item]["name"]) {
    //       emailServerForm[item]["error"] = true
    //       emailServerForm[item]["errorMsg"] = "Invalid Email Address"
    //       errorArrayTwo.push(element)
    //     }
    //   })
    // })

    //validating email configuration
    // if (this.state.emailConfigJson === undefined) {
    //   errorArrayTwo.push("emailconfig")
    //   // Alert.error("Please check your Config JSON");
    //   let textarea = document.getElementById('emailconfig')
    //   console.log(textarea, textarea['defaultValue'])
    //   textarea['error'] = true
    // }

    //validating email for Email server
    Object.keys(emailServerForm).forEach(item => {
      validateArray.forEach(element => {
        if (element === emailServerForm[item]["name"]) {
          if (element === "senderEmail") {
            if (emailServerForm[item]["defaultValue"] !== "" && emailServerForm[item]["defaultValue"] !== undefined) {
              if (!emailId.test(emailServerForm[item]["defaultValue"])) {
                emailServerForm[item]["error"] = true
                errorArrayOne.push(element)
              }
            }
          }
        }
      })
    })
    //Payment Gateway Form
    // Object.keys(paymentGatewayForm).forEach(item => {
    //   errorArray.forEach(element => {
    //     if (element === paymentGatewayForm[item]["name"]) {
    //       paymentGatewayForm[item]["error"] = true
    //       paymentGatewayForm[item]["errorMsg"] = `Invalid ${paymentGatewayForm[item]["label"]}`
    //       errorArrayTwo.push(element)
    //     }
    //   })
    // })
    //Validating Password for Payment Gateway
    Object.keys(paymentGatewayForm).forEach(item => {
      validateArray.forEach(element => {
        if (element === paymentGatewayForm[item]["name"]) {
          if (element === "secretKey") {
            if (paymentGatewayForm[item]["defaultValue"] !== "" && paymentGatewayForm[item]["defaultValue"] !== undefined) {
              if (!pwd.test(paymentGatewayForm[item]["defaultValue"])) {
                paymentGatewayForm[item]["error"] = true
                errorArrayOne.push(element)
              }
            }
          }
        }
      })
    })

    //SMS Gateway Form
    // Object.keys(smsGatewayForm).forEach(item => {
    //   errorArray.forEach(element => {
    //     if (element === smsGatewayForm[item]["name"]) {
    //       smsGatewayForm[item]["error"] = true
    //       errorArrayTwo.push(element)
    //     }
    //   })
    // })
    //Validating phno for SMS Gateway
    Object.keys(smsGatewayForm).forEach(item => {
      validateArray.forEach(element => {
        if (element === smsGatewayForm[item]["name"]) {
          if (element === "phoneNumber") {
            if (smsGatewayForm[item]["defaultValue"] !== "" && smsGatewayForm[item]["defaultValue"] !== undefined) {
              if (!phoneNum.test(smsGatewayForm[item]["defaultValue"])) {
                smsGatewayForm[item]["error"] = true
                smsGatewayForm[item]["errorMsg"] = "Invalid Phone Number"
                errorArrayOne.push(element)
              }
            }
          }
        }
      })
    })
    // console.log(errorArrayOne)
    // console.log(errorArrayTwo, errorArrayOne)
    // console.log(errorArray, AddressForm, emailServerForm, paymentGatewayForm, smsGatewayForm)
    this.setState({
      addressFormData: AddressForm, emailServerFormData: emailServerForm, paymentGatewayData: paymentGatewayForm,
      smsGatewayData: smsGatewayForm
    })
    let settingsPayLoad = {
      instituteDetails: {
        instituteName: instituteForm['instituteName'].value,
        gstin: instituteForm['gstin'].value,
        address1: instituteForm['address1'].value,
        address2: instituteForm['address2'].value,
        address3: instituteForm['address3'].value,
        cityTown: instituteForm['cityTown'].value,
        stateName: this.state.institutestateName,
        stateCode: this.state.institutestateCode,
        pinCode: instituteForm['pinCode'].value,
        firstName: instituteForm['firstName'].value,
        lastName: instituteForm['lastName'].value,
        email: instituteForm['email'].value,
        phoneNumber1: instituteForm['phoneNumber1'].value,
        phoneNumber2: instituteForm['phoneNumber2'].value,
      },
      logo: {
        logo: this.state.logoPicture !== undefined ? String(this.state.logoPicture) : ''
      },
      emailServer: {
        emailServer: this.state.selectedEmailServer,
        emailAddress: emailServerFormOne['senderEmail'].value,
        config: [this.state.emailConfigJson]
      },
      smsGateway: {
        smsGateway: this.state.selectedSMSGateway,
        phoneNumber: smsGatewayFormOne['phoneNumber'].value,
      },
      paymentGateway: {
        paymentGateway: this.state.selectedPaymentGateway,
        accessKey: paymentGatewayFormOne['accessKey'].value,
        secretKey: paymentGatewayFormOne['secretKey'].value,
      }
    }

    if (errorArrayOne.length > 0) {
      Alert.error("Please check your Entered data");
    } else {
      console.log(settingsPayLoad);
      axios.put(`${this.state.env['zqBaseUri']}/setup/settings/${this.state.instituteId}`, settingsPayLoad)
        .then(res => {
          console.log("settings get api response", res.data);
          this.setState({ loader: false });
          window.location.reload();
        })
    }
    // } 
    // else {
    //   Alert.error("Please upload config.json file");
    // }
  }
  cancelForm = () => {
    this.getData();
    // this.setState({ loaderStatus: false }, () => {
    //   AddressForm.map(item => {
    //     item["defaultValue"] = ""
    //   })
    //   console.log("addressForm", AddressForm)
    //   this.setState({ addressFormData: AddressForm })
    // })

    // setTimeout(() => {
    //   this.setState({ loaderStatus: true })
    // }, 1000);
  }
  // cleanData = (value, b, c, d) => {
  //   this.setState({ institutestateCode: "" })
  // }
  render() {
    const { crop, croppedImageUrl, src } = this.state;

    const onButtonClick = () => {
      this.inputFile.current.click();
    };

    const value = 66;
    const borderStyle = {
      border: "1px dotted #1359c1",
      borderRadius: "10px",
    };
    const styleImageLogo = {
      height: "343px",
      width: "643px",
      marginTop: "6px",
      borderRadius: "10px"
    };
    const label = (
      <div className="setting-logo-card">
        <div style={{ position: "relative" }}>
          {this.state.logoPicture2 == "" ?

            <React.Fragment>
              {/* {this.state.loader ? <CircularProgressbar value={value} maxValue={1} text={`${value * 100}%`} /> : null} */}

              <p className="onboard-card-header logo-img-letter" onClick={this.changeLogo}>{this.state.companyLogo}</p>

              <p className="onboard-card-title">
                <span className="browse-content logo-change">Change Logo </span>
              </p>
            </React.Fragment> :
            <React.Fragment>

              <img className="onboard-card-header logo-img-letter logo-image" src={`${this.state.logoPicture2}`} />
              <p className="onboard-card-title">
                <span className="browse-content logo-change image-text">{this.state.logoText} </span>
              </p>
            </React.Fragment>}
        </div>
      </div>
    );

    return (
      <React.Fragment>
        {this.state.loader ? <Loader /> : null}

        <div className="settings-wrap">
          {/* {this.state.isLogoTab ? <div className="settings-form-submit">
            <Button type="submit" class="primary-btn setting-btn floatRight" onClick={() => this.submitForm()}>SUBMIT</Button>
            <Button type="submit" class="secondary-btn  setting-btn floatRight" style={{ marginRight: 10 }} onClick={this.cancelForm}>CANCEL</Button>
          </div> : null} */}
          <div className="settings-form-submit">
            <Button type="submit" class="primary-btn setting-btn floatRight" onClick={() => this.submitForm()}>Submit</Button>
            <Button type="submit" class="secondary-btn  setting-btn floatRight" style={{ marginRight: 10 }} onClick={this.cancelForm}>Cancel</Button>
          </div>
          <div className="invoice-page-wrapper new-table-wrap setting-content">
            {this.state.containerNav == undefined ? null : (
              <ContainerNavbar containerNav={this.state.containerNav} />
            )}
          </div>
        </div>
        <div className="settings-tab-wrap">
          <div className="settings-content">
            <Tabs
              value={this.state.tab}
              indicatorColor="primary"
              textColor="primary"
              onChange={this.selectTabs}
              className="vertical-tab-cont settings-tab-content"
              orientation="vertical" >
              <Tab label="Institute Details" className="tab-list"></Tab>
              <Tab label="Logo" className="tab-list"></Tab>
              <Tab label="Templates" className="tab-list"></Tab>
              <Tab label="Email Server" className="tab-list"></Tab>
              <Tab label="SMS Gateway" className="tab-list"></Tab>
              <Tab label="Payment Gateway" className="tab-list"></Tab>
            </Tabs>
          </div>
          <div className="tab-details">
            <div className={this.state.tab === 0 ? "tab-cont op-1" : "tab-cont op-0"}>
              <div className="tab-one-content-key  full-setting-body">
                <div className="tab-one-content-header">
                  <p>Institute details</p>
                </div>
                <div
                  className="history-icon-box"
                  title="View History"
                  onClick={this.openHistory}
                  style={{ width: '100px', float: 'right', position: "relative", top: "-30px", right: "15px" }}
                >
                  <RestoreOutlinedIcon className="material-historyIcon" />
                  <p>History</p>
                </div>
                <div className="address-form-wrapper ">
                  {/* {this.state.addressFormData.length > 0 ? */}
                  {this.state.loaderStatus == true ?
                    <ZenForm ref={this.instituteRef} inputData={this.state.addressFormData} onInputChanges={this.onInputChanges} onSubmit={this.onSubmit} />
                    : <p className="noprog-txt">{this.state.resText}</p>}
                  {/* : null} */}
                </div>
              </div>
            </div>
            <div className={this.state.tab === 1 ? "tab-cont op-1 logo-cont" : "tab-cont op-0"}>
              <div className="tab-one-content-key">
                <div className="tab-one-content-header">
                  <p>Parameter</p>
                  <p>Value</p>
                </div>
                <div className="versions">
                  <div
                    className="tab-one-content-key-list"
                    style={{
                      background: '#D9FAFF',
                      border: '1px solid #0052CC'
                    }}
                    onClick={this.openLogo}
                  >
                    <p>Logo</p>
                    <p className="choose-format">
                      None&nbsp;&nbsp;
                          <ArrowForwardIosIcon className="setting-right-icon" />
                    </p>
                  </div>
                  <p className="version-name">&nbsp;&nbsp;v{this.state.logoPictureVersion}</p>
                </div>
              </div>
              <div className="tab-one-content-value">
                <div className="tab-one-content-value-content">

                  <React.Fragment>
                    <div className="tab-one-content-value-header">
                      <div className="content-value-header-name">
                        <p className="value-header-name">Logo</p>
                        <span className="logo-version">v{this.state.logoPictureVersion}</span>
                      </div>
                      <div
                        className="history-icon-box"
                        title="View History"
                        onClick={this.openHistory}
                      >
                        <RestoreOutlinedIcon className="material-historyIcon" />
                        <p>History</p>
                      </div>
                    </div>

                    <div className="tab-one-content-value-body parent-react-crop">
                      <div className="avatar-wrap">
                        {this.state.defaultImage == true ?
                          <React.Fragment>
                            <div className="parent-react-crop2">
                              <label className="input-label-text" for="files" >Change Logo</label>
                              <input id="files" className="select-image-input" type="file" accept="image/*" onChange={this.onSelectFile} />
                            </div>
                            <div className="image-div">
                              {this.state.loader == true ?
                                <CircularProgress style={{ width: '100%', height: '20px', width: '20px', float: 'right', marginRight: '10px' }} />
                                :
                                <div>
                                  <img className="logo-image-tag" alt="Loading..." src={this.state.logoPicture2} />
                                  <p className="browse-btn">Browse</p>
                                </div>
                              }
                            </div>
                          </React.Fragment>
                          : <React.Fragment>
                            {src && (
                              <ReactCrop
                                style={styleImageLogo}
                                src={src}
                                crop={crop}
                                ruleOfThirds
                                onImageLoaded={this.onImageLoaded}
                                onComplete={this.onCropComplete}
                                onChange={this.onCropChange}
                              />
                            )}
                          </React.Fragment>}



                      </div>
                    </div>

                  </React.Fragment>
                  {/* )} */}
                </div>
              </div>
            </div>
            <div className={this.state.tab === 2 ? "tab-cont op-1 template-cont " : "tab-cont op-0"}>
              <div className="tab-one-content-key settings-numbering" >
                <div className="tab-one-content-header">
                  <p>Parameter</p>
                  <p>Value</p>
                </div>
                {this.state.getNumArray.map((item, i) => {
                  return (
                    <div
                      className="versions"
                      onClick={(e) => this.changeNumbering(e, item, i)}
                    >
                      <div className={`tab-one-content-key-list ${item.name == this.state.previewNumberName ? 'active' : ''}`}>
                        <p>{item.name}</p>
                        <p className="choose-format" >
                          {item.value}
                          <ArrowForwardIosIcon className="setting-right-icon angle-icon-space" />
                        </p>
                      </div>
                      <p className="version-name">{item.version}</p>
                    </div>
                  );
                })}
              </div>
              <div className="tab-one-content-value">
                <div className="tab-one-content-value-header">
                  <div className="content-value-header-name">
                    {this.state.defaultnumberFormat == true ?
                      <React.Fragment>
                        <p className="value-header-name">Demand Note No.</p>
                        <span className="logo-version">v0</span>
                      </React.Fragment> :
                      <React.Fragment>
                        <p className="value-header-name">{this.state.previewNumberName}</p>
                        <span className="logo-version">{this.state.previewVersion}</span>
                      </React.Fragment>}
                  </div>
                  <div
                    className="history-icon-box"
                    title="View History"
                    onClick={this.openHistory}
                  >
                    <RestoreOutlinedIcon className="material-historyIcon" />
                    <p>History</p>
                  </div>
                </div>

                <div className="tab-one-content-value-body">
                  <iframe style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'auto'
                  }} src={`http://templatehosting.s3-website-us-east-1.amazonaws.com/?id=${this.state.instituteId}`}></iframe>
                </div>
                {/* <div className="tab-one-content-value-body">
                  {this.state.numberingData == 0 || this.state.numberingData > 0 ? (
                    <>
                      <p className="digits">No. of Digits</p>
                      <div className="select-values">
                        <SelectPicker
                          className="select-input-wrap"
                          searchable={false}
                          data={this.state.dataDN}
                          style={{ width: 120 }}
                          defaultValue={this.state.defNumber}
                          onSelect={(value, item, event) =>
                            this.selectValueInv(value, item, event)
                          }
                        />
                        <SelectPicker
                          className="select-input-wrap"
                          searchable={false}
                          data={this.state.dataSlash}
                          style={{ width: 70 }}
                          defaultValue="/"
                          onSelect={(value, item, event) =>
                            this.selectValueSlash(value, item, event)
                          }
                        />
                        <SelectPicker
                          className="select-input-wrap"
                          searchable={false}
                          data={this.state.dataYear}
                          style={{ width: 150 }}
                          defaultValue="YYYY-YY"
                          onSelect={(value, item, event) =>
                            this.selectValueYear(value, item, event)
                          }
                        />
                        <SelectPicker
                          className="select-input-wrap"
                          searchable={false}
                          data={this.state.dataSlash}
                          style={{ width: 70 }}
                          defaultValue="/"
                          onSelect={(value, item, event) =>
                            this.selectValueSlash2(value, item, event)
                          }
                        />
                        <SelectPicker
                          className="select-input-wrap"
                          searchable={false}
                          data={this.state.dataDgts}
                          style={{ width: 70 }}
                          defaultValue="3"
                          onSelect={(value, item, event) =>
                            this.selectValueDigits(value, item, event)
                          }
                        />
                      </div>{" "}
                      <p>Example: {this.state.defNumber}/2020-21/001</p>
                    </>
                  ) : " "}
                </div>
            */}
              </div>
            </div>
            <div className={this.state.tab === 3 ? "tab-cont op-1" : "tab-cont op-0"}>
              <div className="tab-one-content-key full-setting-body">
                <div className="tab-one-content-header">
                  <p>Email Server</p>

                </div>
                <div
                  className="history-icon-box"
                  title="View History"
                  onClick={this.openHistory}
                  style={{ width: '100px', float: 'right', position: "relative", top: "-30px", right: "15px" }}
                >
                  <RestoreOutlinedIcon className="material-historyIcon" />
                  <p>History</p>
                </div>

                <div className="address-form-wrapper ">
                  {this.state.loaderStatus &&
                    <ZenForm ref={this.emailServerRef} inputData={this.state.emailServerFormData} onInputChanges={this.onInputChanges} onSubmit={this.onSubmit} />
                  }
                  <p class="form-hd settings-form-hd">Upload Config JSON File</p>
                  <div className="input-file-config">
                    <label htmlFor="email-config" className="email-config-btn">Select Files</label> {this.state.configFileName.length > 0 ? <><span style={{
                      fontSize: '14px',
                      fontFamily: 'OpenSans-Medium', paddingRight: '5px'
                    }}>File Name: </span><span>{this.state.configFileName}</span></> : null}
                    <input type="file" id="email-config" style={{ display: 'none' }} name="Email Config File" alt="config file" onChange={this.uploadEmailConfigFile} />
                  </div>
                  {this.state.showPreviewConfig && <div style={{ width: '100%', overflow: 'hidden', height: '200px' }} >
                    {/* <textarea id="emailconfig" value={JSON.stringify(this.state.emailConfigJson)} disabled style={{ width: 'calc(100% - 60px)', minHeight: '190px', position: 'relative', left: '20px' }}></textarea> */}
                    <TextareaAutosize id="emailconfig" defaultValue={JSON.stringify(this.state.emailConfigJson)} disabled style={{ width: 'calc(100% - 60px)', minHeight: '190px', position: 'relative', left: '20px' }} />
                  </div>}
                </div>
              </div>

            </div>
            <div className={this.state.tab === 4 ? "tab-cont op-1" : "tab-cont op-0"}>
              <div className="tab-one-content-key full-setting-body">
                <div className="tab-one-content-header">
                  <p>SMS Gateway</p>
                </div>
                <div
                  className="history-icon-box"
                  title="View History"
                  onClick={this.openHistory}
                  style={{ width: '100px', float: 'right', position: "relative", top: "-30px", right: "15px" }}
                >
                  <RestoreOutlinedIcon className="material-historyIcon" />
                  <p>History</p>
                </div>
                <div className="address-form-wrapper ">
                  {/* {this.state.smsGatewayData.length > 0 ? */}
                  {this.state.loaderStatus &&
                    <ZenForm ref={this.smsGatewayRef} inputData={this.state.smsGatewayData} onInputChanges={this.onInputChanges} onSubmit={this.onSubmit} />
                  }
                  {/* : null} */}
                </div>
              </div>
            </div>
            <div className={this.state.tab === 5 ? "tab-cont op-1" : "tab-cont op-0"}>
              <div className="tab-one-content-key full-setting-body">
                <div className="tab-one-content-header">
                  <p>Payment Gateway</p>
                </div>
                <div
                  className="history-icon-box"
                  title="View History"
                  onClick={this.openHistory}
                  style={{ width: '100px', float: 'right', position: "relative", top: "-30px", right: "15px" }}
                >
                  <RestoreOutlinedIcon className="material-historyIcon" />
                  <p>History</p>
                </div>
                <div className="address-form-wrapper ">
                  {/* {this.state.paymentGatewayData.length > 0 ? */}
                  {this.state.loaderStatus &&
                    <ZenForm ref={this.paymentGatewayRef} inputData={this.state.paymentGatewayData} onInputChanges={this.onInputChanges} onSubmit={this.onSubmit} />
                  }
                  {/* : null} */}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* </div> */}
        {this.state.history ?
          <Drawer size='xs' placement='right' show={this.state.showHistory}>
            <Drawer.Header style={{ display: 'flex', paddingRight: '0px' }}>
              <Drawer.Title className="change-history-title">CHANGE HISTORY</Drawer.Title>
              <HighlightOffIcon title="Close" onClick={this.onCloseForm} className="change-history-close-btn" />
            </Drawer.Header>
            <Drawer.Body>
              <Timeline align='left'>
                <ZqHistory historyData={this.state.historyData} onCloseForm={this.onCloseForm} />
              </Timeline>
            </Drawer.Body>
          </Drawer>
          : null
        }
      </React.Fragment >
    );
  }
}
export default withRouter(Settings);
