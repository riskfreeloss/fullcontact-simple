// fullcontact-simple
var express = require('express'),
	FullContact = require('fullcontact'),
    inno = require('./innometrics-helper'),
    app = express();

app.set('port', (process.env.PORT || 5000));

inno.setVars({
    bucketName: process.env.INNO_BUCKET || 'first-bucket',
    appKey: process.env.INNO_APP_KEY || 'not-web',
    appName: process.env.INNO_APP_NAME || 'full-contact-simple',
    groupId: process.env.INNO_COMPANY_ID || 9,
    apiUrl: process.env.INNO_API_URL || 'http://prerelease.innomdc.com/v1',
    auth: {
        user: '4.superuser',
        pass: 'test'
    }
});

var fullcontact;

inno.getSettings({
        	vars: inno.getVars()
	    }, function (err, settings) {
	        if (err) {
	            return response.json({
	                error: err.message
	            });
	        }

			fullcontact = new FullContact(settings.fcApiKey);
		});


app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {

		inno.getSettings({
        	vars: inno.getVars()
	    }, function (err, settings) {
	        if (err) {
	            return response.json({
	                error: err.message
	            });
	        }

			//var emailParam = request.param("email") || settings.email;
			var emailParam = settings.email;

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
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
