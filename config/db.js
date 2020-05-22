// dbPassword = 'mongodb+srv://YOUR_USERNAME_HERE:'+ encodeURIComponent('YOUR_PASSWORD_HERE') + '@CLUSTER_NAME_HERE.mongodb.net/test?retryWrites=true';
mongoURI = 'mongodb://localhost:27017' + '/ImageLabelingTaskManager';
database = 'mongodb://localhost:27017/'
dbName = 'ImageLabelingTaskManager'

module.exports = {
    mongoURI,
    database,
    dbName
};
