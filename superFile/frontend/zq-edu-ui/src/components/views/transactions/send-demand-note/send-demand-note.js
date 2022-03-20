import React, { Component } from "react";
import '../../../../scss/student.scss';
import '../../../../scss/setup.scss';
import Loader from "../../../../utils/loader/loaders";
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ContainerNavbar from "../../../../gigaLayout/container-navbar";
import ZqTable from "../../../../utils/Table/table-component";
import PaginationUI from "../../../../utils/pagination/pagination";
import ZenTabs from '../../../input/tabs';
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import InstallmentJson from './send-demand-note.json';
import axios from "axios";
import moment from 'moment';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Installment from "../../setup/masters/installment/installment";
import { ButtonGroup, ButtonToolbar, CheckTree, Modal, Drawer, Timeline, TreePicker, Icon } from 'rsuite';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import CircularProgress from '@material-ui/core/CircularProgress';

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}
class FeesManager extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            channel: localStorage.getItem('channel'),
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem("auth_token"),
            orgId: localStorage.getItem('orgId'),
            //emailCommunicationRefIds,
            //orgId: "5fa3a1e7fde9270008a93d65",
            containerNav: InstallmentJson.containerNav, // installment.json
            studentsFormjson: InstallmentJson.studentsFormjson, // installment.json
            sampleStudentsData: [], // API response(get)
            // authToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im11bml5YXJhai5uZWVsYW1lZ2FtQGdtYWlsLmNvbSIsImlkIjoiNWY4NTgyZTA2OGEwMDIwMDA4NmM2Y2YxIiwiaWF0IjoxNjA1NjA0MzgxLCJleHAiOjE2MDU2OTA3ODF9.-zqFGREu0TzFYIfcBRQGSthE3ljX3P2JHwB-Qm5Up9A",
            page: 1,
            limit: 10,
            totalRecord: 0,
            totalPages: 1,
            tabViewForm: false,
            studentName: "",
            tableResTxt: "Fetching Data...",
            viewHeader: true,
            totalApiRes: null,
            viewFormLoad: true,
            LoaderStatus: false,
            feesBreakUpArray: [],
            tableViewMode: "",
            payloadId: "",
            snackbar: { openNotification: false, NotificationMessage: "", status: "success" },
            modelboxDetails: { openNotificationModel: false, modelHeading: '', modelStatus: "", modelBodyContent: '', modelFooterSubBtn: true, modelFooterCancelBtn: true },
            payloadDetails: null
        }
    }
    componentDidMount() {
        this.getTableData()
    }
    getTableData = () => {
        this.setState({ sampleStudentsData: [] })
        axios({
            method: 'get',
            url: `https://apidev.zenqore.com/edu/master/studentFeesMapping?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`,
            headers: {
                // 'client': "ken42",
                'Authorization': this.state.authToken
            }
        })
            .then(res => {
                console.log(res, res.data.data);
                let installmentTableRes = [];
                if (res.data.status == "success" && res !== {}) {
                    res.data.data.map((data) => {
                        installmentTableRes.push({
                            "REG NO": data.studentDetails.regId,
                            "Name": data.studentDetails.firstName + " " + data.studentDetails.lastName,
                            "batch/Class": data.programPlanDetails.description,
                            "Fees Structure": data.feeStructureId,
                            "Annual Amount": Number(data.totalAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                            // "Amount till Date": data["Amount till Date"],
                            "Paid": Number(data.paidAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                            "Pending": data.pendingAmount == null ? "₹0.00" : Number(data.pendingAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                            "Created On": moment(data.feeDetails[0].createdAt).format('DD/MM/YYYY'),
                            "Created By": data.createdBy,
                            // "Version": data.feeDetails[0].__v,
                            "Item": JSON.stringify(data),
                            "action": [{ "name": 'Send demand Note' }, { "name": "Download Statement" }, { "name": "Deactivate" }]
                        })
                    })
                    this.setState({ sampleStudentsData: installmentTableRes, totalApiRes: InstallmentJson.sampleApiRes.data, tabViewForm: false, totalPages: res.data.totalPages, page: res.data.currentPage })
                }
                else {
                    this.setState({ sampleStudentsData: [], tableResTxt: "No Data" })
                }
            })
            .catch(err => {
                console.log(err)
                this.setState({ sampleStudentsData: [], tableResTxt: "Error Loading Data" })
            })
    }
    onAddInstallment = () => {
        this.setState({ tabViewForm: true, viewHeader: false, viewFormLoad: false, tableViewMode: "addnew", tableResTxt: "Fetching Data..." })
    }
    handleBackFun = () => {
        this.props.history.goBack();
        this.resetform()
    }
    onPreviewStudentList = (e) => {
        let details = this.state.globalSearch ? e : JSON.parse(e.Item);
        console.log(e, details);
        this.setState({ tabViewForm: true, studentName: e.ID, viewHeader: true, viewFormLoad: false, tableViewMode: "preview", payloadId: details["_id"] })
        let installmentFormData = InstallmentJson.studentsFormjson;
        installmentFormData['Fees Types'] = [];
        installmentFormData.General.map((task) => {
            if (task['name'] == 'feesStructure') {
                task['defaultValue'] = e.ID
                task['readOnly'] = true
                task['required'] = false
            }
            if (task['name'] == 'name') {
                task['defaultValue'] = e.Name
                task['readOnly'] = true
                task['required'] = false
            }
            if (task['name'] == 'batchClass') {
                task['defaultValue'] = e['batch/Class']
                task['readOnly'] = true
                task['required'] = false
            }
            if (task['name'] == 'feeStructure') {
                task['defaultValue'] = e['Fees Structure']
                task['readOnly'] = true
                task['required'] = false
            }
        })
        details.feeDetails.map((data) => {
            installmentFormData['Fees Types'].push(
                {
                    "type": "heading",
                    "label": data.title,
                    "class": "form-hd new-form-heading",
                    "name": "headingData"
                },
                {
                    "category": "input",
                    "type": "text",
                    "name": "title",
                    "label": "Title",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false,
                    "validation": false,
                    "defaultValue": data.title
                },
                {
                    "category": "input",
                    "type": "text",
                    "name": "displayName",
                    "label": "Display Name",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false,
                    "validation": false,
                    "defaultValue": data.displayName
                },
                {
                    "category": "input",
                    "type": "text",
                    "name": "description",
                    "label": "Description",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false,
                    "validation": false,
                    "defaultValue": data.description
                },
                {
                    "category": "input",
                    "type": "text",
                    "name": "total",
                    "label": "Total Amount",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false,
                    "validation": false,
                    "defaultValue": details.total
                },
                {
                    "category": "input",
                    "type": "text",
                    "name": "paid",
                    "label": "Paid Amount",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false,
                    "validation": false,
                    "defaultValue": details.paid
                },
                {
                    "category": "input",
                    "type": "text",
                    "name": "pending",
                    "label": "Pending Amount",
                    "class": "input-wrap",
                    "readOnly": true,
                    "required": false,
                    "requiredBoolean": false,
                    "clear": false,
                    "validation": false,
                    "defaultValue": details.pending == "" ? 0 : details.pending
                }
            )
        })
    }
    onInputChanges = (value, item, event, dataS) => {
        console.log(value, item, event, dataS);
    }
    onPreviewStudentList1 = (e) => {
        console.log(e);
    }
    onPaginationChange = (page, limit) => {
        this.setState({ page: page, limit: limit }, () => {
            console.log(page, limit);
            this.getTableData()
        });
    };
    moveBackTable = () => {
        this.setState({ tabViewForm: false })
        this.resetform()
    }
    handleTabChange = (tabName, formDatas) => {

    }
    onFormSubmit = (data, item) => {

    }
    closeNotification = () => {
        let snackbarUpdate = { openNotification: false, NotificationMessage: "", status: "" }
        this.setState({ snackbar: snackbarUpdate })
    }
    resetform = () => {
        let installmentFormData = InstallmentJson.studentsFormjson;
        Object.keys(installmentFormData).forEach(tab => {
            installmentFormData[tab].forEach(task => {
                delete task['defaultValue']
                task['readOnly'] = false
                task['error'] = false
                task['required'] = task['requiredBoolean']
                task['validation'] = false
                delete task['clear']
            })
        })
        this.setState({ studentsFormjson: installmentFormData, payloadId: "", status: "" })
    }
    handleActionClick = (item, index, hd, name) => {
        // console.log(item, index, hd, name);
        let a = this.state.modelboxDetails;
        a.openNotificationModel = true;
        a.modelHeading = 'Confirm';
        a.modelBodyContent = 'Are you sure want to send Demand Note?';
        a.modelFooterSubBtn = true;
        a.modelFooterCancelBtn = true;
        a.modelStatus = "";
        this.setState({ modelboxDetails: a })
        let payloadDetails = JSON.parse(item.Item);
        if (name === "Send demand Note") {
            console.log("Demand note", JSON.parse(item.Item));
            const totalAmount = payloadDetails.feeDetails.reduce((a, b) => a + b.annualAmount, 0);
            let payloadData = {
                "displayName": "",
                "transactionType": "",
                "transactionSubType": "",
                "transactionDate": "",
                "studentId": payloadDetails.studentId,
                "studentRegId": payloadDetails.studentDetails.regId,
                "studentName": payloadDetails.studentDetails.firstName + " " + payloadDetails.studentDetails.lastName,
                "class": payloadDetails.programPlanDetails.title,
                "academicYear": payloadDetails.programPlanDetails.academicYear,
                "programPlan": payloadDetails.programPlanDetails.programCode,
                "amount": payloadDetails.pendingAmount,
                "dueDate": payloadDetails.dueDate.dueDate,
                "emailCommunicationRefIds": payloadDetails.guardianDetails[0].email,
                "smsCommunicationRefIds": payloadDetails.guardianDetails[0].mobile,
                "status": "",
                "relatedTransactions": [],
                "data": {
                    "orgId": this.state.orgId,
                    "displayName": "",
                    "studentId": payloadDetails.studentId,
                    "studentRegId": payloadDetails.studentDetails.regId,
                    "class": payloadDetails.programPlanDetails.title,
                    "academicYear": payloadDetails.programPlanDetails.academicYear,
                    "programPlan": payloadDetails.programPlanDetails.displayName,
                    "issueDate": "",
                    "dueDate": "",
                    "feesBreakUp": [
                        {
                            "feeTypeId": payloadDetails.feeDetails[0]._id,
                            "feeTypeCode": payloadDetails.feeDetails[0].displayName,
                            "amount": payloadDetails.feeDetails[0].annualAmount,
                            "feeType": payloadDetails.feeDetails[0].title
                        }
                    ]
                },
                "createdBy": this.state.orgId,
                "studentFeeMapId":payloadDetails.displayName,
            }
            console.log(payloadData);
            this.setState({ payloadDetails: payloadData })
        }
    }
    cancelAddMapModel = () => {
        let a = this.state.modelboxDetails;
        a.openNotificationModel = false;
        a.modelHeading = '';
        a.modelBodyContent = '';
        a.modelFooterSubBtn = false;
        a.modelFooterCancelBtn = false;
        a.modelStatus = "";
        this.setState({ modelboxDetails: a })
    }
    confirmSendDemandNote = () => {
        let a = this.state.modelboxDetails;
        let b = this.state.snackbar;
        a.modelFooterSubBtn = false;
        a.modelStatus = "loading";
        a.modelBodyContent = 'Sending Demand Note';
        this.setState({ modelboxDetails: a })
        let headers = {
            'client': "ken42",
            'Authorization': this.state.authToken
        };
        console.log(this.state.payloadDetails);
        axios.post(`https://apidev.zenqore.com/edu/demandNote`, this.state.payloadDetails, { headers })
            .then(res => {
                console.log(res);
                a.modelHeading = 'Status';
                a.modelBodyContent = 'Demand Note Sent Successfully';
                a.modelFooterSubBtn = false;
                a.modelStatus = "success";
                setTimeout(() => {
                    a.openNotificationModel = false;
                    this.setState({ modelboxDetails: a })
                }, 1000)
                this.setState({ modelboxDetails: a, snackbar: b })
            })
            .catch(err => {
                a.modelHeading = 'Status';
                a.modelBodyContent = 'Failed to send';
                a.modelFooterSubBtn = false;
                a.modelStatus = "error";
                setTimeout(() => {
                    a.openNotificationModel = false;
                    this.setState({ modelboxDetails: a })
                }, 1000)
                this.setState({ modelboxDetails: a, snackbar: b })
                console.log(err);
            })
    }
    render() {
        return (
            <div className="list-of-students-mainDiv">
                {this.state.LoaderStatus == true ? <Loader /> : null}
                {this.state.tabViewForm == false ?
                    <React.Fragment>
                        <div className="trial-balance-header-title">
                            <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBackFun} />
                            <p className="top-header-title">Transactions</p>
                        </div>
                        <div className="masters-body-div">
                            {this.state.containerNav == undefined ? null :
                                <React.Fragment>
                                    <ContainerNavbar containerNav={this.state.containerNav} onAddNew={() => { this.onAddInstallment(); }} />
                                    <div className="print-time">{this.state.printTime}</div>
                                </React.Fragment>}
                            <div className="remove-last-child-table">
                                {this.state.sampleStudentsData.length !== 0 ?
                                    <ZqTable
                                        data={this.state.sampleStudentsData}
                                        rowClick={(item) => { this.onPreviewStudentList(item) }}
                                        onRowCheckBox={(item) => { this.onPreviewStudentList1(item) }}
                                        handleActionClick={(item, index, hd, name) => { this.handleActionClick(item, index, hd, name) }}
                                    />
                                    : <p className="noprog-txt">{this.state.tableResTxt}</p>
                                }
                            </div>
                            <div>
                                {this.state.sampleStudentsData.length !== 0 ?
                                    <PaginationUI
                                        total={this.state.totalRecord}
                                        onPaginationApi={this.onPaginationChange}
                                        totalPages={this.state.totalPages}
                                        limit={this.state.limit}
                                        currentPage={this.state.page}
                                    />
                                    : null}
                            </div>
                        </div>
                    </React.Fragment> :
                    <React.Fragment>
                        <div className="tab-form-wrapper tab-table">
                            <div className="preview-btns">
                                {this.state.viewHeader == true ?
                                    <div className="preview-header-wrap">
                                        < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.moveBackTable} />
                                        <h6 className="preview-Id-content">Send Demand Note Preview</h6>
                                    </div> :
                                    <div className="preview-header-wrap">
                                        < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.moveBackTable} />
                                        <h6 className="preview-Id-content">Add New</h6>
                                    </div>
                                }
                            </div>
                            <div className="organisation-table">
                                {this.state.viewFormLoad === false ?
                                    <ZenTabs tabData={this.state.studentsFormjson} className="preview-wrap" tabEdit={this.state.preview} form={this.state.studentsFormjson} value={0} onInputChanges={this.onInputChanges} onFormBtnEvent={(item) => { this.formBtnHandle(item); }} onTabFormSubmit={this.onFormSubmit} handleTabChange={this.handleTabChange} key={0} />
                                    : <p className="noprog-txt">{this.state.tableResTxt}</p>}
                            </div>
                        </div>
                    </React.Fragment>
                }
                <Snackbar open={this.state.snackbar.openNotification} autoHideDuration={6000} onClose={this.closeNotification}>
                    <Alert onClose={this.closeNotification}
                        severity={this.state.snackbar.status === "success" ? "success" : this.state.snackbar.status === "error" ? "error" : "success"}>
                        {this.state.snackbar.NotificationMessage}
                    </Alert>
                </Snackbar>
                <Modal className="coa-model-box" style={{ top: '16%', borderRadius: '2px' }} onHide={this.cancelAddMapModel} size="xs" show={this.state.modelboxDetails.openNotificationModel}>
                    <Modal.Header> <Modal.Title>{this.state.modelboxDetails.modelHeading}</Modal.Title> </Modal.Header>
                    <Modal.Body className="bodyContent" style={{ paddingBottom: '10px', marginTop: '10px' }}>
                        <div>
                            {this.state.modelboxDetails.modelBodyContent}
                            {this.state.modelboxDetails.modelStatus == "error" ? <span>{<Icon icon='exclamation-triangle' />}</span> : this.state.modelboxDetails.modelStatus == "success" ? <span><CheckCircleIcon className="check-circle" /></span> : this.state.modelboxDetails.modelStatus == "loading" ? <span><CircularProgress className="circular-loader-coa" /></span> : null}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        {this.state.modelboxDetails.modelFooterSubBtn == true ?
                            <React.Fragment>
                                <Button className="process-cancel-button" onClick={this.cancelAddMapModel}>Cancel</Button>
                                <Button className="process-confirm-button" onClick={this.confirmSendDemandNote}>Confirm</Button>
                            </React.Fragment> : null}
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}
export default FeesManager;