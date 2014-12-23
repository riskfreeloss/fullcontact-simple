// fullcontact-simple
var express = require('express')
var app = express();
var FullContact = require('fullcontact');

var inno = require('./innometrics-backend-app');
inno.setVars({
    bucketName: process.env.INNO_BUCKET || 'steel',
    appKey: process.env.INNO_APP_KEY || 'K69XeW05b4sRGJXG',
    appName: process.env.INNO_APP_NAME || 'aluminium',
    groupId: process.env.INNO_COMPANY_ID || 8,
    apiUrl: process.env.INNO_API_URL || 'http://prerelease.innomdc.com/v1',
    auth: {
        user: '4.superuser',
        pass: 'test'
    }
});

app.set('port', (process.env.PORT || 5000))
app.set('fc_api_key', (process.env.FULLCONTACT_API_KEY))
app.use(express.static(__dirname + '/public'))

var fullcontact = new FullContact(app.get('fc_api_key'));

app.get('/', function(request, response) {
	var emailParam = request.param("email") || '';
	fullcontact.person.email(emailParam, function (err, data) {
		var result = 'Attempted to retrieve data for <pre>'+emailParam+'</pre><br>';
		if(err)
			result = result+'ERROR:<br>'+err+'</br>';
		if(data)
			result = result+JSON.stringify(data)+'</br>';
		result = result + '<br><pre>'+JSON.stringify(process.env)+'</pre></br>';
		response.send(result);
	});
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
