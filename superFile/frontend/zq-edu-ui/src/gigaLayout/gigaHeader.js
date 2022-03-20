import React, { Component } from 'react';
//import ReactDOM from 'react-dom';
import axios from 'axios';
// import Dexie from 'dexie';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import ZenForm from '../components/input/form';
import gigaHeader from './gigaHeader.json';
import profilePicture from '../assets/images/profile-large.png';
import '../scss/profile-header.scss'
import { withRouter } from 'react-router-dom';
// import DateRangeOutlinedIcon from '@material-ui/icons/DateRangeOutlined';
// import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
// import EventNoteOutlinedIcon from '@material-ui/icons/EventNoteOutlined';
// import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined';
// import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';
// import SearchOutlinedIcon from '@material-ui/icons/SearchOutlined';
// import HeadsetMicIcon from '@material-ui/icons/HeadsetMic';
// import zq_api from '../utils/api-service';
// import PersonOutlineOutlinedIcon from '@material-ui/icons/PersonOutlineOutlined';
// import ClearIcon from '@material-ui/icons/Clear';
import { Alert } from 'rsuite';
import { withStyles } from "@material-ui/core/styles";
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from "@material-ui/core/Checkbox";
import Axios from "axios";
import moment, { defaultFormat } from "moment";
// import sound from "../audio/notification.mp3";
import soundLatest from "../audio/caseclosed.mp3";
// import Sound from "react-sound";
import Loader from "../utils/loader/loaders";
// import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
import CloseIcon from "@material-ui/icons/Close";
// import Privacy from "../components/legal_documents/privacy_policy/privacy";
// import { TextareaAutosize } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
// import Account from "../../src/assets/images/account.PNG";
// import Accountnew from "../../src/assets/images/accountone.PNG";
// import Acnt from "../../src/assets/images/img4.png";
// import Hacnt from "../../src/assets/images/img5.jpg";
// import CircularProgress from "@material-ui/core/CircularProgress";
// import PubNub from 'pubnub-react';
import globalSearchIcon from "../../src/assets/icons/global-search-icon.svg";
import changePasswordIcon from "../../src/assets/icons/changepassword-icon.svg";
import JoinOrgIcon from "../../src/assets/icons/join-org-icon.svg";
import BillingIcon from "../../src/assets/icons/billing-icon.svg";
// import dotMenuIcon from "../../src/assets/icons/dots-menu.svg";
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
// import { th } from 'date-fns/locale';

var audio = new Audio(soundLatest)
const ZqTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#FFC501',
    color: 'black',
    boxShadow: theme.shadows[1],
    fontSize: 14,
    paddingTop: 6,
    paddingBottom: 6,
    paddingRight: 10,
    paddingLeft: 10
  },
}))(Tooltip);
const Cryptr = require('cryptr');
const cryptr = new Cryptr('ZqSecretKey');
const DBEncryptor = new Cryptr('ZqSecretKey');
class GigaHeader extends Component {
  constructor(props) {
    super(props);
    // this.zq_api = new zq_api();
    this.state = {
      env: JSON.parse(localStorage.getItem('env')),
      authToken: localStorage.getItem('auth_token'),
      channel: localStorage.getItem('channel'),
      email: localStorage.getItem('email'),
      zen_auth_token: localStorage.getItem('zen_auth_token'),
      userID: localStorage.getItem("userID"),
      orgName: localStorage.getItem('orgName'),
      orgID: localStorage.getItem('orgId'),
      loginEmail: '',
      menuToggle: false,
      dropDownOpen: false,
      logoutModule: false,
      changePassword: false,
      profileData: {},
      profilePicture: profilePicture,
      addProfilePicture: false,
      pageLoader: false,
      firstName: '',
      lastName: '',
      compName: '',
      designation: '',
      Role: '',
      organization: [],
      DefaultOrganization: [],
      userProfile: [],
      searchText: "",
      searchTextKey: "",
      searchCount: "",
      placeholder: "Search...",
      openNotify: false,
      notifyDot: false,
      getNotification: [],
      notificationTime: "",
      isRead: false,
      isSeen: false,
      clearNotificationList: false,
      todayNotifications: [],
      yestNotifications: [],
      daysBeforeYestNotification: [],
      dayBeforeText: "",
      xclose: -1,
      isAnnounce: false,
      isknowmore: false,
      announcement: [],
      sliderIndex: 0,
      roundIndex: 0,
      isRound: false,
      isModalVerticalAnnounce: false,
      isModalHorizontalAnnounce: false,
      searchTxtEnable: true,
      hannouncement: [],
      imageBaseUrl: 'http://18.215.6.18:1337',
      vannouncement: [],
      isVRound: false,
      isloader: false,
      hSliderIndex: 0,
      left: 664,
      hRoundIndex: 0,
      isHRound: false,
      vRight: 846,
      showSearchField: false,
      dotMenuOpen: false
    }
    // this.pubnub = new PubNub({
    //   publishKey: "pub-c-87ae3cc8-8d0a-40e0-8e0f-dbb286306b21",
    //   subscribeKey: "sub-c-982dbaba-1d98-11ea-8c76-2e065dbe5941"
    // });
    // this.pubnub.init(this);
    this.profilePopupRef = React.createRef();
    this.showInputRef = React.createRef();
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }
  handleClickOutside = (event) => {
    if (this.profilePopupRef && !this.profilePopupRef.current.contains(event.target)) {
      this.setState({ dropDownOpen: false, dotMenuOpen: false })
    }
  }

  // onMenuClick = () => {
  //   this.setState({ menuToggle: !this.state.menuToggle }, () => {
  //     this.props.onMenuToggle(this.state.menuToggle)
  //   })
  // }
  setProfilePicture = () => {
    this.props.history.push('/main/profile-picture')
    this.setState({ dropDownOpen: false })
  }
  joinAnotherOrg = () => {
    this.setState({ dropDownOpen: false })
    this.props.history.push('/main/request-invitation')
  }
  dropDownToggle = () => {
    this.setState({ dropDownOpen: !this.state.dropDownOpen, dotMenuOpen: false })
  }

