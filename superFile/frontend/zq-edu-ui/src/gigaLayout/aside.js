import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
// import ChangeHistory from './change-history'

import '../scss/aside.scss';
class Aside extends Component {
    constructor(props) {
        super(props);
        this.state = {
            asideShow: false,
            asideType: 'history'
        }
    }

    componentDidMount = () => {
        this.setState({
            asideShow: this.props.asideShow,
            asideType: this.props.asideType
        })
    }

    render() {
        return (<React.Fragment>
            {this.state.asideShow ?
                <div className="aside-nav-wrap">
                    <div className="aside-container" style={{ "right": this.state.asideShow ? "0px" : "-100%" }}>
                        {/* {this.state.asideType == 'history' ?
                            < ChangeHistory /> : null
                        } */}
                    </div>
                </div> : null
            }
        </React.Fragment >)
    }
}
export default withRouter(Aside);