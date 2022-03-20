import React, { Component, Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
// import * as router from 'react-router-dom';

import navigation from '../routers/sidenav';
import routes from '../routers/router';
// import logo from '../assets/images/logo.png';
// import logoIcon from '../assets/images/zq-logo.jpeg';
import logoIcon from '../assets/icons/sidenav-zen-logo.svg';
// import logoTxt from '../assets/images/ZQ-text.png';
import logoTxt from '../assets/icons/zq_logo-text.svg';
import rightBurgerSVG from '../assets/icons/right-aligned-burger.svg';
import leftBurgerSVG from '../assets/icons/left-aligned-burger.svg';
// import FolderOutlinedIcon from '@material-ui/icons/FolderOutlined';
// import dashboardIcon from '../assets/icons/dashboard-icon.svg';
// import fileSVG from '../assets/icons/files-icon.svg';

import GigaHeader from './gigaHeader';
import ReactGA from 'react-ga';
import Aside from './aside';
import '../scss/gigalayout.scss';
import Loader from '../utils/loader/loaders';
import { withStyles } from "@material-ui/core/styles";
import Tooltip from '@material-ui/core/Tooltip';

const ZqTooltip = withStyles((theme) => ({
    tooltip: {
        // backgroundColor: 'seagreen',
        // color: 'white',        
        backgroundColor: '#FFC501',
        color: 'black',
        boxShadow: theme.shadows[1],
        fontSize: 14,
        paddingTop: 6,
        paddingBottom: 6,
        paddingRight: 10,
        paddingLeft: 10,
        zIndex: 1111111
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
            leftAligned: true,
            addClass: false,
            steps: [
                {
                    target: '.my-first-step',
                    content: 'This is my awesome feature!',
                },
                {
                    target: '.my-other-step',
                    content: 'This another awesome feature!',
                },
            ],
            currentRoute: ''
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
        let path = this.props.location.pathname
        this.setState({ currentRoute: path, leftAligned: false }, () => {
            this.onMenuToggle(true)
        });
    }
    componentWillUnmount() {
        if (this.unlisten) this.unlisten();
    }
    goToRepository = () => {
        this.props.history.push("/main/filerepository");
    }
    goSupport = () => {
        this.props.history.push("/main/support")
    }
    goTask = () => {
        this.props.history.push("/main/task");
    }
    loading = () => {
        return <Loader />
    }
    onSideNav = (item, e, child) => {
        this.setState({ overSideNav: true, addClass: true })
        // ------------------------
        let top = e.currentTarget.offsetTop
        let offsetwidth = e.currentTarget.offsetWidth

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
                        sidePanel[i]['style']["top"] = '0px'
                    } else {
                        sidePanel[i]['style']["top"] = '0px'
                    }
                } else {
                    if (i === 0) {
                        sidePanel[i]['style']["top"] = '0px'
                    } else {
                        sidePanel[i]['style']["top"] = '0px'
                    }
                }
            }

        }
        let currentUrl = window.location.href.split('#')[1]
        // -------------------
        if (item.url !== undefined) {
            if (item.url == "/main/dashboard") {
                this.setState({ leftAligned: false }, () => {
                    this.onMenuToggle(true)
                });
            }

            let path = String(item.url)
            this.setState({ currentRoute: path });
            let redirect = true
            setTimeout(() => {
                this.onResetNavbar('sidenav-li')
                this.onResetNavbar('sec-sidenav-li')
                this.onResetNavbar('third-sidenav-li')
                this.setState({ overSideNav: false, addClass: false })
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
            }
            else if (item.url === currentUrl) {
                window.location.reload();
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
    appendList = (listItem, headTitle, index, navbarClass, p) => {
        // 
        return <ul className="sub-navbar">
            <p className="sub-navbar-title">{headTitle}</p>
            {listItem.map((child, childIndex) => {
                // let activeClass = child.url && child.url === this.state.currentRoute ? 'active' : ''
                let activeClass = ''
                if (child.children) {
                    child.children.forEach(val => {
                        if (val.url === this.state.currentRoute) activeClass = 'active'
                    });
                }
                else activeClass = child.url && child.url === this.state.currentRoute ? 'active' : ''
                return <li id={'child' + index + childIndex} key={index + childIndex} className={child.icon === undefined ? `${activeClass} ${navbarClass}-sidenav-li with-icon` : `${activeClass} ${navbarClass}-sidenav-li without-icon`} onClick={(e) => this.onSideNav(child, e, `${navbarClass}-sidenav-li`)}>
                    {/* <div className="sub-side-nav-icon"><i className={child.icon + ' icon'}></i></div> */}
                    <span className={navbarClass + '_span'}>{child.name}</span>
                    {child.children !== undefined ?
                        <React.Fragment>
                            <i className="fa fa-chevron-right side-ind-icon"></i>
                            {this.appendList(child.children, child.name, childIndex, 'third')}
                        </React.Fragment> : null}
                </li>
            })}
        </ul>
    }
    //SideNav Expand Collapse
    onMenuToggle = (toggle) => {
        // this.setState({ menuToggle: toggle })
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
        // console.log('test')
        this.setState({ asideShow: true })
    }
    onResetNavbarWrap = () => {
        setTimeout(() => {
            this.onResetNavbar('sidenav-li')
            this.onResetNavbar('sec-sidenav-li')
            this.onResetNavbar('third-sidenav-li')
            this.setState({ overSideNav: false, addClass: false })
        });
    }
    addActiveClass = (element) => {
        if (this.state.currentRoute !== element.url) {
            let checkActive = element.children.find(ele => ele.url === this.state.currentRoute)
            const doesChildExist = element.children.find(ele => ele.children)
            if (doesChildExist && !checkActive) {
                let isActive = false
                element.children.forEach(val => {
                    // if (val.url === this.state.currentRoute) isActive = true
                    val.children && val.children.forEach(childVal => {
                        if (childVal.url === this.state.currentRoute) isActive = true
                    });
                });
                return isActive
            }
            else {
                return checkActive ? true : false
            }
        } else {
            return true
        }
    }
    render() {
        const { steps } = this.state;
        return (<React.Fragment>
            {this.state.isLoader ? <Loader /> : null}
            <div className={`app ${this.state.addClass ? 'add-index' : ''}`}>

                <div className="app" ref={this.appRef}  >

                    <div className="app-header">
                        <div className="sidenav-wrap" style={{ position: 'relative' }}>
                            {/* <ZqTooltip title='Dashboard' placement='bottom' > */}
                            <div className="logo-wrap">
                                <img src={this.state.menuToggle ? logoIcon : logoIcon} alt="Zenqore Logo" onClick={this.onHomeClick} />
                                <p>{this.state.menuToggle ? null : <img src={logoTxt} className="zq-txt-wrap" alt="Zenqore Logo" />}</p>
                            </div>
                            {/* </ZqTooltip> */}
                            <div className="burger-menu-div">
                                {this.state.leftAligned ?
                                    <img src={leftBurgerSVG} onClick={() => { this.setState({ leftAligned: false }, () => this.onMenuToggle(true)); }}></img> :
                                    <img src={rightBurgerSVG} onClick={() => { this.setState({ leftAligned: true }, () => this.onMenuToggle(false)); }} ></img>
                                }
                            </div>
                            <div className="sidenav-over-wrap" onClick={this.onResetNavbarWrap} style={{ display: this.state.overSideNav ? "block" : "none" }}></div>
                            {/* SIDENAVBAR CODE */}
                            <div className="list-ui-sidenav" >
                                <ul style={{
                                    paddingTop: '0px',
                                }}>
                                    {navigation.items.map((item, index) => {
                                        return <li id={'parent' + index} key={index}
                                            onClick={(e) => this.onSideNav(item, e, `sidenav-li`)}
                                            className={this.addActiveClass(item) ? (item.icon === undefined ? "sidenav-li with-icon active" : "sidenav-li  without-icon active") : item.icon === undefined ? "sidenav-li with-icon" : "sidenav-li  without-icon "}>
                                            {/* <ZqTooltip title={item.title} placement='right' className="zqtooltip-position"> */}
                                            <div className="side-nav-icon"><i className={item.icon + ' icon'}></i>
                                                <span className="parent-sidenav-name">{item.name}</span>
                                            </div>
                                            {/* <i className="fa fa-chevron-right side-ind-icon"></i> */}
                                            {/* </ZqTooltip> */}
                                            {item.children !== undefined ?
                                                <React.Fragment>
                                                    <i className="fa fa-chevron-right side-ind-icon"></i>
                                                    {this.appendList(item.children, item.name, index, "sec", this.addActiveClass(item) ? 'active' : '')}
                                                </React.Fragment> : null}
                                        </li>
                                    })}
                                </ul>
                            </div>
                            {/* <GigaHeader /> */}
                            {/* <div className="footer-sidenav">
                                <ZqTooltip title='Files Repository' placement='right' className="zqtooltip-position" >
                                    <div className="files-div" >
                                        <FolderOutlinedIcon onClick={this.goToRepository} style={{ fontSize: '20px' }} />
                                    </div>
                                </ZqTooltip>
                                <ZqTooltip title='Tasks' placement='right' className="zqtooltip-position">
                                    <div className="clipboards-div">
                                        <i className="zq-icon-clipboard" onClick={this.goTask} ></i>
                                    </div>
                                </ZqTooltip>
                                <ZqTooltip title='Support' placement='right' className="zqtooltip-position">
                                    <div className="supportings-icon-div">
                                        <i className="zq-icon-supports" onClick={this.goSupport} ></i>
                                    </div>
                                </ZqTooltip>
                            </div> */}
                        </div>


                        {/* <button onClick={this.onTest}>TEST</button> */}
                    </div>
                    {this.state.asideShow ? <Aside asideShow={this.state.asideShow} asideType="history" /> : null}

                    <div className="app-container" >
                        <GigaHeader />
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
            </div>
        </React.Fragment>);
    }
}

export default GigaLayout;