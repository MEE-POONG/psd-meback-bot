const express = require("express");
const moment = require("moment/moment");
const path = require('path');
const fs = require('fs');
var cors = require('cors')

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const directoryPath = path.join(__dirname, '../excel');

const app = express();
app.use(cors())
const PORT = process.env.PORT || 6661;

app.use(express.json());

const amqp = require("amqplib");
var channel, connection;


async function connectQueue() {
    try {

        connection = await amqp.connect("amqp://admin:admin@43.249.35.14:5672");
        channel = await connection.createChannel()

        // connect to 'test-queue', create one if doesnot exist already
        await channel.assertQueue("test-queue")
        await channel.assertQueue("agent")
        await channel.assertQueue("master")

    } catch (error) {
        console.log(error)
    }
}

const sendData = async (data, queue) => {
    try {
        await connectQueue();
        // send data to queue
        await channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));

        // close the channel and connection
        await channel.close();
        await connection.close();

    } catch (error) {
        console.log(error)
    }
}

app.get("/list", async (req, res) => {

    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        res.status(200).json(files)
    });

})

app.get("/file/:id", async (req, res) => {

    try {
        const file = path.join(__dirname, '../excel/' + req.params.id);
        console.log(file);
        res.download(file); // Set disposition and send it.
    } catch (error) {
        console.error(error.message);
        res.status(400).send("failed to download file");
    }

})

app.get("/send-msg", async (req, res) => {
    const queue = 'test-queue';
    const data = {
        title: "Six of Crows",
        author: "Leigh Burdugo"
    }

    sendData(data, queue);

    console.log("A message is sent to queue")
    res.send("Message Sent");

})

app.post("/agent", async (req, res) => {
    try {
        const queue = 'agent'
        const data = {
            title: req.body.title || "AGENT",
            username: req.body.username || 'ADMIN',
            position: req.body.position || 'ADMIN',
            startDate: req.body.startDate ? moment(req.body.startDate).format('MM/DD/YYYY') : '',
            endDate: req.body.endDate ? moment(req.body.endDate).format('MM/DD/YYYY') : '',
            createdAt: moment().format(),
            updatedAt: moment().format(),
            status: 'WAIT',
        }

        const queue_bot = await prisma.QueueBot.create({
            data: data,
        })
        sendData(queue_bot, queue);
        console.log("A message is sent to queue", queue_bot)
        res.send("Start Agent " + moment().format('MMMM Do YYYY, h:mm:ss a'));
    } catch (error) {
        res.status(400).send("Error Master " + moment().format('MMMM Do YYYY, h:mm:ss a') + '\n' + error);
    }
})

app.post("/master", async (req, res) => {
    try {
        const queue = 'master'
        const data = {
            title: req.body.title || "MASTER",
            username: req.body.username || '',
            position: req.body.position || '',
            startDate: req.body.startDate ? moment(req.body.startDate).format('MM/DD/YYYY') : '',
            endDate: req.body.endDate ? moment(req.body.endDate).format('MM/DD/YYYY') : '',
            createdAt: moment().format(),
            updatedAt: moment().format(),
            status: 'WAIT',
        }

        const queue_bot = await prisma.QueueBot.create({
            data: data,
        })
        sendData(queue_bot, queue);
        console.log("A message is sent to queue", queue_bot)
        res.send("Start Master " + moment().format('MMMM Do YYYY, h:mm:ss a'));
    } catch (error) {
        res.status(400).send("Error Master " + moment().format('MMMM Do YYYY, h:mm:ss a') + '\n' + error);
    }
})

app.post("/customer", async (req, res) => {
    try {
        const queue = 'customer'
        const data = {
            title: req.body.title || "CUSTOMER",
            username: req.body.username || '',
            position: req.body.position || '',
            startDate: req.body.startDate ? moment(req.body.startDate).format('MM/DD/YYYY') : '',
            endDate: req.body.endDate ? moment(req.body.endDate).format('MM/DD/YYYY') : '',
            createdAt: moment().format(),
            updatedAt: moment().format(),
            status: 'WAIT',
        }

        const queue_bot = await prisma.QueueBot.create({
            data: data,
        })
        sendData(queue_bot, queue);
        console.log("A message is sent to queue", queue_bot)
        res.send("Start Customer " + moment().format('MMMM Do YYYY, h:mm:ss a'));
    } catch (error) {
        res.status(400).send("Error Customer " + moment().format('MMMM Do YYYY, h:mm:ss a') + '\n' + error);
    }
})


app.listen(PORT, () => console.log("Server running at port " + PORT));