  dotMenuToggle = () => {
    this.setState({ dotMenuOpen: !this.state.dotMenuOpen, dropDownOpen: false })
  }
  componentDidMount = () => {
    // this.onMenuClick();
    if (localStorage.getItem('channel') !== "testDB") { //Only for Test Environment organization
      this.loadUsers();
    }
    // this.getNotification();
    // this.getAnnouncement();
    // document.addEventListener('click', this.handleClickOutside, true);
    document.addEventListener('mousedown', this.handleClickOutside);
    // setInterval(this.getAnnouncement, 1800000);
    // setInterval(() => { this.getAnnouncement() }, 1800000)


    // this.pubnub.subscribe({
    //   channels: ["5f0fe3908f653a307b83b4ed"],
    //   withPresence: true
    // });
    // setTimeout(() => {
    //   this.pubnub.getMessage(("5f0fe3908f653a307b83b4ed"), (message) => {
    //     console.log(message);
    //   })
    // }, 200)
  }
  //notification
  getNotification = () => {
    this.setState({ loader: true });
    Axios.get(
      `${this.state.env["notification"]}/getAllNotification/${this.state.userID}`
    )
      .then((res) => {
        console.log(res, "success notification");
        let read = res.data.notifications.map((item) => item.isRead);
        let seen = res.data.notifications.map((item) => item.isSeen);
        this.setState({ isRead: read, isSeen: seen });
        let seenIncludes = this.state.isSeen.includes(false);
        // console.log(seenIncludes,"seenincludes")
        this.setState({ soundPlay: seenIncludes })
        // console.log(this.state.soundPlay, "soundPlay")
        if (seenIncludes === false) {
          this.setState({ notifyDot: false })
        } else {
          this.setState({ notifyDot: true })
          audio.autoplay = true;
          audio.play();
        }

        let getList = res.data.notifications;
        getList.sort((a, b) => b.modified_on - a.modified_on)
        let today = [];
        let yest = [];
        let dayBefore = [];
        getList.map((item, i) => {
          let days = String(moment(item.modified_on).calendar());
          if (days.includes("Today")) {
            today.push(item);
            this.setState({ todayNotifications: today });
          } else if (days.includes("Yesterday")) {
            yest.push(item);
            this.setState({ yestNotifications: yest });
          } else {
            let daysbefore = moment(item.modified_on).format("LLL");
            let splits = daysbefore.split(" ");
            let join = splits[0] + " " + splits[1] + splits[2];
            dayBefore.push(item);
          }
        });
        const groups = dayBefore.reduce((groups, game) => {
          let daysbefore = moment(game.modified_on).format("LLL");
          let splits = daysbefore.split(" ");
          let date = splits[0] + " " + splits[1] + splits[2];
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(game);
          return groups;
        }, {});
        const groupArrays = Object.keys(groups).map((date) => {
          return {
            date,
            notifyList: groups[date],
          };
        });
        this.setState({ daysBeforeYestNotification: groupArrays }, () => {
          // console.log(
          //   this.state.daysBeforeYestNotification,
          //   "daysbeforenotification"
          // );
        });
        // getList.map(item)
        this.setState({ getNotification: getList }, () => { });
        if (this.state.getNotification.length === 0) {
          this.setState({ clearNotificationList: true });
        }
        this.setState({ loader: false })
        // console.log(this.state.getNotification, "getNotification");
      })
      .catch((err) => {
        this.setState({ loader: false })
        // console.log(err, "error notification");
        this.setState({ loader: false })
      });
  };
  changeReadandSeen = (item, i) => {
    this.setState({ loader: true })
    Axios.put(`${this.state.env["notification"]}/updateNotification/${item._id}`)
      .then((res) => {
        // console.log(res, "success update notification");
        this.getNotification();
        this.setState({ openNotify: false, loader: false })
      })
      .catch((err) => {
        // console.log(err, "error update notification");
        this.setState({ loader: false })
      });
    this.props.history.push(item.cta)
  };
  deleteNotificationLists = () => {
    this.setState({ loader: true })
    Axios.delete(
      `${this.state.env["notification"]}/clearNotification/${this.state.userID}`
    )
      .then((res) => {
        // console.log(res, "success delete notification");
        this.setState({ loader: true });
        setTimeout(() => {
          this.getNotification();
          this.setState({ loader: false, clearNotificationList: true });
        }, 1000);
        this.setState({ loader: false })
      })
      .catch((err) => {
        // console.log(err, "error delete notification");
        this.setState({ loader: false })
      });
  };
  markAllAsRead = () => {
    this.setState({ loader: true })
    Axios.put(
      `${this.state.env["notification"]}/readAll/${this.state.userID}`
    )
      .then((res) => {
        // console.log(res, "success markasread notification");
        this.setState({ loader: true });
        setTimeout(() => {
          this.getNotification();
          this.setState({ loader: false, clearNotificationList: true });
        }, 2000);
      })
      .catch((err) => {
        // console.log(err, "error markasread notification");
      });
  }
  //Change Password API
  changePasswordApi = (data) => {
    axios({
      url: `${this.state.env['zqBaseUri']}/reset/changepwd`,
      method: 'POST',
      data: {
        "contact": this.state.loginEmail,
        "password": String(cryptr.encrypt(data.password.value))
      }
    }).then(res => {
      // console.log('updated', res)
      Alert.success(res.data.message)
      this.setState({ changePassword: false })
    }).catch(err => {
      // console.log('Change password Failed', err)
      Alert.error("Operation Failed! Please try again.")
    })
  }
  componentWillMount() {
    this.setState({ profileData: gigaHeader })
    localStorage.removeItem('orgName')
    localStorage.setItem('orgName', "Vijaykiran Knowledge Park")
    // GET ORGANIZATION DETAILS
    // let apiDetails = {
    //   url: `${this.state.env['zqBaseUri']}/getOrgData`,
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // }
    // this.zq_api.get(apiDetails).then(res => {
    //   if (res.failed == undefined) {
    //     var org_data = res.organizationData[0]
    //     // this.setState({ orgName: org_data['name'] });
    //     // this.setState({ orgName: res['organizationData'][0]['name'] })
    //     let dataBranch = []
    //     var branch = Object.values(res.branchListData)
    //     branch.map(item => {
    //       dataBranch.push(item['id'])
    //     })
    //     localStorage.setItem("branchid", dataBranch)
    //   }
    // })
  }
  //GET LOGO
  getLogo = (instituteId) => {
    axios.get(`${this.state.env['zqBaseUri']}/setup/settings?instituteid=${instituteId}`)
      .then(res => {
        // let logoData = res.data[0].logo.logo[0]
        let profilePic = res.data[0].logo.logo[0] !== null ? res.data[0].logo.logo[0] : profilePicture;
        this.setState({ profilePicture: profilePic })
      })
  }
  //GET USER PROFILE API
  loadUsers = () => {
    axios({
      url: `${this.state.env['zqBaseUri']}/edu/getUserProfile`,
      method: 'GET',
      headers: {
        "Authorization": this.state.authToken
      }
    }).then(res => {
      console.log("getUserProfile", res)
      let userProfile = res.data.orgId;
      localStorage.setItem('orgId', res.data.orgId)
      localStorage.setItem('instituteId', res.data.orgId)
      this.getLogo(res.data.orgId);
      // if (res.data.length !== 0) {
      //   // localStorage.setItem("userID", res.data.user_id)
      //   localStorage.setItem("userID", userProfile.orgList[0].userId)
      //   let firstName = userProfile.firstName;
      //   let lastName = userProfile.lastName != null ? userProfile.lastName : '';
      //   // localStorage.setItem("username", userProfile.FirstName)
      //   let profilePic = userProfile.profilePic !== null ? userProfile.profilePic[0] : profilePicture;
      //   let organization = userProfile.orgList;
      //   let DefaultOrganization = userProfile.defaultOrganization;

      //   let compName = userProfile.orgList[0].orgName;
      //   let loginEmail = userProfile.userEmail;
      //   let username = firstName + ' ' + lastName
      //   localStorage.setItem('username', username)
      //   //Set Role of User
      //   var Role = []
      //   var name = DefaultOrganization.name;
      //   var compareRole = userProfile.orgList.map(item => {
      //     if (item.OrgName === name) {
      //       localStorage.setItem('orgId', item.orgId)
      //       Role.push(item.role)
      //     }
      //   })
      //   this.setState({
      //     userProfile: userProfile, firstName: firstName, lastName: lastName, Role: Role[0], organization: organization,
      //     DefaultOrganization: DefaultOrganization, profilePicture: profilePic, compName: compName, loginEmail: loginEmail
      //   })
      // }
    })
  }
  //SWITCH USER API
  switchUser = (item) => {
    let DefaultOrganization = { name: item.orgName, email: item.orgEmail, orgId: item.orgId }
    let orgList = this.state.organization;
    this.setState({ organization: [] }, () => {
      this.setState({ organization: orgList, DefaultOrganization: DefaultOrganization })
    })
    this.setState({ pageLoader: true, dropDownOpen: false })
    // console.log(item) //selected item
    localStorage.setItem('email', item.orgEmail)
    localStorage.setItem('orgId', item.orgId)
    localStorage.setItem('instituteId', item.orgId)
    //login to IDOS api
    let payloadId = { "user": `${item.orgEmail}` }
    fetch(`${this.state.env['zqBaseUri']}/master/loginToIdos`,
      {
        method: 'POST',
        body: JSON.stringify(payloadId),
        headers: {
          "content-type": 'application/json'
        }
      })
      .then(resId => {
        return resId.json()
      })
      .then(responseId => {
        console.log('logincredentials', responseId)
        if ((responseId["userData"]["logincredentials"]["0"]["message"]).toLowerCase() == "failure") {
          this.setState({ error: responseId["userData"]['logincredentials']["0"]["failurereason"] });
        } else {
          let token = responseId["userData"]['logincredentials']['0']['authTokenuserIdRoleId']
          localStorage.setItem("auth_token", token)
          localStorage.setItem("email", responseId.usermail)
          localStorage.setItem("channel", responseId.usermail)
          let orgName = responseId["userData"]['logincredentials']['0']['organization']
          localStorage.setItem('orgName', orgName)
          localStorage.setItem('registerUser', true)
          localStorage.setItem('newUser', true)
          window.open('/#/main/dashboard')
          this.setState({ pageLoader: false }, () => {
            window.location.reload()
          })
        }
      })
      .catch(err => {
        // window.location.reload()
        console.log("Switch User Error", err)
        this.setState({ pageLoader: false })
      })
  }
  //REMOVE USER API
  removeUser = (item) => {
    axios({
      url: `${this.state.env['zqBaseUri']}/removeusr`,
      method: 'POST',
      data: {
        "LoginId": this.state.channel,
        "UserEmail": item.OrgEmail,
        "OrgName": item.OrgName
      }
    }).then(res => {
      // console.log('Remove user response', res)
      Alert.success(res.data.message)
    }).catch(err => {
      Alert.error("Operation Failed! Please try again.")
    })
  }
  logoutUsers = () => {
    this.setState({ logoutModule: true, dropDownOpen: false })
  }
  cancelLogout = () => {
    this.setState({ logoutModule: false })
  }
  changePassword = (item) => {
    // console.log(item)
    this.setState({ changePassword: !this.state.changePassword })
  }
  onShowPassword = (item) => {
    this.setState({ showPassword: !this.state.showPassword }, () => {
      item['type'] = this.state.showPassword ? 'text' : 'password'
      this.setState({ inputData: item })
    })
  }
  //LOGOUT API
  logoutZenqore = () => {
    this.setState({ pageLoader: true })
    var getEnvt = localStorage.getItem('env');

    var DBDeleteRequest = window.indexedDB.deleteDatabase(localStorage.getItem('channel'));
    DBDeleteRequest.onerror = function (event) {
      console.log("Error deleting database.");
    };
    DBDeleteRequest.onsuccess = function (event) {
      console.log("Database deleted successfully");
      console.log('check--> it should be undefined---->', event.result); // should be undefined
    };

    let payload = { "sessionId": localStorage.getItem('sessionId') }
    fetch(`${this.state.env.zqBaseUri}/zqedu/logout`, { method: 'POST', body: JSON.stringify(payload) })
      .then((res) => {
        if (res.status == 200) {
          this.setState({ pageLoader: false })
          localStorage.clear();
          localStorage.setItem('env', getEnvt)
          this.props.history.push('/')
        }
        else {
          this.setState({ pageLoader: false })
          localStorage.clear();
          localStorage.setItem('env', getEnvt)
          this.props.history.push('/')
        }
      })
      .catch(err => {
        this.setState({ pageLoader: false })
        localStorage.clear();
        localStorage.setItem('env', getEnvt)
        this.props.history.push('/')
      })
  }
  selectimage = () => {

  }

