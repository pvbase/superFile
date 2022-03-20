import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
// import zenqoreHome from '../../assets/images/zenqoreHome.jpeg';
import ZenForm from '../input/form';
import signinForm from './signin.json';
import Axios from 'axios';
import "./../../scss/login.scss";
import Snackbar from '@material-ui/core/Snackbar';
import Loader from '../../utils/loader/loaders'
import ReactGA from 'react-ga';
import Dexie from 'dexie';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';


import PubNubReact from 'pubnub-react';
Dexie.debug = false
// let dbname = localStorage.getItem('channel');
// let db = new Dexie(dbname);
const Cryptr = require('cryptr');
const cryptr = new Cryptr('ZqSecretKey');

// function databaseExists(dbname, callback) {
//   var dbExists = true;
//   var request = window.indexedDB.open(dbname);
//   request.onupgradeneeded = function (e) {
//     if (request.result.version === 1) {
//       dbExists = false;
//       window.indexedDB.deleteDatabase(dbname);
//       indexedDB.databases().then(lists => {
//         lists.map(dbNameItem => {
//           if (dbNameItem.name !== dbname) {
//             indexedDB.deleteDatabase(dbNameItem.name)
//           }
//         })
//       })
//       if (callback)
//         callback(dbExists);
//     }
//   };
//   request.onsuccess = function (e) {
//     if (dbExists) {
//       if (callback)
//         callback(dbExists);
//     }
//   };
// };

