import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import xlsx from 'xlsx';
import Loader from '../../../../utils/loader/loaders';
import KenTable from '../../../../utils/Table/kenTable';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import feePendingResponse from './feePendingResponse';
import '../../../../scss/student-reports.scss';
import ContainerNavbar from "../../../../gigaLayout/container-navbar";
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import PaginationUI from "../../../../utils/pagination/pagination";
import '../../../../scss/common-table.scss';
import moment from 'moment';
// import JsonResponse3 from '../../../feeCollectionPortal/response3.json';
class feePendingReport extends Component {
    constructor(props) {
        super(props);
        this.state = {
            demandNoteTable: [],
            env: JSON.parse(localStorage.getItem('env')),
            orgId: localStorage.getItem('orgId'),
            containerNav: {
                isBack: false,
                name: "Fee Pending",
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
            tableHeader: ["PROGRAM CODE", "PROGRAM PLAN NAME", "NO. OF STUDENTS", "PENDING STUDENTS", "TOTAL FEES", "TOTAL FEES COLLECTED", "TOTAL PENDING"],
            printReportArr: feePendingResponse.data,
            previewStudentTableData: [],
            previewTableData: [],
            showTable: true,
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 0,
            noData: false,
            isLoader: false,
            previewpage: 1,
            previewlimit: 10,
            previewtotalRecord: 0,
            previewtotalPages: 0,
            totalPreviewRecord: 0,
            particularItem: undefined

        }
    }
    onPaginationChange = (page, limit) => {
        this.setState({ page: page, limit: limit }, () => {
            this.onDataCall()
        });
        console.log(page, limit);
    };
    componentDidMount() {
        console.log(feePendingResponse.data)
        this.onDataCall()
        // feePendingResponse.data.map((item, itemIndex) => {
        //     demandNoteTable.push({
        //         "Program Code": item["programPlanId"],
        //         "Program Plan Name": item["programPlanName"],
        //         "No. of Students": item["numberOfStudents"],
        //         "Pending Students": item["pendingStudents"],
        //         "Total Fees": item["totalFees"],
        //         "Total Fees Collected": item["totalFeesCollected"],
        //         "Total Pending": item['totalPending'],
        //     })
        // })

        // // -----------------------
        // console.log(demandNoteTable)
        // this.setState({ demandNoteTable: demandNoteTable })

    }

    onDataCall = () => {
        this.setState({ isLoader: true })
        let demandNoteTable = []
        this.setState({ printReportArr: [] }, () => {
            axios.get(`${this.state.env['zqBaseUri']}/edu/reports/feePending?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`, {
                headers: {
                    'Authorization': localStorage.getItem("auth_token"),
                    // 'Authorization': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im11bml5YXJhai5uZWVsYW1lZ2FtQGdtYWlsLmNvbSIsImlkIjoiNWY4NTgyZTA2OGEwMDIwMDA4NmM2Y2YxIiwiaWF0IjoxNjA1MjQ3NjQ0LCJleHAiOjE2MDUzMzQwNDR9.m0EMpiZVjkbEWTUjC10WjiRPu0WGP9DBxeV5jBJnyQU",
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
                    // var respErr = { "status": "success", "message": "feePending reports", "data": [{ "programPlanId": "PRGPLN_003", "programPlanName": null, "numberOfStudents": 5, "pendingStudents": 2, "items": [{ "regId": "STUD_003", "studentName": "Pradeep Kumar", "programPlanName": null, "totalFees": 5000, "totalPaid": 2000, "totalPending": 3000 }], "totalFees": 5000, "totalFeesCollected": 2000, "totalPending": 3000 }, { "programPlanId": "PRGPLN_001", "programPlanName": "BE Computer Science  ", "numberOfStudents": 5, "pendingStudents": 2, "items": [{ "regId": "STUD_001", "studentName": "Adiba Nisar", "programPlanName": "BE Computer Science  ", "totalFees": 145000, "totalPaid": 145000, "totalPending": 0 }], "totalFees": 145000, "totalFeesCollected": 145000, "totalPending": 0 }, { "programPlanId": "5fab8b7f2ae048251083235e", "programPlanName": null, "numberOfStudents": 5, "pendingStudents": 2, "items": [{ "regId": "STUD_003", "studentName": "Mohammed Yaseen R", "programPlanName": null, "totalFees": 152000, "totalPaid": 142818.79, "totalPending": 9181.209999999992 }, { "regId": "STUD_001", "studentName": "Adiba Nisar", "programPlanName": null, "totalFees": 146000, "totalPaid": 137181.2, "totalPending": 8818.800000000017 }], "totalFees": 298000, "totalFeesCollected": 279999.99, "totalPending": 18000.01000000001 }, { "programPlanId": "PRGPLN_002", "programPlanName": "BE Mechanical Engg 2020-21", "numberOfStudents": 5, "pendingStudents": 2, "items": [{ "regId": "STUD_002", "studentName": "Abdul Nasar", "programPlanName": "BE Mechanical Engg 2020-21", "totalFees": 125000, "totalPaid": 125000, "totalPending": 0 }], "totalFees": 125000, "totalFeesCollected": 125000, "totalPending": 0 }], "currentPage": null, "perPage": 10, "nextPage": null, "totalRecord": 5, "totalPages": 1 }
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

    removeNull = (a) => {
        return a.split(",").filter(val => val != "" && val != "null" && val != "undefined").join(",")
    }

    onPaginationChange2 = (page, limit, datas) => {
        let data = JSON.parse(datas)
        this.setState({ page: page, limit: limit }, () => {
            // this.onDataCall();
            let current_page = Number(page);
            let perPage = Number(limit);
            let total_pages = Math.ceil(data.length / perPage);
            console.log("total", total_pages)
            current_page = total_pages < current_page ? total_pages : current_page
            // let offset = (current_page - 1) * perPage;
            let lastIndex = current_page * perPage;
            let startIndex = lastIndex - perPage;
            let paginatedItems = data.slice(startIndex, lastIndex)
            // let paginatedData = {
            //     page: current_page,
            //     perPage: perPage,
            //     pre_page: current_page - 1 ? current_page - 1 : null,
            //     next_page: (total_pages > current_page) ? current_page + 1 : null,
            //     total: items.length,
            //     total_pages: total_pages,
            //     data: paginatedItems
            // };
            // return paginatedData
            this.setState({ previewpage: current_page, previewlimit: perPage, previewtotalPages: total_pages, previewtotalRecord: data.length });
            this.setState({ previewTableData: paginatedItems });
        });
        console.log(page, limit, this.state.previewtotalPages);
    };

    showFeePendingPreview = (previewItem, index) => {
        console.log("index", index)
        let previewItemsArray = []
        this.setState({ particularItem: ((Number(this.state.page) - 1) * 10) + Number(index) })
        let preview = previewItem.items && previewItem.items.length > 0 ? previewItem.items : []
        preview.map(item => {
            previewItemsArray.push({
                "REG ID": item.regId,
                "Student Name": item.studentName,
                "Program Plan Name": item.programPlanName,
                "Total Fees": item.totalFees,
                "Total Paid": item.totalPaid,
                "Total Pending": item.totalPending
            })
        })
        let previewArray = [
            {
                "PROGRAM CODE": previewItem['programPlanId'],
                "PROGRAM PLAN NAME": previewItem["programPlanName"],
                "NO. OF STUDENTS": previewItem["numberOfStudents"],
                "PENDING STUDENTS": previewItem["pendingStudents"],
                "TOTAL FEES": previewItem["totalFees"],
                "TOTAL FEES COLLECTED": previewItem["totalFeesCollected"],
                "TOTAL PENDING": previewItem["totalPending"]
            }
        ]
        localStorage.setItem('previewTableData', JSON.stringify(preview))
        let current_page = Number(this.state.previewpage);
        let perPage = Number(this.state.previewlimit);
        let total_pages = Math.ceil(preview.length / perPage);

        current_page = total_pages < current_page ? total_pages : current_page;
        let lastIndex = current_page * perPage;
        let startIndex = lastIndex - perPage;
        let paginatedItems = preview.slice(startIndex, lastIndex)
        this.setState({
            previewStudentTableData: previewArray,
            previewTableData: previewItemsArray,
            previewtotalPages: total_pages,
            previewtotalRecord: preview.length
        }, () => {
            console.log(this.state.previewStudentTableData)
            this.setState({ showTable: false });
        });
    }
    handleBack = () => {
        this.setState({ particularItem: undefined })
        if (this.state.showTable) {
            this.props.history.goBack();
        }
        else {
            this.setState({ showTable: true });
        }
    }
    onDownloadEvent = () => {
        this.setState({ isLoader: true })
        axios.get(`${this.state.env['zqBaseUri']}/edu/reports/feePending?orgId=${this.state.orgId}`, {
            headers: {
                'Authorization': localStorage.getItem("auth_token")
            }
        })
            .then(resp => {
                console.log("fee pending", resp);
                var createXlxsData = []
                var createXlxsDataItem = []
                if (this.state.particularItem == undefined) {

                    resp.data.data.map(item => {
                        createXlxsData.push({
                            "PROGRAM CODE": item.programPlanId,
                            "PROGRAM PLAN NAME": item.programPlanName,
                            "NO. OF STUDENTS": item.numberOfStudents,
                            "PENDING STUDENTS": item.pendingStudents,
                            "TOTAL FEES": item.totalFees,
                            "TOTAL FEES COLLECTED": item.totalFeesCollected,
                            "TOTAL PENDING": item.totalPending
                        })
                        console.log('**DATA**', item)

                    })
                    var ws = xlsx.utils.json_to_sheet(createXlxsData);
                    var wb = xlsx.utils.book_new();
                    xlsx.utils.book_append_sheet(wb, ws, "Fee Pending");
                    xlsx.writeFile(wb, "fee pending.xlsx");
                    //xlsx.writeFile(wb, "fee_pending.csv");
                    this.setState({ isLoader: false })
                } else {
                    var particularData = resp.data.data[this.state.particularItem]
                    createXlxsData.push({
                        "PROGRAM CODE": particularData.programPlanId,
                        "PROGRAM PLAN NAME": particularData.programPlanName,
                        "NO. OF STUDENTS": particularData.numberOfStudents,
                        "PENDING STUDENTS": particularData.pendingStudents,
                        "TOTAL FEES": particularData.totalFees,
                        "TOTAL FEES COLLECTED": particularData.totalFeesCollected,
                        "TOTAL PENDING": particularData.totalPending
                    })
                    particularData.items.map((dataOne, c) => {
                        if (String(dataOne.name).toLowerCase() != "total") {
                            createXlxsDataItem.push({
                                "REG ID": dataOne["regId"],
                                "STUDENT NAME": dataOne["studentName"],
                                "PROGRAM PLAN NAME": dataOne["programPlanName"],
                                "TOTAL FEES": this.formatCurrency(dataOne["totalPaid"]),
                                "TOTAL PAID": this.formatCurrency(dataOne["totalFees"]),
                                "TOTAL PENDING": this.formatCurrency(dataOne["totalPending"])
                            })
                        }
                    })
                    var ws = xlsx.utils.json_to_sheet(createXlxsData);
                    var wsf = xlsx.utils.json_to_sheet(createXlxsDataItem);
                    var wb = xlsx.utils.book_new();
                    xlsx.utils.book_append_sheet(wb, ws, "Fee Pending");
                    xlsx.utils.book_append_sheet(wb, wsf, "Studentwise Fee Pending");
                    xlsx.writeFile(wb, "fee pending.xlsx");
                    //xlsx.writeFile(wb, "fee_pending.csv");
                    this.setState({ isLoader: false })
                }
            })
            .catch(err => {
                console.log(err, 'err0rrrrr')
                this.setState({ isLoader: false })
            })


    }
    render() {
        return (<React.Fragment >
            {this.state.isLoader &&
                <Loader />
            }
            {/* { this.state.demandNoteTable.length > 0 ? <KenTable tableData={this.state.demandNoteTable} onCheckbox={this.onCheckbox} checkBox={true} /> : null} */}
            <div className="reports-student-fees">
                <div className="student-report-header-title">
                    <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBack} />
                    {/* <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.handleBack} style={{ marginRight: 10, cursor: 'pointer' }} /> */}

                    <p className="top-header-title">Report | Fee Pending</p>
                </div>
                <div className="reports-body-section">
                    <React.Fragment>
                        <ContainerNavbar containerNav={this.state.containerNav} onDownload={() => this.onDownloadEvent()} />
                        <div className="print-time">{this.state.printTime}</div>
                    </React.Fragment>
                    <div className="reports-data-print-table">
                        <div className="">
                            {this.state.showTable ?
                                <React.Fragment>
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
                                                    return (<tr key={i + 1} id={i + 1} className="reports-tableRow-body"
                                                        onClick={(e) => { e.preventDefault(); this.showFeePendingPreview(data, i) }}
                                                        style={{ cursor: "pointer" }}>
                                                        {/* <td className="transaction-sno">{data.txnId}</td> */}
                                                        <td className="transaction-vch-num" >{data.programPlanId}</td>
                                                        <td className="transaction-vch-num" >{data.programPlanName}</td>
                                                        <td className="transaction-vch-num" >{data.numberOfStudents}</td>
                                                        <td className="transaction-vch-num" >{data.pendingStudents}</td>
                                                        <td className="transaction-vch-type">{this.formatCurrency(Number(data.totalFees))}</td>
                                                        <td className="transaction-vch-type">{this.formatCurrency(Number(data.totalFeesCollected))}</td>
                                                        <td className="transaction-vch-type">{this.formatCurrency(Number(data.totalPending))}</td>
                                                    </tr>
                                                    )
                                                })}
                                            </tbody> :
                                            <tbody>
                                                <tr>
                                                    {this.state.noData ? <td className="noprog-txt" colSpan={this.state.tableHeader.length}>No data...</td> :
                                                        <td className="noprog-txt" colSpan={this.state.tableHeader.length}>Fetching the data...</td>
                                                    }

                                                </tr>
                                            </tbody>
                                        }
                                    </table>
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
                                </React.Fragment>
                                :
                                <React.Fragment>
                                    <table className="transaction-table-review reports-tableRow-header">
                                        <thead>
                                            <tr>
                                                {Object.keys(this.state.previewStudentTableData[0]).map((data, i) => {
                                                    return <th className={"demand-note " + String(data).replace(' ', '')} key={i + 1}>{data}</th>
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this.state.previewStudentTableData.map((data, i) => {
                                                return (<tr key={i + 1} id={i + 1} className="reports-tableRow-body">
                                                    <td className="transaction-vch-num" >{data["PROGRAM CODE"]}</td>
                                                    <td className="transaction-vch-num" >{data['PROGRAM PLAN NAME']}</td>
                                                    <td className="transaction-vch-num" >{data['NO. OF STUDENTS']}</td>
                                                    <td className="transaction-vch-num" >{data['PENDING STUDENTS']}</td>
                                                    <td className="transaction-vch-type">{this.formatCurrency(Number(data['TOTAL FEES']))}</td>
                                                    <td className="transaction-vch-type">{this.formatCurrency(Number(data['TOTAL FEES COLLECTED']))}</td>
                                                    <td className="transaction-vch-type">{this.formatCurrency(Number(data['TOTAL PENDING']))}</td>
                                                </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                    <p className="statement-of-payment-text">Studentwise Fee Pending</p>
                                    {this.state.previewTableData.length == 0 ?
                                        <p style={{ fontSize: 16, textAlign: 'center', marginTop: 30 }}>No Data</p>
                                        :
                                        <React.Fragment>
                                            <table className="transaction-table-review reports-tableRow-header">
                                                <thead>
                                                    <tr>
                                                        {Object.keys(this.state.previewTableData[0]).map((data, i) => {
                                                            return <th className={"demand-note " + String(data).replace(' ', '')} key={i + 1}>{data}</th>
                                                        })}
                                                    </tr>
                                                </thead>
                                                {this.state.printReportArr.length > 0 ?
                                                    <tbody>
                                                        {this.state.previewTableData.map((data, i) => {
                                                            return (<tr key={i + 1} id={i + 1} className="reports-tableRow-body">
                                                                {/* style={{ cursor: "pointer" }} */}
                                                                <td className="transaction-vch-num" >{data["REG ID"]}</td>
                                                                <td className="transaction-vch-num" >{data["Student Name"]}</td>
                                                                <td className="transaction-vch-num" >{data["Program Plan Name"]}</td>
                                                                <td className="transaction-vch-num" >{this.formatCurrency(Number(data["Total Fees"]))}</td>
                                                                <td className="transaction-vch-type">{this.formatCurrency(Number(data["Total Paid"]))}</td>
                                                                <td className="transaction-vch-type">{this.formatCurrency(Number(data["Total Pending"]))}</td>
                                                            </tr>
                                                            )
                                                        })}
                                                    </tbody> :
                                                    <tbody>
                                                        <tr>
                                                            <td className="noprog-txt" colSpan={this.state.tableHeader.length}>Fetching the data...</td>
                                                        </tr></tbody>}
                                            </table>
                                            <div>
                                                {this.state.previewTableData.length == 0 ? null :
                                                    <PaginationUI
                                                        total={this.state.previewtotalRecord}
                                                        onPaginationApi={this.onPaginationChange2}
                                                        totalPages={this.state.previewtotalPages}
                                                        limit={this.state.previewlimit}
                                                        currentPage={this.state.previewpage}
                                                        allData={localStorage.getItem('previewTableData')}
                                                    />}
                                            </div>
                                        </React.Fragment>
                                    }

                                </React.Fragment>}
                        </div>

                    </div>
                </div>
            </div>

        </React.Fragment >);
    }
}

export default feePendingReport;