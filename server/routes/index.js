var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({title: 'respond with a resource'});
});

router.get('/cities', (req, res) => {
  const cities = [
    {name: 'New York City', population: 8175133},
    {name: 'Los Angeles',   population: 3792621},
    {name: 'Chicago',       population: 2695598}
  ]
  res.json(cities)
})

module.exports = router;
