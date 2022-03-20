import React, { Component, history, createRef } from 'react';
import { withRouter } from 'react-router-dom';
import { Timeline } from 'rsuite';
import '../scss/change-history.scss';
class ChangeHistory extends Component {
    constructor(props) {
        super(props);
        this.state = {
            prevOpen: false,
            showBtn: false,
            historyData: [],
            historyDataKey: []
        }
        this.anchorRef = React.createRef()
        this.historyRef = React.createRef()
    }
    componentDidMount = () => {
        console.log('props', this.props)
        this.setState({ historyData: this.props.historyData })

    }
    onCloseForm = () => {
        console.log('check')
        this.props.onCloseForm()
    }
    render() {
        return (<React.Fragment>
            <div className="history-wrap" ref={this.historyRef}>
                <div className="history-cont1" style={{ marginTop: "10px" }}>
                    {this.state.historyData.map((item, index) => {
                        return <React.Fragment>
                            <Timeline.Item>
                                <p className="change-history-version">Version {item.version}</p>
                                <p className="change-history-date">{item.updatedAt}</p>
                                {item.description.map((data1) => {
                                    return (
                                        <p className="change-history-content"><span>{data1}</span></p>
                                    )
                                })}
                                <p className="change-history-footer">By: {item.userDetails}</p>
                            </Timeline.Item>
                        </React.Fragment>
                    })}
                </div>

            </div>

        </React.Fragment >)
    }
}
export default withRouter(ChangeHistory);