import React from 'react';
import "../../../scss/terms-of-service.scss";
import Axios from 'axios';
import Loader from "../../../utils/loader/loaders";
import { withRouter } from 'react-router-dom';


class Terms extends React.Component {
    state = {
        termsData: [],
        env: JSON.parse(localStorage.getItem('env')),
        isloader: false
    }
    componentDidMount() {
        this.setState({ isloader: true })
        Axios.get(
            `${this.state.env["termsUri"]}/documents/terms.json`
        ).then(res => {
            console.log("terms response", res)
            this.setState({ termsData: res.data["Data"], isloader: false })
        }).catch(err => {
            console.log(err)
            this.setState({ isloader: true })
        })
    }
    renderTerms = (data) => {
        let value = [];
        let i = 0, j = 0.0, k = 0.1;
        data.map((item) => {
            switch (item.type) {
                case "title":
                    let h1 = <h1 className="terms-title">{item.data}</h1>;
                    value.push(h1);
                    break;

                case "version":
                    let v = <h4 className="version">{item.data}</h4>;
                    value.push(v);
                    break;

                case "section":
                    i++;
                    let h2 = <h2 className="section"><span>{i}{". "}</span>{item.data}</h2>
                    value.push(h2);
                    k = 0.1;
                    break;

                case "sub_section":
                    j = Number(Number((i + k)).toFixed(1));
                    let h3 = <h3 className="sub-section"><span>{j}{". "}</span>{item.data}</h3>
                    value.push(h3);
                    k = k + 0.1;
                    break;

                case "paragraph":
                    let p = <p className="paragraph">{item.data}</p>
                    value.push(p);
                    break;

                default:
                    break;
            }
        })
        return value;
    }
    render() {
        let { termsData } = this.state;
        return (
            this.state.isloader ?
                <Loader /> :
                <div className="termsofservice-container">
                    {this.renderTerms(termsData)}
                </div>
        )
    }
}

export default withRouter(Terms);