import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import loginForm from './review-pay.json';
import addAccount from './add-bank.json';
import Loader from '../../utils/loader/loaders'
import PaymentGateway from './paymentGateway';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Button from '@material-ui/core/Button';
import QRCode from '../../assets/images/Gateway/payment-qr.png';
import GPay from '../../assets/images/Gateway/g-pay.png';
import Phonepe from '../../assets/images/Gateway/phone-pay.png';
import Paytm from '../../assets/images/Gateway/paytm.png';
import ICICI from '../../assets/images/Gateway/icici.png';
import UPI from '../../assets/images/Gateway/upi.png';
import Zenqore from '../../assets/images/Gateway/zq-logo.png';
import ZenForm from '../input/form';
import '../../scss/payment-portal.scss';
class ReviewAndPay extends Component {
    constructor(props) {
        super(props)
        this.state = {
            loginFormData: [],
            newBankData: [],
            isLoader: false,
            paymentGateway: false,
        }
    }
    componentDidMount() {
        console.log("review -pay",this.props)
        // let loginFormData = []
        // loginForm.map(item => {
        //     loginFormData.push(item)
        // })
        // this.setState({ loginFormData: loginFormData })
    }
    componentWillMount() {
        // let newBankData = []
        // addAccount.map(item => {
        //     newBankData.push(item)
        //     this.setState({ newBankData: newBankData });
        // })
    }
    onReviewAndPay = () => {
        this.props.onReviewAndPay()
    }
    addAccount = () => {
        this.setState({ isLoader: true });
        setTimeout(() => {
            this.setState({ newBank: true, isLoader: false });
        }, 1000)
    }
    submitAccount = () => {
        this.setState({ isLoader: true });
        setTimeout(() => {
            this.setState({ newBank: false, isLoader: false });
        }, 1000)

    }
    handleNext = () => {
        this.setState({ paymentGateway: true });
    }
    onStepperBack = () => {
        this.props.onStepperBack()
    }
    render() {
        return (
            <React.Fragment>

                <div className='pay-review-wrapper' style={{ textAlign: "center" }}>
                {/* <iframe src={this.props.URL} name="iframe_a" height="100%" width="100%" title="Iframe Example"></iframe> */}
                    {/* <iframe src={"https://razorpay.com/payment-link/plink_FzmBshPpIS8SIp/test"} name="iframe_a" height="100%" width="100%" title="Iframe Example"></iframe> */}
                    
                </div>
            </React.Fragment>
        )
    }
}
export default withRouter(ReviewAndPay);