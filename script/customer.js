
const _ = require('lodash')
const puppeteer = require('puppeteer')
const excel = require('exceljs')
const fs = require('fs')
const moment = require('moment/moment')
require('moment/locale/th')

const cmd = require('node-cmd');

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { args } = require('../config/args')
const { user_Check } = require('../config/user_check')
const { agtest } = require('../config/ag_link')
const { createWorker } = require('tesseract.js');

const CUSTOMER = (async (file_name, queueBotId, from, to) => {

    const worker = await createWorker('eng');
    await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
    });

    const FROM = from ? from : moment().startOf('month').format('MM/DD/YYYY')
    const TO = to ? to : moment().endOf('month').format('MM/DD/YYYY')

    const browser = await puppeteer.launch({ headless: "new", defaultViewport: { width: 1920, height: 5000 }, args });
    const page = await browser.newPage();
    let list_customer = []
    let list_agent = []
    let list_master = []

    try {
        let element, resultTable, resultAgen;
        for (const [idx, data] of user_Check.entries()) {

            console.log(await page.title());
            await page.goto(agtest + `/Public/Default11.aspx`, { waitUntil: 'load' })
            console.log(await page.title());
            element = await page.$x(`//*[@id="txtUserName"]`)
            await element[0].type(data.username);
            element = await page.$x(`//*[@id="txtPassword"]`)
            await element[0].type(data.pass);
            console.log(await page.title());

            await page.screenshot({
                path: 'screenshot.png',
            })
            console.log('screenshot');

            if (await page.title() === 'UFABET บาคาร่าออนไลน์ - เว็บบาคาร่าที่คนเล่นเยอะที่สุด ในประเทศไทย') {
                await browser.close()
                return CUSTOMER(file_name, queueBotId, from, to)
            }

            const birthday = new Date();
            const date1 = birthday.getTime();
            const pathPhoto = __dirname + '/img/captcha' + date1 + '.png'
            try {
                await page.waitForSelector('#divImgCode > img') // Method to ensure that the element is loaded
            } catch (error) {
                await browser.close()
                return CUSTOMER(file_name, queueBotId, from, to)
            }
            const captcha = await page.$('#divImgCode > img') // captcha is the element you want to capture

            await captcha.screenshot({
                path: pathPhoto
            })
            await sleep(2000)

            const { data: { text } } = await worker.recognize(pathPhoto);
            console.log(text, 'length', text.length);
            await worker.terminate();

            if (text.length !== 5) {
                await browser.close()
                return CUSTOMER(file_name, queueBotId, from, to)
            }

            element = await page.$x(`//*[@id="txtCode"]`)
            console.log('text', text);
            await element[0].type(text)
            fs.unlink(pathPhoto, (err => { return; }));
            await sleep(1000)


            const title = await page.title();
            if (title === ':: Management ::') {
                console.log('login ไม่สำเร็จ');
                await browser.close()
                return CUSTOMER(file_name, queueBotId, from, to)
            }
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
            list_master = [...list_master, ...resultTable];

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
                    list_agent = [...list_agent, ...resultAgen];

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
                        list_customer = [...list_customer, ...resultCustomer];
                    }
                }
                // await sleep(5000)
            }
        }
        console.log('export excel: success');
        browser.close();
        var re = new RegExp('/', 'g');


        let tutorials = [];
        let tutorials_agent = [];
        let tutorials_master = [];

        list_master.forEach((obj) => {
            tutorials_master.push({
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
                position: "MASTER",
                queueBotId
            });
        });

        list_agent.forEach((obj) => {
            tutorials_agent.push({
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
                position: "AGENT",
                queueBotId
            });
        });

        list_customer.forEach((obj) => {
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

        let worksheet_master = workbook.addWorksheet(`MASTER`);
        worksheet_master.columns = [
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
        worksheet_master.addRows(tutorials_master);


        let worksheet_agent = workbook.addWorksheet(`AGENT`);
        worksheet_agent.columns = [
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
        worksheet_agent.addRows(tutorials_agent);

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
        worksheet.addRows(tutorials);
        workbook.xlsx.writeFile(`./excel/${file_name}`).then(() => {
            console.log("file saved! " + file_name);
            cmd.runSync(`scp ./excel/${file_name} root@167.71.220.88:/root/projects/psd-meback-bot/excel/${file_name}`);
        });



        return [...tutorials_master, ...tutorials_agent, ...tutorials];
    } catch (error) {
        console.log(error);

        await page.screenshot({
            path: 'error_screenshot.png',
        })

        await prisma.QueueBot.update({
            where: { id: queueBotId },
            data: { status: 'FAILED', updatedAt: moment().format() },
        })
        return [];
    }
})

function sleep(ms) {

    return new Promise((resolve) => setInterval(resolve, ms));

}
exports.CUSTOMER = CUSTOMER;