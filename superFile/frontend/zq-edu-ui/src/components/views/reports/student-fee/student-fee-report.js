import React, { Component } from "react";
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import '../../../../scss/student-reports.scss';
import ContainerNavbar from "../../../../gigaLayout/container-navbar";
import sampleReportData from './student-fees-report.json';
import axios from 'axios';
import xlsx from 'xlsx';
import PaginationUI from "../../../../utils/pagination/pagination";
import '../../../../scss/common-table.scss';
import Loader from '../../../../utils/loader/loaders';
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
class StudentFee extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            env: JSON.parse(localStorage.getItem('env')),
            orgId: localStorage.getItem('orgId'),
            containerNav: {
                isBack: false,
                name: "Fees Collection",
                isName: true,
                isSearch: true,
                isSort: true,
                isPrint: true,
                isDownload: true,
                isShare: false,
                isNew: false,
                newName: "New",
                isSubmit: false,
            },
            tableHeader: ["DEMAND NOTE ID", "REG ID", "STUDENT NAME", "ACADEMIC YEAR", "CLASS/BATCH", "DESCRIPTION", "DUE", "PAID", "BALANCE", "PAID ON", "TXN ID", "STATUS"],
            printReportArr: [],
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 0,
            noData: false,
            isLoader: false
        }
    }
    onPaginationChange = (page, limit) => {
        this.setState({ page: page, limit: limit }, () => {
            this.onDataCall();
        });
        console.log(page, limit);
    };
    componentDidMount() {
        this.onDataCall();
    }
    onDataCall = () => {
        this.setState({ isLoader: true })
        this.setState({ printReportArr: [] }, () => {
            axios.get(`${this.state.env['zqBaseUri']}/edu/reports/feePayment?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`, {
                headers: {
                    'Authorization': localStorage.getItem("auth_token"),
                    // 'Authorization': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im11bml5YXJhai5uZWVsYW1lZ2FtQGdtYWlsLmNvbSIsImlkIjoiNWY4NTgyZTA2OGEwMDIwMDA4NmM2Y2YxIiwiaWF0IjoxNjA1MjQ3NjQ0LCJleHAiOjE2MDUzMzQwNDR9.m0EMpiZVjkbEWTUjC10WjiRPu0WGP9DBxeV5jBJnyQU",
                    //'client': 'ken42'
                }
            })
                .then(resp => {
                    console.log(resp);
                    let noData;
                    if (resp.data.data.length === 0) {
                        noData = true;
                    } else {
                        noData = false;
                    }
                    this.setState({ printReportArr: resp.data.data, totalPages: resp.data.totalPages, totalRecord: resp.data.totalRecord, noData })
                    this.setState({ isLoader: false })
                })
                .catch(err => {
                    console.log(err);
                    this.setState({ isLoader: false })
                    // var respErr = { "status": "success", "message": "feePayment reports", "data": [{ "studentName": "Adiba Nisar", "regId": "STUD_001", "academicYear": "2020-21", "classBatch": "BE_ENG_CSC_20-21", "DemandId": "DN_2020-21_001", "description": [{ "name": "Tuition Fee", "due": 145000, "paid": 145000, "paidDate": "12/11/2020", "balance": 0, "status": "Paid", "txnId": "5fae2d05daeb301acc833ec6" }, { "name": "Total", "due": 145000, "paid": 145000, "paidDate": "-", "balance": 0, "status": "Paid", "txnId": "-" }] }, { "studentName": "Abdul Nasar", "regId": "STUD_002", "academicYear": "2020-21", "classBatch": "BE_ENG_MEC_20-21", "DemandId": "DN_2020-21_002", "description": [{ "name": "Tuition Fee", "due": 125000, "paid": 125000, "paidDate": "11/11/2020", "balance": 0, "status": "Paid", "txnId": "5fae2d090888b11acc10be14" }, { "name": "Total", "due": 125000, "paid": 125000, "paidDate": "-", "balance": 0, "status": "Paid", "txnId": "-" }] }, { "studentName": "Pradeep Kumar", "regId": "STUD_003", "academicYear": "2020-21", "classBatch": "BE_ENG_CVL_20-21", "DemandId": "DN_2020-21_003", "description": [{ "name": "Uniform Plan", "due": 2000, "paid": 800, "paidDate": "10/11/2020", "balance": 2200, "status": "Partial", "txnId": "5fae2d0d7074061accc1a355" }, { "name": "Tuition Fee", "due": 2000, "paid": 1200, "paidDate": "10/11/2020", "balance": 1800, "status": "Partial", "txnId": "5fae2d0d7074061accc1a355" }, { "name": "Total", "due": 4000, "paid": 2000, "paidDate": "-", "balance": 4000, "status": "Partial", "txnId": "-" }] }, { "studentName": "Mohammed Yaseen R", "regId": "STUD_003", "academicYear": "2020-21", "classBatch": "BE_ENG_CVL_20-21", "DemandId": "DN_2020-21_004", "description": [{ "name": "Transport Fee", "due": 280000, "paid": 11275.17, "paidDate": "25/10/2020", "balance": 128724.83, "status": "Partial", "txnId": "5fae2d1aa3335d1acc4e9a77" }, { "name": "Tuition Fee", "due": 280000, "paid": 131543.62, "paidDate": "25/10/2020", "balance": 8456.38, "status": "Partial", "txnId": "5fae2d1aa3335d1acc4e9a77" }, { "name": "Uniform Plan", "due": 280000, "paid": 5637.58, "paidDate": "25/10/2020", "balance": 134362.42, "status": "Partial", "txnId": "5fae2d1aa3335d1acc4e9a77" }, { "name": "Tuition Fee", "due": 280000, "paid": 131543.62, "paidDate": "25/10/2020", "balance": 8456.38, "status": "Partial", "txnId": "5fae2d1aa3335d1acc4e9a77" }, { "name": "Total", "due": 1120000, "paid": 279999.99, "paidDate": "-", "balance": 280000.01, "status": "Partial", "txnId": "-" }] }], "currentPage": null, "perPage": 10, "nextPage": null, "totalRecord": 4, "totalPages": 1 }

                    // this.setState({ printReportArr: respErr.data, totalPages: respErr.totalPages, totalRecord: respErr.totalRecord })
                })

        })
    }
    handleBackFun = () => {
        this.props.history.goBack();
    }
    onDownloadEvent = () => {
        this.setState({ isLoader: true })
        axios.get(`${this.state.env['zqBaseUri']}/edu/reports/feePayment?orgId=${this.state.orgId}`, {
            headers: {
                'Authorization': localStorage.getItem("auth_token")
            }
        })
            .then(resp => {
                console.log("student fee", resp);
                var createXlxsData = []
                resp.data.data.map(item => {
                    item.description.map((dataOne, c) => {
                        if (String(dataOne.name).toLowerCase() != "total") {
                            createXlxsData.push({
                                "DEMAND NOTE ID": item.DemandId,
                                "REG ID": item.regId,
                                "STUDENT NAME": item.studentName,
                                "ACADEMIC YEAR": item.academicYear,
                                "CLASS/BATCH": item.classBatch,
                                "DESCRIPTION": dataOne.name,
                                "DUE": this.formatCurrency(dataOne.due),
                                "PAID": this.formatCurrency(dataOne.paid),
                                "BALANCE": this.formatCurrency(dataOne.balance),
                                "PAID ON": dataOne.paidDate,
                                "TXN ID": dataOne.txnId,
                                "STATUS": dataOne.status
                            })
                        }
                    })
                    console.log('**DATA**', item)

                })
                var ws = xlsx.utils.json_to_sheet(createXlxsData);
                var wb = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, "Student Fee Reports");
                xlsx.writeFile(wb, "student_fee_reports.xlsx");
                // xlsx.writeFile(wb, "demand_note_reports.csv");
                this.setState({ isLoader: false })
            })
            .catch(err => {
                console.log(err, 'err0rrrrr')
                this.setState({ isLoader: false })
            })


    }
    formatCurrency = (amount) => {
        return (new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount))
    }
    render() {
        return (
            <React.Fragment>
                {this.state.isLoader && <Loader />}
                < div className="reports-student-fees" >
                    <div className="student-report-header-title">
                        {/* <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBackFun} /> */}
                        <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={() => { this.props.history.goBack() }} style={{ marginRight: 10, cursor: 'pointer' }} />

                        <p className="top-header-title">Report | Fees Collection</p>
                    </div>
                    <div className="reports-body-section">
                        <React.Fragment>
                            <ContainerNavbar containerNav={this.state.containerNav} onDownload={() => this.onDownloadEvent()} />
                            <div className="print-time">{this.state.printTime}</div>
                        </React.Fragment>
                        <div className="reports-data-print-table">
                            <div className="transaction-review-mainDiv">
                                <table className="transaction-table-review reports-tableRow-header" >
                                    <thead>
                                        <tr>
                                            {this.state.tableHeader.map((data, i) => {
                                                return <th className={'student-fee ' + String(data).replace(' ', '')} key={i + 1}>{data}</th>
                                            })}
                                        </tr>
                                    </thead>
                                    {this.state.printReportArr.length > 0 ?
                                        <tbody>
                                            {this.state.printReportArr.map((data, i) => {
                                                return (
                                                    <tr key={i + 1} id={i + 1}>
                                                        {/* <td className="transaction-sno">{data.txnId}</td> */}
                                                        <td className="transaction-vch-type">{data.DemandId}</td>
                                                        <td className="transaction-vch-num" >{data.regId}</td>
                                                        <td className="transaction-vch-num" >{data.studentName}</td>
                                                        <td className="transaction-vch-type">{data.academicYear}</td>
                                                        <td className="transaction-vch-type">{data.classBatch}</td>
                                                        <td className="transaction-particulars">
                                                            {data.description.map((dataOne, c) => {
                                                                return (
                                                                    <p style={{ fontWeight: dataOne.name == "Total" ? "bold" : '' }}>{dataOne.name}</p>
                                                                )
                                                            })}
                                                        </td>
                                                        <td className="transaction-debit">
                                                            {data.description.map((dataOne, c) => {
                                                                return (
                                                                    <p style={{ fontWeight: dataOne.name == "Total" ? "bold" : '' }}>{Number(Math.abs(dataOne.due)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                                                                )
                                                            })}
                                                        </td>
                                                        <td className="transaction-debit" >
                                                            {data.description.map((dataOne, c) => {
                                                                return (
                                                                    <p style={{ fontWeight: dataOne.name == "Total" ? "bold" : '' }}>{Number(Math.abs(dataOne.paid)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                                                                )
                                                            })}
                                                        </td>
                                                        <td className="transaction-debit">
                                                            {data.description.map((dataOne, c) => {
                                                                return (
                                                                    <p style={{ fontWeight: dataOne.name == "Total" ? "bold" : '' }}>{Number(Math.abs(dataOne.balance)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                                                                )
                                                            })}
                                                        </td>
                                                        <td className="transaction-debit">
                                                            {data.description.map((dataOne, c) => {
                                                                return (
                                                                    <p style={{ fontWeight: dataOne.name == "Total" ? "bold" : '' }}>{dataOne.paidDate}</p>
                                                                )
                                                            })}
                                                        </td>
                                                        <td className="transaction-debit">
                                                            {data.description.map((dataOne, c) => {
                                                                return (
                                                                    <p>{dataOne.txnId}</p>
                                                                )
                                                            })}
                                                        </td>
                                                        <td className="transaction-debit">
                                                            {data.description.map((dataOne, c) => {
                                                                return (
                                                                    <p style={{ color: dataOne.status == "Pending" ? "#FF5630" : dataOne.status == "Paid" ? "#00875A" : "#000000", fontWeight: String(dataOne.name).includes("Total") ? "" : '' }}>{dataOne.status}</p>
                                                                )
                                                            })}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody> :
                                        <tbody>
                                            <tr>
                                                {this.state.noData ? <td className="noprog-txt" colSpan={this.state.tableHeader.length}>No data...</td> :
                                                    <td className="noprog-txt" colSpan={this.state.tableHeader.length}>Fetching the data...</td>
                                                }

                                            </tr></tbody>
                                    }
                                </table>
                            </div>
                            <div>
                                {this.state.printReportArr.length == 0 ? null :
                                    <PaginationUI
                                        total={this.state.totalRecord}
                                        onPaginationApi={this.onPaginationChange}
                                        totalPages={this.state.totalPages}
                                        limit={this.state.limit}
                                        currentPage={this.state.page}
                                    />}
                            </div>
                        </div>
                    </div>
                </div >
            </React.Fragment>
        )
    }
}
export default StudentFee;