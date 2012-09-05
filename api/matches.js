var users = require("./users.js");

exports.getMatches = function(body, callback)
{
    matches = GLOBAL.matchesDB.list(
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("matches.getMatches error: "+error);
			callback([]);
		}
		else
		{
			var result = [];
			for (var X in body.rows)
			{
				var user = body.rows[X].value;
				delete user._id;
				delete user._rev;
				result.push(user);
			}
			console.log("matches.getMatches OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}


exports.addMatch = function(body, callback)
{
	console.log("matches.addMatch: "+JSON.stringify(body));
	
	var matchData = {};
	matchData.date = new Date().getTime();
	
	matchData.leftPlayers = [];
	addToListIfExists(matchData.leftPlayers, body.leftPlayer1);
	addToListIfExists(matchData.leftPlayers, body.leftPlayer2);
	
	matchData.rightPlayers = [];
	addToListIfExists(matchData.rightPlayers, body.rightPlayer1);
	addToListIfExists(matchData.rightPlayers, body.rightPlayer2);
	
	matchData.leftScore = Number(body.leftScore);
	matchData.rightScore = Number(body.rightScore);
	
	if(!validateScore(matchData.leftScore) || !validateScore(matchData.rightScore) 
	|| 
	(matchData.leftScore < 5 && matchData.rightScore < 5))
	{
		callback({status:"error", message:"Invalid score."});
		return;
	}
	
	if(!preValidatePlayers(matchData.leftPlayers) || !preValidatePlayers(matchData.rightPlayers))
	{
		callback({status:"error", message:"Invalid players."});
		return;
	}
	
	users.getUsers({}, function(users)
	{
		if(validatePlayers(users, matchData.leftPlayers, matchData.rightPlayers))
		{
			addMatchToDatabase(matchData, callback);
		}
		else
		{
			callback({status:"error", message:"Invalid players."});
		}
	});
}

function addToListIfExists(list, value)
{
	if(value)
	{
		list.push(value);
	}
}

function validateScore(score)
{
	return !isNaN(score) && score >= 0 && score <= 10;
}

function preValidatePlayers(players)
{
	console.log("preValidatePlayers: " + players.length + " - "+ players);
	return players != null && players.length > 0 && players.length <= 2;
}

function validatePlayers(users, players1, players2)
{
	console.log("validatePlayers: " + players1 + " --- " + players2 + " --- " +users);
	var X;
	for(X in users)
	{
		users[X] = users[X].id;
	}
	var player;
	for(X in players1)
	{
		player = players1[X];
		if(users.indexOf(player) < 0)
		{
			return false;
		}
		if(players2.indexOf(player) >= 0)
		{
			return false;
		}
	}
	for(X in players2)
	{
		player = players2[X];
		if(users.indexOf(player) < 0)
		{
			return false;
		}
	}
	return true;
}

function addMatchToDatabase(matchData, callback)
{
	console.log("matches.addMatchToDatabase: "+JSON.stringify(matchData));
	GLOBAL.matchesDB.insert(matchData, null, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("matches.addMatch error: "+error);
			callback({status:"error"});
		}
		else
		{
			console.log("matches.addMatch OK: " + JSON.stringify(body));
			callback({status:"OK"});
		}
	});
}