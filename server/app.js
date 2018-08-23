var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const kue = require('kue');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var exportRouter = require('./routes/export');

var app = express();

// Serve static files from the React app
const staticFiles = express.static(path.join(__dirname, '../../client/build'))
app.use(staticFiles)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/export', exportRouter);
app.use('/queue', kue.app);

// any routes not picked up by the server api will be handled by the react router
app.use('/*', staticFiles)

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.set('port', (process.env.PORT || 3001))
app.listen(app.get('port'), () => {
  console.log(`Listening on ${app.get('port')}`)
})

module.exports = app;
