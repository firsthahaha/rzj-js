const express = require('express');
const app = express();
const routes = require('./routes/index.js');

app.use(express.urlencoded({ extended: false }))
app.use(express.json({ limit: '100mb' }))

app.all('*', (req, res, next) => {
  // console.log('req.headers', JSON.stringify(req.headers))
  // res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With, Siteid, Loginmode')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS,PATCH')
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Max-Age', 1728000)
  req.method.toUpperCase() == 'OPTIONS' ? res.sendStatus(200) : next()
})

app.use('/', routes);

app.listen(5678, () => {
  console.log('Node服务运行在http://127.0.0.1:5678');
});

