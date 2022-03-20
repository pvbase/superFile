import React from "react";
import "../../../scss/privacy-policy.scss";
import Axios from 'axios';
import Loader from "../../../utils/loader/loaders";
import { withRouter } from 'react-router-dom';


class Privacy extends React.Component {
    state = {
        privacyData: [],
        env: JSON.parse(localStorage.getItem('env')),
        isloader: false
    }
    componentDidMount() {
        this.setState({ isloader: true });
        Axios.get(
            `${this.state.env["privacyUri"]}/documents/privacy.json`
        ).then(res => {
            console.log("privacy response", res)
            this.setState({ privacyData: res.data["Data"], isloader: false })
        }).catch(err => {
            console.log(err)
            this.setState({ isloader: false });
        })

    }
    renderPrivacy = (data) => {
        let value = [];
        let i = 0, j = 0.0, k = 0.1, ol;
        data.map((item, index) => {
            switch (item.type) {
                case "title":
                    let h1 = <h1 className="privacy-title">{item.data}</h1>;
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

                case "list":
                    let list = <ul><li className="privacylist">{item.data}</li></ul>
                    value.push(list);
                    break;

                default:
                    break;
            }
        })
        return value;
    }
    render() {
        let { privacyData } = this.state;
        return (
            this.state.isloader ?
                <Loader /> :
                <div className="privacy-container">
                    {this.renderPrivacy(privacyData)}
                </div>
        )
    }
}

export default withRouter(Privacy);