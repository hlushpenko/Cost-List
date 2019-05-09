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
mongoClient.connect((err, client) => {
    if (err) throw err;
    app.locals.collection = client.db("mydb").collection("users");
    dbClient = client;
    app.listen(3000, () => {
        console.log("Listening on 3000 port");
    })
});

//Обробляємо http-запит головної сторінки
app.get("/", (req, res) => {
    res.render("home");
})

//Отримуємо список користувачів
app.get("/users", (req, res) => {
    const collection = app.locals.collection;
    collection
        .find()
        .toArray(function(err, users) {
            if (err) throw err;
            res.send(users);
        });
});

//Заносимо нового користувача в базу
app.post("/users", jsonParser, function(req, res) {
    if (!req.body) return res.sendStatus(400);
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const user = {firstName: firstName, lastName: lastName};
    const collection = app.locals.collection;
    collection.insertOne(user, function(err, result) {
        if (err) throw err;
        console.log(result);
        res.send(user);
    })
});

//Отримуємо дані про користувача з бази
app.get("/users/:id", function(req, res){
    const id = new objectId(req.params.id);
    const collection = app.locals.collection;
    collection.findOne({_id: id}, function(err, user){
        if(err) throw err;
        res.send(user);
    });
});

app.put("/users", jsonParser, function(req, res){
    if(!req.body) return res.sendStatus(400);
    const id = new objectId(req.body.id);
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const collection = req.app.locals.collection;
    collection.findOneAndUpdate({_id: id}, { $set: {firstName: firstName, lastName: lastName}},
        {returnOriginal: false },function(err, result){

            if(err) return console.log(err);
            const user = result.value;
            res.send(user);
        });
});

//Видаляємо користувача з бази даних
app.delete("/users/:id", function(req, res) {
    const id = new objectId(req.params.id);
    const collection = app.locals.collection;
    collection.findOneAndDelete({_id: id}, function(err, result){
        if(err) throw err;
        let user = result.value;
        res.send(user);
    });
});



//Метод завершує роботу додатку (функція спрацьовує після завершення)
process.on("SIGINT", () => {
    dbClient.close();
    process.exit();
});


