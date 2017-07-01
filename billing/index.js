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
bar = 5;

var lookupCard = (context, pool, cardNum) => {
  // var query = "select * from cards where cardNumber = '" + cardNum + "'";
  // var query = "select * from cards"
  var query = "select cardNumber,amount,date from purchases p " +
      "inner join cards c " +
      "on p.card_id = c.card_id " +
      "order by p.card_id";

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
    } else if (result.rowsAffected[0] >= 1) {

      var sections = result.recordset.reduce((m, item) => {
        m[item.cardNumber] = m[item.cardNumber] || [];
        m[item.cardNumber].push(item);
        return m
      }, {});

      var charges = {}

      Object.keys(sections).forEach((k) => { charges[k] = sections[k].reduce((v, m) => { v += m.amount * 100; return v }, 0) / 100; })
      
      context.res = {
        status: 200,
        body: charges
      }

      bar = result
      context.log('billing is: ');
      // context.log(prices);
      context.log(charges);
      context.done();
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

  var json_input = req.rawBody

  context.log('---');
//   context.log(req);

  if (!pool) {
    context.log('initializing pool')
    pool = new sql.ConnectionPool(config, (err) => {
      if (err) {
        context.log('pool created with err:')
        context.log(err);
      } else {
        context.log('pool created')
      }

      lookupCard(context, pool, "filler");
    });
  } else {
    context.log('pool already exists')

    lookupCard(pool, "filler value");
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

};

