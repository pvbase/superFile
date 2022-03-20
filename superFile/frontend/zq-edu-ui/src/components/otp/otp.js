import React, { Component } from 'react';
// import zenqoreHome from '../../assets/images/zenqoreHome.jpeg';
import OtpInput from 'react-otp-input';
import Axios from 'axios';
import '../../scss/otp.scss';
import '../../scss/login.scss';
import Snackbar from '@material-ui/core/Snackbar';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Loader from '../../utils/loader/loaders';
import Dexie from 'dexie';
import ReactGA from 'react-ga';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';


import PubNubReact from 'pubnub-react';
Dexie.debug = false
let dbname = localStorage.getItem('channel');
let db = new Dexie(dbname);

function databaseExists(dbname, callback) {
  var dbExists = true;
  var request = window.indexedDB.open(dbname);
  request.onupgradeneeded = function (e) {
    if (request.result.version === 1) {
      dbExists = false;
      window.indexedDB.deleteDatabase(dbname);   
      indexedDB.databases().then(lists => {
        lists.map(dbNameItem => {
          if (dbNameItem.name !== dbname) {
            indexedDB.deleteDatabase(dbNameItem.name)
          }
        })
      })
      if (callback)
        callback(dbExists);
    }
  };
  request.onsuccess = function (e) {
    if (dbExists) {
      if (callback)
        callback(dbExists);
    }
  };
};

class OtpComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: "",
      min: 0,
      sec: 0,
      otp: '',
      channel: localStorage.getItem('channel'),
      env: JSON.parse(localStorage.getItem('env')),
      timerOn: true,
      resendOtp: false,
      snackBar: false,
      pageLoader: false,
      toast: false,
      disableOTPbtn:true
    }
    this.pubnub = new PubNubReact({
      publishKey: "pub-c-87ae3cc8-8d0a-40e0-8e0f-dbb286306b21",
      subscribeKey: "sub-c-982dbaba-1d98-11ea-8c76-2e065dbe5941",
      secretKey: "sec-c-ODRhYWJjZmYtZGQ0MS00ZjY2LTkzMGMtY2VhNGZhYjYzOWRi",
      ssl: false,
    });
    this.pubnub.init(this);
  }
  componentWillMount() {
    this.otpTimer(90);
  }
  handleEnter = (e) => {
    this.handleSubmit();
    if (this.state.disablebtn === false) {
      // this.OTPVerify();
      this.handleSubmit();
    } else if (this.state.otpInput === "") {
      alert("please fill details");
    }
  };
  handleKeyPress = (event) => {
    if (event.key === "Enter") {
      this.handleEnter(event);
    }
  };
  handleOnChange = (event) => {
    // this.setState({ otp: event });
    if(!isNaN(event)){
      this.setState({ otp: event })
      this.setState({ error: '' })
      console.log(event.length)
      if(event.length == 6){
       this.setState({ disableOTPbtn: false })
      }
      else{
       this.setState({ disableOTPbtn: true })
      }
     }
  };
  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress);
    // this.setState({ env: JSON.parse(localStorage.getItem("env")) });
  }
  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyPress);
  }
  otpTimer = (remaining) => {
    let m = Math.floor(remaining / 60);
    let s = remaining % 60;
    let timer_min = m < 10 ? "0" + m : m;
    let timer_sec = s < 10 ? "0" + s : s;
    this.setState({ min: timer_min, sec: timer_sec });
    remaining -= 1;
    if (remaining >= 0 && this.state.timerOn) {
      setTimeout(() => {
        this.otpTimer(remaining);
      }, 1000);
      return;
    }
    if (remaining < 0 || !this.state.timerOn) {
      // Do validate stuff here
      this.setState({ resendOtp: true });
      return;
    }
  }
  resendtheOTP = () => {
    this.setState({ toast: true, otp: '' })
    this.setState({ pageLoader: true });
    let payload = { "username": this.state.channel }
    Axios.post(`${this.state.env.zqBaseUri}/zqedu/otplogin`, payload)
      .then(response => {
        this.setState({ pageLoader: false });
        this.setState({ resendOtp: false })
        this.otpTimer(90);
        setTimeout(() => {
          this.setState({ toast: false })
        }, 1000);
      })
  }
  handleSubmit = () => {
    //eslint-disable-next-line
    let otp = /^(\+\d{1,3}[- ]?)?\d{6}$/
    if (otp.test(this.state.otp)) {
      let payload = { "contact": this.state.channel, "otp": String(this.state.otp)}
      this.setState({ pageLoader: true });
      fetch(`${this.state.env.zqBaseUri}/zqedu/otpregister`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }).then(res => {
        return res.json()
      }).then(response => {
        if (response.message.includes("success")) {
          //localStorage.setItem("auth_token", response['auth_token'])
          localStorage.setItem("auth_token","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im11bml5YXJhai5uZWVsYW1lZ2FtQGdtYWlsLmNvbSIsImlkIjoiNWY4NTgyZTA2OGEwMDIwMDA4NmM2Y2YxIiwiaWF0IjoxNjA1NjA0MzgxLCJleHAiOjE2MDU2OTA3ODF9.-zqFGREu0TzFYIfcBRQGSthE3ljX3P2JHwB-Qm5Up9A")
          localStorage.setItem("zen_auth_token", response['auth_token'])
          localStorage.setItem("sessionId", response['session_id'])
          let payloadId = { "authToken": localStorage.getItem('auth_token') }
          this.props.history.push('/main/dashboard')
          // --get user profile api
          // Axios({
          //   url: `${this.state.env['zqBaseUri']}/master/get/getUserProfile`,
          //   method: 'POST',
          //   data: payloadId
          // }).then(res => {
          //   console.log("getUserProfile", res)
          //   let defaultorg = {};
          //   let respData = res.data.data
          //   if (respData.userEmail !== undefined) {
          //     let ZQFirstName = respData.firstName
          //     let ZQLastName = respData.lastName
          //     let channel = localStorage.getItem('channel')
          //     let defaultorg = {};
          //     defaultorg = respData.defaultOrganization;
          //     localStorage.setItem("orgName", respData.orgList[0].orgName)
          //     localStorage.setItem("userID", respData.orgList[0].userId)
          //     localStorage.setItem("orgId", defaultorg.orgId)
          //     localStorage.setItem("email", respData.userEmail)

          //     // -----------------------------------------------------------
          //     let dbname = channel;
          //     databaseExists(dbname, (exists) => {
          //       if (exists) {
          //         console.debug("database " + dbname + " exists");
          //         ReactGA.initialize('UA-166923864-1', {
          //           titleCase: false,
          //           gaOptions: {
          //             clientId: `${ZQFirstName.trim()}${ZQLastName.trim()}`
          //           }
          //         });
          //         ReactGA.set({ page: '/main/dashboard' }); // Update the user's current page
          //         ReactGA.pageview('/main/dashboard'); // Record a pageview for the given page
          //         this.props.history.push('/main/dashboard')
          //       }
          //       else {
          //         this.pubnub.subscribe({
          //           channels: [channel],
          //           withPresence: true
          //         });
          //         this.pubnub.getMessage(channel, (pubnubRes) => {
          //           console.log(pubnubRes);
          //         });
          //         this.callIndexDB(dbname, ZQFirstName, ZQLastName);
          //       }
          //     });
          //   }
          //   else {
          //     //user with invitation
          //     if (localStorage.getItem('inviteId') && String(localStorage.getItem('inviteId')).length !== 0) {
          //       this.props.history.push('/onboard')
          //     }
          //     else {
          //       // alert('No Organisation and New User without Invite ID')

          //       this.setState({ pageLoader: false });
          //       // this.setState({ error: "No org found..Please Upload Master sheet..", snackBar: true })
          //       setTimeout(() => {
          //         this.setState({ snackbar: false });
          //         this.props.history.push('/setup')
          //       }, 1500);
          //     }
          //   }
          // })
          //   .catch(err => {
          //     console.log(err)
          //     this.setState({ pageLoader: false });
          //     this.setState({ error: "Something went wrong... Try again later", snackBar: true })
          //     setTimeout(() => {
          //       this.setState({ snackbar: false });
          //       this.props.history.push('/')
          //     }, 1500);
          //   })
        }
        else if (response.message.includes("Incorrect otp or Expired")) {
          this.setState({ pageLoader: false });
          this.setState({ error: "Incorrect OTP or OTP may be Expired", snackBar: true, otpInput: '', disableOTPbtn: true });
          setTimeout(() => {
            this.setState({ snackBar: false })
          }, 2000);
        }
      },
        (err) => {
        }
      )
      document.body.classList.value = 'header-fixed sidebar-lg-show sidebar-fixed signin'
    }else{
      this.setState({ error: "Incorrect OTP", snackBar: true })
      setTimeout(() => {
        this.setState({ snackBar: false })
      }, 2000);
      
    }
  }
  callIndexDB = async (dbname, ZQFirstName, ZQLastName) => {
    console.debug("database " + dbname + " does not exists");
    console.log("Database doesn't exist");

    let db = new Dexie(dbname);
    db.version(1).stores({ zenqoredata: 'id,value' })
    const apiData = await Axios.get(`${this.state.env['zqBaseUri']}/indexedb/logindataFetch?org=${localStorage.getItem('orgId')}`, {
      headers: {
        "Authorization": localStorage.getItem('auth_token')
      }
    })
      .then(res => {
        if (res.data.status == "success") {
          // this.playAround().then(res => {
          let dbData = res.data.data
          console.log('indexdb response', dbData)
          return dbData
        }
      })

    let createDBData = await apiData;
    console.log('createDBData', createDBData)
    if (createDBData !== undefined) {
      for (let item in createDBData) {
        db.zenqoredata.put({ id: item, data: createDBData[item] })
      }
      this.setState({ isLoader: false });
      ReactGA.initialize('UA-166923864-1', {
        titleCase: false,
        gaOptions: {
          clientId: `${ZQFirstName.trim()}${ZQLastName.trim()}`
        }
      });
      ReactGA.set({ page: '/main/dashboard' }); // Update the user's current page
      ReactGA.pageview('/main/dashboard');
      this.props.history.push('/main/dashboard');
    }
    else {
      db.delete();
      this.setState({ isLoader: false });
      ReactGA.initialize('UA-166923864-1', {
        titleCase: false,
        gaOptions: {
          clientId: `${ZQFirstName.trim()}${ZQLastName.trim()}`
        }
      });
      ReactGA.set({ page: '/main/dashboard' }); // Update the user's current page
      ReactGA.pageview('/main/dashboard');
      this.props.history.push('/main/dashboard');
    }

  }

  render() {
    const { error, min, sec } = this.state;
    var mobileNum = String(this.state.channel).substring(0, 2) + 'XXXXXX' + String(this.state.channel).substring(String(this.state.channel).length - 2)
    return (<React.Fragment>
      {this.state.pageLoader ? <Loader /> : null}
      <div className="zenqore-header-wrap">
        <img src={ZqsmallLogo} className="zq-logo-image" alt="Zenqore" ></img>
        <img src={ZqTextLogo} className="zq-logo-setup" alt="Zenqore" ></img>
      </div>
      <div className="login-wrap figma">
        <div className="zenqore-image-wrapper">
          <div className="zenqore-image-wrap">
          <p className="zq-slogan"> AI powered fees and accounting platform <br />which saves time and gets lots done</p>
            <img src={zenqoreHome} className="zenHome-image" alt="Zenqore-Next Step Accounting" ></img>
          </div>
        </div>
        <div className="zenqore-leftside-wrap">
          <div className="circles-wrap">
            <img src={OrangeCrcle} className="circle-image" alt="Zenqore" ></img>
            <img src={greenCircle} className="circle-image1" alt="Zenqore" ></img>
            <img src={smallGreenCircle} className="circle-image2" alt="Zenqore" ></img>
          </div>
          <div className="zenqore-login-container">
            <div className="login-content">
              <div className="otp-wrapper">
                <p className="otp-info">Please enter the OTP sent to</p>
                <span className="otp-info">+91 {mobileNum}</span> &nbsp;
            <span className="change-otp-btn" title="Change Mobile Number" onClick={() => { this.props.history.push('/') }}>Change</span>
              </div>
              <div>
                <OtpInput
                  id="otp"
                  inputStyle={{
                    width: '48px',
                    height: '48px',
                    marginTop: '20px',
                    marginLeft: '8px',
                    fontSize: "14px",
                    borderRadius: 4,
                    border: 'solid 1px #15435b',
                    fontFamily: 'OpenSans-Medium',
                    fontWeight: 500,
                    fontStretch: 'normal',
                    fontStyle: 'normal',
                    lineHeight: 1.5,
                    letterSpacing: 'normal',
                    color: '#15435b',
                  }}
                  className="otpStyle"
                  name="otp"
                  onChange={this.handleOnChange}
                  numInputs={6}
                  value={this.state.otp}
                  shouldAutoFocus="true"
                  separator={<span></span>}
                />
              </div>
              <Snackbar
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={this.state.snackBar}
                autoHideDuration={2000}
                message={this.state.error}
                className={`info-snackbar ${this.state.error ? 'alert-red' : ''}`}
              />
              <button className="primary-btn-otp" type="submit" onClick={this.handleSubmit} disabled={this.state.disableOTPbtn}>Verify OTP</button>
              <div className="resend-otp-wrap">
                {!this.state.resendOtp ?
                  <React.Fragment>
                    <p className="otp-para"> Didn't received yet? <span className="login-btn-color" title="Click to resend the One Time Password (OTP)" >Resend Code</span></p>
                    <p className="resend-timer">{`${min + ':' + sec}`}</p>
                  </React.Fragment> : <React.Fragment>
                    <p className="otp-para"> Didn't received yet? <span className="login-btn-color" title="Click to resend the One Time Password (OTP)" onClick={this.resendtheOTP} >Resend Now</span></p>
                  </React.Fragment>}
              </div>
              {this.state.toast ?
                <React.Fragment>
                  <div className="login-copyright-wrap">
                   
                    {/* <button className="otp-toast-btn" type="submit"  > <CheckCircleIcon />Verification has sent to {this.state.channel} </button> */}
                    <Snackbar
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={true}
                autoHideDuration={1000}
                message={`OTP  has been sent to your mobile no.${this.state.channel}`}
                className={`info-snackbar alert-green }`}
              />
                  </div>
                </React.Fragment>
                : null

              }

            </div>
          </div>
        </div>
      </div>
      <div className="login-copyright-wrap figma">
        <div className="login-copyright-text">
          <p>Copyright © {(new Date().getFullYear())} Gigaflow Technologies LLP. All rights reserved</p>
        </div>
      </div>
    </React.Fragment>);
  }

}

export default OtpComponent;
