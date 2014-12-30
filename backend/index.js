// fullcontact-simple
var express = require('express'),
	FullContact = require('fullcontact'),
    inno = require('./innometrics-helper'),
    app = express();

app.set('port', (process.env.PORT || 5000));

inno.setVars({
    bucketName: process.env.INNO_BUCKET || 'first-bucket',
    appKey: process.env.INNO_APP_KEY || '17A1q5uC8c225hgW',
    appName: process.env.INNO_APP_NAME || 'full-contact-simple',
    groupId: process.env.INNO_COMPANY_ID || 9,
    apiUrl: process.env.INNO_API_URL || 'http://prerelease.innomdc.com/v1',
    auth: {
        user: '4.superuser',
        pass: 'test'
    },
    // only for updateProfile
    profileId: '12345',
    collectApp: 'rest-api',
    section: 'first-section'
});

var fullcontact;

console.log("Setting up FullContact...");
inno.getSettings({
        	vars: inno.getVars()
	    }, function (err, settings) {
	        if (err) {
  				console.log("Error: " + err.message + " vars: "+JSON.stringify(inno.getVars()));
	        }

	    	var fcApiKey = settings ? settings.fcApiKey : process.env.FULLCONTACT_API_KEY;

			fullcontact = new FullContact(fcApiKey);
		});


app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {

	inno.getSettings({
		vars: inno.getVars()
	}, function (err, settings) {
		if (err) {
			return response.json({
				error: err.message,
				vars: inno.getVars()
			});
		}

		//var emailParam = request.param("email") || settings.email;
		var emailParam = settings.email;

		fullcontact.person.email(emailParam, function (err, data) {

			inno.updateProfile({
				vars: inno.getVars(),
				data: {
						'socialMediaData': data
					}
				}, function (err) {
					var result = 'Attempted to retrieve data for <pre>'+emailParam+'</pre><br>';
					if(err)
						result = result+'ERROR:<br>'+err+'</br>';
					if(data)
						result = result+JSON.stringify(data)+'</br>';
					result = result + '<br><pre>'+JSON.stringify(process.env)+'</pre></br>';
					
					console.log(result);
					return response.send(result);
				});
			});
	});
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
