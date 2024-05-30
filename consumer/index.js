const express = require("express");
const moment = require("moment/moment");

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4002;

const amqp = require("amqplib");
const { AGENT } = require("../script/agent");
const { MASTER } = require("../script/master");
const { CUSTOMER } = require("../script/customer");
var channel, connection;


connectQueue()
async function connectQueue() {
    connection = await amqp.connect("amqp://admin:admin@43.249.35.14:5672");
    channel = await connection.createChannel()

    connection = await amqp.connect("amqp://admin:admin@43.249.35.14:5672");
    channel = await connection.createChannel()

    await channel.assertQueue("agent", { durable: true })
    await channel.assertQueue("master", { durable: true })
    await channel.assertQueue("customer", { durable: true })

    channel.prefetch(1)


    channel.consume("agent", async data => {

        const content = JSON.parse(Buffer.from(data.content))
        const { id, startDate, endDate } = content
        console.log(id)
        await prisma.queueBot.update({
            where: { id },
            data: { status: 'WAITTING', updatedAt: moment().format() },
        })
        console.log("Data received : ", `${JSON.stringify(content, null, 2)}`);

        const file_name = 'AGENT_' + id + '.xlsx'
        const tutorials = await AGENT(file_name, id, startDate, endDate)

        try {
            if (tutorials.length == 0) {
                throw new Error("No data")
            }
            await prisma.pastAG.createMany({ data: tutorials })
            await prisma.queueBot.update({
                where: { id },
                data: { status: 'SUCCESS', updatedAt: moment().format(), file_name },
            })
        } catch (error) {
            console.log(error)

            await prisma.queueBot.update({
                where: { id },
                data: { status: 'FAILED', updatedAt: moment().format() },
            })
        }

        channel.ack(data, true)
    })



    channel.consume("master", async data => {

        const content = JSON.parse(Buffer.from(data.content))
        const { id, startDate, endDate } = content
        console.log(id)
        await prisma.queueBot.update({
            where: { id },
            data: { status: 'WAITTING', updatedAt: moment().format() },
        })
        const file_name = 'MASTER_' + id + '.xlsx'
        console.log("Data received : ", file_name, `${JSON.stringify(content, null, 2)}`);

        const tutorials = await MASTER(file_name, id, startDate, endDate)

        try {
            await prisma.pastAG.createMany({ data: tutorials })
            await prisma.queueBot.update({
                where: { id },
                data: { status: 'SUCCESS', updatedAt: moment().format(), file_name },
            })
        } catch (error) {
            console.log(error)
            await prisma.queueBot.update({
                where: { id },
                data: { status: 'FAILED', updatedAt: moment().format() },
            })
        }

        channel.ack(data, true)
    })

    channel.consume("customer", async data => {

        const content = JSON.parse(Buffer.from(data.content))
        const { id, startDate, endDate } = content
        console.log(id)
        await prisma.queueBot.update({
            where: { id },
            data: { status: 'WAITTING', updatedAt: moment().format() },
        })
        const file_name = 'CUSTOMER_' + id + '.xlsx'
        console.log("Data received : ", file_name, `${JSON.stringify(content, null, 2)}`);

        const tutorials = await CUSTOMER(file_name, id, startDate, endDate)

        try {
            await prisma.pastAG.createMany({ data: tutorials })
            await prisma.queueBot.update({
                where: { id },
                data: { status: 'SUCCESS', updatedAt: moment().format(), file_name },
            })
            channel.ack(data, true)
        } catch (error) {
            console.log(error)
            await prisma.queueBot.update({
                where: { id },
                data: { status: 'FAILED', updatedAt: moment().format() },
            })
            channel.ack(data, true)
        }

    })
}


app.listen(PORT, () => console.log("Server running at port " + PORT));
