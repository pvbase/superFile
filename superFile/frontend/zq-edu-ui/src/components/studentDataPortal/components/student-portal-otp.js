import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import OtpInput from 'react-otp-input';
import Axios from 'axios';
import '../../../scss/otp.scss';
import '../../../scss/login.scss';
import Loader from '../../../utils/loader/loaders';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { Alert } from 'rsuite';

class StudentPortalOTP extends Component {
    constructor(props) {
        super(props)
        this.state = {
            error: "",
            min: 0,
            sec: 0,
            otp: '',
            env: JSON.parse(localStorage.getItem('env')),
            timerOn: true,
            resendOtp: false,
            snackBar: false,
            pageLoader: false,
            toast: false,
            mobileNo: '',
        }
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
        this.setState({ otp: event });
    };
    componentDidMount() {
        document.addEventListener("keydown", this.handleKeyPress);
        // this.setState({ env: JSON.parse(localStorage.getItem("env")) });
    }
    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyPress);
    }
    componentWillMount() {
        this.otpTimer(90);
        this.setState({ mobileNo: this.props.mobileNo })
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
        this.setState({ pageLoader: true });
        let mobileNo = this.state.mobileNo;
        let payload = { "username": mobileNo }
        Axios.post(`${this.state.env['zqBaseUri']}/zqedu/otplogin`, payload)
            .then(response => {
                // Alert.info(`New OTP has been sent to ${this.state.mobileNo}`)
                if (response.status == 201 || response.status == 200) {
                    Alert.info(`OTP re-sent to ${mobileNo}`)
                    this.setState({ pageLoader: false });
                    this.setState({ resendOtp: false })
                    this.otpTimer(90);
                    setTimeout(() => {
                        this.setState({ toast: false })
                        this.setState({ pageLoader: false });
                    }, 1000);
                }
            }).catch(err => {
                Alert.info(`Operation Failed. Please try again.`)
                this.setState({ pageLoader: false });
            })
    }
    handleSubmit = () => {
        this.setState({ pageLoader: true });
        //eslint-disable-next-line
        let otp = /^(\+\d{1,3}[- ]?)?\d{6}$/;
        let payload = {
            "username": this.state.mobileNo,
            "otp": this.state.otp
        }
        if (otp.test(this.state.otp)) {
            Axios.post(`${this.state.env['zqBaseUri']}/zqedu/login`, payload)
                .then(res => {
                    if (res.message == 'Incorrect otp or Expired, pls resend and try it') {
                        Alert.error("Invalid OTP")
                        this.setState({ resendOtp: true, pageLoader: false });
                        this.otpTimer(0);
                    }
                    if (res.data.message == 'login success') {
                        console.log(res.data.message)
                        this.setState({ pageLoader: false });
                        Alert.success("OTP Verified.")
                        let authToken = res.data.auth_token;
                        let sessionID = res.data.session_id;
                        let credentials = {
                            authToken: authToken,
                            sessionID: sessionID
                        }
                        this.props.onOTPSubmit(credentials);
                    }
                    if (res.data.message == 'OTP Expired') {
                        Alert.info("OTP has Expired! Please Try again.")
                        this.setState({ resendOtp: true, pageLoader: false });
                    }
                }).catch(err => {
                    Alert.error("Invalid OTP ")
                    this.setState({ pageLoader: false });
                })
        }
    }
    onChangeNumber = () => {
        this.props.onChangeNumber()
    }
    render() {
        const { error, min, sec } = this.state;
        var mobileNum = String(this.state.mobileNo).substring(0, 2) + 'XXXXXX' + String(this.state.mobileNo).substring(String(this.state.mobileNo).length - 2)
        return (
            <React.Fragment>
                {this.state.pageLoader ? <Loader /> : null}
                <div className="zenqore-login-container">
                    <div className="login-content">
                        <div className="otp-wrapper">
                            <p className="otp-info">Please enter the OTP sent to</p>
                            <span className="otp-info">+91 {mobileNum}</span> &nbsp;
                            <span className="change-otp-btn" title="Change Mobile Number" onClick={() => { this.onChangeNumber() }}>Change</span>
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
                                    border: 'solid 1px #dfe1e6',
                                    fontFamily: 'OpenSans-Medium',
                                    fontWeight: 500,
                                    fontStretch: 'normal',
                                    fontStyle: 'normal',
                                    lineHeight: 1.5,
                                    letterSpacing: 'normal',
                                    color: '#1359c1',
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
                        <button className="primary-btn-otp" type="submit" onClick={this.handleSubmit}>Verify OTP</button>
                        <div className="resend-otp-wrap">
                            {!this.state.resendOtp ?
                                <React.Fragment>
                                    <p className="otp-para"> Didn't received yet? <span className="resend-timer">{`${min + ':' + sec}`}</span> </p>
                                    <span className="login-btn-color" title="Click to resend the One Time Password (OTP)" >Resend OTP </span>

                                </React.Fragment> : <React.Fragment>
                                    <p className="otp-para"> Didn't received yet? <span className="login-btn-color" title="Click to resend the One Time Password (OTP)" onClick={this.resendtheOTP} >Resend Now</span></p>
                                </React.Fragment>}
                        </div>
                        {this.state.toast ?
                            <React.Fragment>
                                <div className="login-copyright-wrap">
                                    <button className="otp-toast-btn" type="submit"  > <CheckCircleIcon />New OTP has been sent to {this.state.mobileNo} </button>
                                </div>
                            </React.Fragment>
                            : null
                        }
                    </div>
                </div>
            </React.Fragment>
        )
    }
}
export default withRouter(StudentPortalOTP)