  changePlaceholder = (data) => {
    // console.log(`I am called${data}`)
    this.setState({ searchTextKey: data })
  }

  onSearchInput = (e) => {
    this.setState({ searchTextKey: e.target.value, searchTxtEnable: false })
  }

  handleKeyPress = (e, path) => {
    let { orgID } = this.state;
    // orgName = orgName.trim().split(" ").join("-");
    if (e.key === "Enter") {
      let searchText = e.target.value;
      this.setState({ searchTxtEnable: true }, () => {
        localStorage.setItem('globalSearchTxt', searchText)
      })
      let searchKey = searchText.split(" ").join("+")
      axios({
        url: `${this.state.env['searchUri']}/search/${orgID}/0/10?search='${searchText}'`,
        method: 'GET'
      }).then(res => {
        let payload = {
          "userId": this.state.userID,
          "searchText": searchText
        }
        axios.get(`${this.state.env['searchUri']}/searches/${this.state.userID}`).then(response => {
          let recentSearch = response.data;
          axios.post(`${this.state.env['searchUri']}/searches`, payload)
            .then(resp => {
              this.props.history.push({
                pathname: `/main/${path}`,
                search: `?q=${searchKey}`,
                state: [{ response: res.data }, { searchText: searchText }, { recentSearch: recentSearch }, { changePlaceholder: this.changePlaceholder }],
              })
            })
        })
      })

      // })
      // })

    }
  }
  componentDidUpdate() {
    if (localStorage.getItem('globalSearchTxt') != null && this.state.searchTxtEnable) {
      if (String(localStorage.getItem('globalSearchTxt')).length > 0) {
        //console.log('local storage', localStorage.getItem('globalSearchTxt'))
        if (String(localStorage.getItem('globalSearchTxt')) != this.state.searchTextKey) {
          this.setState({ searchTextKey: localStorage.getItem('globalSearchTxt') })
        }
      }
    }

  }
  goSupport = () => {
    this.props.history.push("/main/support")
  }
  openNotification = () => {
    Axios.put(`${this.state.env["notification"]}/seenAll/${this.state.userID}`)
      .then((res) => {
        console.log(res, "success dot notifications")
        this.getNotification()
      }).catch((err) => {
        console.log(err, "error dot notification")
      })
    this.setState({
      openNotify: !this.state.openNotify,
      notifyDot: false,
    });
  };
  goNotificationList = () => {
    this.setState({ notifyDot: false, openNotify: false });
    this.props.history.push("/main/notification");
  };
  goTask = () => {
    this.props.history.push("/main/task");
  }
  onCleanInput = () => {
    this.setState({ searchTextKey: '', searchTxtEnable: true }, () => {
      localStorage.setItem('globalSearchTxt', "")
    })
  }

