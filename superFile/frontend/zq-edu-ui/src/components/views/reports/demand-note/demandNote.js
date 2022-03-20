import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import xlsx from 'xlsx';
import Loader from '../../../../utils/loader/loaders';
import KenTable from '../../../../utils/Table/kenTable';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import demandNoteJson from './demand_note_response';
import '../../../../scss/student-reports.scss';
import ContainerNavbar from "../../../../gigaLayout/container-navbar";
import PaginationUI from "../../../../utils/pagination/pagination";
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import '../../../../scss/common-table.scss';
// import JsonResponse3 from '../../../feeCollectionPortal/response3.json';
class DemandNoteReport extends Component {
    constructor(props) {
        super(props);
        this.state = {
            env: JSON.parse(localStorage.getItem('env')),
            orgId: localStorage.getItem('orgId'),
            demandNoteTable: [],
            isLoader: false,
            containerNav: {
                isBack: false,
                name: "Demand Notes",
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
            noData: false,
            tableHeader: ["DEMAND NOTE ID", "REG ID", "STUDENT NAME", "ACADEMIC YEAR", "CLASS/BATCH", "ISSUED DATE", "DUE DATE", "DESCRIPTION", "AMOUNT", "STATUS"],
            printReportArr: [],
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 0,

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
        let demandNoteTable = []
        this.setState({ printReportArr: [] }, () => {
            axios.get(`${this.state.env['zqBaseUri']}/edu/reports/demandNote?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`, {
                headers: {
                    'Authorization': localStorage.getItem("auth_token"),
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
                    console.log(err, 'err0rrrrr')
                    // var respErr = { "status": "success", "message": "demandNote reports", "data": [{ "data": { "leadId": null, "students": [{ "studentName": "Adiba Nisar", "regId": "STUD_001", "class": "BE_ENG_CSC_20-21", "academicYear": "2020-21", "admittedOn": "31/03/1995", "studentFeesMappingId": "5fab81e34ba44f4c1457065b", "dueDate": "30/11/2020", "studentRefId": "5fab81e74ba44f4c14570661", "feesBreakup": [{ "description": "Tuition Fee", "amount": 145000, "pendingAmount": 145000, "dueAmount": 145000 }, { "description": "Total", "amount": 145000, "pendingAmount": 145000, "dueAmount": 145000 }] }], "totalFees": 145000 }, "ledgerRefIds": ["5fae2cf9ffa4751accb6d5a4"], "_id": "5fae2cf9ffa4751accb6d5a3", "displayName": "DN_2020-21_001", "entityId": "5fa8daece3eb1f18d4250e55?page=1", "todayDate": "11/11/2020", "parentEmail": "mathi@gmail.com", "transactionType": "eduFees", "transactionSubType": "demandNote", "totalFees": 145000, "createdBy": "5fa29d5b3ab8c44784144eec", "updatedBy": "5fa29d5b3ab8c44784144eec", "status": "Paid", "paymentStatus": "Paid", "additionalDetails": { "date": "13/11/2020", "transactionId": "5fae2cf9ffa4751accb6d5a3", "remarks": "Demand Note Sent" }, "createdAt": "13/11/2020", "updatedAt": "13/11/2020", "__v": 0 }, { "data": { "leadId": null, "students": [{ "studentName": "Abdul Nasar", "regId": "STUD_002", "class": "BE_ENG_MEC_20-21", "academicYear": "2020-21", "admittedOn": null, "studentFeesMappingId": null, "dueDate": "09/12/2020", "studentRefId": "5fab8b852ae048251083236b", "feesBreakup": [{ "description": "Tuition Fee", "amount": 125000, "pendingAmount": 125000, "dueAmount": 125000 }, { "description": "Total", "amount": 125000, "pendingAmount": 125000, "dueAmount": 125000 }] }], "totalFees": 125000 }, "ledgerRefIds": ["5fae2cfdfb11311acca2e6fe"], "_id": "5fae2cfcfb11311acca2e6fd", "displayName": "DN_2020-21_002", "entityId": "5fa8daece3eb1f18d4250e55?page=1", "todayDate": "10/11/2020", "parentEmail": "abdul.n@gmail.com", "transactionType": "eduFees", "transactionSubType": "demandNote", "totalFees": 125000, "createdBy": "5fa29d5b3ab8c44784144eec", "updatedBy": "5fa29d5b3ab8c44784144eec", "status": "Paid", "paymentStatus": "Paid", "additionalDetails": { "date": "13/11/2020", "transactionId": "5fae2cfcfb11311acca2e6fd", "remarks": "Demand Note Sent" }, "createdAt": "13/11/2020", "updatedAt": "13/11/2020", "__v": 0 }, { "data": { "leadId": null, "students": [{ "studentName": "Pradeep Kumar", "regId": "STUD_003", "class": "BE_ENG_CVL_20-21", "academicYear": "2020-21", "admittedOn": null, "studentFeesMappingId": null, "dueDate": "07/12/2020", "studentRefId": "5fab8b852ae048251083236c", "feesBreakup": [{ "description": "Tuition Fee", "amount": 3000, "pendingAmount": 3000, "dueAmount": 3000 }, { "description": "Uniform Plan", "amount": 2000, "pendingAmount": 2000, "dueAmount": 2000 }, { "description": "Total", "amount": 5000, "pendingAmount": 5000, "dueAmount": 5000 }] }], "totalFees": 5000 }, "ledgerRefIds": ["5fae2d0187c20d1acc9a35c2", "5fae2d0187c20d1acc9a35c3"], "_id": "5fae2d0087c20d1acc9a35c1", "displayName": "DN_2020-21_003", "entityId": "5fa8daece3eb1f18d4250e55?page=1", "todayDate": "08/11/2020", "parentEmail": "pradeepkumar@gmail.com", "transactionType": "eduFees", "transactionSubType": "demandNote", "totalFees": 5000, "createdBy": "5fa29d5b3ab8c44784144eec", "updatedBy": "5fa29d5b3ab8c44784144eec", "status": "Partial", "paymentStatus": "Partial", "additionalDetails": { "date": "13/11/2020", "transactionId": "5fae2d0087c20d1acc9a35c1", "remarks": "Demand Note Sent" }, "createdAt": "13/11/2020", "updatedAt": "13/11/2020", "__v": 0 }, { "data": { "leadId": null, "students": [{ "studentName": "Mohammed Yaseen R", "regId": "STUD_003", "class": "BE_ENG_CVL_20-21", "academicYear": "2020-21", "admittedOn": null, "studentFeesMappingId": null, "dueDate": "01/11/2020", "studentRefId": "5fab8b852ae048251083236c", "feesBreakup": [{ "description": "Tuition Fee", "amount": 140000, "pendingAmount": 140000, "dueAmount": 140000 }, { "description": "Transport Fee", "amount": 12000, "pendingAmount": 12000, "dueAmount": 12000 }, { "description": "Total", "amount": 152000, "pendingAmount": 152000, "dueAmount": 152000 }] }], "totalFees": 152000 }, "ledgerRefIds": ["5fae2d120011cb1acc39adf8", "5fae2d120011cb1acc39adf9"], "_id": "5fae2d110011cb1acc39adf7", "displayName": "DN_2020-21_004", "entityId": "5fa8daece3eb1f18d4250e55?page=1", "todayDate": "01/10/2020", "parentEmail": "mohammed.yaseen@gmail.com", "transactionType": "eduFees", "transactionSubType": "demandNote", "totalFees": 152000, "createdBy": "5fa29d5b3ab8c44784144eec", "updatedBy": "5fa29d5b3ab8c44784144eec", "status": "Partial", "paymentStatus": "Partial", "additionalDetails": { "date": "13/11/2020", "transactionId": "5fae2d110011cb1acc39adf7", "remarks": "Demand Note Sent" }, "createdAt": "13/11/2020", "updatedAt": "13/11/2020", "__v": 0 }, { "data": { "leadId": null, "students": [{ "studentName": "Adiba Nisar", "regId": "STUD_001", "class": "BE_ENG_CSC_20-21", "academicYear": "2020-21", "admittedOn": null, "studentFeesMappingId": null, "dueDate": "01/11/2020", "studentRefId": "5fab8b852ae048251083236a", "feesBreakup": [{ "description": "Tuition Fee", "amount": 140000, "pendingAmount": 140000, "dueAmount": 140000 }, { "description": "Uniform Plan", "amount": 6000, "pendingAmount": 6000, "dueAmount": 6000 }, { "description": "Total", "amount": 146000, "pendingAmount": 146000, "dueAmount": 146000 }] }], "totalFees": 146000 }, "ledgerRefIds": ["5fae2d167916f41acc9b4404", "5fae2d167916f41acc9b4405"], "_id": "5fae2d157916f41acc9b4403", "displayName": "DN_2020-21_005", "entityId": "5fa8daece3eb1f18d4250e55?page=1", "todayDate": "01/10/2020", "parentEmail": "adiba.nisar@gmail.com", "transactionType": "eduFees", "transactionSubType": "demandNote", "totalFees": 146000, "createdBy": "5fa29d5b3ab8c44784144eec", "updatedBy": "5fa29d5b3ab8c44784144eec", "status": "Partial", "paymentStatus": "Partial", "additionalDetails": { "date": "13/11/2020", "transactionId": "5fae2d157916f41acc9b4403", "remarks": "Demand Note Sent" }, "createdAt": "13/11/2020", "updatedAt": "13/11/2020", "__v": 0 }], "currentPage": null, "perPage": 10, "nextPage": null, "totalRecord": 5, "totalPages": 1 }

                    this.setState({ isLoader: false })
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
        axios.get(`${this.state.env['zqBaseUri']}/edu/reports/demandNote?orgId=${this.state.orgId}`, {
            headers: {
                'Authorization': localStorage.getItem("auth_token")
            }
        })
            .then(resp => {
                console.log(resp);
                var createXlxsData = []
                resp.data.data.map(data => {
                    data.data.students[0].feesBreakup.map((dataOne, c) => {
                        if (String(dataOne.description).toLowerCase() != "total") {
                            createXlxsData.push({
                                "DEMAND NOTE ID": data.displayName,
                                "REG ID": data.data.students[0].regId,
                                "STUDENT NAME": data.data.students[0].studentName,
                                "ACADEMIC YEAR": data.data.students[0].academicYear,
                                "CLASS/BATCH": data.data.students[0].class,
                                "ISSUED DATE": data.todayDate,
                                "DUEDATE": data.data.students[0].dueDate,
                                "DESCRIPTION": dataOne.description,
                                "AMOUNT": this.formatCurrency(dataOne.amount),
                                "STATUS": dataOne.status
                            })
                        }
                    })
                    console.log('**DATA**', data)

                })
                var ws = xlsx.utils.json_to_sheet(createXlxsData);
                var wb = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(wb, ws, "Demand Note Reports");
                xlsx.writeFile(wb, "demand_note_reports.xlsx");
                //xlsx.writeFile(wb, "demand_note_reports.csv");
                this.setState({ isLoader: false })
            })
            .catch(err => {
                console.log(err, 'err0rrrrr')
                this.setState({ isLoader: false })
            })


    }
    printScreen = () => { }
    render() {
        return (<React.Fragment >
            {/* { this.state.demandNoteTable.length > 0 ? <KenTable tableData={this.state.demandNoteTable} onCheckbox={this.onCheckbox} checkBox={true} /> : null} */}

            {this.state.isLoader &&
                <Loader />
            }
            <div className="reports-student-fees">
                <div className="student-report-header-title">
                    {/* <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBackFun} /> */}
                    <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={()=>{this.props.history.goBack()}} style={{ marginRight: 10, cursor: 'pointer' }} />
                    <p className="top-header-title">Report | Demand Notes</p>
                </div>
                <div className="reports-body-section">
                    <React.Fragment>
                        <ContainerNavbar containerNav={this.state.containerNav} onDownload={() => this.onDownloadEvent()} printScreen={this.printScreen()} />
                        <div className="print-time">{this.state.printTime}</div>
                    </React.Fragment>
                    <div className="reports-data-print-table">
                        <div className="transaction-review-mainDiv">
                            <table className="transaction-table-review reports-tableRow-header">
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
                                            return (<tr key={i + 1} id={i + 1}>
                                                <td className="transaction-vch-num" >{data.displayName}</td>
                                                <td className="transaction-vch-num" >{data.data.students[0].regId}</td>
                                                <td className="transaction-vch-num" >{data.data.students[0].studentName}</td>
                                                <td className="transaction-vch-type">{data.data.students[0].academicYear}</td>
                                                <td className="transaction-vch-type">{data.data.students[0].class}</td>
                                                <td className="transaction-vch-type">{data.todayDate}</td>
                                                <td className="transaction-vch-type">{data.data.students[0].dueDate}</td>
                                                <td className="transaction-particulars">
                                                    {data.data.students[0].feesBreakup.map((dataOne, c) => {
                                                        return (
                                                            <p style={{ fontWeight: String(dataOne.description).includes("Total") ? "bold" : '' }}>{dataOne.description}</p>
                                                        )
                                                    })}
                                                </td>
                                                <td className="transaction-debit">
                                                    {data.data.students[0].feesBreakup.map((dataOne, c) => {
                                                        return (
                                                            <p style={{ fontWeight: String(dataOne.description).includes("Total") ? "bold" : '' }}>{this.formatCurrency(dataOne.amount)}</p>
                                                        )
                                                    })}
                                                </td>
                                                <td className="transaction-debit">
                                                    {data.data.students[0].feesBreakup.map((dataOne, c) => {
                                                        let status = dataOne.status;
                                                        return (
                                                            // <p style={{ fontWeight: dataOne.name == "Total" ? "bold" : '' }}>{dataOne.Status}</p>

                                                            <p style={{ color: String(status).toLowerCase().includes("pending") ? "#FF5630" : String(status).toLowerCase().includes("paid") ? "#00875A" : "#000000", fontWeight: String(dataOne.description).includes("Total") ? "" : '' }}>{String(status).charAt(0).toUpperCase() + String(status).slice(1)}</p>
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
            </div>

        </React.Fragment >);
    }
}

export default DemandNoteReport;