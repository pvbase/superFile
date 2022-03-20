import React, { Component } from 'react';
import ZenForm from '../input/form';
import Axios from 'axios';
import registerForm from './register.json'
import "./../../scss/login.scss";
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import Loader from '../../utils/loader/loaders';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';
import sucess from '../../assets/images/zq-success.svg';


class RegisterComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: '',
      userInput: '',
      env: {},
      emailRegInfo: false,
      level1: true,
      registerFormData: [],
      snackBar: false,
      isLoader: false

    }
  }
  componentDidMount() {
    this.setState({ env: JSON.parse(localStorage.getItem('env')) })
  }
  componentWillMount = () => {
    // registerForm.map(item=>{
    //   if(item.name == 'email') {
    //     item['defaultValue'] = this.props.location.userInput
    //   }
    // })
    // console.log(registerForm)
    // console.log(this.props.location.userInput)
    // this.setState({registerFormData: registerForm})
    let registerFormData = []
    let automation = localStorage.getItem('automation') != undefined ? localStorage.getItem('automation') : "false"

    registerForm.map(item => {
      if (automation == "true" && item.category == 'recaptcha') {
        item['validation'] = true
        item['error'] = false
        registerFormData.push(item)
      } else {
        item['error'] = false
        registerFormData.push(item)
      }
    })
    this.setState({ registerFormData: registerFormData })
  }
  onSubmit = (data, item) => {
    console.log('***data***', item)
    let payload = {
      "contact": data.email.value
    }
    console.log(payload)
    this.setState({ isLoader: true });
    let apiDetails = item['apiDetails']['0']
    Axios.post(`${this.state.env[apiDetails['baseUri']]}/${apiDetails['apiUri']}`, payload)
      .then(response => {
        this.setState({ isLoader: false });
        // this.setState({ level1: false, emailRegInfo: true })
        if (response !== undefined) {
          if (response.data.message.includes('Already')) {
            this.setState({ level1: true, emailRegInfo: false })
            this.setState({ error: "You are already registered user,For Login", snackBar: true })
            this.setState({ isLoader: false });
          }
          else {
            this.setState({ level1: false, emailRegInfo: true })
          }

        }



      }, (err) => {
        if (err.response !== undefined) {
          if (err.response.data.message.includes('Already')) {
            this.setState({ level1: true, emailRegInfo: false })
            this.setState({ error: "You are already registered user", snackBar: true })
            this.setState({ isLoader: false });
          }
        }
        else {
          this.setState({ level1: true, emailRegInfo: false })
          this.setState({ error: "Something went wrong in request..Try with valid Email id", disablebtn: true })
          this.setState({ isLoader: false });
          // this.onLoadRecaptcha();
        }
      }

      )
  }
  onLogin = () => {
    this.props.history.push({
      pathname: '/', userInput: this.state.userInput
    })
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
            {this.state.level1 && <React.Fragment>
              <div className="login-content">
                <h3 className="login-form-hd">Get Started</h3>
                <p className="login-desc-txt">Create your account now.</p>
                <ZenForm inputData={this.state.registerFormData} onSubmit={this.onSubmit} />
                <div className="signup-req-wrap">
                  <p className="login-separator-line"></p>
                  <p className="login-para">Have an account? <span className="login-btn-color" onClick={this.onLogin} >Login Now!</span></p>
                  {/* <div className="login-copyright-wrap"><p className="login-copyright-text">© {(new Date().getFullYear())} All rights reserved. Gigaflow Technologies LLP. </p></div> */}
                </div>
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
                    <Button color="secondary" size="small" onClick={this.onLogin}>
                      click here
                  </Button>
                  </React.Fragment>
                }

              />
            </React.Fragment>}
            {this.state.emailRegInfo &&
              <React.Fragment>
                <div className="email-reg-info">
                  <div className="login-content">
                    <h3 className="login-form-hd">SIGN UP <br />COMPLETE</h3>

                    <img src={sucess} className="register-success-icon" alt="Add Item" title="Add New item" />
                    <p className="register-para" >Your Request for Signup has been <br />sent to Zenqore Admin.</p>
                    <p className="register-para1">We will get back to you soon! </p>
                  </div>
                </div>

              </React.Fragment>
            }
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

export default RegisterComponent;