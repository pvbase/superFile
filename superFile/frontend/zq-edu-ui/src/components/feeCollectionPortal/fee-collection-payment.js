import React, { Component } from 'react';
import zq_logo from '../../assets/images/zq_logo.png'
import { withRouter } from 'react-router-dom';
import ZenForm from '../input/form';
import loginForm from './fee-collection-payment.json';
import Loader from '../../utils/loader/loaders'
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import OtpComponent from './feecollection-otp';
import ViewDetails from './viewDemandNote';
import ReviewAndPay from './review-pay';
import PaymentGateway from './paymentGateway';
import ConfirmPayment from './pay-confirm';
import clsx from 'clsx';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import StepConnector from '@material-ui/core/StepConnector';
import '../../scss/payment-portal.scss';
import '../../scss/portal-stepper.scss';
import '../../scss/login.scss';
import Axios from 'axios';
import Snackbar from '@material-ui/core/Snackbar';
import { Alert } from 'rsuite';
import zenqoreHome from '../../assets/images/welcomepage.svg';
import ZqsmallLogo from '../../assets/images/small_zqlogo.svg';
import ZqTextLogo from '../../assets/images/zenqore_text.svg';
import OrangeCrcle from '../../assets/images/orange-circle.svg';
import greenCircle from '../../assets/images/greenCircle.svg';
import smallGreenCircle from '../../assets/images/greenCircle2.svg';

import { Modal, Icon, Steps } from 'rsuite';
import 'rsuite/dist/styles/rsuite-default.css';

// const useColorlibStepIconStyles = makeStyles({
//     root: { backgroundColor: '#ccc', zIndex: 1, color: '#fff', width: 26, height: 26, display: 'flex', borderRadius: '50%', justifyContent: 'center', alignItems: 'center', },
//     active: { backgroundColor: '#1359c1' },
//     completed: { backgroundColor: '#36b37e' },
// });

class feeCollection extends Component {
    constructor(props) {
        super(props)
        this.state = {
            env: JSON.parse(localStorage.getItem('env')),
            loginFormData: [],
            isLoader: false,
            isOtp: false,
            mobileNo: '',
            activeStep: 0,
            snackBar: false,
            demandNote: '',
            amountFormat: '',
            ParentName: '',
            email: '',
            URL: '',
            amount: '',
            parentphone: '',
            paymentId: '',
            steps: ['Login', 'View Details', 'Confirm Payment', 'Payment Processing', 'Confirmation'],
        }
        // let options = {
        //     "key": "rzp_test_UimMrx1nr4WzqV", // Enter the Key ID generated from the Dashboard
        //     "amount": "50000", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        //     "currency": "INR",
        //     "name": "ABC Corporation",
        //     "description": "Fees Payment",
        //     "image": "",
        //     "handler": function (response) {
        //         alert(response.razorpay_payment_id);
        //         alert(response.razorpay_order_id);
        //         alert(response.razorpay_signature)
        //     },
        //     "prefill": {
        //         "name": "Gaurav Kumar",
        //         "email": "gaurav.kumar@example.com",
        //         "contact": "9999999999"
        //     },
        //     "notes": {
        //         "address": "Razorpay Corporate Office"
        //     },
        //     "theme": {
        //         "color": "#3399cc"
        //     }
        // };
        // let rzp1 = new window.Razorpay(options);
        // rzp1.on('payment.failed', function (response) {
        //     alert(response.error.code);
        //     alert(response.error.description);
        //     alert(response.error.source);
        //     alert(response.error.step);
        //     alert(response.error.reason);
        //     alert(response.error.metadata.order_id);
        //     alert(response.error.metadata.payment_id);
        // });
        // document.getElementById('rzp-button1').onclick = function (e) {
        //     rzp1.open();
        //     e.preventDefault();
        // }
    }
    componentDidUpdate() {
    }
    componentWillMount() {
        let { newpath } = this.state;
        let mobileNumberLocation = window.location.href;
        if (mobileNumberLocation.includes("razorpay_payment_id")) {
            const payvalue = mobileNumberLocation.split("?")
            if (payvalue[1] != undefined) {
                var paymentquery = String(payvalue[1]).split(/[=,&]/)
                this.props.history.push("/feeCollection")
                setTimeout(() => {
                    console.log('***value***', paymentquery)
                    console.log('***value***', paymentquery[5])
                    this.setState({ paymentId: paymentquery[5] })
                    localStorage.setItem('paymentId', paymentquery[5])
                    this.setState({ activeStep: 4 })
                }, 1000)

            }


        }
        else {
            const value = mobileNumberLocation.split("?")
            console.log('***CP***', value)
            if (value[1] != undefined) {
                var query = String(value[1]).split(/[=,&]/)
                this.props.history.push(newpath)
                console.log('***value***', query[1])
                localStorage.setItem('orgId', query[1])
                localStorage.setItem('demandNote', query[3])
                this.setState({ orgId: query[1], demandNote: query[3] })
            }
            let loginFormData = []
            loginForm.map(item => {
                loginFormData.push(item)
            })
            this.setState({ loginFormData: loginFormData })
        }

    }
    onSubmit = (data, item, format) => {
        this.setState({ isLoader: true });
        console.log('***data***', item)
        let mobileNo = data.phoneno.value;

        let payload = { "username": mobileNo }
        this.setState({ mobileNo: mobileNo });


        // this.setState({ isOtp: true, isLoader: false })
        Axios.post(`${this.state.env['zqBaseUri']}/zqparent/otplogin`, payload)
            .then(value => {
                if (value.data.status == "failure") {
                    // Alert.error(value.data.errors[0].message)
                    this.setState({ isOtp: false, isLoader: false })
                }
                if (value.data.message == 'otp generated') {
                    // Alert.info(`OTP sent to ${mobileNo}`)
                    this.setState({ isOtp: true, isLoader: false })
                }
            }).catch(err => {
                // Alert.error("Login Failed !")
                this.setState({ isLoader: false });
            })
    }
    handleNext = () => {
        let a = this.state.activeStep;
        console.log(a);
        this.setState({ activeStep: a + 1 })
    }
    handleBack = () => {
        let a = this.state.activeStep;
        this.setState({ activeStep: a - 1 })
    }
    handleReset = () => {
        this.setState({ activeStep: 0 })
    }
    onChangeNumber = () => {
        this.setState({ isOtp: false })
    }
    onStepperBack = () => {
        this.handleBack();
    }
    onDocumentView = (data) => {
        this.setState({ transactionID: data });
        this.handleNext();
    }
    onViewDemandNoteComplete = (value, amount, name, email, parentphone) => {
        this.setState({
            amountFormat: value, amount: amount,
            ParentName: name, email: email, parentphone: parentphone
        })

        this.handleNext();
    }
    onViewDetails = () => {
        this.handleNext();
    }
    onReviewAndPay = () => {
        this.handleNext();
    }
    onPaymentGateway = (callBackUrl) => {
        this.setState({ URL: callBackUrl }, () => {
            this.handleNext();
        })
    }

