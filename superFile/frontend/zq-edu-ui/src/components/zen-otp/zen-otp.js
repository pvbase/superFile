import React, { Component } from 'react';
import OtpInput from 'react-otp-input';
import Axios from 'axios';
import '../../scss/otp.scss';
import '../../scss/login.scss';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Snackbar from '@material-ui/core/Snackbar';
import Loader from '../../utils/loader/loaders';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';



class ZenOTP extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInput: '',
      otperror: '',
      min: 0,
      sec: 0,
      otp: '',
      toast: false,
      env: JSON.parse(localStorage.getItem('env')),
      channel: localStorage.getItem('channel'),
      timerOn: true,
      resendOtp: false,
      pageLoader: false,
      disableOTPbtn: true,
      snackBar: false

    }
  }
  componentWillMount() {
    let { newpath } = this.state;
    let mobileNumberLocation = window.location.href;
    const value = mobileNumberLocation.split("?")
    this.setState({ userInput: value[1], newpath: value[0] })
    if (value[1] !== undefined) {
      this.props.history.push(newpath)
      this.setState({ env: JSON.parse(localStorage.getItem('env')) })
      localStorage.setItem("channel", value[1]);

      this.setState({ disableOTPbtn: true });
      this.otpTimer(60);
      let payload = { "username": value[1] }
      Axios.post(`${this.state.env.zqBaseUri}/zqedu/otpregister`, payload)
        .then(response => {
          if (response.status == 201 || response.status == 200) {
            this.otpTimer(60);
            // this.setState({ disableOTPbtn: false });
            console.log(response)
          }
          else if (response.status == 401) {
            this.setState({
              otperror: "Admin has not approved this request",
              otp: '',
              snackBar: true,
              disableOTPbtn: true
            })
          }
        }, (err) => {
          console.log(err.response)
          let response = err.response;
          this.setState({
            otperror: response["data"]["message"],
            otp: '',
            snackBar: true,
            disableOTPbtn: true
          })
        })
    }
    else {
      alert('Please verify the registeration link')
      this.props.history.push('/')
    }
  }
  handleOnChange = (event) => {
    if (!isNaN(event)) {
      this.setState({ otp: event })
      this.setState({ error: '' })
      console.log(event.length)
      if (event.length == 6) {
        this.setState({ disableOTPbtn: false })
      }
      else {
        this.setState({ disableOTPbtn: true })
      }
    }

  }
  otpTimer = (remaining) => {
    let m = Math.floor(remaining / 60);
    let s = remaining % 60;

    let timer_min = m < 10 ? '0' + m : m;
    let timer_sec = s < 10 ? '0' + s : s;

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
      this.setState({ resendOtp: true })
      return;
    }
  }
  resendtheOTP = () => {
    this.setState({ toast: true, otp: '' })
    this.setState({ pageLoader: true });
    let payload = { "username": this.state.userInput }
    Axios.post(`${this.state.env.zqBaseUri}/zqedu/otpregister`, payload)
      .then(response => {
        this.setState({ pageLoader: false });
        this.setState({ resendOtp: false })
        this.otpTimer(90);
        setTimeout(() => {
          this.setState({ toast: false })
        }, 1000);

      })
  }
  onOtpSubmit = () => {
    this.setState({ pageLoader: true })
    // eslint-disable-next-line
    // var emailId = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    var phoneno = /\+?\d[\d -]{8,12}\d/;
    let payload = { "username": this.state.userInput, "otp": this.state.otp }
    if (this.state.userInput.length === 10 && phoneno.test(this.state.userInput)) {
      this.props.history.push('/student-data-portal')
      localStorage.setItem("auth_token", 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiOTg3MzY1ODg5NSIsIlVzZXJJZCI6IjVmYWEyZDZkODM3NzRiMDAwN2U2NTM4ZCIsImluc3RpdHV0ZSI6Ikp1c3RpbiBJbnN0aXR1dGUiLCJyb2xlIjoiQWRtaW4iLCJhY2NvdW50X1N0YXR1cyI6IkFjdGl2ZSIsImlhdCI6MTYwNTE2MjM5OH0.NT3CQGvUtSI4bIZhYVoai3ojrLgRnQPUc78tOdjcWXo');
      setTimeout(() => {
        this.setState({ pageLoader: false })
      }, 2000)
      // Axios.post(`${this.state.env.zqBaseUri}/zqedu/register`, payload)
      //   .then(response => {
      //     if (response.data.message.includes("success")) {
      //       let payload = { "contact": this.state.userInput, "otp": this.state.otp }
      //       fetch(`${this.state.env.zqBaseUri}/zqedu/login`,
      //         {
      //           method: 'POST',
      //           body: JSON.stringify(payload),
      //         }
      //       ).then(res => {
      //         return res.json();
      //       })
      //         .then(response => {
      //           if (response.message.includes("success")) {
      //             this.setState({ pageLoader: false })
      //             localStorage.setItem("auth_token", response['auth_token']);
      //             localStorage.setItem("zen_auth_token", response['auth_token']);

      //             if (localStorage.getItem('inviteId') && String(localStorage.getItem('inviteId')).length !== 0) {
      //               this.props.history.push('/onboard')
      //             }
      //             else {
      //               this.props.history.push('/student-data-portal')
      //             }
      //           }
      //           else if (response.message.includes("Incorrect otp or Expired")) {
      //             this.setState({ pageLoader: false })
      //             this.setState({ error: "Incorrect OTP or OTP may be Expired", snackBar: true, otp: '', disableOTPbtn: true });
      //             setTimeout(() => {
      //               this.setState({ snackBar: false })
      //             }, 2000);
      //           }
      //         },
      //           (err) => {
      //             console.log("------err----", err)
      //             this.setState({ pageLoader: false })
      //             this.setState({
      //               otperror: 'Incorrect OTP or OTP may be expired',
      //               otp: '',
      //               disableOTPbtn: true,
      //               snackBar: true
      //             })
      //             setTimeout(() => {
      //               this.setState({ snackBar: false })
      //             }, 2000);
      //           }
      //         )
      //       document.body.classList.value = 'header-fixed sidebar-lg-show sidebar-fixed signin'
      //     }

      //   }, (err) => {
      //     console.log("err", err)
      //     if (err.response.data.message !== undefined) {
      //       if (err.response.data.message.includes("Incorrect otp") || (err.response.data.message.includes("Expired"))) {
      //         this.setState({ pageLoader: false, })
      //         this.setState({
      //           otperror: 'Incorrect OTP or OTP may be expired',
      //           otp: '',
      //           disableOTPbtn: true,
      //           snackBar: true
      //         })


      //       }
      //       else if (err.response.data.message.includes('pls login')) {
      //         this.setState({ pageLoader: false, })
      //         this.setState({
      //           otperror: 'You are already registered.. Please Log in',
      //           otp: '',
      //           disableOTPbtn: true,
      //           snackBar: true
      //         })
      //       }
      //       else {
      //         this.setState({
      //           pageLoader: false,
      //           disableOTPbtn: true,
      //           otperror: err.response.data.Err,
      //           snackBar: true
      //         })
      //       }
      //     }
      //     else {
      //       this.setState({
      //         pageLoader: false,
      //         disableOTPbtn: true,
      //         otperror: err.response.data.Err,
      //         snackBar: true
      //       })
      //     }
      //   })

    }
  }
  render() {
    const { otperror, min, sec } = this.state;
    var mobileNum = String(this.state.userInput).substring(0, 2) + 'XXXXXX' + String(this.state.userInput).substring(String(this.state.userInput).length - 2)

    return (<React.Fragment >
      { this.state.pageLoader ? <Loader /> : null}
      < div className="zenqore-header-wrap" >
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
                  separator={<span></span>}
                />
              </div>
              <br />
              <Snackbar
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={this.state.snackBar}
                autoHideDuration={1000}
                message={otperror}
                className={`info-snackbar ${otperror.includes('success') ? 'alert-green' : 'alert-red'}`}
              />
              {/* {otperror && <p className="error-texts" style={{ color: `${otperror.includes("success") ? "green" : (otperror.includes('Incorrect OTP') || otperror.includes('valid OTP') || otperror.includes('Invalid User') || otperror.includes('already') || otperror.includes('Admin') ? "red" : "")}` }}>{otperror}</p>} */}
              <button className="primary-btn-otp" type="submit" disabled={this.state.disableOTPbtn} onClick={this.onOtpSubmit}>Verify OTP</button>

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
                    {/* <button className="otp-toast-btn" type="submit"  > <CheckCircleIcon />Verification Link sent to {this.state.channel} </button> */}
                    <Snackbar
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={true}
                      autoHideDuration={1000}
                      message={`OTP  has been sent to your mobile no. ${this.state.userInput}`}
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
    </React.Fragment >);
  }
}

export default ZenOTP;