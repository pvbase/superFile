import React, { Component } from 'react';
// import zenqoreHome from '../../assets/images/zenqoreHome.jpeg';
import ZenForm from '../input/form';
import signupForm from './signup.json';
import Axios from 'axios';
import "./../../scss/login.scss";
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
// import Loader from '../../utils/loader/loaders';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';

const Cryptr = require('cryptr');
const cryptr = new Cryptr('ZqSecretKey');

var emailFromLink = ""
class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // error: '',
      emailerror: '',
      userInput: '',
      username: '',
      env: JSON.parse(localStorage.getItem('env')),
      signupFormData: [],
      snackBar: false
    }
  }
  componentWillMount() {
    // this.setState({ env: JSON.parse(localStorage.getItem('env')) })
    let { newpath } = this.state;
    let emailLocation = window.location.href;
    const value = emailLocation.split("?")
    this.setState({ username: value[1], newpath: value[0] })
    this.props.history.push(newpath)
    this.setState({ env: JSON.parse(localStorage.getItem('env')) })
    localStorage.setItem("email", value[1]);
    localStorage.setItem("channel", value[1]);
    emailFromLink = value[1]


    let payload = { "username": emailFromLink }
    Axios.post(`${this.state.env.zqBaseUri}/zqedu/otpregister`, payload)
      .then(response => {
        console.log(response)
      }, (err) => {
        console.log(err.response)
        if (err.response.data.message.includes("already")) {
          this.setState({ hidePasswordInputs: true, emailerror: "You are already registered...Please log in", pageLoader: false, snackBar: true })
          // setTimeout(() => {
          //     // this.props.history.push('/')
          //     this.setState({snackBar:false})
          // }, 1000);
        } else this.setState({ hidePasswordInputs: true, emailerror: "Admin has not approved this email address", disablebtn: true, snackBar: true })
      })
    signupForm.map(item => {
      if (String(item.name) === 'email') {
        item['defaultValue'] = emailFromLink
      }
      // return
    })
    this.setState({ signupFormData: signupForm })

  }

  onSubmit = (data, item) => {
    console.log('***data***', item)
    let apiDetails = item['apiDetails']['0']
    let regiterDetails = item['apiDetails']['1']
    let loginDetails = item['apiDetails']['2']
    let payload = { "username": data.email.value }
    Axios.post(`${this.state.env[apiDetails['baseUri']]}/${apiDetails['apiUri']}`, payload)
      .then(response => {
        console.log(response)
        this.setState({ hidePasswordInputs: false });
        let payload = { "username": String(data.email.value), "password": String(cryptr.encrypt(data.password.value)) }
        Axios.post(`${this.state.env[regiterDetails['baseUri']]}/${regiterDetails['apiUri']}`, payload)
          .then(response => {
            if (response.data.message.includes("registerd success")) {
              let payloadId = { "username": data.email.value, "password": String(cryptr.encrypt(data.password.value)) }
              // fetch(`${this.state.env.baseUri}/login`, { method: 'POST', body: JSON.stringify(payload), credentials: 'include' }).then(res => {
              Axios.post(`${this.state.env[loginDetails['baseUri']]}/${loginDetails['apiUri']}`, payloadId)
                .then(response => {
                  if (response.data.message.includes("login success")) {
                    this.setState({ pageLoader: false });
                    localStorage.setItem("auth_token", response.data['auth_token']);
                    localStorage.setItem("zen_auth_token", response.data['auth_token'])
                    localStorage.setItem("sessionId", response.data['session_id'])
                    //new user without invitation
                    if (localStorage.getItem('inviteId') && String(localStorage.getItem('inviteId')).length !== 0) {
                      this.props.history.push('/onboard')
                    }
                    else {
                      this.props.history.push('/student-data-portal')
                    }
                  }
                  else if (response.data.message.includes("Incorrect otp or Expired")) {
                    this.setState({ pageLoader: false });
                  }
                },
                  (err) => {
                    // console.log('error')
                  }
                )
              document.body.classList.value = 'header-fixed sidebar-lg-show sidebar-fixed signin'

            }

          }, (err) => {
            if (err.response.data.message.includes("Url expired.")) {
              this.setState({ pageLoader: false });
              this.setState({ emailerror: "Verification Link has been expired", enableResendLink: true })
              // this.props.history.push('/zensignup')
            }
            else if (err.response.data.message.includes("already")) {
              this.setState({ hidePasswordInputs: true, emailerror: "You are already registered...Please log in", pageLoader: false })
              setTimeout(() => {
                this.props.history.push('/')
              }, 2000);
            }
          })
        // }

      }, (err) => {
        console.log(err.response)
        if (err.response.data.message.includes("already")) {
          this.setState({ emailerror: "You are already registered...Please log in", pageLoader: false, snackBar: true })
          // setTimeout(() => {
          //   this.setState({snackBar:false})

          // }, 2000);
          // setTimeout(() => {
          //   this.props.history.push('/')
          // }, 2500);
        }
        else
          this.setState({ emailerror: "Admin has not approved this email address", pageLoader: false, snackBar: true })
        setTimeout(() => {
          this.setState({ snackBar: false })
        }, 2000);
      })

  }
  routerpage = (mzg) => {
    if (String(mzg).includes('not approved')) {
      this.props.history.push('/');
    }
    else {
      this.props.history.push('/')
    }
  }
  render() {
    return (<React.Fragment>
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
              <h3 className="login-form-hd">Welcome Back</h3>
              <p className="login-desc-txt">Setup your password and Sign Up to Zenqore</p>
              <ZenForm inputData={this.state.signupFormData} onSubmit={this.onSubmit} />
              <div className="signup-req-wrap">
                {/* <a className="forgot-pwd">Forgot  Password?</a> */}
                {/* <p className="login-separator-line"></p> */}
                {/* <p className="login-para">Already have an Account? <span className="login-btn-color" onClick={this.signupProcess} >Login Now</span></p> */}
                {/* <div className="login-copyright-wrap"><p className="login-copyright-text">© {(new Date().getFullYear())} All rights reserved. Gigaflow Technologies LLP. </p></div> */}
              </div>
              <Snackbar
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={this.state.snackBar}
                autoHideDuration={1000}
                message={this.state.emailerror}
                className="info-snackbar"
                action={
                  <React.Fragment>
                    <Button color="secondary" size="small" onClick={(ev) => { ev.stopPropagation(); this.routerpage(this.state.emailerror) }}>
                      Click Here
                  </Button>
                  </React.Fragment>
                }
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
    </React.Fragment>);
  }
}

export default Signup;