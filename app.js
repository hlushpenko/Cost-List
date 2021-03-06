const express = require("express");
const hbs = require("hbs");
const mongodb = require("mongodb");
const mongoClient = new mongodb.MongoClient("mongodb://localhost:27017/",{useNewUrlParser: true});
const objectId = mongodb.ObjectID;


let app = express();
const jsonParser = express.json();
let dbClient;

//Визначаємо рушій по замовчуванню для HTML
app.set("view engine", "hbs");

//Здійснюємо підключення
mongoClient.connect(mongoClientConnect);

function mongoClientConnect(err, client) {
    if (err) throw err;
    app.locals.collection = client.db("mydb").collection("costs");
    dbClient = client;
    app.listen(3000, () => {
        console.log("Listening on 3000 port");
    })
}

//Обробляємо http-запит головної сторінки
app.get("/", (req, res) => res.render("home"));

//Отримуємо список користувачів
app.get("/costs", (req, res) => {
    const collection = app.locals.collection;
    collection
        .find()
        .toArray(function(err, costs) {
            if (err) throw err;
            res.send(costs);
        });
});

//Заносимо нову транзакцію в базу
app.post("/costs", jsonParser, function(req, res) {
    if (!req.body) return res.sendStatus(400);
    const costName = req.body.costName;
    const costDescription = req.body.costDescription;
    const costSum = parseInt(req.body.costSum);
    const costDate = req.body.costDate;
    const costCategory = req.body.costCategory;
    const cost =
        {costName: costName, costDescription: costDescription, costSum: costSum,
            costDate: costDate, costCategory: costCategory};

    const collection = app.locals.collection;
    collection.insertOne(cost, function(err, result) {
        if (err) throw err;
        console.log(result);
        res.send(cost);
    })
});

//Отримуємо дані про витрати з бази
app.get("/costs/:id", function(req, res){
    const id = new objectId(req.params.id);
    const collection = app.locals.collection;
    collection.findOne({_id: id}, function(err, cost){
        if(err) throw err;
        res.send(cost);
    });
});

app.put("/costs", jsonParser, function(req, res){
    if(!req.body) return res.sendStatus(400);
    const id = new objectId(req.body.id);
    const costName = req.body.costName;
    const costDescription = req.body.costDescription;
    const costDate = req.body.costDate;
    const costCategory = req.body.costCategory;
    const costSum = parseInt(req.body.costSum);
    const collection = req.app.locals.collection;
    collection.findOneAndUpdate({_id: id}, { $set:
                {costName: costName, costDescription: costDescription, costCategory: costCategory,
                    costSum: costSum, costDate:costDate}},
        {returnOriginal: false },function(err, result){
            if(err) return console.log(err);
            const cost = result.value;
            res.send(cost);
        });
});

//Видаляємо запис з бази даних
app.delete("/costs/:id", function(req, res) {
    const id = new objectId(req.params.id);
    const collection = app.locals.collection;
    collection.findOneAndDelete({_id: id}, function(err, result){
        if(err) throw err;
        let cost = result.value;
        res.send(cost);
    });
});



//Метод завершує роботу додатку (функція спрацьовує після завершення)
process.on("SIGINT", () => {
    dbClient.close();
    process.exit();
});


