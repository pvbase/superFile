import React, { Component } from 'react';
 import { HashRouter, Route, Switch, Redirect, withRouter } from 'react-router-dom';
//import { Route, Switch, Redirect, withRouter, BrowserRouter } from 'react-router-dom';
// import { renderRoutes } from 'react-router-config';
import './App.scss';

import Axios from 'axios';
// import Auth from './auth';
import 'rsuite/dist/styles/rsuite-default.css';
import Loader from './utils/loader/loaders';
var env = require('./environment/env').default

// const loading = () => <div className="animated fadeIn pt-3 text-center">Loading...</div>;
const loading = () => { return <Loader /> }

// Containers
const GigaLayout = React.lazy(() => import('./gigaLayout/gigalayoutNew'));


// Pages

const Login = React.lazy(() => import('./components/login'));
const OTP = React.lazy(() => import('./components/otp'));
const ForgotPassword = React.lazy(() => import('./components/forgotPwd/forgotPassword'));
const Register = React.lazy(() => import('./components/register/register'));
const SignUp = React.lazy(() => import('./components/signup/signup'));
const Signin = React.lazy(() => import('./components/signin/signin'));
const ZenOTP = React.lazy(() => import('./components/zen-otp/zen-otp'));
const Privacy = React.lazy(() => import('./components/legal_documents/privacy_policy/privacy'));
const Terms = React.lazy(() => import('./components/legal_documents/terms_of_service/terms'));
const StudentDataPortal = React.lazy(() => import('./components/studentDataPortal/student-portal-main'));
const FeeCollectionPortal = React.lazy(() => import('./components/feeCollectionPortal/fee-collection-payment'))
// const PageNotFound = React.lazy(() => import('./components/page404/page404'));

const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route
        {...rest}
        render={(props) =>
            localStorage.getItem("auth_token") ? (
                <Component {...props} />
            ) : (
                    <Redirect
                        to={{
                            pathname: "/",
                        }}
                    />
                )
        }
    />
);

class Main extends Component {

    constructor(props) {
        super(props)
        this.state = {
            params: {
                r: false
            },
            env: {}
        }
        // console.log(props)
    }

    componentWillMount() {
        console.log(window.location.origin)
        if (window.location.origin === 'http://18.190.75.244:3000' || window.location.origin === 'http://3.81.87.177') {
            //Dev Environment
            this.setState({ env: env['dev'] })
            localStorage.setItem('env', JSON.stringify(env['dev']))
        }
        else if (window.location.origin === "http://3.6.111.111:3000" || window.location.origin === "https://uat.zenqore.com") {
            //Alpha Passive Environment
            this.setState({ env: env['passive'] })
            localStorage.setItem('env', JSON.stringify(env['passive']))
        }
        else if (window.location.origin === 'https://app.zenqore.com') {  //Production Environment
            this.setState({ env: env['prod'] })
            localStorage.setItem('env', JSON.stringify(env['prod']))
        }
        else {
            //Dev Environment changes
            this.setState({ env: env['dev'] })
            localStorage.setItem('env', JSON.stringify(env['dev']))
        }
    }
    shouldComponentUpdate() {

        console.log('***PROPS****', this.props)
        return true
    }
    componentDidMount() {
        localStorage.setItem('automation', "false");
    }
    render() {
        return (
            <HashRouter>
                <React.Suspense fallback={loading()}>
                    <Switch>
                        <Route exact path="/" name="Login Page" render={props => <Login {...props} />} />
                        <Route exact path="/OTP" name="OTP Page" render={props => <OTP {...props} />} />
                        <Route exact path="/zqforgotpassword" name="ForgotPassword Page" render={props => <ForgotPassword {...props} />} />
                        <Route exact path="/register" name="Register Page" render={props => <Register {...props} />} />
                        {/* <Route exact path="/onboard" name="onboard Page" render={props => <Onboard {...props} />} /> */}
                        <Route exact path="/zqsignup" name="signup page" render={props => <SignUp {...props} />} />
                        <Route exact path="/zqsignin" name="signin Page" render={props => <Signin {...props} />} />
                        <Route exact path="/zqotp" name="ZenOTP page" render={props => <ZenOTP {...props} />} />
                        <Route exact path="/privacy" name="Privacy" render={props => <Privacy {...props} />} />
                        <Route exact path="/terms" name="Terms" render={props => <Terms {...props} />} />
                        <Route exact path="/student-data-portal" name="Student Data Portal" render={props => <StudentDataPortal {...props} />} />
                        <Route exact path="/feeCollection" name="Fee Collection" render={props => <FeeCollectionPortal {...props} />} />
                        <PrivateRoute path="/main" name="Home" params={this.state.params} component={GigaLayout} />
                    </Switch>
                </React.Suspense>
            </HashRouter>
            // <BrowserRouter>
            //     <React.Suspense fallback={loading()}>
            //         <Switch>
            //             <Route exact path="/feeCollection" name="Fee Collection Page" render={props => <FeeCollectionPortal {...props} />} />
            //         </Switch>
            //     </React.Suspense>
            // </BrowserRouter >
        );
    }
}

export default Main;
