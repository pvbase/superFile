import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import xlsx from 'xlsx';
import Loader from '../../../../utils/loader/loaders';
import KenTable from '../../../../utils/Table/kenTable';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import defaulterReportJson from './defaulterReportResponse';
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import '../../../../scss/student-reports.scss';
import ContainerNavbar from "../../../../gigaLayout/container-navbar";
import PaginationUI from "../../../../utils/pagination/pagination";
import '../../../../scss/common-table.scss';
// import JsonResponse3 from '../../../feeCollectionPortal/response3.json';
class defaulterReport extends Component {
    constructor(props) {
        super(props);
        this.state = {
            demandNoteTable: [],
            env: JSON.parse(localStorage.getItem('env')),
            orgId: localStorage.getItem('orgId'),
            containerNav: {
                isBack: false,
                name: "Defaulter Report",
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
            tableHeader: ["REG ID", "STUDENT NAME", "PARENT NAME", "PROGRAM PLAN", "DEMANDNOTE ID", "DEMAND NOTE DATE", "DEMAND NOTE TOTAL", "FEE PAID", "FEE PENDING", "PENDING SINCE"],
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
            axios.get(`${this.state.env['zqBaseUri']}/edu/reports/defaulterReport?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`, {
                headers: {
                    'Authorization': localStorage.getItem("auth_token"),
                    // 'client': 'ken42'
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
                    // var respErr = { "status": "success", "message": "defaulterReport reports", "data": [{ "REGISTRATION ID": "1HK16CS008", "STUDENT NAME": "Adiba Nisar", "CLASS/BATCH": "BE Computer Science  ", "ADMISSION DATE": "31/03/1995", "studentName": "Adiba Nisar", "regId": "1HK16CS008", "parentName": "Nisar", "programPlan": "BE_ENG_CSC_20-21", "displayName": "DN_2020-21_001", "demandNoteId": "DN_2020-21_001", "demandNoteDate": "11/11/2020", "totalFees": 145000, "feePaid": 145000, "feeBalance": 0, "pendingSince": "6 days" }, { "REGISTRATION ID": "1HK16CS009", "STUDENT NAME": "C R Preethi", "CLASS/BATCH": "BE Computer Science  ", "ADMISSION DATE": "01/04/1995", "studentName": "C R Preethi", "regId": "1HK16CS009", "parentName": "Preethi", "programPlan": "BE_ENG_CSC_20-21", "displayName": "DN_2020-21_002", "demandNoteId": "DN_2020-21_002", "demandNoteDate": "10/11/2020", "totalFees": 125000, "feePaid": 125000, "feeBalance": 0, "pendingSince": "7 days" }, { "REGISTRATION ID": "1HK16CS010", "STUDENT NAME": "Mohammed  Yaseen R", "CLASS/BATCH": "BE Computer Science  ", "ADMISSION DATE": "02/04/1995", "studentName": "Mohammed  Yaseen R", "regId": "1HK16CS010", "parentName": "Yaseen R", "programPlan": "BE_ENG_CSC_20-21", "displayName": "DN_2020-21_003", "demandNoteId": "DN_2020-21_003", "demandNoteDate": "08/11/2020", "totalFees": 3000, "feePaid": 2000, "feeBalance": 1000, "pendingSince": "8 days" }], "currentPage": null, "perPage": 10, "nextPage": null, "totalRecord": 4, "totalPages": 1 }
                    // this.setState({ printReportArr: respErr.data, totalPages: respErr.totalPages, totalRecord: respErr.totalRecord })
                })

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
    onCheckbox = (selectedItem) => {
        console.log('selectedItem', selectedItem)
        this.setState({ selectedData: selectedItem })
        var amountInit = 0
        if (selectedItem.length > 0) {
            selectedItem.map(item => {
                if (item.Description != 'Total') {
                    amountInit = amountInit + item['Amount']
                }
            })
        }
        this.setState({ amount: amountInit })
        this.setState({ amountFormat: this.formatCurrency(amountInit) })
    }
    handleBackFun = () => {
        this.props.history.goBack();
    }
    onDownloadEvent = () => {
        this.setState({ isLoader: true })
        axios.get(`${this.state.env['zqBaseUri']}/edu/reports/defaulterReport?orgId=${this.state.orgId}`, {
            headers: {
                'Authorization': localStorage.getItem("auth_token")
            }
        })
            .then(resp => {
                console.log("default report", resp);
                var createXlxsData = []
                resp.data.data.map(item => {
                    //  data.data.students[0].feesBreakup.map((dataOne, c) => {
                    // if (String(dataOne.description).toLowerCase() != "total") {
                    createXlxsData.push({
                        "REG ID": item.regId,
                        "STUDENT NAME": item.studentName,
                        "PARENT NAME": item.parentName,
                        "PROGRAM PLAN": item.programPlan,
                        "DEMAND NOTE ID": item.demandNoteId,
                        "DEMAND NOTE DATE": item.demandNoteDate,
                        "DEMAND NOTE TOTAL": this.formatCurrency(item.totalFees),
                        "FEE PAID": this.formatCurrency(item.feePaid),
                        "FEE PENDING": this.formatCurrency(item.feeBalance),
                        "PENDING SINCE": item.pendingSince
                    })
                    // }
                    //  })
                    console.log('**DATA**', item)

                })
                var ws = xlsx.utils.json_to_sheet(createXlxsData);
                var wb = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, "Defaulter Reports");
                xlsx.writeFile(wb, "defaulter_reports.xlsx");
                // xlsx.writeFile(wb, "demand_note_reports.csv");
                this.setState({ isLoader: false })
            })
            .catch(err => {
                console.log(err, 'err0rrrrr')
                this.setState({ isLoader: false })
            })


    }
    render() {
        return (<React.Fragment >
            {this.state.isLoader && <Loader />}
            {/* { this.state.demandNoteTable.length > 0 ? <KenTable tableData={this.state.demandNoteTable} onCheckbox={this.onCheckbox} checkBox={true} /> : null} */}
            <div className="reports-student-fees">
                <div className="student-report-header-title">
                    {/* <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBackFun} /> */}
                    <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={() => { this.props.history.goBack() }} style={{ marginRight: 10, cursor: 'pointer' }} />

                    <p className="top-header-title">Report | Defaulter Report</p>
                </div>
                <div className="reports-body-section">
                    <React.Fragment>
                        <ContainerNavbar containerNav={this.state.containerNav} onDownload={() => this.onDownloadEvent()} />
                        <div className="print-time">{this.state.printTime}</div>
                    </React.Fragment>
                    <div className="reports-data-print-table">
                        <div className="transaction-review-mainDiv">
                            <table className="transaction-table-review reports-tableRow-header ">
                                <thead>
                                    <tr>
                                        {this.state.tableHeader.map((data, i) => {
                                            return <th className={"demand-note " + String(data).replace(' ', '')} key={i + 1}>{data}</th>
                                        })}
                                    </tr>
                                </thead>
                                {this.state.printReportArr.length > 0 ?
                                    <tbody>
                                        {this.state.printReportArr.map((data, i) => {
                                            return (<tr key={i + 1} id={i + 1} className="reports-tableRow-body">
                                                {/* <td className="transaction-sno">{data.txnId}</td> */}
                                                <td className="transaction-vch-num" >{data.regId}</td>
                                                <td className="transaction-vch-num" >{data.studentName}</td>
                                                <td className="transaction-vch-num" >{data.parentName}</td>
                                                <td className="transaction-vch-type">{data.programPlan}</td>
                                                <td className="transaction-vch-num" >{data.displayName}</td>
                                                <td className="transaction-vch-type">{data.demandNoteDate}</td>
                                                <td className="transaction-vch-type">{this.formatCurrency(Number(data.totalFees))}</td>
                                                <td className="transaction-vch-type">{this.formatCurrency(Number(data.feePaid))}</td>
                                                <td className="transaction-vch-type">{this.formatCurrency(Number(data.feeBalance))}</td>
                                                <td className="transaction-vch-type">{data.pendingSince}</td>

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
            </div>

        </React.Fragment >);
    }
}

export default defaulterReport;