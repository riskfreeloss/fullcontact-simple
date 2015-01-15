// fullcontact-simple
var express = require('express'),
	bodyParser = require('body-parser'),
	FullContact = require('fullcontact'),
    inno = require('./innometrics-helper'),
    app = express();

app.set('port', (process.env.PORT || 5000));

inno.setVars({
    bucketName: process.env.INNO_BUCKET /* || 'first-bucket' */,
    appKey: process.env.INNO_APP_KEY /* || 'ZYSBCxyg5MP4P293'*/,
    appName: process.env.INNO_APP_NAME /* || 'full-contact-simple'*/,
    groupId: process.env.INNO_COMPANY_ID /* || 9 */,
    apiUrl: process.env.INNO_API_URL /* || 'http://prerelease.innomdc.com/v1' */,
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
app.use(bodyParser.json())

app.get('/', handleRequests);
app.post('/', handleRequests);

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

function handleRequests(request, response) {


	console.log("Received http request, method: "+JSON.stringify(request.method)+" params: "+JSON.stringify(request.params)+" query: "+JSON.stringify(request.query)+" body: "+JSON.stringify(request.body));

	inno.getSettings({
		vars: inno.getVars()
	}, function (err, settings) {
		if (err) {
			return response.json({
				error: err.message,
				vars: inno.getVars()
			});
		}

		var emailParam = request.param("email") || settings.email;
		if(request.body && request.body.profile)
		{
			var sessions = request.body.profile.sessions || [];
			for(var i = 0; i < sessions.length; i++)
			{
				var events = request.body.profile.sessions[i].events || [];
				for(var j = 0; j < events.length; j++)
				{
					var ev = events[j];
					if(ev.definitionId && ev.definitionId == "fake-login-event" && ev.data && ev.data.email)
					{
						emailParam = ev.data.email;
					}
				}
			}
		}
		else
		{
			console.log("Unrecognized input in body, using profile ID "+inno.getVars().profileId+" and email: "+emailParam);
		}

		fullcontact.person.email(emailParam, function (err, data) {

			console.log("Attempting to retrieve social media data for "+emailParam);

			var innoVars = inno.getVars();
			if(request.body && request.body.profile && request.body.profile.id) {
				console.log("parsed profileId to update: "+request.body.profile.id);
				innoVars.profileId = request.body.profile.id;
			}
			else
			{
				console.log("no profile id in body, using "+innoVars.profileId);
				console.log(request.body);
			}

			inno.updateProfile({
				vars: innoVars,
				data: {
						'socialMediaData': data.socialProfiles ? JSON.stringify(data.socialProfiles) : ""
					}
				}, function (err) {
					var result = 'Attempted to retrieve data for <pre>'+emailParam+'</pre><br>';
					if(err) {
						result = result+'ERROR:<br>'+err+'</br>';	
						console.log('ERROR: '+err);
					}
					if(data) {
						result = result+JSON.stringify(data)+'</br>';	
						//console.log('data returned!'+JSON.stringify(data));
						console.log('data returned: '+JSON.stringify(data.socialProfiles));
					}
					//result = result + '<br><pre>'+JSON.stringify(process.env)+'</pre></br>';
					
					return response.send(result);
				});
			});
	});
}
