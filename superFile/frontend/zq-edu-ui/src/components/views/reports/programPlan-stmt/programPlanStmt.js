import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import xlsx from 'xlsx';
import Loader from '../../../../utils/loader/loaders';
import KenTable from '../../../../utils/Table/kenTable';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import programPlanStmtResponse from './programPlanStmtResponse';
import '../../../../scss/student-reports.scss';
import ContainerNavbar from "../../../../gigaLayout/container-navbar";
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import moment from 'moment';
import PaginationUI from "../../../../utils/pagination/pagination";
import '../../../../scss/common-table.scss';
class programPlanStmtReport extends Component {
    constructor(props) {
        super(props);
        this.state = {
            demandNoteTable: [],
            env: JSON.parse(localStorage.getItem('env')),
            orgId: localStorage.getItem('orgId'),
            containerNav: {
                isBack: false,
                name: " Program Plan Statement",
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
            tableHeader: ["PROGRAM NAME", "PROGRAM CODE", "PROGRAM FEE", "TOTAL STUDENTS", "TOTAL FEES", "TOTAL FEES COLLECTED", "BALANCE"],
            printReportArr: [],
            showTable: true,
            previewStudentTableData: [],
            previewTableData: [],
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPreviewRecord: 0,
            totalPages: 0,
            previewpage: 1,
            previewlimit: 10,
            previewtotalRecord: 0,
            previewtotalPages: 0,
            noData: false,
            isLoader: false,
            particularItem: undefined
        }
    }
    onPaginationChange = (page, limit, data) => {
        this.setState({ page: page, limit: limit }, () => {
            this.onDataCall();
        });
        console.log(page, limit);
    };
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
    componentDidMount() {
        this.onDataCall();
    }
    onDataCall = () => {
        this.setState({ isLoader: true })
        this.setState({ printReportArr: [] }, () => {
            axios.get(`${this.state.env['zqBaseUri']}/edu/reports/programPlanStatement?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`, {
                headers: {
                    'Authorization': localStorage.getItem("auth_token"),
                    // 'Authorization': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im11bml5YXJhai5uZWVsYW1lZ2FtQGdtYWlsLmNvbSIsImlkIjoiNWY4NTgyZTA2OGEwMDIwMDA4NmM2Y2YxIiwiaWF0IjoxNjA1NTg3OTQ0LCJleHAiOjE2MDU2NzQzNDR9.6UAe_2MRYz2AMSB7OtFurtwdn6pKjkap8RFqpgbDTHI",
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
                    // var respErr = { "status": "success", "message": "programPlanStatement reports", "data": [{ "PROGRAM NAME": "PRGPLN_001", "PROGRAM CODE": "BE_ENG_CSC_20-21", "PROGRAM FEE": 0, "TOTAL STUDENTS": 4, "TOTAL FEES": 145000, "TOTAL FEES COLLECTED": 145000, "BALANCE": 0, "items": [{ "TRANSACTION NO": "DN_2020-21_001", "DEMAND NOTE NO": "DN_2020-21_001", "TRANSACTION DATE": "11/11/2020", "STUDENT NAME": "Adiba Nisar", "PARTICULARS": "Tuition Fee", "DUE AMOUNT": 145000, "PAID AMOUNT": 0, "BALANCE": 145000 }, { "TRANSACTION NO": "RCPT_2020-21_001", "DEMAND NOTE NO": "DN_2020-21_001", "TRANSACTION DATE": "12/11/2020", "STUDENT NAME": "Adiba Nisar", "PARTICULARS": "Tuition Fee", "DUE AMOUNT": 145000, "PAID AMOUNT": 145000, "BALANCE": 0 }] }, { "PROGRAM NAME": "PRGPLN_002", "PROGRAM CODE": "BE_ENG_ME_20-21", "PROGRAM FEE": 0, "TOTAL STUDENTS": 4, "TOTAL FEES": 125000, "TOTAL FEES COLLECTED": 125000, "BALANCE": 0, "items": [{ "TRANSACTION NO": "DN_2020-21_002", "DEMAND NOTE NO": "DN_2020-21_002", "TRANSACTION DATE": "10/11/2020", "STUDENT NAME": "Abdul Nasar", "PARTICULARS": "Tuition Fee", "DUE AMOUNT": 125000, "PAID AMOUNT": 0, "BALANCE": 125000 }, { "TRANSACTION NO": "RCPT_2020-21_002", "DEMAND NOTE NO": "DN_2020-21_002", "TRANSACTION DATE": "11/11/2020", "STUDENT NAME": "Abdul Nasar", "PARTICULARS": "Tuition Fee", "DUE AMOUNT": 125000, "PAID AMOUNT": 125000, "BALANCE": 0 }] }], "currentPage": null, "perPage": 10, "nextPage": null, "totalRecord": 2, "totalPages": 1 }
                    // this.setState({ printReportArr: respErr.data, totalPages: respErr.totalPages, totalRecord: respErr.totalRecord })
                })

        })
    }
    onDownloadEvent = () => {
        this.setState({ isLoader: true })
        axios.get(`${this.state.env['zqBaseUri']}/edu/reports/programPlanStatement?orgId=${this.state.orgId}`, {
            headers: {
                'Authorization': localStorage.getItem("auth_token")
            }
        })
            .then(resp => {
                console.log("student fee", resp);
                var createXlxsData = [];
                var createXlxsDataItem = [];
                if (this.state.particularItem == undefined) {
                    resp.data.data.map(item => {
                        createXlxsData.push({
                            "PROGRAM NAME": item['PROGRAM NAME'],
                            "PROGRAM CODE": item["PROGRAM CODE"],
                            "PROGRAM FEE": this.formatCurrency(item["PROGRAM FEE"]),
                            "TOTAL STUDENTS": item["TOTAL STUDENTS"],
                            "TOTAL FEES": this.formatCurrency(Number(item["TOTAL FEES"])),
                            "TOTAL FEES COLLECTED": this.formatCurrency(Number(item["TOTAL FEES COLLECTED"])),
                            "BALANCE": this.formatCurrency(Number(item["BALANCE"])),
                        })
                        console.log('**DATA**', item)

                    })
                    var ws = xlsx.utils.json_to_sheet(createXlxsData);
                    var wb = xlsx.utils.book_new();
                    xlsx.utils.book_append_sheet(wb, ws, "Program Plan Statement");
                    xlsx.writeFile(wb, "program_plan_statement.xlsx");
                    //xlsx.writeFile(wb, "fee_pending.csv");
                    this.setState({ isLoader: false })
                }
                else {
                    var particularData = resp.data.data[this.state.particularItem];
                    createXlxsData.push({
                        "PROGRAM NAME": particularData['PROGRAM NAME'],
                        "PROGRAM CODE": particularData["PROGRAM CODE"],
                        "PROGRAM FEE": this.formatCurrency(particularData["PROGRAM FEE"]),
                        "TOTAL STUDENTS": particularData["TOTAL STUDENTS"],
                        "TOTAL FEES": this.formatCurrency(Number(particularData["TOTAL FEES"])),
                        "TOTAL FEES COLLECTED": this.formatCurrency(Number(particularData["TOTAL FEES COLLECTED"])),
                        "BALANCE": this.formatCurrency(Number(particularData["BALANCE"])),
                    })
                    particularData.items.map((dataOne, c) => {
                        if (String(dataOne.name).toLowerCase() != "total") {
                            createXlxsDataItem.push({
                                "TRANSACTION NO": dataOne["TRANSACTION NO"],
                                "DEMAND NOTE NO": dataOne["DEMAND NOTE NO"],
                                "TRANSACTION DATE": dataOne["TRANSACTION DATE"],
                                "STUDENT NAME": dataOne["STUDENT NAME"],
                                "PARTICULARS": dataOne["PARTICULARS"],
                                "DUE AMOUNT": this.formatCurrency(Number(dataOne["DUE AMOUNT"])),
                                "PAID AMOUNT": this.formatCurrency(Number(dataOne["PAID AMOUNT"])),
                                "BALANCE": this.formatCurrency(Number(dataOne["BALANCE"]))
                            })
                        }
                    })
                    var ws = xlsx.utils.json_to_sheet(createXlxsData);
                    var wsf = xlsx.utils.json_to_sheet(createXlxsDataItem);
                    var wb = xlsx.utils.book_new();
                    xlsx.utils.book_append_sheet(wb, ws, "Program Plan Statement");
                    xlsx.utils.book_append_sheet(wb, wsf, "Statement of Payment");
                    xlsx.writeFile(wb, "programplan_statement.xlsx");
                    this.setState({ isLoader: false })
                }
                // resp.data.data.map(item => {
                //     console.log('***ITEMS***', item)
                //     if (item.items.length > 0) {
                //         item.items.map((dataOne, c) => {
                //             if (String(dataOne.name).toLowerCase() != "total") {
                //                 createXlxsData.push({
                //                     // "PROGRAM NAME": item['PROGRAM NAME'],
                //                     // "PROGRAM CODE": item["PROGRAM CODE"],
                //                     // "PROGRAM FEE": this.formatCurrency(item["PROGRAM FEE"]),
                //                     // "TOTAL STUDENTS": item["TOTAL STUDENTS"],
                //                     // "TOTAL FEES": this.formatCurrency(Number(item["TOTAL FEES"])),
                //                     // "TOTAL FEES COLLECTED": this.formatCurrency(Number(item["TOTAL FEES COLLECTED"])),
                //                     // "BALANCE": this.formatCurrency(Number(item["BALANCE"])),
                //                     "TRANSACTION NO": dataOne["TRANSACTION NO"],
                //                     "DEMAND NOTE NO": dataOne["DEMAND NOTE NO"],
                //                     "TRANSACTION DATE": dataOne["TRANSACTION DATE"],
                //                     "STUDENT NAME": dataOne["STUDENT NAME"],
                //                     "PARTICULARS": dataOne["PARTICULARS"],
                //                     "DUE AMOUNT": this.formatCurrency(Number(dataOne["DUE AMOUNT"])),
                //                     "PAID AMOUNT": this.formatCurrency(Number(dataOne["PAID AMOUNT"])),
                //                     "BALANCE": this.formatCurrency(Number(dataOne["BALANCE"]))
                //                 })
                //             }
                //         })
                //     } else {
                //         createXlxsData.push({
                //             "PROGRAM NAME": item['PROGRAM NAME'],
                //             "PROGRAM CODE": item["PROGRAM CODE"],
                //             "PROGRAM FEE": item["PROGRAM FEE"],
                //             "TOTAL STUDENTS": item["TOTAL STUDENTS"],
                //             "TOTAL FEES": this.formatCurrency(Number(item["TOTAL FEES"])),
                //             "TOTAL FEES COLLECTED": this.formatCurrency(Number(item["TOTAL FEES COLLECTED"])),
                //             "BALANCE": this.formatCurrency(Number(item["BALANCE"])),
                //             "TRANSACTION NO": "-",
                //             "DEMAND NOTE NO": "-",
                //             "TRANSACTION DATE": "-",
                //             "STUDENT NAME": "-",
                //             "PARTICULARS": "-",
                //             "DUE AMOUNT": "-",
                //             "PAID AMOUNT": "-",
                //             "BALANCE": "-"
                //         })
                //     }
                //     console.log('**DATA**', item)

                // })
                // var ws = xlsx.utils.json_to_sheet(createXlxsData);
                // var wb = xlsx.utils.book_new();
                // xlsx.utils.book_append_sheet(wb, ws, "Program Plan Reports");
                // xlsx.writeFile(wb, "program_plan_reports.xlsx");
                // this.setState({ isLoader: false })
                // // xlsx.writeFile(wb, "demand_note_reports.csv");
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
    showProgramPlanStmtPreview = (previewItem, index) => {
        let preview = previewItem.items && previewItem.items.length > 0 ? previewItem.items : []
        this.setState({ particularItem: ((Number(this.state.page) - 1) * 10) + Number(index) });
        let previewArray = [
            {
                "PROGRAM NAME": previewItem['PROGRAM NAME'],
                "PROGRAM CODE": previewItem["PROGRAM CODE"],
                "PROGRAM FEE": previewItem["PROGRAM FEE"],
                "TOTAL STUDENTS": previewItem["TOTAL STUDENTS"],
                "TOTAL FEES": previewItem["TOTAL FEES"],
                "TOTAL FEES COLLECTED": previewItem["TOTAL FEES COLLECTED"],
                "BALANCE": previewItem["BALANCE"]
            }
        ]
        localStorage.setItem('previewTableData', JSON.stringify(preview))
        let current_page = Number(this.state.previewpage);
        let perPage = Number(this.state.previewlimit);
        let total_pages = Math.ceil(preview.length / perPage);

        current_page = total_pages < current_page ? total_pages : current_page
        // let offset = (current_page - 1) * perPage;
        let lastIndex = current_page * perPage;
        let startIndex = lastIndex - perPage;
        let paginatedItems = preview.slice(startIndex, lastIndex)
        this.setState({
            previewStudentTableData: previewArray,
            previewTableData: preview,
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
    render() {
        return (<React.Fragment >
            {this.state.isLoader && <Loader />}
            {/* { this.state.demandNoteTable.length > 0 ? <KenTable tableData={this.state.demandNoteTable} onCheckbox={this.onCheckbox} checkBox={true} /> : null} */}
            <div className="reports-student-fees">
                <div className="student-report-header-title">
                    <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBack} />
                    {/* <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.handleBack} style={{ marginRight: 10, cursor: 'pointer' }} /> */}
                    <p className="top-header-title">Report | Program Plan Statement</p>
                </div>
                <div className="reports-body-section">
                    <React.Fragment>
                        <ContainerNavbar containerNav={this.state.containerNav} onDownload={() => this.onDownloadEvent()} />
                        <div className="print-time">{this.state.printTime}</div>
                    </React.Fragment>
                    <p className="statement-date-time">Date: {moment().format('DD/MM/YYYY')}</p>
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
                                                        onClick={(e) => { e.preventDefault(); this.showProgramPlanStmtPreview(data, i) }}
                                                        style={{ cursor: "pointer" }}>
                                                        {/* <td className="transaction-sno">{data.txnId}</td> */}
                                                        <td className="transaction-vch-num" >{data["PROGRAM NAME"]}</td>
                                                        <td className="transaction-vch-num" >{data["PROGRAM CODE"]}</td>
                                                        <td className="transaction-vch-type">{this.formatCurrency(Number(data["PROGRAM FEE"]))}</td>
                                                        <td className="transaction-vch-num" >{data["TOTAL STUDENTS"]}</td>
                                                        <td className="transaction-vch-type">{this.formatCurrency(Number(data["TOTAL FEES"]))}</td>
                                                        <td className="transaction-vch-type">{this.formatCurrency(Number(data["TOTAL FEES COLLECTED"]))}</td>
                                                        <td className="transaction-vch-type">{this.formatCurrency(Number(data["BALANCE"]))}</td>
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
                                                    <td className="transaction-vch-num" >{data["PROGRAM NAME"]}</td>
                                                    <td className="transaction-vch-num" >{data["PROGRAM CODE"]}</td>
                                                    <td className="transaction-vch-type">{this.formatCurrency(Number(data["PROGRAM FEE"]))}</td>
                                                    <td className="transaction-vch-num" >{data["TOTAL STUDENTS"]}</td>
                                                    <td className="transaction-vch-type">{this.formatCurrency(Number(data["TOTAL FEES"]))}</td>
                                                    <td className="transaction-vch-type">{this.formatCurrency(Number(data["TOTAL FEES COLLECTED"]))}</td>
                                                    <td className="transaction-vch-type">{this.formatCurrency(Number(data["BALANCE"]))}</td>
                                                </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                    <p className="statement-of-payment-text">Statement of Payment</p>
                                    {this.state.previewTableData.length == 0 ?
                                        <p style={{ fontSize: 16, textAlign: 'center', marginTop: 30 }}>No Statement</p>
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
                                                <tbody>
                                                    {this.state.previewTableData.map((data, i) => {
                                                        return (<tr key={i + 1} id={i + 1} className="reports-tableRow-body">
                                                            {/* style={{ cursor: "pointer" }} */}
                                                            <td className="transaction-vch-num" >{data["TRANSACTION NO"]}</td>
                                                            <td className="transaction-vch-num" >{data["DEMAND NOTE NO"]}</td>
                                                            <td className="transaction-vch-num" >{data["TRANSACTION DATE"]}</td>
                                                            <td className="transaction-vch-num" >{data["STUDENT NAME"]}</td>
                                                            <td className="transaction-vch-num" >{data["PARTICULARS"]}</td>
                                                            <td className="transaction-vch-num" >{this.formatCurrency(Number(data["DUE AMOUNT"]))}</td>
                                                            <td className="transaction-vch-type">{this.formatCurrency(Number(data["PAID AMOUNT"]))}</td>
                                                            <td className="transaction-vch-type">{this.formatCurrency(Number(data["BALANCE"]))}</td>
                                                        </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table> <div>
                                                {this.state.previewTableData.length == 0 ? null :
                                                    <PaginationUI
                                                        total={this.state.previewtotalRecord}
                                                        onPaginationApi={this.onPaginationChange2}
                                                        totalPages={this.state.previewtotalPages}
                                                        limit={this.state.previewlimit}
                                                        currentPage={this.state.previewpage}
                                                        allData={localStorage.getItem('previewTableData')}
                                                    />}
                                            </div> </React.Fragment>}
                                </React.Fragment>}
                        </div>

                    </div>
                </div>
            </div>
        </React.Fragment >);
    }
}

export default programPlanStmtReport;