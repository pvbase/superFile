import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import "../../scss/student-portal.scss";
import '../../scss/payment-portal.scss';
import '../../scss/portal-stepper.scss';
import '../../scss/login.scss';
import { Modal, Icon, Steps } from 'rsuite';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import StepConnector from '@material-ui/core/StepConnector';
import { CircularProgress } from "@material-ui/core";
import StudentLogin from './components/student-portal-login';
import StudentPortalOTP from './components/student-portal-otp';
import StudentDataCenter from './components/student-data-center';
import StudentUploadReview from './components/upload-review';
import zq_logo from '../../assets/images/zq_logo.png';
import Loader from '../../utils/loader/loaders';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';

class StudentDataPortal extends Component {
    constructor(props) {
        super(props)
        this.state = {
            loader: false,
            activeStep: 1,
            isOtp: false,
            landPage: null,
            steps: ['Login', 'Student Data Center', 'Upload Student Data', 'Confirmation'],
            snackBar: false,
            mobileNo: '',
            uploadedData: [],
            finishSetup: true,
            credentials: {}
        }
    }
    getStepContent = (stepIndex) => {
        switch (stepIndex) {
            case 0:
                return <React.Fragment>
                    <div className="login-wrap figma">
                        <div className="zenqore-image-wrapper">
                            <div className="zenqore-image-wrap">
                                <p className="zq-slogan"> Welcome to the Student Data Portal </p>
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
                                {this.state.loader ? <Loader /> :
                                    <React.Fragment>
                                        {this.state.isOtp ? <StudentPortalOTP mobileNo={this.state.mobileNo} onOTPSubmit={this.onOTPSubmit} /> : <StudentLogin onMobileSubmit={this.onMobileSubmit} />}
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
                </React.Fragment>
            case 1:
                return <StudentDataCenter uploadReview={this.uploadReview} credentials={this.state.credentials} onFinishSetup={this.onFinishSetup} />
            case 2:
                return <StudentUploadReview uploadedData={this.state.uploadedData} uploadConfirm={this.uploadConfirm} credentials={this.state.credentials} goBack={this.goBack} />
            case 3:
                return <StudentDataCenter finishSetup={this.state.finishSetup} credentials={this.state.credentials} onFinishSetup={this.onFinishSetup} />
            default:
                return '***';
        }
    }
    handleNext = () => {
        let a = this.state.activeStep;
        this.setState({ activeStep: a + 1 })
    }
    handleBack = () => {
        let a = this.state.activeStep;
        this.setState({ activeStep: a - 1 })
    }
    handleStart = () => {
        this.setState({ activeStep: 0 })
    }
    onMobileSubmit = (data) => {
        this.setState({ loader: true, isOtp: true, mobileNo: data });
        setTimeout(() => {
            this.setState({ loader: false });
        }, 100)
    }
    onOTPSubmit = (data) => {
        this.setState({ credentials: data, isOtp: false });
        this.handleNext();
    }
    uploadReview = (val) => {
        this.setState({ uploadedData: val });
        this.handleNext();
    }
    uploadConfirm = () => {
        this.handleNext();
    }
    onFinishSetup = () => {
        this.handleStart();
    }
    goBack = () => {
        this.handleBack();
    }
    render() {
        const ColorlibConnector = withStyles({
            alternativeLabel: { top: 22 },
            active: { '& $line': { backgroundColor: "#1359C1", marginTop: '-10px', transitionDelay: '2s' }, },
            completed: { '& $line': { backgroundColor: '#36B37E', marginTop: '-10px' }, },
            line: { height: 2, border: 0, backgroundColor: '#ccc', borderRadius: 1, marginTop: '-10px' },
        })(StepConnector);
        return (<React.Fragment>
            {this.state.loader ? <Loader /> : null}
            <div className="migration-main-div portal-login-div vendor-invoice-upload-wrap pdf-extraction-upload-wrap ">
                {this.state.LoaderData === true ? <Loader /> : ''}
                <div className="migration-header-stepper-section">
                    <div className="zenlogo-wrap">
                        <img src={zq_logo} alt="Zenqore Logo" className="zqlogo-image"></img>
                    </div>
                    <div className="zenqore-stepper-section">
                        <Steps current={this.state.activeStep} currentStatus="process" vertical={false} >
                            <Steps.Item title="Login" />
                            <Steps.Item title="Student Data Center" />
                            <Steps.Item title="Upload Student Data" />
                            <Steps.Item title="Confirmation" />
                        </Steps>
                    </div>
                </div>
                <div className="migration-body-content-section" style={{ backgroundColor: "none !important" }}>
                    {this.getStepContent(this.state.activeStep)}
                </div>
            </div>

        </React.Fragment>)
    }
}
export default withRouter(StudentDataPortal)