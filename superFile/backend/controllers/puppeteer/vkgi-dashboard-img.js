// const { When, Then, And, Given } = require("@cucumber/cucumber");
// const chai = require("chai")
// const puppeteer = require("puppeteer")
// var { setDefaultTimeout } = require('@cucumber/cucumber');
// setDefaultTimeout(60 * 10000);
// const fs = require('fs')

// var vkgiData = {
//     'url': process.env.vkgiURL,
// }
// const cleanUpUrl = url => {
//     const cleanUrl = url.toLowerCase();
//     if (!cleanUrl.includes("https://") && !cleanUrl.includes("http://")) {
//         return `http://${cleanUrl}`;
//     }
//     return cleanUrl;
// };
// exports.runScript = async (req, res) => {
//     const url = cleanUpUrl(vkgiData.url);
//     const { institute } = req.query
//     if (institute == 'vkgi') {
//         //locators
//         const loginPage = {
//             email: 'input[id="email"]',
//             loginButton: 'button[class="MuiButtonBase-root MuiButton-root MuiButton-contained primary-btn login-btn"]',
//             password: 'input[id="password"]',
//             submitButton: 'button[class="MuiButtonBase-root MuiButton-root MuiButton-contained primary-btn login-btn"]',
//             dashboard: '//div[@class="trial-balance-header-title"]/p',
//             dashboard_div: '//div[@class="new-dashboard-body"]',
//             dashboard_container: '//div[@class="app-container"]'
//         }
//         this.browser = await puppeteer.launch({
//             // headless: false,
//             // devtools: true,
//             args: [
//                 '--disable-infobars',
//                 '--start-maximized',
//             ],
//         })

//         this.page = await this.browser.newPage();
//         // await this.page.setViewport({ width: 1380, height: 754 });
//         await this.page.setViewport({ width: 1500, height: 800 });
//         console.log('1', url)
//         await this.page.goto(url, { waitUntil: 'load', timeout: 0 })
//         await this.page.waitForSelector(loginPage.email)
//         // await this.page.screenshot({ path: "sc1.png" })
//         var emailTextBox = await this.page.$eval('#root > div.login-wrap.figma > div.zenqore-leftside-wrap > div.zenqore-login-container.ken42login > div > form > div.input-wrap.login-input > p', e => e.textContent)
//         chai.expect(emailTextBox).to.equal('Email or Mobile No. *')
//         var loginBtn = await this.page.$eval('#root > div.login-wrap.figma > div.zenqore-leftside-wrap > div.zenqore-login-container.ken42login > div > form > button', elements => elements.innerText)
//         chai.expect(loginBtn).to.equal('LOGIN')
//         await this.page.evaluate(() => {
//             localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZmMuYWRtaW4udmtnaS5hbGxAemVucW9yZS5jb20iLCJVc2VySWQiOiI2MDViMDkzYzFjMzQ1ODQ5MzVmOWU0ZGEiLCJpbnN0aXR1dGUiOiJWS0dJIiwib3JnSWQiOiI1ZmE4ZGFlY2UzZWIxZjE4ZDQyNTBlOTgiLCJyb2xlIjoiQWRtaW4iLCJhY2NvdW50U3RhdHVzIjoiQWN0aXZlIiwiaWF0IjoxNjIzNzI5Mzk2fQ.zI9sSx8C6M5nLi-CXwEVicpEkF74rIS6xpxoUOG7gGg');
//             localStorage.setItem('orgId', '5fa8daece3eb1f18d4250e98');
//             localStorage.setItem('channel', 'fc.admin.vkgi.all@zenqore.com');
//             localStorage.setItem('role', 'Admin');
//         });
//         console.log('2', url + `main/dashboard`)
//         await this.page.goto(`${url}main/dashboard`, { waitUntil: 'load', timeout: 0 })
//         let dashboardBody = await this.page.waitForXPath(loginPage.dashboard_div, { waitUntil: 'load', timeout: 0 })

//         await this.page.waitForTimeout(2000)
//         await this.page.evaluate(() => {
//             document.getElementsByClassName('app-container')[0].style.height = "auto"
//             document.getElementsByClassName('new-dashboard-body')[0].style.padding = "20px"
//             document.getElementsByClassName('trial-balance-header-title')[0].style.display = "none"
//             document.getElementsByClassName('app-header-container')[0].style.display = "none"
//             document.getElementsByClassName('summary-content-Body')[0].style.width = "100%"
//             document.getElementsByClassName('summary-content-Body')[1].style.width = "100%"
//             document.getElementsByClassName('summary-content-Body')[2].style.width = "100%"
//             document.getElementsByClassName('dashboard-left-block1')[0].style.height = '135px'
//             document.getElementsByClassName('dashboard-left-block2')[0].style.height = '250px'

//             document.getElementsByClassName('dashboard-left-block3')[0].style.height = '420px'
//             document.getElementsByClassName('dashboard-left-block4')[0].style.height = '330px'
//             document.getElementsByClassName('dashboard-right-block1')[0].style.height = '280px'

//             document.getElementsByClassName('dashboard-right-block2A-box1')[0].style.height = '250px'
//             document.getElementsByClassName('dashboard-right-block2A-box2')[0].style.height = '265px'
//             document.getElementsByClassName('dashboard-right-block2A-box3')[0].style.height = '195px'
//             document.getElementsByClassName('dashboard-right-block2A-box4')[0].style.height = '140px'
//             document.getElementsByClassName('categories-content-box')[0].style.height = '55px'
//             document.getElementsByClassName('categories-content-box')[1].style.height = '55px'
//             document.getElementsByClassName('categories-content-box')[2].style.height = '55px'
//             document.getElementsByClassName('categories-content-box')[3].style.height = '55px'
//             document.getElementsByClassName('categories-content-box')[4].style.height = '55px'
//             document.getElementsByClassName('categories-content-box')[5].style.height = '55px'
//             document.getElementsByClassName('dashboard-right-block2B')[0].style.height = '885px'
//         })
//         await this.page.waitForTimeout(2000)
//         await dashboardBody.screenshot({
//             path: 'element.png'
//         })
//         const image = 'data:image/png;base64,' + base64Encode('element.png');
//         await this.page.goto(image, { waitUntil: 'networkidle0' });

//         await this.page.pdf({
//             path: 'dashboard.pdf',
//             format: 'A4',
//             border: '0',
//             header: {
//                 height: '0mm',
//             },
//             footer: {
//                 height: '0mm',
//             },
//             margin: {
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 bottom: 0
//             },
//             width: '100%',
//             pageRanges: '1',
//             landscape: true
//             // scale:
//         })
//         const base64Data = fs.readFileSync('dashboard.pdf')
//         console.log('Dashboard Screenshot taken and got the base64 data')
//         var pdfBuffer = Buffer.from(base64Data, 'base64');
//         fs.unlink('dashboard.pdf', () => { console.log('pdf deleted succesfully') })
//         fs.unlink('element.png', () => { console.log('Image deleted succesfully') })
//         res.send({
//             message: 'success',
//             file: pdfBuffer
//         });
//     }
// }
// function base64Encode(file) {
//     var bitmap = fs.readFileSync(file);
//     return new Buffer.from(bitmap).toString('base64');
// }
