import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import Loader from '../../utils/loader/loaders';
import JsonResponse from './response.json';
import JsonResponse2 from './response2.json';
import JsonResponse3 from './response3.json';
// import { Document, Page, pdfjs } from 'react-pdf';
// import pdfURL from '../../assets/pdf/salesforce.pdf';
import LinearProgress from '@material-ui/core/LinearProgress';
import KenTable from '../../utils/Table/kenTable';
import Axios from 'axios';

class ViewDetails extends Component {
    constructor(props) {
        super(props)
        // pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
        this.state = {
            fileSize: '',
            env: JSON.parse(localStorage.getItem('env')),
            orgId: localStorage.getItem('orgId'),
            demandNote: localStorage.getItem('demandNote'),
            pdfLoaded: 0,
            upload: false,
            filename: 'invoice.pdf',
            numPages: null,
            pageNumber: 1,
            isLoader: false,
            ParentName: "",
            amount: 0,
            tableData: [],
            amountFormat: 0,
            selectedPay: [],
            feeCollectionData: [],
            selectedData: [],
            transactionRecord: [],
            email:'',
            parentphone:''
        }
    }
    formatCurrency = (amount) => {
        return (new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount))
    }

    componentDidMount = () => {
        this.setState({ isLoader: true })
        Axios.get(`${this.state.env['zqBaseUri']}/edu/demandNote?orgId=${this.state.orgId}&demandNote=${this.state.demandNote}`, {
            headers: {
                "Authorization": localStorage.getItem('auth_token')
            }
        }).then(response => {

            console.log('demand', response)
            var resData = response.data
            this.setState({ ParentName: resData.guardianDetails[0].firstName + " " + resData.guardianDetails[0].lastName })
            this.setState({email:resData.guardianDetails[0].email,parentphone:resData.guardianDetails[0].mobile})
            let demandNoteDetailsArray = resData.demandNoteDetails
            let feeCollection = []
            let feeData = []
            demandNoteDetailsArray.map((item, itemIndex) => {
                let studentDetails = item.demandNoteData
                let total = 0
                let dueTotal = 0
                let paidTotal = 0
                let lateTotal = 0
                let feesBreakupData = []
                feeCollection.push({
                    "ID": studentDetails.studentRegId,
                    "Name": studentDetails.studentName,
                    "Class": studentDetails.class,
                    "items": []

                })
                studentDetails.data.feesBreakUp.map((fee, index) => {
                    let value = studentDetails.feesBreakUp.find(item => item.feeTypeCode == fee.feeTypeCode);
                    total = total + fee.amount
                    dueTotal = dueTotal + value.totalAmount
                    paidTotal = paidTotal + studentDetails.paidAmount
                    lateTotal = lateTotal + 0

                    feeData.push({
                        "ID": studentDetails.studentRegId,
                        "Name": studentDetails.studentName,
                        "Class": studentDetails.class,
                        "Description": fee.feeType, "Amount": fee.amount, "Due Amount": fee.amountToBePaid, "Paid Amount": 0, "Late Fee Amount": 0, "Status": value.status
                    })
                    feeCollection[itemIndex]['items'].push({
                        "Description": fee.feeType, "Amount": value.totalAmount, "Due Amount": value.pendingAmount, "Paid Amount": 0, "Late Fee Amount": 0, "Status": value.status
                    })
                    if (studentDetails.data.feesBreakUp.length == (index + 1)) {
                        feeCollection[itemIndex]['items'].push({
                            "Description": 'Total', "Amount": total, "Due Amount": dueTotal, "Paid Amount": paidTotal, "Late Amount": lateTotal, "Status": "Pending"
                        })
                        feeData.push({
                            "Description": 'Total', "Amount": total, "Due Amount": dueTotal, "Paid Amount": paidTotal, "Late Amount": lateTotal, "Status": "Pending"
                        })
                    }
                })




            })

            console.log('***feeCollection***', feeCollection)
            this.setState({ feeCollectionData: feeCollection });
            this.setState({ isLoader: false })
            // setTimeout(() => {
            //     console.log('feeData', feeData)
            //     this.setState({ tableData: feeData });
            // }, 1000);
        })
            .catch(err => {
                console.log('demand', err)
                this.setState({ isLoader: false })
            })
        // this.setState({ isLoader: true });
        // if (this.props.invNo != undefined && this.props.orgId != undefined) {

        // async function fetchData() {
        // console.log('TEST', this.props.parentId, this.props.studentId, this.props.name)

        // this.setState({ ParentName: "Sathish Kumar" })
        // if (this.props.name === "Vishnu") {
        // resData = JsonResponse
        // this.setState({ ParentName: "Sathish Kumar" })

        // } if (this.props.name === "Swetha") {
        //     resData = JsonResponse2
        //     this.setState({ ParentName: "Sathish Kumar" })

        // } if (this.props.name === "Prathik") {
        //     resData = JsonResponse3
        //     this.setState({ ParentName: "Arun Kumar" })

        // }
        // var resData = JsonResponse3;

        // this.setState({ transactionRecord: resData })
        // let feeCollection = []
        // let feeData = []
        // resData['transactionDetails'].map((item, itemIndex) => {
        //     let total = 0
        //     let dueTotal = 0
        //     let paidTotal = 0
        //     let lateTotal = 0
        //     let feesBreakupData = []
        //     feeCollection.push({
        //         "ID": item.regId,
        //         "Name": item.name,
        //         "Class": item.class,
        //         items: []
        //     })
        //     item.feesBreakup.map((fee, index) => {
        //         total = total + fee.amount
        //         dueTotal = dueTotal + fee.dueAmount
        //         paidTotal = paidTotal + fee.paidAmount
        //         lateTotal = lateTotal + fee.lateFeeAmount

        //         feeData.push({
        //             "ID": item.regId,
        //             "Name": item.name,
        //             "Class": item.class,
        //             "Description": fee.description, "Amount": fee.amount, "Due Amount": fee.dueAmount, "Paid Amount": fee.paidAmount, "Late Fee Amount": fee.lateFeeAmount, "Status": "Pending"
        //         })
        //         feeCollection[itemIndex]['items'].push({
        //             "Description": fee.description, "Amount": fee.amount, "Due Amount": fee.dueAmount, "Paid Amount": fee.paidAmount, "Late Fee Amount": fee.lateFeeAmount, "Status": "Pending"
        //         })
        //         if (item.feesBreakup.length == (index + 1)) {
        //             feeCollection[itemIndex]['items'].push({
        //                 "Description": 'Total', "Amount": total, "Due Amount": dueTotal, "Paid Amount": paidTotal, "Late Fee Amount": lateTotal, "Status": "Pending"
        //             })
        //             feeData.push({
        //                 "Description": 'Total', "Amount": total, "Due Amount": dueTotal, "Paid Amount": paidTotal, "Late Fee Amount": lateTotal, "Status": "Pending"
        //             })
        //         }
        //     })
        // })
        // console.log('***feeCollection***', feeCollection)
        // this.setState({ feeCollectionData: feeCollection });
        // setTimeout(() => {
        //     console.log('feeData', feeData)
        //     this.setState({ tableData: feeData });
        // }, 1000);
        // }
        // fetchData();

    }
    onViewDetails = () => {
        axios.put(`${this.state.env['portal']}/1/${this.props.transactionID}?docNo=${this.props.invNo}&orgId=${this.props.orgId}`).then(response => {
            console.log(response)
        })
        this.props.onViewDetails()
    }
    onStepperBack = () => {
        this.props.onStepperBack()
    }
    // onDocumentLoadSuccess = (numPages) => {
    //     this.setState({ numPages: numPages });
    // }
    onPayNow = () => {
        this.props.payNow(this.state.selectedData, 'Arun Jain', this.state.amount, this.state.transactionRecord)
    }

    onCheckbox = (selectedItem) => {
        console.log('selectedItem', selectedItem)
        this.setState({ selectedData: selectedItem })
        var amountInit = 0
        if (selectedItem.length > 0) {
            selectedItem.map(item => {
                if (item.Description != 'Total') {
                    amountInit = amountInit + item['Due Amount']
                }
            })
        }
        this.setState({ amount: amountInit })
        localStorage.setItem('amount',amountInit)
        this.setState({ amountFormat: this.formatCurrency(amountInit) })
    }
    onViewDemandNoteComplete = () => {
        this.props.onViewDemandNoteComplete(this.state.amountFormat,this.state.amount,this.state.ParentName,this.state.email,this.state.parentphone)
    }
    render() {
        const { pageNumber, numPages } = this.state;
        return (
            <React.Fragment>
                {this.state.isLoader ? <Loader /> : null}
                <div className="portal-fee-details">
                    <div style={{ textAlign: 'Center', 'padding': '20px' }}>
                        <h5 className="login-form-hd">Welcome Mr.{this.state.ParentName}</h5><br />
                        <p className="login-desc-txt" >There are following pending payments</p>
                    </div>
                    {this.state.feeCollectionData.length > 0 ? <KenTable tableData={this.state.feeCollectionData} onCheckbox={this.onCheckbox} checkBox={true} /> : null}

                    {this.state.feeCollectionData.length > 0 ? <Button style={this.state.selectedData.length > 0 ? { background: "#15435b", color: "#fff", marginRight: "15px", marginTop: "20px", "float": "right" } : { background: "gray", color: "#fff", marginRight: "15px", marginTop: "20px", "float": "right" }} disabled={this.state.selectedData.length > 0 ? false : true} className="portal-primary-btn pay-now-btn" onClick={this.onViewDemandNoteComplete}>Pay Now {this.state.amount > 0 ? `(${this.state.amountFormat})` : null}</Button> :null}
                    {/* <Button  disabled={this.state.selectedData.length > 0 ? false : true} className="" onClick={this.onPayNow}>Pay Now {this.state.amount > 0 ? `(${this.state.amountFormat})` : null}</Button> */}

                </div>
            </React.Fragment>
        )
    }
}
export default withRouter(ViewDetails);