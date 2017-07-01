// Create connection to database
const config = {
  user: 'themnem', // update me
  password: 'demoPass0', // update me
  database: 'themnem-db',
  server: 'themnem-serv1.database.windows.net', // update me
  options: {
    encrypt: true,
    rowCollectionOnRequestCompletion: true,
    database: 'themnem-db' //update me
  }
}
// const sql = require('mssql/msnodesqlv8')
const sql = require('mssql')

var pool = null;

var lookupCard = (context, pool, cardNum) => {
  // var query = "select * from cards where cardNumber = '" + cardNum + "'";
  // var query = "select * from cards"
  var query = "select amount,date from purchases p " +
      "inner join cards c " +
      "on p.card_id = c.card_id " +
      "where c.cardNumber = '" + cardNum + "'";


  var req = new sql.Request(pool);
  
  req.query(query, (err, result) => {
    if (err) {
      context.log("got err doing query")
      context.log(err)

      context.res = {
        status: 500,
        body: err
      }

      context.done()
    }
  
    context.log('done with request')
    context.log(result)
    context.log(result.rowsAffected[0])

    if (!result || !result.rowsAffected) {
      context.res = {
        status: 500,
        body: "weird result"
      }

      context.done();
    } else if (result.rowsAffected[0] === 0) {
      context.res = {
        status: 404,
        body: `Couldn't find card number ${cardNum}` //'
      }

      context.done()
    } else if (result.rowsAffected[0] >= 1) {
      context.res = {
        status: 200,
        body: result.recordset
      }

      context.done()
    } else {
      context.res = {
        status: 500,
        body: "fell through conditions"
      }

      context.done()
    }
  });

}

module.exports = function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');

  var json_input = req.rawBody || req.body

  context.log('---');
//   context.log(req);
  context.log(req);

  var query_input = eval("(" + json_input + ")");
  var query_card = query_input['cardNumber'];
  context.log(query_card);

  if (query_card) {
      context.log('got query_card!');

      if (!pool) {
        context.log('initializing pool')
        pool = new sql.ConnectionPool(config, (err) => {
          if (err) {
            context.log('pool created with err:')
            context.log(err);
          } else {
            context.log('pool created')
          }

          lookupCard(context, pool, query_card);
        });
      } else {
        context.log('pool already exists')

        lookupCard(pool, query_card);
      }

 
    sql.on('error', err => {
      context.log('got err');
      // ... error handler
      context.res = {
        status: 500,
        body: err
      }
      
      context.done()
    })

  } else {
    context.log("couldn't find card to query!");

    context.res = {
      status: 500,
      body: "couldn't recognize a valid cardNumber"
    }

    context.done();
  }

};