  goToRepository = () => {
    this.props.history.push("/main/filerepository");
  }
  onBillingMethod = () => {
    this.setState({ dropDownOpen: !this.state.dropDownOpen }, () => {
      this.props.history.push("/main/billing");
    })

  }
  hourstodays = (num, momentTime) => {
    let d = Math.floor(num / 1440); // 60*24
    let h = Math.floor((num - d * 1440) / 60);
    let m = Math.round(num % 60);
    let s = Number(((num - d * 24 * 60 - h * 60 - m) * 60).toFixed(0));
    if (d > 0) {
      return momentTime.format("lll");
    } else if (m === 0 && s === 0) {
      return "now";
    } else if (h === 0 && m === 0) {
      return s + " secs ago";
    } else if (h === 0) {
      return m + " mins ago";
    } else {
      return h + " hr, " + m + " min";
    }
  };
  closeNotification = () => {
    this.setState({ openNotify: false })
  }
  handlePrivacy = () => {
    this.setState({ dropDownOpen: false }, () => {
      window.open("#/privacy", "_blank").focus()
    })
  }

  handleTermsofservice = () => {
    this.setState({ dropDownOpen: false }, () => {
      window.open("#/terms", "_blank").focus()
    })
  }

  handleAnnouncement = (id, index) => {
    let { announcement, sliderIndex, roundIndex } = this.state;
    sliderIndex = announcement.length - 1 === index ? 0 : sliderIndex;
    roundIndex = announcement.length - 1 === index ? 0 : roundIndex;
    Axios({
      url: `${this.state.env['announcementViewsUri']}/announcement-views`,
      method: 'POST',
      data: {
        "user_id": this.state.userID,
        "announcement_id": id
      }
    }).then(res => {
      console.log("xclose res", res)
      this.setState({ sliderIndex, roundIndex }, () => {
        this.getAnnouncement();
      })
    }).catch(err => {
      console.log("xclose err", err)
    })

  }
  horizontalAnnouncement = (id, index) => {
    //this.setState({ isloader: true });
    let { hannouncement, hSliderIndex, hRoundIndex } = this.state;
    hSliderIndex = hannouncement.length - 1 === index ? 0 : hSliderIndex;
    hRoundIndex = hannouncement.length - 1 === index ? 0 : hRoundIndex;
    Axios({
      url: `${this.state.env['announcementViewsUri']}/announcement-views`,
      method: 'POST',
      data: {
        "user_id": this.state.userID,
        "announcement_id": id
      }
    }).then(res => {
      console.log("xclose res", res)
      this.setState({ hSliderIndex, hRoundIndex }, () => {
        this.getAnnouncement();
      })
    }).catch(err => {
      console.log("xclose err", err)
      //this.setState({ isloader: false });
    })

  }
  verticalAnnouncement = (id, index) => {
    // this.setState({ isloader: true });
    let { vannouncement, hSliderIndex, hRoundIndex } = this.state;
    hSliderIndex = vannouncement.length - 1 === index ? 0 : hSliderIndex;
    hRoundIndex = vannouncement.length - 1 === index ? 0 : hRoundIndex;
    Axios({
      url: `${this.state.env['announcementViewsUri']}/announcement-views`,
      method: 'POST',
      data: {
        "user_id": this.state.userID,
        "announcement_id": id
      }
    }).then(res => {
      console.log("xclose res", res)
      this.setState({ hSliderIndex, hRoundIndex }, () => {
        this.getAnnouncement();
      })
    }).catch(err => {
      console.log("xclose err", err)
      // this.setState({ isloader: false });
    })

  }
  handleKnowmore = (url) => {
    window.open(`${url}`, "_blank")
  }

