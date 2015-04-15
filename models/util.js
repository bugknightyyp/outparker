exports.getGMTSeconds = function(){
  return Math.floor(Date.now() / 1000 + (new Date()).getTimezoneOffset() * 60 )
}