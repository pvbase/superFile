import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Axios from 'axios';
import Button from '@material-ui/core/Button';
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
import CloseIcon from '@material-ui/icons/Close';
import Loader from '../../../utils/loader/loaders';
import { instituteDetailsMappings } from "./instituteDetailsMappings";
import { Tooltip, CircularProgress, useTheme } from "@material-ui/core";
import { Alert, Modal } from 'rsuite';
let myref = null;
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
class UploadReview extends Component {
    constructor(props) {
        super(props)
        this.state = {
            studentData: [],
            uploadedData: [],
            env: JSON.parse(localStorage.getItem('env')),
            authToken: localStorage.getItem('auth_token'),
            tableResponse: "Fetching Data...",
            rowsPerPage: 10,
            page: 0,
            loader: false,
            activeTab: 0,
            activeTabValue: '',
            fileName: "",
            uploadBtn: false,
            credentials: {}
        }
    }
    componentWillMount() {
        let uploadedData = this.props.uploadedData;
        let credentials = this.props.credentials
        this.setState({ credentials: credentials });
        let parsedData = JSON.parse(uploadedData)
        let studentData = parsedData.uidata;
        let fileName = parsedData.fileName;
        let apidata = parsedData.apidata;
        let stringifyData = {
            apidata: apidata,
            uidata: studentData,
        }
        let uploadData = JSON.stringify(stringifyData)
        console.log(uploadData)
        let initTabName = Object.keys(studentData)
        this.setState({ uploadedData: uploadData, studentData: studentData, activeTabValue: initTabName[0], uploadBtn: true, fileName: fileName });
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
    confirmUpload = () => {
        this.setState({ loader: true });
        var payload = this.state.uploadedData;
        let authToken = this.state.credentials.authToken
        let fd = new FormData();
        const jsonData = new Blob([payload], { type: "application/json" })
        fd.append('file', jsonData)
        var headers = {
            'Authorization': localStorage.getItem('auth_token')
        }
        Axios.post(`${this.state.env['studentUpload']}/edu/uploadMaster?filename=${this.state.fileName}`, fd, { headers: headers })
            .then(res => {
                if (res.data.status == 'success') {
                    Alert.success(res.data.message)
                    this.uploadConfirm()
                    this.setState({ loader: false });
                }
                else { Alert.error(res.data.message) }
            }).catch(err => {
                console.log(err)
                this.goBack();
                Alert.error("Failed to upload data.")
                this.setState({ loader: false });
            })
    }
    uploadConfirm = () => {
        this.props.uploadConfirm();
    }
    goBack = () => {
        this.props.goBack();
    }
    render() {
        return (
            <React.Fragment>
                {this.state.loader ?
                    <div style={{ position: 'absolute', zIndex: 110, top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.8)' }}>
                        <CircularProgress size={24} />
                    </div> : null}
                <div className='migration-main-div migration-body-content-section' style={{ backgroundColor: "transparent" }}>
                    {this.state.uploadBtn ?
                        <div className='student-data-center-headers'>
                            <Button variant="primary" onClick={this.confirmUpload} className="confirm-upload-btn"> Confirm Upload </Button>
                        </div>
                        : null}
                    <div className='preview-table' style={{ top: "18vh" }}>
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
                                <CloseIcon className="close-preview" onClick={this.goBack} />
                                {tab.length == 0 ? <p className="fetching-data">No data has been uploaded so far...</p> :
                                    <React.Fragment>
                                        <div className="preview-table-main">
                                            <TableContainer className="preview-table-container" style={{ top: "0px" }}>
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
                </div>
            </React.Fragment>
        )
    }
}
export default withRouter(UploadReview)