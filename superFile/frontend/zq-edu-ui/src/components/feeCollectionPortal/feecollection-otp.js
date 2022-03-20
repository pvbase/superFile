import React, { Component } from 'react';
import OtpInput from 'react-otp-input';
import Axios from 'axios';
import '../../scss/otp.scss';
import '../../scss/login.scss';
import Snackbar from '@material-ui/core/Snackbar';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Loader from '../../utils/loader/loaders';
import { Alert } from 'rsuite';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';


class OtpComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: "",
            min: 0,
            sec: 0,
            otp: '',
            orgId: localStorage.getItem('orgId'),
            channel: localStorage.getItem('channel'),
            userInput: '',
            env: JSON.parse(localStorage.getItem('env')),
            timerOn: true,
            resendOtp: false,
            snackBar: false,
            pageLoader: false,
            toast: false,
            transactionID: '',
            disableOTPbtn: true
        }
    }
    componentWillMount() {
        this.otpTimer(90);

        this.setState({ userInput: this.props.mobileNo })
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
        this.setState({ otp: '' })
        this.setState({ pageLoader: true });
        let payload = { "username": this.state.userInput }
        Axios.post(`${this.state.env['zqBaseUri']}/zqparent/otplogin`, payload)
            .then(response => {
                // Alert.info(`New OTP has been sent to ${this.state.channel}`)
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
        this.setState({ pageLoader: true })
        let otp = /^(\+\d{1,3}[- ]?)?\d{6}$/;
        if (otp.test(this.state.otp)) {
            // this.props.onDocumentView();
            let payload = {
                "username": this.state.userInput,
                "otp": this.state.otp,
                "instutiteId": this.state.orgId
            }


            Axios.post(`${this.state.env['zqBaseUri']}/zqparent/login`, payload)
                .then(res => {
                    if (res.data.message == 'invalid OTP') {
                        Alert.error("Invalid OTP")
                        this.setState({ resendOtp: true, pageLoader: false });

                        // this.otpTimer(0);
                    }
                    if (res.data.message == 'login success') {
                        console.log(res.data.message)
                        // Alert.success("OTP Verified.")
                        let data = res.data.data;
                        this.setState({ pageLoader: false })
                        localStorage.setItem('auth_token', res.data.auth_token)
                        this.props.onDocumentView(data)
                    }
                    if (res.data.message == 'OTP Expired') {
                        Alert.info("OTP has Expired! Please Try again.")
                        this.setState({ pageLoader: false })
                        // this.setState({ resendOtp: true });
                    }
                }).catch(err => {
                    if (err.response.data.message !== undefined) {
                        if (err.response.data.message.includes("Incorrect otp") || (err.response.data.message.includes("Expired"))) {
                            this.setState({ pageLoader: false })
                            Alert.error('Incorrect OTP or OTP may be expired')
                            this.setState({
                                otp: '',
                                disableOTPbtn: true,
                                snackBar: true
                            })


                        }

                        else {
                            Alert.error(err.response.data.Err)

                            this.setState({
                                pageLoader: false,
                                disableOTPbtn: true,
                                // otperror: err.response.data.Err,
                            })
                        }
                    }
                    else {
                        this.setState({
                            pageLoader: false,
                            disableOTPbtn: true,
                            otperror: err.response.data.Err,
                            snackBar: true
                        })
                    }

                })
        }

    }
    onChangeNumber = () => {
        this.props.onChangeNumber()
    }
    render() {
        const { error, min, sec } = this.state;
        var mobileNum = String(this.state.userInput).substring(0, 2) + 'XXXXXX' + String(this.state.userInput).substring(String(this.state.userInput).length - 2)
        // var mobileNum = this.props.mobileNo;
        return (<React.Fragment>
            {this.state.pageLoader ? <Loader /> : null}
            {/* <div className="login-wrap"> */}
            {/* <div className="zenqore-image-wrapper">
                    <div className="zenqore-image-wrap">
                        <img src={zenqoreHome} className="zenHome-image" alt="Zenqore-Next Step Accounting" ></img>
                    </div>
                </div> */}
            <div className="login-wrap figma">
                <div className="zenqore-image-wrapper">
                    <div className="zenqore-image-wrap">
                        <p className="zq-slogan"> Welcome to the Fee Collection Portal </p>
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

                            <button className="primary-btn-otp" type="submit" onClick={this.handleSubmit} disabled={this.state.disableOTPbtn}>Verify OTP</button>
                            <div className="resend-otp-wrap">
                                {!this.state.resendOtp ?
                                    <React.Fragment>
                                        <p className="otp-para"> Didn't received yet? {`${min + ':' + sec}`}</p>
                                        <p className="resend-timer"><span className="login-btn-color" title="Click to resend the One Time Password (OTP)" >Resend OTP </span></p>
                                    </React.Fragment> : <React.Fragment>
                                        <p className="otp-para"> Didn't received yet? </p>
                                        <p className="resend-timer"><span className="login-btn-color" title="Click to resend the One Time Password (OTP)" onClick={this.resendtheOTP} >Resend Now</span></p>

                                    </React.Fragment>}
                            </div>
                            {this.state.toast ?
                                <React.Fragment>
                                    <div className="login-copyright-wrap">
                                        <button className="otp-toast-btn" type="submit"  > <CheckCircleIcon />New OTP has been sent to {this.state.userInput} </button>
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
