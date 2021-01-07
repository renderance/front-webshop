/*
 * Server side code using the express framework running on a Node.js server.
 *
 * Load the express framework and create an app.
 */
const express = require('express');
const mysql = require('mysql');
const app = express();

/*
 * Host all files in the client folder as static resources.
 * That means: localhost:8080/someFileName.js corresponds to client/someFileName.js.
 */
app.use(express.static('client'));

/*
 * Allow express to understand json serialization.
 */
app.use(express.json());

/*
 * Here I intend to configure the database initially.
 */

let con = mysql.createConnection({
  host: "localhost",
  user: "shop",
  password: "iamshop",
  database: "sogyoadventure"
});
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

/*
 * Here I intend to define all back-end funcitons.
 */

function calcTotals(kids,adults,kidprice,adultprice,reqkids,reqadults,discountpercent){
  console.log("Received call to calcTotals.")
  let originalPrice = Number(kids) * Number(kidprice)
                    + Number(adults) * Number(adultprice);
  let percent = Number(discountpercent)/100;
  let discount = 0;
  if (Number(reqkids) <= Number(kids) && Number(reqadults)  <= Number(adults)) {
    let numdiscounts = Math.min(
      Math.floor(Number(kids)/Number(reqkids)),
      Math.floor(Number(adults)/Number(reqadults))
    )
    discount = numdiscounts * percent *
      (Number(reqkids) * Number(kidprice) + Number(reqadults) * Number(adultprice));
  }
  let endTotal = originalPrice - discount;
  return {'price' : originalPrice, 'discount' : discount, 'total': endTotal};
}

/**
 * A route is like a method call. It has a name, some parameters and some return value.
 *
 * Name: /api/attractions
 * Parameters: the request as made by the browser
 * Return value: the list of attractions defined above as JSON
 *
 * In addition to this, it has a HTTP method: GET, POST, PUT, DELETE
 *
 * Whenever we make a request to our server,
 * the Express framework will call one of the methods defined here.
 * These are just regular functions. You can edit, expand or rewrite the code here as needed.
 */

app.post("/api/calctotals", function (request, response) {
  console.log("Api call received for /calctotals");
  let results = calcTotals(
    request.body['kids'] || 0,
    request.body['adults'] || 0,
    request.body['kidprice'] || 0,
    request.body['adultprice'] || 0,
    request.body['reqkids'] || 0,
    request.body['reqadults'] || 0,
    request.body['discountpercent'] || 0
  )
  response.json(results)
});

app.post("/api/parkdetails", function (request, response){
  console.log("Api call received for /parkdetails");
  let sqlrequest = "SELECT * FROM sogyoadventure.available_tickets WHERE parkname = '"+request.body['parkname']+"'";
  con.query(sqlrequest,(err,result,fields) => {
    if (err) throw err;
    console.log("SQL request successful!");
    response.json(result);
  })
})

app.get("/api/attractions", function (request, response) {
    console.log("Api call received for /attractions");
    let sqlrequest = "SELECT * FROM sogyoadventure.available_tickets";
    con.query(sqlrequest,(err,results,fields) => {
      if(err) throw err;
      console.log("SQL request successful!");
      response.json(results)
    })
});

app.get("/api/orders", function(request, response) {
  console.log("Api call received for /orders");
  let sqlrequest = "SELECT * FROM sogyoadventure.orders";
})

app.post("/api/placeorder", function (request, response) {
    console.log("Api call received for /placeorder");
    let order = request.body;
    for(ticket in order){
      let parkname = ticket;
      let kids = order[ticket]['ticketkid'];
      let adults = order[ticket]['ticketadult'];
      let today = new Date();
      let user = "shop"
      let sqlrequest = "SELECT * FROM sogyoadventure.available_tickets WHERE parkname = '"+ticket+"'";
      con.query(sqlrequest,(err,results,fields) => {
        if (err) throw err;
        let kidprice = Number(results[0]['kid_price']);
        let adultprice = Number(results[0]['adult_price']);
        let reqkids = Number(results[0]['discount_kid_req']);
        let reqadults = Number(results[0]['discount_adult_req']);
        let discountpercent = Number(results[0]['discount_percent']);
        let totals = calcTotals(kids,adults,kidprice,adultprice,reqkids,reqadults,discountpercent);
        let price = totals['price'];
        let discount = totals['discount'];
        let total = totals['total'];
        let sqlquery = "INSERT INTO orders (park,date,username,price,discount,total_amount,kid_tickets,adult_tickets)"
                    + " VALUES ("
                    + "'" + parkname + "'" + ", "
                    + "'" + today.toISOString().slice(0, 19).replace('T', ' ') + "'" +", "
                    + "'" + user +"'" + ", "
                    + price +", "
                    + discount +", "
                    + total +", "
                    + kids +", "
                    + adults +")";
        con.query(sqlquery,(err,results,fields) => {
          if(err) throw err;
          console.log("SQL insert successful!");
        })
      })
      let sqlupdate = "UPDATE sogyoadventure.available_tickets SET available = available -"+Number(kids+adults)+" WHERE parkname = '"+ticket+"'";
      con.query(sqlupdate,(err,results,fields)=> {
        if (err) throw err;
        console.log("SQL update of available tickets successful!");
      })
    }
    response.sendStatus(200);
});

app.get("/api/myorders", function (request, response) {
    console.log("Api call received for /myorders");

    response.sendStatus(200);
});

app.get("/api/admin/edit", function (request, response) {
    console.log("Api call received for /admin/edit");

    response.sendStatus(200);
});


/**
 * Make our webserver available on port 8000.
 * Visit localhost:8000 in any browser to see your site!
 */
app.listen(8000, () => console.log('Example app listening on port 8000!'));
