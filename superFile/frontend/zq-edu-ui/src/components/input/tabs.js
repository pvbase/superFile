import React, { Component } from "react";
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import '../../scss/tabs.scss';
import ZenForm from './form';
import Button from '@material-ui/core/Button';
import { Alert } from 'rsuite';
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
export default class ZenTabs extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tabData: {},
            activeTab: 0,
            form: false,
            submitCheck: false,
            tabEdit: false,
            clear: false
        }
    }
    componentWillMount = () => {
        console.log('props', this.props)
        this.setState({ tabData: this.props.tabData, form: this.props.form, tabEdit: this.props.tabEdit == undefined ? false : this.props.tabEdit, clear: this.props.clear == undefined ? false : this.props.clear })
    }
    handleChange = (event, value) => {
        console.log(event, value)
        this.setState({ activeTab: value })
        this.props.handleTabChange(value, this.props.form)
    }
    onSubmit = (e) => {
        e.preventDefault();
        let fd = this.state.tabData
        let submitCheck = false
        Object.keys(fd).forEach(item => {
            fd[item].forEach(tab => {
                if (tab.required && tab.requiredBoolean) {
                    if (!tab.validation) {
                        submitCheck = true
                        tab['error'] = true
                        tab['errorMsg'] = `Invalid ${tab.label}`
                    } else {
                        submitCheck = submitCheck
                        tab['error'] = false
                    }
                }
            })
        })
        this.setState({ submitCheck: submitCheck, tabData: fd }, () => {
            if (!this.state.submitCheck) {
                this.props.onTabFormSubmit(this.props.tabData, this.props.form)
            } else {
                Alert.error("Please check your data!")
            }
        })
        // this.props.onSubmit(data, item)
    }
    onInputChanges = (value, item, event, dataS) => {
        console.log(value, item, event, dataS)
        item['defaultValue'] = value
        if (this.props.onInputChanges != undefined) {
            this.props.onInputChanges(value, item, event, dataS)
        }
    }
    onFormBtnEvent = (item) => {
        console.log('check')
        this.props.onFormBtnEvent(item)
    }
    render() {
        return (
            <div className="tab-wrapper">
                <Paper square>
                    <React.Fragment>
                        <Tabs
                            value={this.state.activeTab}
                            indicatorColor="primary"
                            textColor="primary"
                            onChange={this.handleChange}
                        >
                            {Object.keys(this.state.tabData).map((tab, tabIndex) => {
                                return <Tab label={tab} />
                            })}
                        </Tabs>
                        {Object.keys(this.state.tabData).map((tab, tabIndex) => {
                            return <TabPanel value={this.state.activeTab} index={tabIndex}>
                                {this.state.form ? <React.Fragment>
                                    <div className={this.props.preview ? "pre-btn" : "tab-form-btn-wrap "}>
                                        {/* <Button variant="contained" type="clear" className="secondary-btn form-clear-btn" onClick={() => this.onFormBtnEvent('clear')}>Clear</Button> */}
                                        {/* <Button variant="contained" type="cancel" className="secondary-btn form-cancel-btn" onClick={() => this.onFormBtnEvent('cancel')}>Cancel</Button> */}
                                        <Button variant="contained" type="save" className="secondary-btn form-save-btn">Save</Button>
                                        <Button variant="contained" type="submit" className="primary-btn form-submit-btn" onClick={this.onSubmit}>Submit</Button>
                                    </div>
                                    <ZenForm inputData={this.state.tabData[tab]} clear={true} onInputChanges={this.onInputChanges} formClass={this.props.formClass} />
                                </React.Fragment> : <React.Fragment>
                                    </React.Fragment>}
                            </TabPanel>
                        })}
                    </React.Fragment>
                </Paper>
            </div>
        )
    }
}



