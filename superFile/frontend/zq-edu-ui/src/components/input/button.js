import React, { Component } from "react";
import Button from '@material-ui/core/Button';

class ButtonField extends Component {
  constructor() {
    super();
    this.state = {
      inputData: {}
    };
  }
  componentDidMount = () => {
    this.setState({ inputData: this.props.inputData })
  }
  onCancel = (item) => {
    console.log(item)
    this.props.onCancel()
  }
  render() {
    return (
      <React.Fragment>
        {this.state.inputData.type === "submit" ?
          <Button variant="contained" type={this.state.inputData.type} className={this.state.inputData.class}>{this.state.inputData.label}</Button> :
          <Button type={this.state.inputData.type} className={this.state.inputData.class} onClick={() => this.onCancel(this.state.inputData)}>{this.state.inputData.label}</Button>}
      </React.Fragment>

    )
  }
}

export default ButtonField;