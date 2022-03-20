import React, { Component } from 'react';
// import zenqoreHome from '../../assets/images/zenqoreHome.jpeg';
import ZenForm from '../input/form';
// import Axios from 'axios';
import forgotForm from './forgotpassword.json';
import "./../../scss/login.scss";
import Snackbar from '@material-ui/core/Snackbar';
import Loader from '../../utils/loader/loaders';
// import Button from '@material-ui/core/Button';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';

const Cryptr = require('cryptr');
const cryptr = new Cryptr('ZqSecretKey');
class ForgotPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      env: {},
      forgotFormData: [],
      enableResendLink: false,
      error: '',
      isLoader: false,
      snackBar: false
    }
  }
  componentDidMount() {
    let { newpath } = this.state;
    let emailLocation = window.location.href;
    const value = emailLocation.split("?")
    this.setState({ username: value[1], newpath: value[0] })
    this.props.history.push(newpath)
    this.setState({ env: JSON.parse(localStorage.getItem('env')) })
    localStorage.setItem("email", value[1]);
  }
  componentWillMount = () => {
    // forgotForm.map(item => {
    //   if (item.name == 'email') {
    //     item['defaultValue'] = this.props.location.userInput
    //   }
    // })
    this.setState({ forgotFormData: forgotForm })
    // this.setState({ username: this.props.location.userInput })
  }
  onSubmit = (data, item) => {
    console.log('***data***', item)
    console.log('***pwd***', data.password.value)
    let payload = { "contact": this.state.username, "password": String(cryptr.encrypt(data.password.value)) }
    let apiDetails = item['apiDetails']['0']
    // let loginapiDetails = item['apiDetails']['1']
    // let loginDetails = item['apiDetails']['2']
    // let getProfileDetails = item['apiDetails']['3']
    this.setState({ isLoader: true });
    fetch(`${this.state.env[apiDetails['baseUri']]}/${apiDetails['apiUri']}`, { method: 'POST', body: JSON.stringify(payload) })
      .then(res => {
        return res.json()
      })
      .then(response => {
        if (response.message.includes("successfully")) {
          this.setState({ error: 'Password changed Sucessfully', snackBar: true, userInput: this.state.username })
          setTimeout(() => {
            this.setState({ snackBar: false })
          }, 1000);
          setTimeout(() => {
            this.props.history.push({
              pathname: '/', userInput: this.state.username
            })
          }, 2000);
          // let payload = { "contact": this.state.username, "password": String(data.password.value), "origin": window.location.origin }
          // Axios.post(`${this.state.env[loginapiDetails['baseUri']]}/${loginapiDetails['apiUri']}`, payload)
          //   .then(response => {
          //     this.setState({ isLoader: false });
          //     if (response.data.message.includes('login success')) {
          //       let payloadId = { "authToken": response.data['auth_token'] }
          //       localStorage.setItem("auth_token", response.data['auth_token'])
          //       localStorage.setItem("zen_auth_token", response.data['auth_token'])

          // --get user profile api
          //     let getUserprofilePayload = {
          //       "authToken": response.data['auth_token']
          //     }
          //     Axios.post(`${this.state.env['newMaster']}/master/get/getUserProfile`, getUserprofilePayload)
          //       .then(res => {
          //         if (res.status == 200) {
          //           console.log("getUserProfile", res)
          //           let defaultorg = {};
          //           defaultorg = res.data.DefaultOrganization;
          //           let loginidosPayload = {
          //             "user": defaultorg.email
          //           }
          //           if (String(res.UserEmail).length !== 0) {
          //             Axios.post(`${this.state.env[loginDetails['baseUri']]}/${loginDetails['apiUri']}`, loginidosPayload)
          //               .then(responseId => {
          //                 if (responseId.status == 400) {
          //                   localStorage.setItem('registerUser', false);
          //                   this.props.history.push('/main/dashboard')
          //                 } else {
          //                   console.log('response.logincredentials', responseId)
          //                   if ((responseId.data['userData']['logincredentials'] !== undefined)) {
          //                     if ((responseId.data["userData"]["logincredentials"]["0"]["message"]).toLowerCase() == "failure") {
          //                       this.setState({ error: responseId.data["userData"]['logincredentials']["0"]["failurereason"] });
          //                       this.props.history.push('/onboard')
          //                     } else {
          //                       let token = responseId.data["userData"]['logincredentials']['0']['authTokenuserIdRoleId']
          //                       localStorage.setItem("auth_token", token)
          //                       localStorage.setItem("email", responseId.data.usermail)
          //                       localStorage.setItem("zen_email", this.props.location.userInput)
          //                       localStorage.setItem('registerUser', true)
          //                       this.props.history.push('/main/dashboard')
          //                     }
          //                   }
          //                   else {
          //                     this.setState({ error: "Something went wrong... Try again later", password: '' })
          //                   }
          //                 }
          //               })
          //               .catch(err => {
          //                 this.setState({ error: 'Invalid User' });
          //                 this.props.history.push('/onboard')
          //               })
          //           }
          //           else {
          //             this.props.history.push('/onboard')
          //           }
          //         }
          //       })
          //       .catch(err => {
          //         this.props.history.push('/onboard')
          //       })
          //   }
          //   else if (response.data.message.includes('pls register')) {
          //     this.setState({ error: 'You are not a registered user, please register' });
          //     this.setState({ isLoader: false });
          //     this.props.history.push('/register')
          //   }

          //   else if (response.data.message.includes('incorrect')) {

          //     this.setState({ isLoader: false });
          //     this.setState({ error: 'Entered password is wrong, please try again.', snackBar: true });
          //     setTimeout(() => {
          //       this.setState({ snackBar: false })
          //     }, 1000);
          //     this.setState({ username: this.state.username, password: '' })
          //   }
          //   console.log('email login response', response)
          // },
          //   (err) => {
          //     console.log("error")
          //     this.setState({ isLoader: false });

          //     this.setState({ error: 'Entered password is wrong, please try again.', snackBar: true });
          //     setTimeout(() => {
          //       this.setState({ snackBar: false })
          //     }, 2000);

          //   })

        } else if (response.message.includes("Url expired")) {
          this.setState({ error: "Verification Link has been expired", snackBar: true, enableResendLink: true })
          this.setState({ isLoader: false });
          setTimeout(() => {
            this.setState({ snackBar: false })
          }, 1500);
        }

      })

  }
  onLogin = () => {
    this.props.history.push('/')
  }
  resendEmailLink = () => {
    let payload = { "contact": this.state.username }
    fetch(`${this.state.env.resetPwdUri}/resetreq`, { method: 'POST', body: JSON.stringify(payload) })
      .then(res => {
        return res.json();
      }).then(response => {
        // console.log('link response', response)
        this.setState({ error: "Verification Link has been sent to your mail", snackBar: true, })
        setTimeout(() => {
          this.setState({ snackbar: false });
        }, 2000);
      })
  }
  onPasswordSuccess = () => {
    this.setState({ snackBar: false }, () => {
      this.props.history.push({
        pathname: '/zqsignin', userInput: this.state.username
      })
    });

  }
  render() {
    return (<React.Fragment>
      {this.state.isLoader ? <Loader /> : null}
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
              <h3 className="login-form-hd">Forgot Password?</h3>
              <p className="login-desc-txt">Please create your new password</p>
              <ZenForm inputData={this.state.forgotFormData} onSubmit={this.onSubmit} />
              <div className="signup-req-wrap">
                {this.state.enableResendLink && <p className="login-btn-color" onClick={this.resendEmailLink} style={{ "textDecoration": "underline", "cursor": "pointer" }}>Resend Link Now</p>}

                {/* <a className="forgot-pwd">Forgot  Password?</a> */}
                {/* <p className="login-separator-line"></p> */}
                <p className="login-para">I remember my password. <span className="login-btn-color" onClick={this.onLogin} >Login Now</span></p>
                {/* <div className="login-copyright-wrap"><p className="login-copyright-text">© {(new Date().getFullYear())} All rights reserved. Gigaflow Technologies LLP. </p></div> */}
              </div>
              <Snackbar
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={this.state.snackBar}
                autoHideDuration={1000}
                message={this.state.error}
                className="info-snackbar"

              />


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

export default ForgotPassword;