class Signin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      channel: localStorage.getItem('channel'),
      error: '',
      userInput: '',
      env: {},
      email: '',
      signinFormData: [],
      isLoader: false,
      snackBar: false
    }
    this.pubnub = new PubNubReact({
      publishKey: "pub-c-87ae3cc8-8d0a-40e0-8e0f-dbb286306b21",
      subscribeKey: "sub-c-982dbaba-1d98-11ea-8c76-2e065dbe5941",
      secretKey: "sec-c-ODRhYWJjZmYtZGQ0MS00ZjY2LTkzMGMtY2VhNGZhYjYzOWRi",
      ssl: false,
    });
    this.pubnub.init(this);
  }

  componentDidMount() {
    this.setState({ env: JSON.parse(localStorage.getItem('env')) })
  }
  componentWillMount = () => {
    signinForm.map(item => {
      if (String(item.name) === 'email') {
        item['defaultValue'] = this.state.channel

      }
    })
    this.setState({ signinFormData: signinForm })
    this.setState({ email: this.state.channel })
  }
  forgotProcess = () => {
    let payload = { "contact": this.state.email }
    fetch(`${this.state.env.zqBaseUri}/reset/resetreq`, { method: 'POST', body: JSON.stringify(payload) })
      .then(res => {
        return res.json();
      }).then(response => {
        this.setState({ pageLoader: false });
        this.setState({ error: "Verification Link has been sent to your mail", snackBar: true, })
        setTimeout(() => {
          this.setState({ snackBar: false });
        }, 2000);
        // this.props.history.push({ pathname: '/forgotPassword', userInput: this.state.userInput })
      })

  }


  onSubmit = (data, item) => {
    this.setState({ isLoader: true });
    // console.log('***data***', item)
    let apiDetails = item['apiDetails']['0']
    let payload = {
      "username": data.email.value,
      "password": String(cryptr.encrypt(data.password.value)),
    }
    Axios.post(`${this.state.env[apiDetails['baseUri']]}/${apiDetails['apiUri']}`, payload)
      .then(response => {
        if (response.data.message.includes('login success')) {
          localStorage.setItem("auth_token", response.data['auth_token'])
          localStorage.setItem("zen_auth_token", response.data['auth_token'])
          localStorage.setItem("sessionId", response.data['session_id'])
          this.props.history.push('/main/dashboard')
          // --get user profile api
          //   let getUserprofilePayload = {
          //     "authToken": response.data['auth_token']
          //   }

          // Axios.post(`${this.state.env['zqBaseUri']}/master/get/getUserProfile`, getUserprofilePayload)
          //   .then(res => {
          //     let respData = res.data.data
          //     if (respData.userEmail !== undefined) {
          //       // console.log("getUserProfile", res)
          //       let ZQFirstName = respData.firstName
          //       let ZQLastName = respData.lastName
          //       let channel = localStorage.getItem('channel')
          //       let defaultorg = {};
          //       defaultorg = respData.defaultOrganization;
          //       localStorage.setItem("orgName", respData.orgList[0].orgName)
          //       localStorage.setItem("userID", respData.orgList[0].userId)
          //       localStorage.setItem("orgId", defaultorg.orgId)
          //       localStorage.setItem("email", respData.userEmail)
          //       this.props.history.push('/main/dashboard')
          //       // ------------------------------------------------------------

          //       //   let dbname = channel;
          //       //   databaseExists(dbname, (exists) => {
          //       //     if (exists) {
          //       //       console.debug("database " + dbname + " exists");
          //       // ReactGA.initialize('UA-166923864-1', {
          //       //   titleCase: false,
          //       //   gaOptions: {
          //       //     clientId: `${ZQFirstName.trim()}${ZQLastName.trim()}`
          //       //   }
          //       // });
          //       // ReactGA.set({ page: '/main/dashboard' }); // Update the user's current page
          //       // ReactGA.pageview('/main/dashboard'); // Record a pageview for the given page
          //       // this.props.history.push('/main/dashboard')
          //     }
          //     //     else {
          //     //       this.pubnub.subscribe({
          //     //         channels: [channel],
          //     //         withPresence: true
          //     //       });
          //     //       this.pubnub.getMessage(channel, (pubnubRes) => {
          //     //         console.log(pubnubRes);
          //     //       });
          //     //       // this.callIndexDB(dbname, ZQFirstName, ZQLastName);
          //     //       this.callTestIndexDb('testDB', '', '')
          //     //     }
          //     //   });
          //     // }
          //     // else {
          //     //   //user with invitation
          //     //   if (localStorage.getItem('inviteId') && String(localStorage.getItem('inviteId')).length !== 0) {
          //     //     this.props.history.push('/onboard')
          //     //   }
          //     //   else {
          //     //     // alert('No Organisation and New User without Invite ID')
          //     //     this.props.history.push('/setup')
          //     //   }
          //     // }
          //   })
          //   .catch(err => {
          //     console.log(err)
          //     this.setState({ error: "Something went wrong... Try again later", snackBar: true })
          //     setTimeout(() => {
          //       this.setState({ snackbar: false });
          //       this.setState({ isLoader: false });
          //       // this.props.history.push('/')
          //     }, 1500);

          //   })
        }
      },
        (err) => {
          console.log("Entered password is wrong, please try again..")
          this.setState({ isLoader: false });
          this.setState({ error: 'Entered password is wrong, please try again.', snackBar: true });
          setTimeout(() => {
            this.setState({ snackBar: false })
          }, 2000);
        })
  }
  callTestIndexDb = async (dbname, ZQFirstName, ZQLastName) => {
    localStorage.setItem('channel', 'testDB')
    localStorage.setItem('orgId', '5f901c003168883cb44c3df1')
    localStorage.setItem('orgName', '3D CONCEPT TOOLING PRIVATE LIMITED')
    console.debug("database " + dbname + " does not exists");
    console.log("Database doesn't exist");

    let db = new Dexie(dbname);
    db.version(1).stores({ zenqoredata: 'id,value' })
    const apiData = await Axios.get('https://extapidev.zenqore.com/indexedb/logindataFetch?org=5f901c003168883cb44c3df1', { //test organisation
      headers: {
        "Authorization": localStorage.getItem('auth_token')
      }
    })
      .then(res => {
        if (String(res.data.status) === "success") {
          // this.playAround().then(res => {
          let dbData = res.data.data
          console.log('indexdb response', dbData)
          return dbData
        }
      }).catch(err => {
        return { failed: true, error: err }
      })

    let createDBData = await apiData;
    console.log('createDBData', createDBData)
    if (createDBData.failed == undefined) {

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
  callIndexDB = async (dbname, ZQFirstName, ZQLastName) => {
    console.debug("database " + dbname + " does not exists");
    console.log("Database doesn't exist");

    let db = new Dexie(dbname);
    db.version(1).stores({
      zenqoredata: 'id,value'
    })

    const apiData = await Axios.get(`${this.state.env['zqBaseUri']}/indexedb/logindataFetch?org=${localStorage.getItem('orgId')}`, {
      headers: {
        "Authorization": localStorage.getItem('auth_token')
      }
    })
      .then(res => {
        if (String(res.data.status) === "success") {
          // this.playAround().then(res => {
          let dbData = res.data.data
          console.log('indexdb response', dbData)
          return dbData
        }
      }).catch(err => {
        return { failed: true, error: err }
      })

    let createDBData = await apiData;
    console.log('createDBData', createDBData)
    if (createDBData.failed === undefined) {
      var dbData = [];
      for (let item in createDBData) {
        dbData.push({ id: item, data: createDBData[item] })
      }
      db.zenqoredata.bulkPut(dbData).then((item) => {
        console.log("Last data add was: " + item);
        // alert("Data has been pushed")
        // this.setState({ isLoader: false });
        // this.props.history.push('/main/dashboard');
      })
      ReactGA.initialize('UA-166923864-1', {
        titleCase: false,
        gaOptions: {
          clientId: `${ZQFirstName.trim()}${ZQLastName.trim()}`
        }
      });
      ReactGA.set({ page: '/main/dashboard' }); // Update the user's current page
      ReactGA.pageview('/main/dashboard');
      this.setState({ isLoader: false });
      this.props.history.push('/main/dashboard');
    }
    else {
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
              <h3 className="login-form-hd">Welcome Back</h3>
              <p className="login-desc-txt">Sign in to proceed</p>
              <ZenForm inputData={this.state.signinFormData} onSubmit={this.onSubmit} />
              <div className="signup-req-wrap">
                <a className="forgot-pwd" onClick={this.forgotProcess}>Forgot Password?</a>
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
                message={this.state.error}
                className={`info-snackbar ${this.state.error.includes('Verification') ? 'alert-green' : 'alert-red'}`}
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

export default withRouter(Signin);