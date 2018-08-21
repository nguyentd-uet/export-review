module.exports.deplay = function (millsec){
    return new Promise((reslove) => {setTimeout(reslove,millsec)})
}