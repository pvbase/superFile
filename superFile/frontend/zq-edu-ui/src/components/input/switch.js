import React, { Component } from 'react';
import { withStyles, Theme, createStyles } from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
const AntSwitch = withStyles((theme: Theme) =>
    createStyles({
        root: {
            width: 28,
            height: 16,
            padding: 0,
            display: 'flex',
        },
        switchBase: {
            padding: 2,
            color: theme.palette.grey[500],
            '&$checked': {
                transform: 'translateX(12px)',
                color: theme.palette.common.white,
                '& + $track': {
                    opacity: 1,
                    backgroundColor: "#0052CC",
                    borderColor: theme.palette.primary.main,
                },
            },
        },
        thumb: {
            width: 12,
            height: 12,
            boxShadow: 'none',
        },
        track: {
            border: `1px solid ${theme.palette.grey[500]}`,
            borderRadius: 16 / 2,
            opacity: 1,
            backgroundColor: theme.palette.common.white,
        },
        checked: {},
    }),
)(Switch);
export default class ZenSwitch extends Component {
    constructor() {
        super();
        this.state = {
            checked: true,
            disabled: false,
            inputData: {}
        }
    }
    componentDidMount = () => {
        console.log(this.props)
        this.setState({ checked: this.props.inputData.defaultValue, disabled: this.props.inputData.readOnly, inputData: this.props.inputData })
    }
    handleChange = (e) => {
        this.setState({ checked: !this.state.checked }, () => {
            console.log(this.state.checked)
            this.props.onInputChanges(this.state.checked, this.props.inputData, e)
        })
    }
    render() {
        return (
            <React.Fragment>
                <div className={this.state.inputData.class}>
                    <p className='switch-label'>{this.state.inputData.label}</p>
                    <div className="switch-tab">
                        <span style={{paddingRight:'8px'}}>No</span>
                        <AntSwitch
                            checked={this.state.checked}
                            onChange={(e) => this.handleChange()}
                            name="checked"
                            color="primary"
                            disabled={this.state.disabled}
                        />
                        <span  style={{paddingLeft:'5px'}}>Yes</span>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}