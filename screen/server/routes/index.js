const express = require('express');
const routes = express.Router();

const report_routes = require('./report.js');

routes.get('/', (req, res) => {
  res.send('root path');
});
routes.use('/report', report_routes);

module.exports = routes;