    getStepContent = (stepIndex) => {
        switch (stepIndex) {
            case 0:
                return <React.Fragment>
                    
                    {this.state.isOtp == false ?
                        <React.Fragment>
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
                                            {/* <h3 className="login-form-hd">Welcome Back</h3> */}
                                            <p className="login-desc-txt">Please login using your Mobile Number</p>
                                            {this.state.loginFormData.length > 0 ?
                                                <ZenForm inputData={this.state.loginFormData} onSubmit={this.onSubmit} />
                                                : null}
                                            <div className="signup-req-wrap">
                                                <p className="login-separator-line"></p>
                                                {/* <p className="login-para">Don't have any account yet? <span className="login-btn-color" onClick={this.signupProcess} >Signup Request</span></p> */}
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
                                            // action={
                                            //     <React.Fragment>
                                            //         <Button color="secondary" size="small" onClick={this.onRegister}>
                                            //             Click Here
                                            //     </Button>
                                            //     </React.Fragment>
                                            // }
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
                        </React.Fragment> :
                        <OtpComponent mobileNo={this.state.mobileNo} onDocumentView={this.onDocumentView} onChangeNumber={this.onChangeNumber} />
                    }
               
                </React.Fragment>
            case 1:
                return <ViewDetails onViewDetails={this.onViewDetails} onViewDemandNoteComplete={this.onViewDemandNoteComplete} onStepperBack={this.onStepperBack} />;
            case 2:
                return <PaymentGateway onPaymentGateway={this.onPaymentGateway} onStepperBack={this.onStepperBack} amountFormat={this.state.amountFormat} amount={this.state.amount} userInput={this.state.parentphone} ParentName={this.state.ParentName} email={this.state.email} />
            case 3:
                return <ReviewAndPay onReviewAndPay={this.onReviewAndPay} onStepperBack={this.onStepperBack} URL={this.state.URL} />;
            case 4:
                return <ConfirmPayment onStepperBack={this.onStepperBack} paymentId={this.state.paymentId} amount={this.state.amount}/>;
            default:
                return '***';
        }
    }
    nextStepChange = () => {
        // if (this.state.activeStep == 1 && this.state.migrationStatusData.step2 == null) {
        //     a.modalHeading = "Warning"; a.modalContent = "Please upload zenqore.json"; a.modalIcon = "error"; a.buttonFunctionName = "cancel-migration-step"; a.button = null
        //     this.setState({ openNotificationModel: true, modalNotification: a })
        // }
        // else if (this.state.activeStep == 2) {
        //     a.modalHeading = "Confirm"; a.modalContent = "Click confirm to add chart of accounts"; a.modalIcon = null; a.button = true; a.buttonFunctionName = "confirm-coa-step";
        //     this.setState({ openNotificationModel: true, modalNotification: a })
        // }
        // else if (this.state.activeStep == 3) {
        //     a.modalHeading = "Confirm"; a.modalContent = "Click Confirm to start migrating transactions"; a.modalIcon = null; a.button = true; a.buttonFunctionName = "confirm-transaction-step";
        //     this.setState({ openNotificationModel: true, modalNotification: a })
        // }
        // else if (this.state.activeStep == 4) {
        //     a.modalHeading = "Confirm"; a.modalContent = "Trial balance"; a.modalIcon = null; a.button = true; a.buttonFunctionName = "confirm-trialbalance-step";
        //     this.setState({ openNotificationModel: true, modalNotification: a })
        // }
        // else if (this.state.activeStep == 6) {
        //     a.modalHeading = "Confirm"; a.modalContent = "Confirmation and Setup"; a.modalIcon = null; a.button = true; a.buttonFunctionName = "confirm-setup-step";
        //     this.setState({ openNotificationModel: true, modalNotification: a })
        // }
        // else {
        //     return this.state.activeStep >= 6 ? null : this.setState({ activeStep: this.state.activeStep + 1 })
        // }
        this.setState({ activeStep: this.state.activeStep + 1 })

    }
    previousStepChange = () => {
        // this.setState({ errorButtonView: false }, () => {
        //     let a = this.state.migrationStatusData;
        //     if (this.state.activeStep == 1) {
        //         a.step1 = null;
        //         this.setState({ migrationStatusData: a })
        //         return this.state.activeStep <= 0 ? null : this.setState({ activeStep: this.state.activeStep - 1, openNotificationModel: false })
        //         this.cancelAddMapModel()
        //     }
        //     else {
        //         return this.state.activeStep <= 0 ? null : this.setState({ activeStep: this.state.activeStep - 1, openNotificationModel: false })
        //         this.cancelAddMapModel()
        //     }
        // })
        this.setState({ activeStep: this.state.activeStep - 1 })
    }
    finishMigration = () => {
        this.setState({ activeStep: 0 })
    }
    render() {
        const ColorlibConnector = withStyles({
            alternativeLabel: { top: 22 },
            active: { '& $line': { backgroundColor: "#1359C1", marginTop: '-10px', transitionDelay: '2s' }, },
            completed: { '& $line': { backgroundColor: '#36B37E', marginTop: '-10px' }, },
            line: { height: 2, border: 0, backgroundColor: '#ccc', borderRadius: 1, marginTop: '-10px' },
        })(StepConnector);
        return (<React.Fragment>
            {this.state.isLoader ? <Loader /> : null}

            <div className="migration-main-div portal-login-div vendor-invoice-upload-wrap pdf-extraction-upload-wrap">
                {this.state.LoaderData === true ? <Loader /> : ''}
                <div className="migration-header-stepper-section">
                    <div className="zenlogo-wrap">
                        <img src={zq_logo} alt="Zenqore Logo" className="zqlogo-image"></img>
                    </div>
                    <div className="zenqore-stepper-section">
                        <Steps current={this.state.activeStep} currentStatus="process" vertical={false} >
                            <Steps.Item title="Login" />
                            <Steps.Item title="View Details" />
                            <Steps.Item title="Confirm Payment" />
                            <Steps.Item title="Payment Processing" />
                            <Steps.Item title="Confirmation" />
                        </Steps>
                    </div>
                </div>
                <div className="migration-body-content-section">
                    {this.getStepContent(this.state.activeStep)}
                </div>
                {/* <div className="migration-footer-navigation-section">
                    <Button className="stepper-back-button" onClick={this.previousStepChange}>Back</Button>
                    {this.state.activeStep <= 3 ? <Button className="stepper-next-button" onClick={this.nextStepChange}>Next</Button> : null}
                    {this.state.activeStep == 4 ? <Button className="stepper-next-button" onClick={this.finishMigration}>Finish</Button> : null}
                </div> */}
            </div>

        </React.Fragment>);
    }
}
export default withRouter(feeCollection)