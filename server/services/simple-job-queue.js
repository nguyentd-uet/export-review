var kue = require('kue');
var jobs = kue.createQueue();

var stt = 0
function newJob (){
    
    var name = 'nguyen' + stt
    var job = jobs.create('new_job', {name: name});
    stt++

    job
    .on('complete', function (){
      console.log('Job', job.id, 'with name', job.data.name, 'is    done');
    })
    .on('failed', function (){
      console.log('Job', job.id, 'with name', job.data.name, 'has  failed');
    });
    job.save();
}

jobs.process('new_job', function (job, done){
    // console.log('Job', job.data.name, 'is done');
    done && done();
})

setInterval(newJob, 3000);