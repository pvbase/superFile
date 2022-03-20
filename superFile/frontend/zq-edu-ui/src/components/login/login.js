import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import Recaptcha from 'react-recaptcha';
import Axios from 'axios';
import { withRouter } from 'react-router-dom';
import ZenForm from '../input/form';
import loginForm from './login.json'
import "./../../scss/login.scss";
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import Loader from '../../utils/loader/loaders';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';

class LoginComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: '',
      userInput: '',
      env: {},
      loginFormData: [],
      snackBar: false,
      isLoader: false
    }
  }

  componentDidMount() {
    //invite accountant
    if (window.location.href.includes('?')) {
      let { newpath } = this.state;
      let emailLocation = window.location.href;
      const value = emailLocation.split("?")
      let inviteId = value[1].split('=')
      this.setState({ inviteId: inviteId, newpath: value[0] })
      this.props.history.push(newpath)
      this.setState({ env: JSON.parse(localStorage.getItem('env')) })
      localStorage.setItem("inviteId", inviteId[1].split('#')[0]);
    }

    this.setState({ env: JSON.parse(localStorage.getItem('env')) })
    let loginFormData = []
    let automation = localStorage.getItem('automation') != undefined ? localStorage.getItem('automation') : "false"

    loginForm.map(item => {
      if (automation == "true" && item.category == 'recaptcha') {
        item['validation'] = true
        item['error'] = false
        loginFormData.push(item)
      } else {
        item['error'] = false
        loginFormData.push(item)
      }
    })
    this.setState({ loginFormData: loginFormData })
  }

  signupProcess = () => {
    this.props.history.push('/register')
  }

  onSubmit = (data, item, fd, format) => {
    console.log('***data***', data.email.value)
    let userInput = data.email.value
    let payload = { "username": userInput }
    let apiDetails = item['apiDetails']['0']
    localStorage.setItem('channel', userInput)
    this.setState({ isLoader: true });
    Axios.post(`${this.state.env[apiDetails['baseUri']]}/${apiDetails['apiUri']}`, payload)
      .then(response => {
        this.setState({ isLoader: false });
        if (format == 'ph') {
          this.props.history.push({
            pathname: '/otp', userInput: userInput
          })
        } else {
          this.props.history.push({
            pathname: '/zqsignin', userInput: userInput
          })
        }
      },
        (error) => {
          if (error.response.status === 400 || error.response.status === 409) {
            if (error.response.data.message.includes("Pls register")) {
              this.setState({ isLoader: false });
              this.setState({ error: "You are not a registered user, please register.", snackBar: true, userInput: userInput });
            }
          }
          return Promise.reject(error.response);
        }
      )
  }

  onRegister = () => {
    this.setState({ snackBar: false }, () => {
      this.props.history.push({
        pathname: '/register', userInput: this.state.userInput
      })
    });

  }

  // inputBlur=(value, item, e)=>{
  //   if (this.state.env['type'] === 'qa' || this.state.env['type'] === 'passive') {
  //     Axios.get(`${this.state.env['automationUri']}/test_config?contact=${value}`)
  //         .then(resp => {
  //           console.log(resp)
  //           if(resp.data.automate[0] != undefined){
  //             var automation = resp.data.automate[0]['automate']
  //             let loginFormData = []

  //             console.log(this.state.loginFormData)
  //               loginForm.map(item => {
  //                 if (automation == "true" && item.category == 'recaptcha') {
  //                   item['validation'] = true
  //                   loginFormData.push(item)
  //                 } else {
  //                   loginFormData.push(item)
  //                 }
  //               })
  //               this.setState({ loginFormData: loginFormData })

  //           }
  //         })
  //         .catch(err => {
  //             localStorage.setItem('automation', "false");
  //         })
  // }
  // }
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
            <p className="zq-slogan"> AI powered fees and accounting platform <br />which saves time and gets lots done </p>
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
              <p className="login-desc-txt">Please login to your account</p>
              {/* {this.state.loginFormData.length > 0 ? <ZenForm inputBlur={this.inputBlur} inputData={this.state.loginFormData} onSubmit={this.onSubmit} /> : null} */}
              {this.state.loginFormData.length > 0 ? <ZenForm inputData={this.state.loginFormData} onSubmit={this.onSubmit} /> : null}
              <div className="signup-req-wrap">
                {/* <a className="forgot-pwd">Forgot  Password?</a> */}
                {/* <p className="login-separator-line"></p>
                <p className="login-para">Don't have any account yet? <span className="login-btn-color" onClick={this.signupProcess} >Signup Request</span></p> */}
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
                className={'info-snackbar alert-red'}
                action={
                  <React.Fragment>
                    {/* <Button color="secondary" size="small" onClick={this.onRegister}>
                      Click Here
                  </Button> */}
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

export default withRouter(LoginComponent);