import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import ZqTable from '../../../utils/Table/table-component';
import Axios from 'axios';
import Button from '@material-ui/core/Button';
import * as xlsx from "xlsx";
import CloseIcon from '@material-ui/icons/Close';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Loader from '../../../utils/loader/loaders';
import { Tooltip, CircularProgress, useTheme } from "@material-ui/core";
import { Alert, Modal } from 'rsuite';
import { instituteDetailsMappings } from "./instituteDetailsMappings";
interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
}
function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}
class StudentDataCenter extends Component {
    constructor(props) {
        super(props)
        this.inputFileRef = React.createRef(null);
        this.state = {
            env: JSON.parse(localStorage.getItem('env')),
            authToken: '',
            tableResponse: "Fetching Data...",
            showUpload: false,
            fileName: "",
            tabData: [],
            showPreview: false,
            studentData: [],
            activeTab: 0,
            activeTabValue: '',
            dense: false,
            loader: false,
            circularLoader: false,
            rowsPerPage: 10,
            page: 0,
            uploadBtn: false,
            finishSetup: false
        }
    }
    componentWillMount() {
        let finishSetup = this.props.finishSetup == undefined ? false : this.props.finishSetup;
        let credentials = this.props.credentials
        this.setState({ finishSetup: finishSetup, credentials: credentials });
    }
    componentDidMount() {
        let authToken = this.state.credentials.authToken
        var headers = {
            'Authorization': localStorage.getItem('auth_token')
        }
        Axios.get(`${this.state.env['zqBaseUri']}/edu/getUploadRecords`, { headers: headers })
            .then(res => {
                if (res.data.status == 'success') {
                    let tabData = [];
                    let data = res.data.data;
                    if (data.length > 0) {
                        data.map(item => {
                            tabData.push({
                                "File Name": item.fileName,
                                "No. of Students": item.totalRecords,
                                "Uploaded Date": this.dateFilter(item['updatedAt']),
                                "Status": "Uploaded",
                                "item": JSON.stringify(item.uidata)
                            })
                        })
                        this.setState({ tabData: tabData });
                    } if (data.length == 0) {
                        this.setState({ tableResponse: 'No data has been uploaded so far...' });
                    }
                }
            }).catch(err => {
                this.setState({ tableResponse: 'No Data' });
            })
    }
    dateFilter = (ev) => {
        var ts = new Date(ev);
        let getDate = `${String(ts.getDate()).length == 1 ? `0${ts.getDate()}` : ts.getDate()}`;
        let getMonth = `${String(ts.getMonth() + 1).length == 1 ? `0${ts.getMonth() + 1}` : ts.getMonth() + 1}`;
        let getYear = `${ts.getFullYear()}`
        let today = `${getDate}/${getMonth}/${getYear}`
        return today
    }
    formatCurrency = (amount) => {
        return (new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount))
    }
    filePathset = (e) => {
        e.stopPropagation();
        e.preventDefault();
        var file = e.target.files[0];
        console.log(file);
        this.setState({ uploadData: file });
        this.readFile(file);
    }
    readFile = (file) => {
        let f = file;
        let name = f.name;
        this.setState({ fileName: name });
        const reader = new FileReader();
        reader.onload = (evt) => {
            const source = evt.target.result;
            const wb = xlsx.read(source, { type: "binary" });
            /* Get all Worksheet */
            let sheetData = {};
            let checkData = wb.SheetNames.findIndex(item => item.toLowerCase().includes("institute details"));
            let instituteDetailIndex;
            if (checkData != -1) {
                instituteDetailIndex = checkData
            } else {
                instituteDetailIndex = wb.SheetNames.findIndex(item => item[0].toLowerCase())
            }
            let instituteDetailItem = wb.SheetNames[instituteDetailIndex];
            wb.SheetNames.splice(instituteDetailIndex, 1);
            //For Rest of the Sheets - Sheet 2 and above
            wb.SheetNames.forEach(item => {
                const ws = wb.Sheets[item];
                const data = xlsx.utils.sheet_to_json(ws, { defval: "-", raw: false });
                sheetData[item] = data;
            })
            console.log("sheetData main", sheetData)
            //For Institute Details - Sheet 1
            let instituteData = wb.Sheets[instituteDetailItem];
            let instituteDetails = {};
            let instituteKeys = Object.keys(instituteData);
            instituteKeys.forEach(item => {
                item = item.toLowerCase();
                if (instituteDetailsMappings[item]) {
                    let valueKey = instituteDetailsMappings[item].value.toUpperCase()
                    if (instituteDetailsMappings[item].parent) {
                        instituteDetails[instituteDetailsMappings[item].parent] = {};
                    }
                }
            })
            instituteKeys.forEach(item => {
                item = item.toLowerCase();
                if (instituteDetailsMappings[item]) {
                    let valueKey = instituteDetailsMappings[item].value.toUpperCase()
                    if (instituteDetailsMappings[item].parent) {
                        instituteDetails[instituteDetailsMappings[item].parent][instituteDetailsMappings[item].key] = {
                            key: instituteData[item.toUpperCase()] ? instituteData[item.toUpperCase()].w : instituteData[item.toUpperCase()],
                            value: instituteData[valueKey] ? instituteData[valueKey].w : instituteData[valueKey]
                        }
                    } else {
                        instituteDetails[instituteDetailsMappings[item].key] = {
                            key: instituteData[item.toUpperCase()] ? instituteData[item.toUpperCase()].w : instituteData[item.toUpperCase()],
                            value: instituteData[valueKey] ? instituteData[valueKey].w : instituteData[valueKey]
                        }
                    }
                }
            })
            console.log("instituteDetails", instituteDetails)
            let uploadPayload = { "Institute Details": instituteDetails, ...sheetData } // Upload Sheet Data - REVIEW DATA -- before confirming upload
            console.log("New Preview", uploadPayload)
            let uploadJSON = JSON.stringify(uploadPayload) // Upload payload JSON STRING
            let previewExcel = { "Institute Details": {}, ...sheetData } // For Review View - UI
            // For 1st Tab - Institute Details
            var firstTableData = []
            console.log(Object.keys(instituteDetails))
            var instObjKey = Object.keys(instituteDetails)
            instObjKey.map(instKey => {
                console.log('instKey', instKey)
                Object.keys(instituteDetails[instKey]).map(insideKey => {
                    console.log('insideKey', insideKey)
                    console.log('keys', instituteDetails[instKey][insideKey])
                    console.log('find', instituteDetails[instKey][insideKey] != undefined ? instituteDetails[instKey][insideKey]['key'] : "N/A")
                    if (instituteDetails[instKey][insideKey] != undefined) {
                        if (insideKey == "dateOfRegistration") {
                            firstTableData.push({
                                ' ': instituteDetails[instKey][insideKey]['key'],
                                '': this.dateFilter(instituteDetails[instKey][insideKey]['value'])
                            })
                        } else {
                            if (insideKey == 'key') {
                                firstTableData.push({
                                    ' ': `${instituteDetails[instKey][insideKey]}addingHead`,
                                    '': `addingHead`
                                })
                            }
                            if (instituteDetails[instKey][insideKey]['key'] != undefined) {
                                firstTableData.push({
                                    ' ': instituteDetails[instKey][insideKey]['key'],
                                    '': instituteDetails[instKey][insideKey]['value']
                                })
                            }
                        }
                    }
                })
            })
            console.log(firstTableData)
            console.log(previewExcel)
            previewExcel['Institute Details'] = firstTableData
            let initTabName = Object.keys(previewExcel)
            this.setState({ studentData: previewExcel });  // SENDING DATA FOR REVIEW TABLE// setTabData(previewExcel);  // SENDING DATA FOR REVIEW TABLE
            // DATA FOR --- UPLOAD API
            let uploadData = {
                apidata: uploadPayload,
                uidata: previewExcel,
                fileName: name
            }
            let stringifyMain = JSON.stringify(uploadData)
            console.log("Check Data", stringifyMain)
            this.uploadReview(stringifyMain);
            this.setState({ uploadAPI: stringifyMain }); // For Upload API i.e. Excel data Converted JSON format; contains: 1. apidata 2. uidata- Upload Button
            console.log("Preview Data", previewExcel);
        };
        reader.readAsBinaryString(f);
    }
    uploadReview = (data) => {
        this.props.uploadReview(data);
    }
    onPreviewData = (data) => {
        let value = JSON.parse(data.item)
        let initTabName = Object.keys(value)
        this.setState({ activeTabValue: initTabName[0], activeTab: 0, page: 0, studentData: value, showPreview: true, loader: true, showUpload: true });
        setTimeout(() => { this.setState({ loader: false }); }, 2000)
    }
    onFinishSetup = () => {
        this.setState({ circularLoader: true });
        let sessionID = this.props.credentials.sessionID;
        var payload = { "sessionId": localStorage.getItem('sessionId') }
        Axios.post(`${this.state.env['zqBaseUri']}/zqedu/logout`, payload)
            .then(res => {
                if (res.data.message == 'session logout') {
                    Alert.success(res.data.message)
                    this.setState({ circularLoader: false });
                    this.props.history.push('/')
                    // this.props.onFinishSetup()
                }
            }).catch(err => {
                console.log(err)
                this.props.history.push('/')
                // this.props.onFinishSetup()
                this.setState({ circularLoader: false });
            })
    }
    handleTabChange = (event, value) => {
        console.log(event.target.textContent, value)
        this.setState({ activeTab: value, activeTabValue: event.target.textContent, page: 0 });
    }
    handleChangePage = (event, newPage) => {
        this.setState({ page: newPage });
    };
    handleChangeRowsPerPage = (event) => {
        this.setState({ rowsPerPage: (parseInt(event.target.value, 10)), page: 0 });
    };
    render() {
        return (
            <React.Fragment>
                {this.state.loader ? <Loader /> : null}
                {this.state.circularLoader ?
                    <div style={{ position: 'absolute', zIndex: 110, top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.8)' }}>
                        <CircularProgress size={24} />
                    </div> : null}
                <div className='student-data-center-main'>
                    {this.state.finishSetup ?
                        <div className='student-data-center-headers' style={{ marginRight: "0px" }}>

                            <Button variant="primary" onClick={this.onFinishSetup} className="confirm-upload-btn" style={{ right: "28px" }}>Finish</Button>
                        </div> :
                        <div className='student-data-center-headers'>
                            {!this.state.showUpload ? <React.Fragment>
                                <div className="upload-json-btn">
                                    <input id='upload' ref={this.inputFileRef} type='file' onChange={this.filePathset} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" hidden />
                                    <label for="upload" className="student-upload-btn" style={{ lineHeight: "24px" }}>Upload File</label>
                                </div>
                                <Button variant="primary" onClick={this.onFinishSetup} className="confirm-upload-btn" style={{ right: "28px" }}>Logout</Button>
                            </React.Fragment>
                                : null}
                            {/* <Button variant="primary" onClick={this.onStudentDetail} className="logout-btn"> Logout </Button> */}
                        </div>}
                    {!this.state.showPreview ?
                        <div className='firstTable'>
                            {this.state.tabData.length != 0 ? <div className="data-center-table"><ZqTable variant='secondary' className="upload-center-table" tableTitle='Upload List Status' data={this.state.tabData} rowClick={(item) => { this.onPreviewData(item) }} /></div> : <p className="noprog-txt">{this.state.tableResponse}</p>}
                        </div> :
                        <div className='preview-table'>
                            <Tabs
                                value={this.state.activeTab}
                                indicatorColor="primary"
                                textColor="primary"
                                onChange={this.handleTabChange}
                                className='preview-tabs'
                            >
                                {Object.keys(this.state.studentData).map((tab, tabIndex) => {
                                    return <Tab label={tab} />
                                })}
                            </Tabs>
                            {Object.keys(this.state.studentData).map((tab, tabIndex) => {
                                return <TabPanel value={this.state.activeTab} index={tabIndex}>
                                    <CloseIcon className="close-preview" onClick={() => this.setState({ showPreview: false, showUpload: false })} />
                                    {tab.length == 0 ? <p className="fetching-data">No data has been uploaded so far...</p> :
                                        <React.Fragment>
                                            <div className="preview-table-main">
                                                <TableContainer className="preview-table-container">
                                                    <Table
                                                        className='table-confirm-upload'
                                                        aria-labelledby="tableTitle"
                                                        size={this.state.dense ? 'small' : 'medium'}
                                                        aria-label="enhanced table">
                                                        <TableHead className="thead-confirm-upload">
                                                            <TableRow className='preview-table-headRow'>
                                                                {Object.keys(this.state.studentData[this.state.activeTabValue][0]).map((key) => {
                                                                    return (<TableCell className='preview-table-headCell'>{key}</TableCell>)
                                                                })}
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody className='tbody-preview'>
                                                            {this.state.studentData[this.state.activeTabValue].slice(this.state.page * this.state.rowsPerPage, ((this.state.page * this.state.rowsPerPage) + this.state.rowsPerPage)).map(data => {
                                                                return <TableRow className='preview-table-bodyRow'>
                                                                    {Object.keys(data).map(data1 => {
                                                                        if (data1.toLowerCase().includes('fees') || data1.toLowerCase().includes('amount') || data1.toLowerCase().includes('paid') || data1.toLowerCase().includes('total fees ') || data1.toLowerCase().includes('fees collected ')) {
                                                                            return (
                                                                                <React.Fragment>
                                                                                    <TableCell className='preview-table-headCellAmt'>{this.formatCurrency(data[data1] == '-' ? 0.00 : data[data1])}</TableCell>
                                                                                </React.Fragment>
                                                                            )
                                                                        }
                                                                        if (data1.toLowerCase().includes('date') || data1.toLowerCase().includes('dob')) {
                                                                            return (
                                                                                <React.Fragment>
                                                                                    <TableCell className='preview-table-headCellDate'>{data[data1] === '-' ? '-' : this.dateFilter(data[data1])}</TableCell>
                                                                                </React.Fragment>
                                                                            )
                                                                        } else {
                                                                            return (
                                                                                <React.Fragment>
                                                                                    <TableCell className={String(data[data1]).includes('addingHead') ? 'preview-table-mainCell' : 'preview-table-bodyCell'}>{String(data[data1] == '' ? '-' : data[data1]).replace('addingHead', '')}</TableCell>
                                                                                </React.Fragment>
                                                                            )
                                                                        }
                                                                    })}
                                                                </TableRow>
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                                <TablePagination
                                                    rowsPerPageOptions={[5, 10, 15]}
                                                    component="div"
                                                    count={this.state.studentData[this.state.activeTabValue].length}
                                                    rowsPerPage={this.state.rowsPerPage}
                                                    page={this.state.page}
                                                    onChangePage={this.handleChangePage}
                                                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                                                />
                                            </div>
                                        </React.Fragment>
                                    }
                                </TabPanel>
                            })}
                        </div>
                    }
                </div>
            </React.Fragment>
        )
    }
}
export default withRouter(StudentDataCenter)