  slideDataRight = (index) => {
    index = index + 1;
    if (index < this.state.announcement.length) {
      this.setState({ sliderIndex: index, roundIndex: index });
    }
    else {
      this.setState({ sliderIndex: 0, roundIndex: 0 })
    }
  }
  slideDataLeft = (index) => {
    index = index - 1;
    console.log(index)
    if (index == -1) {
      this.setState({ sliderIndex: this.state.announcement.length - 1, roundIndex: this.state.announcement.length - 1 })
    } else {
      this.setState({ sliderIndex: index, roundIndex: index })
    }
  }
  slideDataRound = (index) => {
    this.setState({ roundIndex: index, sliderIndex: index })
  }
  getAnnouncement = () => {
    let { userID } = this.state;
    Axios.get(`${this.state.env["announcementUri"]}/announcements/${userID}`)
      .then(res => {
        // console.log(".....,", res.data);
        let stripData = [];
        let horizontalData = [];
        let verticalData = [];
        res.data.map(item => {
          let type = item["type"]["type_name"];
          if (type === "strip") {
            stripData.push(item)
          } else if (type === "horizontal") {
            horizontalData.push(item);
          } else if (type === "vertical") {
            verticalData.push(item)
          }
        })
        let isAnnounce = stripData.length > 0 ? true : false;
        let isRound = stripData.length === 1 ? false : true;
        let isModalHorizontalAnnounce = horizontalData.length > 0 ? true : false;
        let isModalVerticalAnnounce = verticalData.length > 0 ? true : false;
        let isHRound = horizontalData.length === 1 ? false : true;
        let isVRound = verticalData.length === 1 ? false : true;
        this.setState({ isAnnounce, isRound, isModalHorizontalAnnounce, isModalVerticalAnnounce, isVRound, vannouncement: verticalData, isHRound, announcement: stripData, hannouncement: horizontalData })
      }).catch(err => {
        console.log("announce error", err)
      })
  }
  horizontalClose = () => {
    this.setState({ isModalHorizontalAnnounce: false })
  }
  verticalClose = () => {
    this.setState({ isModalVerticalAnnounce: false })
  }

  hslideRight = () => {
    let { hSliderIndex, hannouncement } = this.state;
    hSliderIndex = hSliderIndex + 1;
    if (hSliderIndex < hannouncement.length) {
      this.setState({ hSliderIndex, hRoundIndex: hSliderIndex });
    }
    else {
      this.setState({ hSliderIndex: 0, hRoundIndex: 0 })
    }
  }
  hslideLeft = () => {
    let { hSliderIndex, hannouncement } = this.state;
    hSliderIndex = hSliderIndex - 1;
    if (hSliderIndex == -1) {
      this.setState({ hSliderIndex: hannouncement.length - 1, hRoundIndex: hannouncement.length - 1 })
    } else {
      this.setState({ hSliderIndex: hSliderIndex, hRoundIndex: hSliderIndex })
    }
  }
  vslideRight = () => {
    let { hSliderIndex, vannouncement } = this.state;
    hSliderIndex = hSliderIndex + 1;
    if (hSliderIndex < vannouncement.length) {
      this.setState({ hSliderIndex, hRoundIndex: hSliderIndex });
    }
    else {
      this.setState({ hSliderIndex: 0, hRoundIndex: 0 })
    }
  }
  vslideLeft = () => {
    let { hSliderIndex, vannouncement } = this.state;
    hSliderIndex = hSliderIndex - 1;
    if (hSliderIndex == -1) {
      this.setState({ hSliderIndex: vannouncement.length - 1, hRoundIndex: vannouncement.length - 1 })
    } else {
      this.setState({ hSliderIndex: hSliderIndex, hRoundIndex: hSliderIndex })
    }
  }
  horizontalRound = (index) => {
    this.setState({ hRoundIndex: index, hSliderIndex: index })
  }

