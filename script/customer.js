
const _ = require('lodash')
const puppeteer = require('puppeteer')
const excel = require('exceljs')
const moment = require('moment/moment')
require('moment/locale/th')

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()


const user_Check = [
    { username: 'ufrcbvip', pass: 'Pp123456++', useCheck: 'ufrcb' }
]
const agtest = "http://ocean.isme99.com"

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
const CUSTOMER = (async (file_name, queueBotId, from, to) => {

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
                // console.log("rows 92 : ", rows);
                return Array.from(rows, row => {
                    const columns = row.querySelectorAll('td');
                    // console.log("columns : ", columns);
                    return Array.from(columns, column => column.innerText);
                });
            });
            for (var i = 0; i < resultTable.length; i++) {
                if (resultTable[i][2] !== 'THB' || resultTable[i][0] == 'ufruu00' || resultTable[i][0] == 'ufrcb0' || resultTable[i][0] == 'Total') {
                    resultTable.splice(i, 1)
                }
            }
            resultTable.shift()

            //หาเอเย่น
            for (var x = 0; x < resultTable.length; x++) {
                if (resultTable[x][1] !== "Top") {

                    await page.goto(
                        agtest + `/_Part_Sub/SubAccsWinLose2.aspx?role=ag&userName=` +
                        resultTable[x][0] + `&from=${FROM}&to=${TO}&userID=` +
                        data.useCheck +
                        `&checkAll=True`,
                        {
                            waitUntil: 'load'
                        }
                    )
                    await page.waitForXPath(`//*[@id="SubAccsWinLose_cm1_g"]`, { visible: true });
                    resultAgen = await page.evaluate(async () => {
                        const rows = document.querySelectorAll('#SubAccsWinLose_cm1_g tbody tr');
                        console.log("rows 92 : ", rows);
                        return Array.from(rows, row => {
                            const columns = row.querySelectorAll('td');
                            // console.log("columns : ", columns);
                            return Array.from(columns, column => column.innerText);
                        });
                    });

                    for (var y = 0; y < resultAgen.length; y++) {
                        if (resultAgen[y][2] !== 'THB') {
                            resultAgen.splice(y, 1)
                        }
                    }
                    resultAgen.shift()

                    for (var z = 0; z < resultAgen.length; z++) {
                        await page.goto(
                            agtest + `/_Part_Sub/SubAccsWinLose2.aspx?role=sa&userName=` +
                            resultAgen[z][0] + `&from=${FROM}&to=${TO}&userID=` +
                            resultTable[x][0] +
                            `&checkAll=True`,
                            {
                                waitUntil: 'load'
                            }
                        )
                        await page.waitForXPath(`//*[@id="SubAccsWinLose_cm1_g"]`, { visible: true });
                        resultCustomer = await page.evaluate(async () => {
                            const rows = document.querySelectorAll('#SubAccsWinLose_cm1_g tbody tr');
                            // console.log("rows 92 : ", rows);
                            return Array.from(rows, row => {
                                const columns = row.querySelectorAll('td');
                                // console.log("columns : ", columns);
                                return Array.from(columns, column => column.innerText);
                            });
                        });
                        for (var a = 0; a < resultCustomer.length; a++) {
                            if (resultCustomer[a][2] !== 'THB') {
                                resultCustomer.splice(a, 1)
                            } else {
                                console.log("167 list : ", a, " agent : ", resultAgen[z][0]);
                                console.log("168 list : ", a, " customer : ", resultCustomer[a][0]);
                            }
                        }
                        resultCustomer.shift()
                        Array.from(resultCustomer, column => column.push(resultAgen[z][0]));
                        Array.from(resultCustomer, column => column.push(resultTable[x][0]));
                        list = [...list, ...resultCustomer];
                    }
                }
            }
        }
        console.log('export excel: success');
        browser.close();
        console.log("list : ", list);
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
                customerId: obj[0],
                agentId: obj[19],
                masterId: obj[20],
                position: "CUSTOMER",
                queueBotId
            });
        });
        let workbook = new excel.Workbook();
        let worksheet = workbook.addWorksheet(`CUSTOMER`);
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
            console.log("file saved! " + file_name);
        });
        return tutorials;
    } catch (error) {
        console.log(error);
        await prisma.QueueBot.update({
            where: { id },
            data: { status: 'FAILED', updatedAt: moment().format() },
        })
        return [];
    }
})


exports.CUSTOMER = CUSTOMER;