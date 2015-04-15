// module.exports = function(app){
//   app.use('/user', require('./user').user)

//   app.use('/video', require('./video/').video)
//   app.use('/videos', require('./video/').videos)

// }
module.exports = function(app){
  app.use('/user', require('./user'))
  //app.use('/common', require('./common'))

}