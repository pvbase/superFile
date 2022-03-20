import React, { Component, Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
// import * as router from 'react-router-dom';

import navigation from '../routers/sidenav';
import routes from '../routers/router';
import logo from '../assets/images/logo.png';
import logoIcon from '../assets/images/zq-logo.jpeg';
import logoTxt from '../assets/images/ZQ-text.png';

import GigaHeader from './gigaHeader';
import ReactGA from 'react-ga';
import Aside from './aside';
import '../scss/gigalayout.scss';
import Loader from '../utils/loader/loaders';
import { withStyles } from "@material-ui/core/styles";
import Tooltip from '@material-ui/core/Tooltip';

const ZqTooltip = withStyles((theme) => ({
    tooltip: {
        backgroundColor: '#FFC501',
        color: 'black',
        boxShadow: theme.shadows[1],
        fontSize: 14,
        paddingTop: 6,
        paddingBottom: 6,
        paddingRight: 10,
        paddingLeft: 10
    },
}))(Tooltip);
class GigaLayout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            menuToggle: false,
            asideShow: false,
            isLoader: false,
            overSideNav: false,
            steps: [
                {
                  target: '.my-first-step',
                  content: 'This is my awesome feature!',
                },
                {
                  target: '.my-other-step',
                  content: 'This another awesome feature!',
                },
        
              ]
        }
        this.appRef = React.createRef()
        this.unlisten = null;
    }
    componentDidMount() {
        ReactGA.initialize('UA-166923864-1', {
            debug: false
        });
        this.unlisten = this.props.history.listen(path => {
            ReactGA.set({ page: path.pathname }); // Update the user's current page
            ReactGA.pageview(path.pathname); // Record a pageview for the given page
        })
    }
    componentWillUnmount() {
        if (this.unlisten) this.unlisten();
    }
    loading = () => {
        return <Loader />
    }
    onSideNav = (item, e, child) => {
        this.setState({ overSideNav: true })
        let top = e.currentTarget.offsetTop
        let getNavList = document.querySelectorAll(`.${child}`)
        for (var i = 0; i < getNavList.length; i++) {
            getNavList[i]['classList'] = String(getNavList[i]['classList']).replace('open', '')
        }
        // eslint-disable-next-line
        e.currentTarget.classList = e.currentTarget.classList + ' ' + 'open'

        let sidePanel = document.getElementsByClassName('sub-navbar')
        // eslint-disable-next-line
        for (var i = 0; i < sidePanel.length; i++) {
            if (String(sidePanel[i].parentNode.className).includes('open')) {
                if (String(sidePanel[i].parentNode.className).includes('sec-sidenav-li')) {
                    let setTop = sidePanel[i]['parentNode']['offsetTop']
                    if ((window.innerHeight / 2) < sidePanel[i]['offsetHeight']) {
                        sidePanel[i]['style']["top"] = `${window.innerHeight - (sidePanel[i]['offsetHeight'] + top)}px`
                    } else {
                        sidePanel[i]['style']["top"] = `${setTop - ((sidePanel[i]['offsetHeight'] / 2) - (56 / 2))}px`
                    }
                } else {
                    // if (i === 5) {
                    //     let t = Number(window.innerHeight - sidePanel[i]['offsetHeight']) - Number(top)
                    //     sidePanel[i]['style']["top"] = `${t}px`
                    // } else 
                    if (i === 0) {
                        sidePanel[i]['style']["top"] = `${top}px`
                    } else {
                        sidePanel[i]['style']["top"] = `${top - ((sidePanel[i]['offsetHeight'] / 2) - (56 / 2))}px`
                    }
                }
            }

        }
        if (item.url !== undefined) {
            let redirect = true
            setTimeout(() => {
                this.onResetNavbar('sidenav-li')
                this.onResetNavbar('sec-sidenav-li')
                this.onResetNavbar('third-sidenav-li')
                this.setState({ overSideNav: false })
            });
            routes.map(route => {
                if (item.url === route.path) {
                    redirect = false
                } else {
                    redirect = redirect
                }
            })
            if (redirect) {
                this.props.history.push('/main/coming-soon')
            } else {
                this.props.history.push(item.url)
            }

        }
    }
    onResetNavbar = (nav) => {
        let getNavList = document.querySelectorAll(`.${nav}`)
        for (var i = 0; i < getNavList.length; i++) {
            getNavList[i]['classList'] = String(getNavList[i]['classList']).replace('open', '')
        }
    }
    appendList = (listItem, index, navbarClass) => {
        return <ul className="sub-navbar">
            {listItem.map((child, childIndex) => {
                return <li id={'child' + index + childIndex} key={index + childIndex} className={child.icon === undefined ? `${navbarClass}-sidenav-li with-icon` : `${navbarClass}-sidenav-li without-icon`} onClick={(e) => this.onSideNav(child, e, `${navbarClass}-sidenav-li`)}>
                    {/* <div className="sub-side-nav-icon"><i className={child.icon + ' icon'}></i></div> */}
                    <span>{child.name}</span>
                    {child.children !== undefined ?
                        <React.Fragment>
                            <i className="fa fa-chevron-right side-ind-icon"></i>
                            {this.appendList(child.children, childIndex, 'third')}
                        </React.Fragment> : null}
                </li>
            })}
        </ul>
    }
    //SideNav Expand Collapse
    onMenuToggle = (toggle) => {
        this.setState({ menuToggle: toggle })
        if (toggle) {
            this.appRef.current.className = "app menu-collapse"
        } else {
            this.appRef.current.className = "app"
        }
    }
    onHomeClick = () => {
        this.props.history.push('/main/dashboard')
    }
    onTest = () => {
        console.log('test')
        this.setState({ asideShow: true })
    }
    onResetNavbarWrap = () => {
        setTimeout(() => {
            this.onResetNavbar('sidenav-li')
            this.onResetNavbar('sec-sidenav-li')
            this.onResetNavbar('third-sidenav-li')
            this.setState({ overSideNav: false })
        });
    }
    render() {
        const {steps } = this.state;
        return (<React.Fragment>
            {this.state.isLoader ? <Loader /> : null}
            <div className="app" ref={this.appRef}>
                <div className="sidenav-wrap">
                    <ZqTooltip title='Dashboard' placement='right-end' >
                        <div className="logo-wrap">
                            <img src={this.state.menuToggle ? logoIcon : logoIcon} alt="Zenqore Logo" onClick={this.onHomeClick} />
                            <p>{this.state.menuToggle ? null : <img src={logoTxt} className="zq-txt-wrap" alt="Zenqore Logo" />}</p>
                            <p className="version-type">BETA</p>
                        </div>
                    </ZqTooltip>
                    <div className="sidenav-over-wrap" onClick={this.onResetNavbarWrap} style={{ display: this.state.overSideNav ? "block" : "none" }}></div>
                    {/* SIDENAVBAR CODE */}

                    <ul style={{ paddingTop: '10px' }}>
                        {navigation.items.map((item, index) => {
                            return <li id={'parent' + index} key={index} onClick={(e) => this.onSideNav(item, e, `sidenav-li`)} className={item.icon === undefined ? "sidenav-li with-icon" : "sidenav-li  without-icon"}>
                                <ZqTooltip title={item.title} placement='right' >
                                    <div className="side-nav-icon"><i className={item.icon + ' icon'}></i></div>
                                </ZqTooltip>
                                <span>{item.name}</span>
                                {item.children !== undefined ?
                                    <React.Fragment>
                                        <i className="fa fa-chevron-right side-ind-icon"></i>
                                        {this.appendList(item.children, index, "sec")}
                                    </React.Fragment> : null}</li>
                        })}
                    </ul>
                </div>
                <div className="app-header">
                    <GigaHeader onMenuToggle={this.onMenuToggle} />

                    {/* <button onClick={this.onTest}>TEST</button> */}
                </div>
                {this.state.asideShow ? <Aside asideShow={this.state.asideShow} asideType="history" /> : null}
                <div className="app-container" >
                    <Suspense fallback={this.loading()}>
                        <Switch>
                            {routes.map((route, idx) => {
                                return route.component ? (
                                    <Route
                                        key={idx}
                                        path={route.path}
                                        exact={route.exact}
                                        name={route.name}
                                        render={props => (
                                            <route.component {...props} />
                                        )} />
                                ) : (null);
                            })}
                            <Redirect from="/" to="/main/coming-soon" />
                        </Switch>
                    </Suspense>
                </div>
            </div>
        </React.Fragment>);
    }
}

export default GigaLayout;