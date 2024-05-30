
const _ = require('lodash')
const puppeteer = require('puppeteer')
const excel = require('exceljs')
const moment = require('moment/moment')
require('moment/locale/th')

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()


const user_Check = [
    { username: 'ufruuvip', pass: 'Pp123456++', useCheck: 'ufruu' }
]
const agtest = "http://ag.777beer.com"

const args = [
    '--autoplay-policy=user-gesture-required',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-domain-reliability',
    '--disable-extensions',
    '--disable-features=AudioServiceOutOfProcess',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-offer-store-unmasked-wallet-cards',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-setuid-sandbox',
    '--disable-speech-api',
    '--disable-sync',
    '--hide-scrollbars',
    '--ignore-gpu-blacklist',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--password-store=basic',
    '--use-gl=swiftshader',
    '--use-mock-keychain',
];
const MASTER = (async (file_name, queueBotId, from, to) => {

    const FROM = from ? from : moment().startOf('month').format('MM/DD/YYYY')
    const TO = to ? to : moment().endOf('month').format('MM/DD/YYYY')

    const browser = await puppeteer.launch({ headless: "new", defaultViewport: { width: 1920, height: 5000 }, args });
    const page = await browser.newPage();
    let list = []

    try {
        let element, resultTable, resultAgen;
        for (const [idx, data] of user_Check.entries()) {
            await page.goto(agtest + `/Public/Default11.aspx`, { waitUntil: 'load' })
            element = await page.$x(`//*[@id="txtUserName"]`)
            await element[0].type(data.username);
            element = await page.$x(`//*[@id="txtPassword"]`)
            await element[0].type(data.pass);


            await page.waitForXPath(`//*[@id="btnSignIn"]`, { visible: true })
            element = await page.$x(`//*[@id="btnSignIn"]`)
            await Promise.all([
                element[0].click(),
                page.waitForNavigation({ waitUntil: 'load' })
            ])

            console.log('login สำเร็จ');

            await page.goto(
                agtest + `/_Part_Sub/SubAccsWinLose2.aspx?role=pa&userName=` +
                data.useCheck + `&from=${FROM}&to=${TO}&gId=-1&checkAll=True`,
                {
                    waitUntil: 'load'
                }
            )
            //หามาสเตอร์
            await page.waitForXPath(`//*[@id="SubAccsWinLose_cm1_g"]`, { visible: true });
            resultTable = await page.evaluate(async () => {
                const rows = document.querySelectorAll('#SubAccsWinLose_cm1_g tbody tr');
                return Array.from(rows, row => {
                    const columns = row.querySelectorAll('td');
                    return Array.from(columns, column => column.innerText);
                });
            });
            for (var i = 0; i < resultTable.length; i++) {
                if (resultTable[i][2] !== 'THB' || resultTable[i][0] == 'ufruu00' || resultTable[i][0] == 'ufrcb0' || resultTable[i][0] == 'Total') {
                    resultTable.splice(i, 1)
                }
            }
            resultTable.shift()

            list = [...list, ...resultTable];
        }
        console.log('export excel: success');
        browser.close();

        var re = new RegExp('/', 'g');
        let tutorials = [];
        list.forEach((obj) => {
            tutorials.push({
                Account: obj[0],
                Contact: obj[1],
                Cur: obj[2],
                Amount: parseFloat(obj[3].replace(/,/g, '')),
                ValidAmount: parseFloat(obj[4].replace(/,/g, '')),
                MemberCount: parseFloat(obj[5].replace(/,/g, '')),
                StakeCount: parseFloat(obj[6].replace(/,/g, '')),
                GrossCom: parseFloat(obj[7].replace(/,/g, '')),
                MemberWL: parseFloat(obj[8].replace(/,/g, '')),
                MemberCom: parseFloat(obj[9].replace(/,/g, '')),
                MemberWLCom: parseFloat(obj[10].replace(/,/g, '')),
                SuperProfitValid: parseFloat(obj[11].replace(/,/g, '')),
                SuperProfitWL: parseFloat(obj[12].replace(/,/g, '')),
                SuperProfitCom: parseFloat(obj[13].replace(/,/g, '')),
                SuperProfitWLCom: parseFloat(obj[14].replace(/,/g, '')),
                CompanyValid: parseFloat(obj[15].replace(/,/g, '')),
                CompanyWL: parseFloat(obj[16].replace(/,/g, '')),
                CompanyCom: parseFloat(obj[17].replace(/,/g, '')),
                CompanyWLCom: parseFloat(obj[18].replace(/,/g, '')),
                customerId: '',
                agentId: '',
                masterId: obj[0],
                position: "MASTER",
                queueBotId
            });
        });
        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet(`MASTER`);
        worksheet.columns = [
            { header: "Account", key: "Account", width: 15 },
            { header: "Contact", key: "Contact", width: 15 },
            { header: "Cur", key: "Cur", width: 5 },
            { header: "Amount", key: "Amount", width: 15 },
            { header: "Valid Amount", key: "ValidAmount", width: 15 },
            { header: "Member Count", key: "MemberCount", width: 15 },
            { header: "Stake Count", key: "StakeCount", width: 15 },
            { header: "Gross Comm", key: "GrossCom", width: 15 },
            { header: "Members W/L", key: "MemberWL", width: 15 },
            { header: "Members Com", key: "MemberCom", width: 15 },
            { header: "Members W/L + Com", key: "MemberWLCom", width: 25 },
            { header: "Master/Agent Profit Valid Amount", key: "SuperProfitValid", width: 30 },
            { header: "Master/Agent Profit W/L", key: "SuperProfitWL", width: 30 },
            { header: "Master/Agent Profit Com", key: "SuperProfitCom", width: 30 },
            { header: "Master/Agent Profit W/L + Com", key: "SuperProfitWLCom", width: 30 },
            { header: "Company Profit Valid Amount", key: "CompanyValid", width: 30 },
            { header: "Company Profit W/L", key: "CompanyWL", width: 30 },
            { header: "Company Profit Com", key: "CompanyCom", width: 30 },
            { header: "Company Profit W/L + Com", key: "CompanyWLCom", width: 30 },
        ];
        // Add Array Rows
        worksheet.addRows(tutorials);
        workbook.xlsx.writeFile(`./excel/${file_name}`).then(() => {
            console.log("file saved!" + file_name);
        });
        return tutorials;
    } catch (error) {
        console.log(error);
        await prisma.QueueBot.update({
            where: { id: queueBotId },
            data: { status: 'FAILED', updatedAt: moment().format() },
        })
        return [];
    }
})


exports.MASTER = MASTER;