  render() {
    let { organization, announcement, isAnnounce, sliderIndex, roundIndex, isRound, hSliderIndex, left, hRoundIndex, isHRound, vRight, hannouncement, imageBaseUrl, vannouncement, isVRound } = this.state;
    // console.log("sliderindec", sliderIndex)
    return (<React.Fragment>
      {this.state.loader ? <Loader /> : null}

      <div className="app-header-container" ref={this.profilePopupRef}>

        {/* <button ref={button=>this.myBtn = button} onClick={this.btnSound}>SOUND</button> */}
        <div className="menu-bar-wrap">
          {/* <ZqTooltip title={this.state.menuToggle ? 'Expand' : 'Collapse'} placement='right' >
            <i className="fa fa-bars" onClick={this.onMenuClick}></i>
          </ZqTooltip> */}
          <div className="horizontal-nav">
            <div className="header-nav-wrapper">
              <div className="overall-search-btn">
                {/* <span className="overall-search-icon"><SearchOutlinedIcon /></span> */}
                {/* <img src={globalSearchIcon} alt="Global Search" id="my-search" className="global-search-icon" onClick={() => { this.setState({ showSearchField: !this.state.showSearchField }) }}></img> */}
                <img src={globalSearchIcon} alt="Global Search" id="my-search" className="global-search-icon"></img>
                {this.state.showSearchField && <span className="span"><input type="text" id="my-searchInput" ref={this.showInputRef} /></span>}

                {/* <input className="search-input-box" value={this.state.searchTextKey} onChange={(e) => this.onSearchInput(e)} onKeyPress={(e) => this.handleKeyPress(e, 'search')} placeholder={this.state.placeholder} ></input>
                {String(this.state.searchTextKey).length == 0 ? null : <span className="close" style={{ cursor: "pointer" }} onClick={this.onCleanInput}><ClearIcon className="search-clear" /></span>} */}
              </div>
              <div className="icon-wrapper">
                {/* <div className="support-icon-box"><ZqTooltip title='Support' placement='bottom' ><HeadsetMicIcon onClick={this.goSupport} /></ZqTooltip></div> */}
                {/* <div className="task-icon-box"><ZqTooltip title='Task' placement='bottom' ><AssignmentOutlinedIcon onClick={this.goTask} /></ZqTooltip></div> */}
                {/* <div className="task-icon-box" ><ZqTooltip title='Repository' placement='bottom' ><FolderOutlinedIcon onClick={this.goToRepository} /></ZqTooltip></div> */}
                <ZqTooltip title='Notifications' placement='bottom' >
                  <div className="notification-icon-box">
                    {this.state.notifyDot === true ? (
                      <div className="notify-dot"></div>
                    ) : null}
                    <NotificationsNoneIcon onClick={this.openNotification} className="notify-icon-svg" />
                  </div>
                </ZqTooltip>
              </div>
            </div>
            <div className="drop-down-btn">
              {/* {this.state.profilePicture == "" ?
                <img src={profilePicture} className='profile-img-tiny' id="profile-image-tiny" style={{ width: "36px" }} onClick={() => this.dropDownToggle()} />
                :
                <img src={this.state.profilePicture} className='profile-img-tiny' id="profile-image-tiny" style={{ width: "36px" }} onClick={() => this.dropDownToggle()} />
              } */}
              {/* <span className="dot-menuitem" title="Fee Collection">Fee Collection</span> */}
              <span className={`zq-dotmenu ${this.state.dotMenuOpen ? 'zq-dotmenu-active' : ''}`} onClick={() => this.dotMenuToggle()}>
                <i className="zq-config-dots-menu" alt="Zenqore Menu"></i>
              </span>
              <span className="dotmenu-vertical-line"></span>

              <p className='profile-orgName' onClick={() => this.dropDownToggle()}>{this.state.orgName}<span><i className={this.state.dropDownOpen ? 'fa fa-chevron-up' : 'fa fa-chevron-down'}></i></span></p>

            </div>
            <div className={`dot-menu-view ${this.state.dotMenuOpen ? "open" : ''}`} id="dot-menu" style={{ display: `${this.state.dotMenuOpen ? 'block' : 'none'}` }}>
              <div className="profile-menu">
                {/* <div className="profile-details">
                  <p className="user-name">{this.state.firstName}<span> </span> {this.state.lastName}</p>
                  <p className="company-name">{this.state.loginEmail}</p>
                  <p className="company-name">{this.state.orgName}</p>
                  <p className="user-designation">{this.state.Role}</p>
                </div> */}
                {/* <div className='join-org'>
                  <p className="join-org-btn">
                    Accounting</p>
                </div> */}
                {/* <hr className='profile-seperator' /> */}
                <div className='join-org'>
                  <p className="join-org-btn">Fee Collection</p>
                </div>
                {/* <hr className='profile-seperator' /> */}
                {/* <div className='profile-logout'>
                  <Button variant="outlined" color="primary" className="logout-btn" onClick={this.logoutUsers}>Log Out</Button>
                </div>
                <hr className='profile-seperator' /> */}

              </div>
            </div>

            {/* {this.state.dropDownOpen ? */}
            <div className={`profile-menu-view ${this.state.dropDownOpen ? "open" : ''}`} id="profile-menu" style={{ display: `${this.state.dropDownOpen ? 'block' : 'none'}` }}>
              <div className="profile-menu">
                {/* <div className="profile-img" onClick={() => this.setProfilePicture()} > */}
                <div className="profile-img" >
                  {this.state.profilePicture == null ?
                    <img src={profilePicture} className='profile-img-upload' id="profile-image" />
                    :
                    <img src={this.state.profilePicture} className='profile-img-upload' id="profile-image" />
                  }
                </div>
                <div className="profile-details">
                  <p className="user-name">{this.state.firstName}<span> </span> {this.state.lastName}</p>
                  <p className="company-name">{this.state.loginEmail}</p>
                  <p className="company-name">{this.state.orgName}</p>
                  <p className="user-designation">{this.state.Role}</p>
                  {/* <div className="profile-features">
                    <button className="profile-features-btn" onClick={this.onBillingMethod}>Billing</button>
                    {/* <button className="profile-features-btn">Transfer</button> */}
                  {/* </div> */}
                  {/* <p className="change-password" onClick={this.changePassword}>Change Password</p> */}

                </div>
                <hr className='profile-seperator' />

                {/* <div className='join-org'>
                  <p className="join-org-btn" onClick={() => this.onBillingMethod()}><img src={BillingIcon} />Billing</p>
                </div> */}
                {/* <hr className='profile-seperator' />
                <div className='join-org'>
                  <p className="join-org-btn" onClick={() => this.changePassword()}><img src={changePasswordIcon} />Change Password</p>
                </div> */}
                {/* <div className="profile-features">
                  {this.state.changePassword ?
                    <div className="profile-pwd-form">
                      <ZenForm inputData={this.state.profileData} onFormBtnEvent={this.changePassword} onSubmit={this.changePasswordApi} />
                    </div>
                    : null
                  }
                </div> */}
                {/* <hr className='profile-seperator' /> */}
                {/* <div className='org-list'>
                  {organization.map((item, index) => {
                    return (<React.Fragment key={index}>
                      {(String(this.state.orgName).toLowerCase().replace(/ /g, "") == String(item.OrgName).toLowerCase().replace(/ /g, "")) && (String(this.state.DefaultOrganization.email).toLowerCase().replace(/ /g, "") == String(item.OrgEmail).toLowerCase().replace(/ /g, "")) ? null :
                        <React.Fragment>
                          <div className="org-list-btn" onClick={(ev) => { ev.stopPropagation(); this.switchUser(item, index) }} key={index}>
                            <p className='org-name'><img src={JoinOrgIcon} />{item.orgName}</p>
                            <p className="org-remove" onClick={(ev) => { ev.stopPropagation(); this.removeUser(item, index) }}><i className="fa fa-trash"></i></p>
                          </div>
                          <hr className='profile-seperator' />
                        </React.Fragment>
                      }
                    </React.Fragment>
                    )
                  })}
                </div> */}
                {/* <div className='join-org'>
                  <p className="join-org-btn" onClick={() => this.joinAnotherOrg()}><img src={JoinOrgIcon} />Join Another Organization</p>
                </div> */}
                {/* <hr className='profile-seperator' /> */}
                <div className='profile-logout'>
                  <Button variant="outlined" color="primary" className="logout-btn" onClick={this.logoutUsers}>Log Out</Button>
                </div>
                <hr className='profile-seperator' />
                {/* <div className="privacy-policy">
                  <Button variant="outlined" color="primary" className="privacy-btn" onClick={this.handlePrivacy}>Privacy Policy</Button>
                  <span className="separator-dot" aria-hidden="true">-</span>
                  <Button variant="outlined" color="primary" className="service-btn" onClick={this.handleTermsofservice}>Terms of Service</Button>
                </div> */}
              </div>
            </div>
            {/* : null} */}

          </div>
        </div>
        {this.state.isAnnounce &&
          announcement.map((item, i) => {
            return (
              <div className={`announcement-container ${isRound === false ? "strip-height" : ""}`} style={{ display: sliderIndex === i ? "block" : "none" }}>
                <div className="announcement-link-new">
                  {isRound && <>
                    <div className="announcement-left" onClick={() => this.slideDataLeft(i)} >
                      <ChevronLeftIcon style={{ fontSize: 30 }} />
                    </div>
                  </>}
                  <div className="announcement-link">{item.title}</div>
                </div>
                <div className="announcement-feature-new">
                  <div className="announcement-feature">{item.message}</div>
                  <div className="announcement-round-container">
                    {isRound && <>
                      {announcement.map((round, r) => {
                        return (
                          <div className="announcement-round" style={{ backgroundColor: roundIndex === r ? "black" : "white" }}
                            onClick={() => this.slideDataRound(r)}></div>
                        )
                      })}
                    </>}
                  </div>
                </div>
                <div className="announcement-startbtn-new">
                  <div className="announcement-startbtn" onClick={() => this.handleKnowmore(item.url)}>{item.action_text}</div>
                </div>
                <div className="announcement-xclose-new">
                  <div className="announcement-xclose" onClick={() => this.handleAnnouncement(item.id, i)}><CloseIcon /></div>
                  {isRound && <>
                    <div className="announcement-right" onClick={() => this.slideDataRight(i)}>
                      <ChevronRightIcon style={{ fontSize: 30 }} />
                    </div>
                  </>}
                </div>
              </div>
            )
          })
        }

        {this.state.isModalVerticalAnnounce && <>
          <div className="modal-container">
            {/* {this.state.isloader ? (<>
              <CircularProgress />
            </>
            ) : (
                <> */}
            {vannouncement.map((item, i) => {
              let imgurl = imageBaseUrl + item["banner"]["url"];
              return (
                <>
                  <div className="vertical-modal-container" style={{ display: hSliderIndex === i ? "block" : "none" }}>
                    <div className="vertical-modal-img">
                      {isVRound &&
                        <div className="v-left" onClick={this.vslideLeft}>
                          <ChevronLeftIcon style={{ fontSize: 50 }} />
                        </div>
                      }
                      <img src={imgurl} style={{ width: "100%", height: "100%" }}></img>
                    </div>
                    <div className="vertical-modal-text">
                      <div className="vertical-modal-close">
                        <div className="vclose" onClick={() => this.verticalAnnouncement(item.id, i)}>&times;</div>
                      </div>
                      <div className="vtext">
                        <div className="vtext-one">
                          <div className="vertical-header">{item.title}</div>
                        </div>
                      </div>
                      <div className="vtext-two">
                        {isVRound &&
                          <div className="v-right" onClick={this.vslideRight}>
                            <ChevronRightIcon style={{ fontSize: 50 }} />
                          </div>
                        }
                        <div className="vtext-three">{item.message}</div>
                      </div>
                      <div className="vertical-modal-button">
                        <div className="vbutton" onClick={() => this.handleKnowmore(item.url)}>{item.action_text}</div>
                      </div>
                      <div className="vspace"></div>
                    </div>
                  </div>
                </>
              )
            })}
            <div className="vertical-round-container">
              {vannouncement.map((round, r) => {
                if (r !== 0) {
                  vRight = vRight + 20;
                }
                return (
                  <>
                    {isVRound &&
                      <div className="vertical-round" style={{ left: vRight, backgroundColor: hRoundIndex === r ? "black" : "white" }}
                        onClick={() => this.horizontalRound(r)} >
                      </div>
                    }
                  </>
                )
              })}
            </div>
            {/* </>
              )} */}
          </div>
        </>}

        {this.state.isModalHorizontalAnnounce &&
          <>
            <div className="modalnew-container">
              <div className="horizontal-round-container">
                {hannouncement.map((round, r) => {
                  if (r !== 0) {
                    left = left + 20;
                  }
                  return (
                    <>
                      {isHRound &&
                        <div className="horizontal-round" style={{ left: left, backgroundColor: hRoundIndex === r ? "black" : "white" }}
                          onClick={() => this.horizontalRound(r)}>
                        </div>
                      }
                    </>
                  )
                })}
              </div>
              {hannouncement.map((item, i) => {
                let imgurl = imageBaseUrl + item["banner"]["url"];
                return (
                  <>
                    <div className="horizontal-modal-container " style={{ display: hSliderIndex === i ? "block" : "none" }}>
                      <div className="horizontal-modal-img">
                        <div className="hclose" onClick={() => this.horizontalAnnouncement(item.id, i)}>&times;</div>
                        {isHRound &&
                          <div className="h-left" onClick={this.hslideLeft}>
                            <ChevronLeftIcon style={{ fontSize: 50 }} />
                          </div>
                        }
                        <img src={imgurl} style={{ width: "100%", height: "100%" }}></img>
                        {isHRound &&
                          <div className="h-right" onClick={this.hslideRight}>
                            <ChevronRightIcon style={{ fontSize: 50 }} />
                          </div>
                        }
                      </div>
                      <div className="horizontal-modal-text">
                        <div className="horizontal-modal-heading">
                          <div className="horizontal-header">{item.title}</div>
                        </div>
                        <div className="horizontal-modal-second">
                          <div className="horizontal-modal-paragraph">
                            {item.message}
                          </div>
                        </div>
                        <div className="horizontal-modal-third">
                          <div className="horizontal-modal-button">
                            <div className="hbutton" onClick={() => this.handleKnowmore(item.url)}>{item.action_text}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })}
            </div>
          </>
        }

      </div>
      {this.state.openNotify === true ? (
        <div className="notification-wrap">
          {this.state.clearNotificationList === false ||
            this.state.getNotification.length > 0 ? (
              <>
                <div className="notification-heading">
                  <p>Notification</p>
                  <div className="notification-close">
                    <button
                      className="clear_all"
                      onClick={this.deleteNotificationLists}
                    >
                      Clear All
                  </button>
                    <CloseIcon
                      onClick={this.closeNotification}
                      className="notification-close-icon"
                    />
                  </div>

                </div>

                <div className="notification-content">
                  {this.state.todayNotifications.length === 0 ?
                    <>
                      {this.state.todayNotifications.length === 0 || this.state.yestNotifications.length > 1 || this.state.daysBeforeYestNotification.length > 1 ?
                        <div className="today-no-notify">
                          <p>Today</p>
                        </div> : null}
                      <div className="no-notification">
                        <p>No Notification</p>
                      </div> </> : <>
                      <div className="today-notify">
                        <p>Today</p>
                      </div>
                      {this.state.todayNotifications.map((item, i) => {
                        let read = item.isRead;
                        let momentTime = moment(item.modified_on);
                        let today = moment();
                        const diff = today.diff(momentTime, "minutes");
                        let sec;
                        if (diff === 0) {
                          sec = today.diff(momentTime, "seconds");
                        } else if (sec === 0) {
                          return "now";
                        }
                        let timeDiff = (diff, this.hourstodays(diff, momentTime));
                        return (
                          <div
                            key={i}
                            className="list_details"
                            onClick={() => this.changeReadandSeen(item, i)}
                          >
                            <div
                              className={
                                read === true ? "notify-listname" : "notify-listname-unread"
                              }
                            >
                              <Checkbox color="primary" />
                              <p>{item.message}</p>
                            </div>
                            <span>{timeDiff}</span>
                          </div>
                        );
                      })}</>}
                  {this.state.yestNotifications.length === 0 ? null :
                    <>
                      <div className="today-notify">
                        <p>Yesterday</p>
                      </div>
                      {this.state.yestNotifications.map((item, i) => {
                        let read = item.isRead;
                        let momentTime = moment(item.modified_on);
                        let today = moment();
                        const diff = today.diff(momentTime, "minutes");
                        let sec;
                        if (diff === 0) {
                          sec = today.diff(momentTime, "seconds");
                        } else if (sec === 0) {
                          return "now";
                        }
                        let timeDiff = (diff, this.hourstodays(diff, momentTime));
                        return (
                          <div
                            key={i}
                            className="list_details"
                            onClick={() => this.changeReadandSeen(item, i)}
                          >
                            <div
                              className={
                                read === true ? "notify-listname" : "notify-listname-unread"
                              }
                            >
                              <Checkbox color="primary" />
                              <p>{item.message}</p>
                            </div>
                            <span>{timeDiff}</span>
                          </div>
                        );
                      })}
                    </>}

                  {this.state.daysBeforeYestNotification.length === 0 ? null :
                    <>
                      {this.state.daysBeforeYestNotification.map((item, i) => {

                        return (
                          <><div className="today-notify">
                            <p>{item.date}</p>
                          </div>
                            {item.notifyList.map((item, i) => {
                              let read = item.isRead;
                              let momentTime = moment(item.modified_on);
                              let today = moment();
                              const diff = today.diff(momentTime, "minutes");
                              let sec;
                              if (diff === 0) {
                                sec = today.diff(momentTime, "seconds");
                              } else if (sec === 0) {
                                return "now";
                              }
                              let timeDiff = (diff, this.hourstodays(diff, momentTime));
                              return (<div
                                key={i}
                                className="list_details"
                                onClick={() => this.changeReadandSeen(item, i)}
                              >
                                <div
                                  className={
                                    read === true ? "notify-listname" : "notify-listname-unread"
                                  }
                                >
                                  <Checkbox color="primary" />
                                  <p>{item.message}</p>
                                </div>
                                <span>{timeDiff}</span>
                              </div>)
                            })}
                          </>);
                      })}
                    </>}
                  {this.state.getNotification.length === 0 ? null : <div className="btn-wrap">
                    <button className="mark_as_all_read" onClick={this.markAllAsRead}>
                      Mark all as Read
                    </button>
                    <button
                      className="view_all"
                      onClick={this.goNotificationList}
                    >
                      View All
                    </button>
                  </div>}
                </div>
              </>
            ) : (
              <>
                <div className="notification-heading">
                  <p>Notification</p>
                  <CloseIcon
                    onClick={this.closeNotification}
                    className="notification-close-icon"
                  />
                </div>
                <p className="no-notification">No Notification</p>
              </>
            )}
        </div>
      ) : null}
      {this.state.logoutModule ?
        <Dialog open={this.logoutUsers} aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description" className='logout-menu-wrap' >
          <DialogTitle id="alert-dialog-title" className="logout-header-text">Confirmation</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" className="logout-text">
              Are you sure you want to logout from <span style={{ color: "#00b8d9" }}>{this.state.orgName}</span>  ?
                        </DialogContentText>
          </DialogContent>
          <DialogActions className="logout-header-btns">
            <Button onClick={this.cancelLogout} className="btns-submit btns-cancel" color="primary" style={{ marginRight: "15px" }}>Cancel</Button>
            <Button onClick={this.logoutZenqore} className="btns-submit" color="primary" autoFocus>Confirm</Button>
          </DialogActions>
        </Dialog> : null}

    </React.Fragment >)
  }
}

export default withRouter(GigaHeader);