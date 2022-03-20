import React, { Component } from "react";
import '../../../../../scss/student.scss';
import '../../../../../scss/setup.scss';
import Loader from "../../../../../utils/loader/loaders";
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ContainerNavbar from "../../../../../gigaLayout/container-navbar";
import ZqTable from "../../../../../utils/Table/table-component";
import PaginationUI from "../../../../../utils/pagination/pagination";
import ZenTabs from '../../../../../components/input/tabs';
import KeyboardBackspaceSharpIcon from '@material-ui/icons/KeyboardBackspaceSharp';
import InstallmentJson from './installment.json';
import axios from "axios";
import moment from 'moment';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}
class Installment extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            channel: localStorage.getItem('channel'),
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem("auth_token"),
            orgId: localStorage.getItem('orgId'),
            // authToken:"",
            // orgId:"",
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
        axios({
            method: 'get',
            url: `https://apidev.zenqore.com/edu/master/installments?orgId=${this.state.orgId}&page=1&limit=10`,
            headers: {
                // 'client':"ken42",
                'Authorization': this.state.authToken
            }
        })
            .then(res => {
                let installmentTableRes = [];
                if (res.data.status == "success") {
                    if (res.data.data.length == 0) {
                        this.setState({ tableResTxt: "No Data" })
                    }
                    else {
                        res.data.data.map((data) => {
                            installmentTableRes.push({
                                "ID": data.displayName,
                                "Title": data.title,
                                "Description": data.description,
                                "NOS": data.numberOfInstallments,
                                "Frequency": data.frequency,
                                "Created by": data.createdAt !== "" ? moment(data.createdAt).format('DD/MM/YYYY') : "-",
                                "Version": data.__v,
                                "Item": JSON.stringify(data)
                            })
                        })
                        this.setState({ sampleStudentsData: installmentTableRes, totalApiRes: res.data.data, tabViewForm: false })
                    }
                }
                else {
                    this.setState({ tableResTxt: "Error loading Data" })
                }
            })
            .catch(err => { this.setState({ tableResTxt: "Error loading Data" }) })
    }
    onAddInstallment = () => {
        this.setState({ tabViewForm: true, viewHeader: false, viewFormLoad: true, tableViewMode: "addnew", tableResTxt: "Fetching Data..." }, () => {
            let installmentFormData = InstallmentJson.studentsFormjson;
            axios({
                method: 'get',
                url: `https://apidev.zenqore.com/edu/master/getDisplayId/installments?orgId=${this.state.orgId}`,
                headers: {
                    // 'client':"ken42",
                    'Authorization': this.state.authToken
                }
            })
                .then(res => {
                    this.resetform()
                    console.log(res, res.data.data);
                    Object.keys(installmentFormData).forEach(tab => {
                        installmentFormData[tab].forEach(task => {
                            if (task['name'] == 'id') {
                                task['defaultValue'] = String(res.data.data)
                                task['readOnly'] = true
                            }
                        })
                    })
                    this.setState({ studentsFormjson: installmentFormData, viewFormLoad: false })
                })
                .catch(err => {
                    this.setState({ tableResTxt: "Error loading Data" })
                })
        })
    }
    handleBackFun = () => {
        this.props.history.goBack();
        this.resetform()
    }
    onPreviewStudentList = (e) => {
        let details = this.state.globalSearch ? e : JSON.parse(e.Item)
        let noOfIns, freqData, dueDate;
        let newStudentsFormjson = this.state.studentsFormjson;
        let installmentFormData = InstallmentJson.studentsFormjson;
        this.state.totalApiRes.map((data) => {
            if (data.displayName == e.ID) {
                this.setState({ tabViewForm: true, studentName: e.ID, viewHeader: true, viewFormLoad: true, tableViewMode: "preview", payloadId: details["_id"] })
                Object.keys(installmentFormData).forEach(tab => {
                    installmentFormData[tab].forEach(task => {
                        if (task['name'] == 'id') {
                            task['defaultValue'] = e.ID
                            task['readOnly'] = true
                            task['required'] = false
                        }
                        else if (task['name'] == 'title') {
                            task['defaultValue'] = e.Title
                            task['readOnly'] = false
                            task['required'] = false
                        }
                        else if (task['name'] == 'description') {
                            task['defaultValue'] = e.Description
                            task['readOnly'] = false
                            task['required'] = false
                        }
                        else if (task['name'] == 'noOfInstallments') {
                            task['defaultValue'] = String(e.NOS)
                            task['readOnly'] = false
                            noOfIns = String(e.NOS)
                            task['required'] = false
                        }
                        else if (task['name'] == 'frequencySchedule') {
                            task['defaultValue'] = String(e.Frequency)
                            task['readOnly'] = false
                            freqData = String(e.Frequency)
                            task['required'] = false
                        }
                        else if (task['name'] == 'byDueDate') {
                            task['defaultValue'] = String(data.dueDate)
                            task['readOnly'] = false
                            dueDate = String(data.dueDate)
                            task['required'] = false
                        }
                    })
                })
                this.setState({ studentsFormjson: installmentFormData, LoaderStatus: true }, () => {
                    if (noOfIns == undefined || freqData == undefined || dueDate == undefined) { }
                    else {
                        axios({
                            method: 'get',
                            url: `https://apidev.zenqore.com/edu/master/installments/installmentDueDateCalculation?noOfInst=${noOfIns}&frequency=${freqData}&dueDate=${dueDate}`,
                            headers: {
                                // 'client':"ken42",
                                'Authorization': this.state.authToken
                            }
                        })
                            .then(res => {
                                let newArr = [];
                                res.data.data.map((data) => {
                                    newArr.push(
                                        {
                                            "category": "input",
                                            "type": "text",
                                            "name": "dueOn",
                                            "label": "Due On",
                                            "class": "input-wrap",
                                            "readOnly": true,
                                            "required": false,
                                            "requiredBoolean": false,
                                            "clear": false,
                                            "defaultValue": data.dueDate !== "" ? moment(data.dueDate).format('DD/MM/YYYY') : "-"
                                        },
                                        {
                                            "category": "input",
                                            "type": "text",
                                            "name": "percentage",
                                            "label": "Percentage",
                                            "class": "input-wrap input-wrap-1",
                                            "readOnly": true,
                                            "required": false,
                                            "requiredBoolean": false,
                                            "clear": false,
                                            "defaultValue": String(data.percentage.toFixed(2)) + "%"
                                        }
                                    )
                                })
                                newStudentsFormjson["Payment Breakup"] = newArr;
                                this.setState({ studentsFormjson: newStudentsFormjson, viewFormLoad: false, LoaderStatus: false, feesBreakUpArray: res.data.data })
                            })
                            .catch(err => {
                                let snackbarUpdate = { openNotification: true, NotificationMessage: "Error loading payment Breakup Details", status: "error" };
                                this.setState({ snackbar: snackbarUpdate, viewFormLoad: true, LoaderStatus: false, tableResTxt: "Error loading Data" })
                            })
                    }
                })
            }
            else { }
        })
    }
    onInputChanges = (value, item, event, dataS) => {
        if (dataS == undefined) { }
        else {
            setTimeout(() => {
                let commonName = dataS.name == undefined ? "" : dataS.name;
                let noOfIns, freqData, dueDate;
                let newStudentsFormjson = this.state.studentsFormjson;
                this.setState({ LoaderStatus: true })
                console.log(dataS.defaultValue);
                newStudentsFormjson["General"].map((data) => {
                    if (data.name == "noOfInstallments") {
                        noOfIns = commonName == "noOfInstallments" ? dataS.defaultValue : data.defaultValue
                    }
                })
                newStudentsFormjson["Schedule Details"].map((data) => {
                    if (data.name == "frequencySchedule") {
                        freqData = commonName == "frequencySchedule" ? dataS.defaultValue : data.defaultValue
                    }
                    else if (data.name == "byDueDate") {
                        dueDate = commonName == "byDueDate" ? dataS.defaultValue : data.defaultValue
                    }
                })
                if (dataS.name == "noOfInstallments" || dataS.name == "frequencySchedule" || dataS.name == "byDueDate") {
                    if (commonName == "noOfInstallments") {
                        newStudentsFormjson["General"].map((data) => {
                            if (data.name == "noOfInstallments") {
                                noOfIns = String(dataS.defaultValue)
                            }
                        })
                    }
                    else if (commonName == "frequencySchedule") {
                        newStudentsFormjson["Schedule Details"].map((data) => {
                            if (data.name == "frequencySchedule") {
                                freqData = String(dataS.defaultValue)
                            }
                        })
                    }
                    else if (commonName == "byDueDate") {
                        newStudentsFormjson["Schedule Details"].map((data) => {
                            if (data.name == "byDueDate") {
                                dueDate = String(dataS.defaultValue)
                            }
                        })
                    }
                    setTimeout(() => {
                        axios({
                            method: 'get',
                            url: `https://apidev.zenqore.com/edu/master/installments/installmentDueDateCalculation?noOfInst=${noOfIns}&frequency=${freqData}&dueDate=${dueDate}`,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': this.state.authToken
                            }
                        })
                            .then(res => {
                                console.log(res.data.data);
                                let newArr = [];
                                res.data.data.map((data) => {
                                    newArr.push(
                                        {
                                            "category": "input",
                                            "type": "text",
                                            "name": "dueOn",
                                            "label": "Due On",
                                            "class": "input-wrap",
                                            "readOnly": true,
                                            "required": false,
                                            "requiredBoolean": false,
                                            "clear": false,
                                            "defaultValue": data.dueDate !== "" ? moment(data.dueDate).format('DD/MM/YYYY') : "-"
                                        },
                                        {
                                            "category": "input",
                                            "type": "text",
                                            "name": "percentage",
                                            "label": "Percentage",
                                            "class": "input-wrap input-wrap-1",
                                            "readOnly": true,
                                            "required": false,
                                            "requiredBoolean": false,
                                            "clear": false,
                                            "defaultValue": String(data.percentage.toFixed(2)) + "%"
                                        }
                                    )
                                })
                                newStudentsFormjson["Payment Breakup"] = [];
                                newStudentsFormjson["Payment Breakup"] = newArr;
                                console.log(newArr);
                                this.setState({ studentsFormjson: newStudentsFormjson, LoaderStatus: false, feesBreakUpArray: res.data.data })

                            })
                            .catch(err => { console.log(err) })
                    }, 1000)
                }
                else { }
            }, 300)
        }
    }
    onPreviewStudentList1 = (e) => {
        console.log(e);
    }
    onPaginationChange = (page, limit) => {
        this.setState({ page: page, limit: limit });
        console.log(page, limit);
    };
    moveBackTable = () => {
        this.setState({ tabViewForm: false })
        this.resetform()
    }
    handleTabChange = (tabName, formDatas) => {
        console.log(tabName, formDatas);
        let noOfIns, freqData, dueDate;
        let newStudentsFormjson = this.state.studentsFormjson;
        if (tabName == 2) {
            formDatas["General"].map((data) => {
                if (data.name == "noOfInstallments") {
                    noOfIns = data.defaultValue
                }
            })
            formDatas["Schedule Details"].map((data) => {
                if (data.name == "frequencySchedule") {
                    freqData = data.defaultValue
                }
                else if (data.name == "byDueDate") {
                    dueDate = data.defaultValue
                }
            }, () => {
                this.setState({ studentsFormjson: newStudentsFormjson })
                axios({
                    method: 'get',
                    url: `https://apidev.zenqore.com/edu/master/installments/installmentDueDateCalculation?noOfInst=${noOfIns}&frequency=${freqData}&dueDate=${dueDate}%20Day#/`,
                    headers: {
                        // 'client':"ken42",
                        'Authorization': this.state.authToken
                    }
                })
                    .then(res => {
                        console.log(res.data.data);
                        let newArr = [];
                        res.data.data.map((data) => {
                            newArr.push(
                                {
                                    "category": "input",
                                    "type": "text",
                                    "name": "dueOn",
                                    "label": "Due On",
                                    "class": "input-wrap",
                                    "readOnly": true,
                                    "required": false,
                                    "requiredBoolean": false,
                                    "clear": false,
                                    "defaultValue": String(data.dueDate)
                                },
                                {
                                    "category": "input",
                                    "type": "text",
                                    "name": "percentage",
                                    "label": "Percentage",
                                    "class": "input-wrap input-wrap-1",
                                    "readOnly": true,
                                    "required": false,
                                    "requiredBoolean": false,
                                    "clear": false,
                                    "defaultValue": String(data.percentage)
                                }
                            )
                        })
                        newStudentsFormjson["Payment Breakup"] = newArr;
                        console.log(newArr);
                        this.setState({ studentsFormjson: newStudentsFormjson })

                    })
                    .catch(err => { console.log(err) })
            })
        }
    }
    onFormSubmit = (data, item) => {
        this.setState({ isLoader: true, LoaderStatus: true })
        let generalData = data['General'];
        console.log(data, generalData);
        let scheduleData = data['Schedule Details']
        let defaultValue1 = {}
        generalData.map(item => {
            if (item.name == "id") {
                defaultValue1['id'] = item['defaultValue'];
            }
            if (item.name == 'title') {
                defaultValue1['title'] = item['defaultValue'];
            }
            if (item.name == 'description') {
                defaultValue1['description'] = item['defaultValue'];
            }
            if (item.name == 'noOfInstallments') {
                defaultValue1['noOfInstallments'] = item['defaultValue'];
            }
        })
        scheduleData.map(item => {
            if (item.name == "frequencySchedule") {
                defaultValue1['frequencySchedule'] = item['defaultValue'];
            }
            if (item.name == 'byDueDate') {
                defaultValue1['byDueDate'] = item['defaultValue'];
            }
        })
        let payload = {
            "displayName": defaultValue1['id'],
            "title": defaultValue1['title'],
            "description": defaultValue1['description'],
            "numberOfInstallments": defaultValue1['noOfInstallments'],
            "frequency": defaultValue1['frequencySchedule'],
            "dueDate": defaultValue1['byDueDate'],
            "feesBreakUp": this.state.feesBreakUpArray,
            "createdBy": "5f11b43c8cc9423f9f5a73e9"
        }
        if (this.state.tableViewMode === "preview") {
            console.log("Preview");
            console.log(payload);
            let headers = {
                // 'client':"ken42",
                'Authorization': this.state.authToken
            };
            let bodyData = payload;
            axios.put(`https://apidev.zenqore.com/edu/master/installments?id=${this.state.payloadId}`, bodyData, { headers })
                .then(res => {
                    console.log(res);
                    let snackbarUpdate = { openNotification: true, NotificationMessage: "Updated Successfully", status: "success" }
                    this.setState({ payloadId: "", LoaderStatus: false, snackbar: snackbarUpdate });
                    this.resetform();
                    this.getTableData();
                })
                .catch(err => {
                    console.log(err);
                    let snackbarUpdate = { openNotification: true, NotificationMessage: "Error", status: "error" }
                    this.setState({ payloadId: "", LoaderStatus: false, snackbar: snackbarUpdate });
                })
        }
        else if (this.state.tableViewMode === "addnew") {
            console.log("addnew");
            console.log(payload);
            let headers = {
                'client': "ken42",
                'Authorization': this.state.authToken
            };
            let bodyData = payload;
            axios.post(`https://apidev.zenqore.com/edu/master/installments`, bodyData, { headers })
                .then(res => {
                    console.log(res);
                    let snackbarUpdate = { openNotification: true, NotificationMessage: "Added Successfully", status: "success" }
                    this.setState({ payloadId: "", LoaderStatus: false, snackbar: snackbarUpdate });
                    this.resetform();
                    this.getTableData();
                })
                .catch(err => {
                    console.log(err);
                    let snackbarUpdate = { openNotification: true, NotificationMessage: "Error", status: "error" }
                    this.setState({ payloadId: "", LoaderStatus: false, snackbar: snackbarUpdate });
                })
        }
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
                            <KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={() => { this.props.history.goBack() }} style={{ marginRight: 10, cursor: 'pointer' }} />
                            {/* <ArrowBackIosIcon className="top-header-icon" onClick={this.handleBackFun} /> */}
                            <p className="top-header-title">Masters</p>
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
                                <PaginationUI
                                    total={this.state.totalRecord}
                                    onPaginationApi={this.onPaginationChange}
                                    totalPages={this.state.totalPages}
                                    limit={this.state.limit}
                                    currentPage={this.state.page}
                                />
                            </div>
                        </div>
                    </React.Fragment> :
                    <React.Fragment>
                        <div className="tab-form-wrapper tab-table">
                            <div className="preview-btns">
                                {this.state.viewHeader == true ?
                                    <div className="preview-header-wrap">
                                        < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.moveBackTable} />
                                        <h6 className="preview-Id-content">Installment preview</h6>
                                    </div> :
                                    <div className="preview-header-wrap">
                                        < KeyboardBackspaceSharpIcon className="keyboard-back-icon" onClick={this.moveBackTable} />
                                        <h6 className="preview-Id-content">New Installment</h6>
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
                <Snackbar open={this.state.snackbar.openNotification} autoHideDuration={2500} onClose={this.closeNotification}>
                    <Alert onClose={this.closeNotification}
                        severity={this.state.snackbar.status === "success" ? "success" : this.state.snackbar.status === "error" ? "error" : "success"}>
                        {this.state.snackbar.NotificationMessage}
                    </Alert>
                </Snackbar>
            </div>
        )
    }
}
export default Installment;