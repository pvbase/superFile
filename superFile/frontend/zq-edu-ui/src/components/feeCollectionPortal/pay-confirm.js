import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import Loader from '../../utils/loader/loaders'
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Axios from 'axios';
class ConfirmInvoice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            env: JSON.parse(localStorage.getItem('env')),
            isLoader: false,
            paymentId: localStorage.getItem('paymentId'),
            paymentResponse: [],
            refEmailId: "",
        }
    }
    componentDidMount() {
        console.log(this.props)
        Axios.get(`${this.state.env['zqBaseUri']}/edu/getPaymentStatus/${this.state.paymentId} `, {
            // Axios.get(`${this.state.env['zqBaseUri']}/edu/getPaymentStatus/pay_G0cc5K2r3ZrRMC`, {
            headers: {
                "Authorization": localStorage.getItem('auth_token')
            }
        }).then(response => {
            console.log("get response", response)
            this.setState({ paymentResponse: JSON.parse(response.data.Data) })
            // console.log('paymentResponse',this.state.paymentResponse)
            let paymentResponse = JSON.parse(response.data.Data)
            let payload = {

                "transactionDate": new Date(paymentResponse.created_at),
                "relatedTransactions": [
                    localStorage.getItem('demandNote'),
                ],
                "transactionType": "eduFees",
                "transactionSubType": "feePayment",
                "amount": Number(localStorage.getItem('amount')),
                "status": 'initiated',
                "data": {
                    "orgId": localStorage.getItem('orgId'),
                    "transactionType": "eduFees",
                    "transactionSubType": "feePayment",
                    "mode": paymentResponse.method,
                    "modeDetails": {
                        "netBankingType": null,
                        "walletType": null,
                        "instrumentNo": paymentResponse.acquirer_data.bank_transaction_id,
                        "instrumentDate": new Date(paymentResponse.created_at),
                        "bankName": paymentResponse.bank,
                        "branchName": "",
                        "transactionId": paymentResponse.acquirer_data.bank_transaction_id,
                        "remarks": ""
                    },
                    "amount": Number(localStorage.getItem('amount')),
                },
                "paymentTransactionId": this.state.paymentId,
                "createdBy": localStorage.getItem('orgId'),
                "emailCommunicationRefIds": paymentResponse.email
            }
            console.log("payload", payload)
            Axios.post(`${this.state.env['zqBaseUri']}/edu/feePayment`, payload, {
                headers: {
                    "Authorization": localStorage.getItem('auth_token')
                }
            }).then(response => {
                console.log("post responsew", response)

            }).catch(err => {
                console.log("post responsew", err)
            })
        }).catch(err => {
            console.log("get  err response", err)
            console.log(err)
        })
        //    let paymentResponse =this.state.paymentResponse

    }
    handleNext = () => {
        this.props.history.push('./feeCollection')
        this.setState({ isLoader: true });
        setTimeout(() => {
            this.setState({ isLoader: false });
            window.location.reload();
        }, 1000)
    }
    onStepperBack = () => {
        this.props.onStepperBack()
    }
    render() {
        return (
            <React.Fragment>
                {this.state.isLoader ? <Loader /> : null}

                <div className="upload-invoice-confirm-wrap">
                    <div>
                        <CheckCircleIcon className="confirm-icon" />
                        <p>Your payment has been successfully processed and Receipt has been sent to your email address.
                        <br /><br />Your Transaction is: &nbsp;<b>{this.state.paymentResponse.acquirer_data !== undefined ? this.state.paymentResponse.acquirer_data.bank_transaction_id : null}</b> </p>
                    </div>
                </div>
                <div className="payment-confirm-btn">
                    {/* <Button className="stepper-BackBtn" color="primary" onClick={this.onStepperBack} > Back </Button> */}
                    <Button className="stepper-NextBtn" variant="contained" style={{ float: "right" }} color="primary" onClick={this.handleNext}>Finish </Button>
                </div>
            </React.Fragment>
        )
    }

}
export default withRouter(ConfirmInvoice);