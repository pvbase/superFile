import React, { Component } from 'react';
import LinearProgress from '@material-ui/core/LinearProgress';
import "../../scss/loader.scss";
class Loader extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        return (<React.Fragment>
            <div className="loader-wrap">
                <LinearProgress />
            </div>
        </React.Fragment>);
    }
}

export default Loader;