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
import InstallmentJson from './fees-manager.json';
import axios from "axios";
import moment from 'moment';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Installment from "../../setup/masters/installment/installment";

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
            containerNav: InstallmentJson.containerNav, // installment.json
            studentsFormjson: InstallmentJson.studentsFormjson, // installment.json
            sampleStudentsData: [], // API response(get)
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
            snackbar: { openNotification: false, NotificationMessage: "", status: "success" }
        }
    }
    componentDidMount() {
        this.getTableData()
    }
    getTableData = () => {
        this.setState({ sampleStudentsData: [] })
        axios({
            method: 'get',
            url: `https://apidev.zenqore.com/edu/master/feesManager?orgId=${this.state.orgId}&page=${this.state.page}&limit=${this.state.limit}`,
            headers: {
                'Authorization': this.state.authToken,
            }
        })
            .then(res => {
                console.log(res);
                if (res.data.status == "success") {
                    if (res.data.data.length == 0) {
                        this.setState({ tableResTxt: "No Data" })
                    }
                    else {
                        let studentTableDetails = [];
                        let resp = res.data.data;
                        resp.map((data) => {
                            studentTableDetails.push({
                                "id": data.id,
                                "title": data.title,
                                "description": data.description,
                                "Fees type": data.feeType,
                                "annual amount": Number(data.feeDetails.annualAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                                // "per unit amount": Number(data.feeDetails.perUnitAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
                                "program plan": data.programPlan,
                                "created on": data.createdAt !== "" ? moment(data.createdAt).format('DD/MM/YYYY') : "-",
                                "created by": data.createdBy,
                                "version": data.__v
                            })
                        })
                        this.setState({ sampleStudentsData: studentTableDetails, totalRecord: res.data.totalRecord, totalPages: res.data.totalPages, page: res.data.currentPage })
                    }
                }
            })
            .catch(err => {
                console.log(err);
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
        console.log(e);

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
    render() {
        return (
            <div className="list-of-students-mainDiv">
                {this.state.LoaderStatus == true ? <Loader /> : null}
                {this.state.tabViewForm == false ?
                    <React.Fragment>
                        <div className="trial-balance-header-title">
                            {/* <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBackFun} /> */}
                            <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={() => { this.props.history.goBack() }} style={{ marginRight: 10, cursor: 'pointer' }} />
                            <p className="top-header-title">Configuration</p>
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
                                    /> : null}
                            </div>
                        </div>
                    </React.Fragment> :
                    <React.Fragment>
                        <div className="tab-form-wrapper tab-table">
                            <div className="preview-btns">
                                {this.state.viewHeader == true ?
                                    <div className="preview-header-wrap">
                                        < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.moveBackTable} />
                                        <h6 className="preview-Id-content">Late Fees preview</h6>
                                    </div> :
                                    <div className="preview-header-wrap">
                                        < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.moveBackTable} />
                                        <h6 className="preview-Id-content">New Fees Manager</h6>
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
            </div>
        )
    }
}
export default FeesManager;