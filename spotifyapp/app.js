// Initialize the Spotify objects
var sp = getSpotifyApi(1),
	models = sp.require("sp://import/scripts/api/models"),
	views = sp.require("sp://import/scripts/api/views"),
	ui = sp.require("sp://import/scripts/ui");
	player = models.player,
	library = models.library,
	application = models.application,
	playerImage = new views.Player();

PlaylistWars = {
  common: {
    init: function() {
      // application-wide code

		// as we have to do this async, do it straight away
		PlaylistWars.Util.GetComputerPlaylist();

		// start the starfield
	    var stars = Game.start('stars', Stars);
	
		// start playing the superman theme
		player.play('spotify:track:4tABZngfyleLXr5wxHgRxZ');
		
		// create our spotify playlist
		PlaylistWars.Playlist = new models.Playlist();
		UIPlaylist = new views.List(PlaylistWars.Playlist);
		$('#current-playlist-tracks').html(UIPlaylist.node);
		$(".sp-list").addClass("sp-light");
		
		// load in any tracks sitting in local storage
		for (var i = 0; i < localStorage.length; i++) {
			PlaylistWars.Playlist.add(models.Track.fromURI(localStorage.getItem(localStorage.key(i))));
		}
		
		// handle dropped tracks
		if (models.application.links.length) {
			PlaylistWars.Util.HandleDroppedLinks();
		}
		application.observe(models.EVENT.LINKSCHANGED, PlaylistWars.Util.HandleDroppedLinks);
		
		if (PlaylistWars.Playlist.length == 5) {
			// hide the add bit
			$('#current-playlist-addtracks').hide();
		}
		
		// bind buttons
		$('#start-again').click(PlaylistWars.Util.ClearPlaylist);
		PlaylistWars.Util.ButtonCheck();

		// initialise the gamespace with nulls
		PlaylistWars.Gamespace.width = 60;
		PlaylistWars.Gamespace.height = 40;
		PlaylistWars.Gamespace.Grid = new Array(PlaylistWars.Gamespace.width);
		for (var x = 0; x < PlaylistWars.Gamespace.width; x++) {
			PlaylistWars.Gamespace.Grid[x] = new Array(PlaylistWars.Gamespace.height);
			for (var y = 0; y < PlaylistWars.Gamespace.height; y++) {
				PlaylistWars.Gamespace.Grid[x][y] = null;
			}
		}
		
		// ui code
		PlaylistWars.Draw.GridElement = $('#gamespace');
		PlaylistWars.Draw.ResetGrid();
		
		/*$('#reset').click(function() {
			PlaylistWars.Draw.ResetGrid();
			PlaylistWars.Engine.PlayGame();
			PlaylistWars.Draw.Draw();
		});
		
		$('#tick').click(function() {
			//PlaylistWars.Draw.ResetGrid();
			PlaylistWars.Engine.Tick(200);
			//PlaylistWars.Draw.Draw();
		});*/
    }
  },
	UIPlaylist: null,
	Playlist: null,
	ComputerPlaylist: null,

  Util: {
    init: function() {
      // controller-wide code
    },
	// Distance (radius returned)
	Distance: function (From, To) {
	  x = To.x - From.x;
	  y = To.y - From.y;
	  distance = Math.sqrt(x*x + y*y);
	  return distance;
	},
	HandleDroppedLinks: function() {
		var links = models.application.links;

		// can we have any more tracks?
		if (localStorage.length >= 5) {
			return;
		}
		
		// dont duplicate
		if (localStorage.getItem(links[0]) == null) {
			localStorage.setItem(links[0], links[0]);
			// add to our playlist
			PlaylistWars.Playlist.add(models.Track.fromURI(links[0]));
		}
		PlaylistWars.Util.ButtonCheck();
	},
	ClearPlaylist: function() {
		// kill local storage
		localStorage.clear();
		
		// clear the ui list
		PlaylistWars.Playlist = new models.Playlist();
		UIPlaylist = new views.List(PlaylistWars.Playlist);
		$('#current-playlist-tracks').html(UIPlaylist.node);
		$(".sp-list").addClass("sp-light");
		
		PlaylistWars.Util.ButtonCheck();
	},
	ButtonCheck: function() {
		// if we got 5 tracks, enable the buttons
		if (localStorage.length == 5) {
			$('#current-playlist-addtracks').hide();
			$('#play-online').removeClass('disabled').click(function(){alert('todo play online');});
			$('#bot-mode').removeClass('disabled');
			$('#bot-mode').click(function(){PlaylistWars.Engine.SetupBotMode();});
		}
		else {
			$('#current-playlist-addtracks').show();
			$('#play-online').addClass('disabled').unbind();
			$('#bot-mode').addClass('disabled').unbind();
		}
	},
	GetComputerPlaylist: function() {
		console.log('PlaylistWars.Util.GetComputerPlaylist()');
		// pick the top 5 tracks on spotify atm
		var toplist = new models.Toplist();
		toplist.toplistType = models.TOPLISTTYPE.REGION;
		toplist.matchType = models.TOPLISTMATCHES.TRACKS;
		toplist.region = models.TOPLISTREGION_EVERYWHERE;

		toplist.observe(models.EVENT.CHANGE, function() {
			PlaylistWars.ComputerPlaylist = new models.Playlist();
			for (var i = 0; i < 5; i++){
				PlaylistWars.ComputerPlaylist.add(toplist.results[i]);
			}
		});
		toplist.run();
	},
	StartEchnoNestRetrieval: function() {
		console.log('PlaylistWars.Util.StartEchnoNestRetrieval()');
		
		// get all the echonest profiles in parallel
		PlaylistWars.Util.EchonestCompleteCounter = 0;
		async.parallel([
		    PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[0].Tracks[0]),
			PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[0].Tracks[1]),
			PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[0].Tracks[2]),
			PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[0].Tracks[3]),
			PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[0].Tracks[4]),
			PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[1].Tracks[0]),
			PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[1].Tracks[1]),
			PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[1].Tracks[2]),
			PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[1].Tracks[3]),
			PlaylistWars.Util.GetEchonestProperties(PlaylistWars.GameInfo.Players[1].Tracks[4])
		]);
		// now we maintain external counters to check when we get results from all of these
	},
	GetEchonestProperties: function(track) {
		console.log('PlaylistWars.Util.GetEchonestProperties()');
		// get the artist of the track
		var artistName = track.track.artists[0].name;
		
		// hit up echonest for the artist
		$.getJSON('http://developer.echonest.com/api/v4/artist/search?api_key=' 
			+ PlaylistWars.Util.Parameters.echonestApiKey 
			+ '&format=json&results=1&name=' + artistName
			+ '&bucket=hotttnesss&bucket=familiarity',
		function(data) {
			var hotness = data.response.artists[0].hotttnesss;
			var familiarity = data.response.artists[0].familiarity;
			
			track.hotness = hotness;
			track.familiarity = familiarity;
			
			PlaylistWars.Util.EchonestCompleteWatcher();
		});
	},
	EchonestCompleteCounter: 0,
	EchonestCompleteWatcher: function() {
		console.log('PlaylistWars.Util.EchonestCompleteWatcher()');
		// every time this gets called, increment by 1
		PlaylistWars.Util.EchonestCompleteCounter++;
		console.log('PlaylistWars.Util.EchonestCompleteCounter: ' + PlaylistWars.Util.EchonestCompleteCounter);
		// if it hits 10, we have results for all our tracks
		if (PlaylistWars.Util.EchonestCompleteCounter == 10) {
			PlaylistWars.Util.CalculatePlaylistParameters();
		}
	},
	CalculatePlaylistParameters: function() {
		console.log('PlaylistWars.Util.CalculatePlaylistParameters()');
		// finally we need to divvy up the points to the tracks in the playlists
		
		var player1MinMaxVals = {
			minLength: PlaylistWars.GameInfo.Players[0].Tracks[0].length,
			maxLength: 0,
			minFamiliarity: PlaylistWars.GameInfo.Players[0].Tracks[0].familiarity,
			maxFamiliarity: 0,
			minHotness: PlaylistWars.GameInfo.Players[0].Tracks[0].hotness,
			maxHotness: 0
		};
		var player2MinMaxVals = {
			minLength: PlaylistWars.GameInfo.Players[1].Tracks[0].length,
			maxLength: 0,
			minFamiliarity: PlaylistWars.GameInfo.Players[1].Tracks[0].familiarity,
			maxFamiliarity: 0,
			minHotness: PlaylistWars.GameInfo.Players[1].Tracks[0].hotness,
			maxHotness: 0
		}
		
		// set the mins and maxes
		for (var i = 0; i < PlaylistWars.GameInfo.Players[0].Tracks.length; i++) {
			var thisTrack = PlaylistWars.GameInfo.Players[0].Tracks[i];
			player1MinMaxVals.maxHotness = thisTrack.hotness > player1MinMaxVals.maxHotness ? thisTrack.hotness : player1MinMaxVals.maxHotness;
			player1MinMaxVals.minHotness = thisTrack.hotness < player1MinMaxVals.minHotness ? thisTrack.hotness : player1MinMaxVals.minHotness;
			player1MinMaxVals.maxLength = thisTrack.length > player1MinMaxVals.maxLength ? thisTrack.length : player1MinMaxVals.maxLength;
			player1MinMaxVals.minLength = thisTrack.length < player1MinMaxVals.minLength ? thisTrack.length : player1MinMaxVals.minLength;
			player1MinMaxVals.maxFamiliarity = thisTrack.familiarity > player1MinMaxVals.maxFamiliarity ? thisTrack.familiarity : player1MinMaxVals.maxFamiliarity;
			player1MinMaxVals.minFamiliarity = thisTrack.familiarity < player1MinMaxVals.minFamiliarity ? thisTrack.familiarity : player1MinMaxVals.minFamiliarity;
		}
		for (var i = 0; i < PlaylistWars.GameInfo.Players[1].Tracks.length; i++) {
			var thisTrack = PlaylistWars.GameInfo.Players[1].Tracks[i];
			player2MinMaxVals.maxHotness = thisTrack.hotness > player2MinMaxVals.maxHotness ? thisTrack.hotness : player2MinMaxVals.maxHotness;
			player2MinMaxVals.minHotness = thisTrack.hotness < player2MinMaxVals.minHotness ? thisTrack.hotness : player2MinMaxVals.minHotness;
			player2MinMaxVals.maxLength = thisTrack.length > player2MinMaxVals.maxLength ? thisTrack.length : player2MinMaxVals.maxLength;
			player2MinMaxVals.minLength = thisTrack.length < player2MinMaxVals.minLength ? thisTrack.length : player2MinMaxVals.minLength;
			player2MinMaxVals.maxFamiliarity = thisTrack.familiarity > player2MinMaxVals.maxFamiliarity ? thisTrack.familiarity : player2MinMaxVals.maxFamiliarity;
			player2MinMaxVals.minFamiliarity = thisTrack.familiarity < player2MinMaxVals.minFamiliarity ? thisTrack.familiarity : player2MinMaxVals.minFamiliarity;
		}
		console.log(player1MinMaxVals);
		console.log(player2MinMaxVals);

		// now we need to divvy up the points
		for (var i = 0; i < PlaylistWars.GameInfo.Players[0].Tracks.length; i++) {	// player 1
			var thisTrack = PlaylistWars.GameInfo.Players[0].Tracks[i];
			var minMaxValues = player1MinMaxVals;
			// normalise each skill (x-min)/(max-min)
			var normalHotness = (thisTrack.hotness - minMaxValues.minHotness) / (minMaxValues.maxHotness - minMaxValues.minHotness);
			var normalLength = (thisTrack.length - minMaxValues.minLength) / (minMaxValues.maxLength - minMaxValues.minLength);
			var normalFamiliarity = (thisTrack.familiarity - minMaxValues.minFamiliarity) / (minMaxValues.maxFamiliarity - minMaxValues.minFamiliarity);
			//console.log(scalingFactor);
			console.log('nHotness: ' + normalHotness + ' nLength: ' + normalLength + ' nFamiliarity:' + normalFamiliarity);
			// now assign points
			thisTrack.attack = Math.floor(1 + normalHotness  * PlaylistWars.Util.Parameters.maxPoints / 3);
			thisTrack.defence = Math.floor(1 + normalFamiliarity  * PlaylistWars.Util.Parameters.maxPoints / 3);
			thisTrack.speed = Math.floor(1 + normalLength  * PlaylistWars.Util.Parameters.maxPoints / 3);
			// do all our points add up to the maxpoints?
			var pointsLeft = PlaylistWars.Util.Parameters.maxPoints - (thisTrack.attack + thisTrack.defence + thisTrack.speed);
			if (pointsLeft > 0) {
				// put them on speed
				thisTrack.speed += pointsLeft;
			}
			console.log('attack: ' + thisTrack.attack + ' defence: ' + thisTrack.defence + ' speed: ' + thisTrack.speed);
		}
		// now we need to divvy up the points
		for (var i = 0; i < PlaylistWars.GameInfo.Players[1].Tracks.length; i++) {	// player 2
			var thisTrack = PlaylistWars.GameInfo.Players[1].Tracks[i];
			var minMaxValues = player2MinMaxVals;
			// normalise each skill (x-min)/(max-min)
			var normalHotness = (thisTrack.hotness - minMaxValues.minHotness) / (minMaxValues.maxHotness - minMaxValues.minHotness);
			var normalLength = (thisTrack.length - minMaxValues.minLength) / (minMaxValues.maxLength - minMaxValues.minLength);
			var normalFamiliarity = (thisTrack.familiarity - minMaxValues.minFamiliarity) / (minMaxValues.maxFamiliarity - minMaxValues.minFamiliarity);
			// now assign points
			thisTrack.attack = Math.floor(1 + normalHotness * PlaylistWars.Util.Parameters.maxPoints / 3);
			thisTrack.defence = Math.floor(1 + normalFamiliarity * PlaylistWars.Util.Parameters.maxPoints / 3);
			thisTrack.speed = Math.floor(1 + normalLength * PlaylistWars.Util.Parameters.maxPoints / 3);
			// do all our points add up to the maxpoints?
			var pointsLeft = PlaylistWars.Util.Parameters.maxPoints - (thisTrack.attack + thisTrack.defence + thisTrack.speed);
			if (pointsLeft > 0) {
				// put them on speed
				thisTrack.speed += pointsLeft;
			}
		}
		// ok - let's run this motherfucker!
		PlaylistWars.Engine.Countdown();
	},
	Parameters: {
		startHealth: 20,
		attackThreshold: 0.3,  // chance of making a hit
		speedMultiplier: 0.95,   // higher = slower
		meleeRange: 1.0,
		shootingRange: 4,
		retreatThreshold: 0.3,
		echonestApiKey: 'VB2JJHBQ9R3FPIXUR',
		maxPoints: 15
	}
  },

  Actions: {
	// Attack
	// returns the amount of damage to do the defender. -1 if a miss
	// time until we make another attack is a multiplier of the memory value
	// better memory (higher) means you have to wait longer to attack again
	
	//attackWaitMultiplier = 
	Attack: function(Attacker, Defender) {
		console.log('PlaylistWars.Actions.Attack()');
	  rand = Math.random();
	console.log('rand: ' + rand + ' rand/defender.defence: ' + rand / Defender.defence);
	  if (Math.random() > PlaylistWars.Util.Parameters.attackThreshold + Math.random() / Defender.defence) { // hit chance reduces with greater defender defence
	    return (Math.floor(1 + Math.random() * Attacker.attack));  // damage increases with greater attack
	  }
	  else {
	    return -1;  // miss
	  }
	},

	// Move
	// Chance of actually making the move is a function of the Speed value
	// returns -1 if we can't make a move
	
	Move: function(Source, Target, flee) {
		console.log('PlaylistWars.Actions.Move()');

	  if (typeof flee == 'undefined') flee = false; // flee is optional
	  // calculate the final positions
	  var north = {
	    x: Source.x,
	    y: Source.y - 1,
	    valid: true,
	    targetDistance: null
	  };
	  var south = {
	    x: Source.x,
	    y: Source.y + 1,
	    valid: true,
	    targetDistance: null
	  };
	  var east = {
	    x: Source.x + 1,
	    y: Source.y,
	    valid: true,
	    targetDistance: null
	  };
	  var west = {
	    x: Source.x - 1,
	    y: Source.y,
	    valid: true,
	    targetDistance: null
	  };

	  var moves = [north, south, east, west];
	  var validMoves = new Array();

	  // eliminate illegal moves
	  for (var i = 0; i < moves.length; i++) {
		var thisMove = moves[i];
	    // flag moves out of the gamespace
	    if (thisMove.x < 0 ||
	        thisMove.x > PlaylistWars.Gamespace.width - 1 ||
	        thisMove.y < 0 ||
	        thisMove.y > PlaylistWars.Gamespace.height - 1) {
		console.log('move invalid');
	      thisMove.valid = false;
	    }

	    // flag a move that puts us on someone else
	    if (thisMove.valid 
		&& (PlaylistWars.Gamespace.Grid[thisMove.x][thisMove.y] != null
		|| PlaylistWars.Gamespace.Grid[thisMove.x][thisMove.y] == false)) {  // check if its empty or the guy is dead
	      thisMove.valid = false;
	    }

	    // if its still a valid move, move to our valid moves collection
	    if (thisMove.valid) {
	      validMoves.push(thisMove);
	    }
	  }

	  // are there actually any moves we can make?
	  if (validMoves.length == 0) {
	    return -1;
	  }

	  // for the remaining moves calculate the distances to the target
	  for (var i = 0; i < validMoves.length; i++) {
	    validMoves[i].targetDistance = PlaylistWars.Util.Distance(validMoves[i], Target);
	  }

	  // sort them with shortest first
	  validMoves.sort(function(a,b) {
	    if (a.targetDistance < b.targetDistance) {
	      return -1;
	    }
	    else if (a.targetDistance > b.targetDistance) {
	      return 1;
	    }
	    else {
	      return 0;
	    }
	  });

	  // do we actually make a move?
	  if (Math.random() > PlaylistWars.Util.Parameters.speedMultiplier / Source.speed) { 

	    // if flee is true
	    var moveToMake = null;
	    if (flee) {
	      // move to the last location in the list (furthest away)
	      moveToMake = validMoves[validMoves.length - 1];
		}
		else {
	      // otherwise move to the first location in the list (nearest)
	      moveToMake = validMoves[0];
	    }

	    // move
	    PlaylistWars.Gamespace.Grid[moveToMake.x][moveToMake.y] = true;
	    PlaylistWars.Gamespace.Grid[Source.x][Source.y] = null;
		
		// kill the old position in the div
		//$(PlaylistWars.Draw.GridElement).find('.cell[x=' + Source.x +'][y=' + Source.y +']').css('background-color', '');
		var thisCell = $(PlaylistWars.Draw.GridElement).find('tr:nth-child(' + (Source.y + 1) +')').find('td:nth-child(' + (Source.x + 1) + ')');
		thisCell.removeClass();
		thisCell.addClass('cell');
		thisCell.html('');
		
		// update the source
		Source.x = moveToMake.x;
		Source.y = moveToMake.y;

	    // TODO: Draw animation of this move
	  }
	}
  },

	Decisions: {
		// Melee range?
		
		InMeleeRange: function(From, To) {
			console.log('PlaylistWars.Decisions.InMeleeRange()');
		  var distance = PlaylistWars.Util.Distance(From, To);
		  if (distance <= PlaylistWars.Util.Parameters.meleeRange)
		    return true;
		  else
		    return false;
		},

		// Shooting range?
		
		InShootingRange: function(From, To) {
			console.log('PlaylistWars.Decisions.InShootingRange()');
		  var distance = PlaylistWars.Util.Distance(From, To);
		  if (distance <= PlaylistWars.Util.Parameters.shootingRange)
		    return true;
		  else
		    return false;
		},

		// retreat?
		
		ShouldRetreat: function(Unit) {
			console.log('PlaylistWars.Decisions.ShouldRetreat()');
		  var healthPercent = Unit.health / Unit.startHealth; // will normally be set to 5
		  var defenseProbability = 1 / Unit.defence;
		console.log('healthpercent: ' + healthPercent + ' defenseProbability: ' + defenseProbability)
		  if ((healthPercent * defenseProbability) <= PlaylistWars.Util.Parameters.retreatThreshold)
		    return true;
		  else
		    return false;
		}
		
	},
	
	Gamespace: {
		Grid: null,		// need to initialise this array
		width: null,
		height: null
	},
	
	Engine: {
		Working: false,		// helper to let us know the engine is doing something
		SetupBotMode: function() {
			console.log('PlaylistWars.Engine.SetupBotMode()');
			// ok we're playing against the computer
			// first of all, construct our game object
			var player1Tracks = new Array();
			for (var i = 0; i < PlaylistWars.Playlist.tracks.length; i++) {
				var thisTrack = {
					trackUri: PlaylistWars.Playlist.tracks[i].uri,
					track: PlaylistWars.Playlist.tracks[i],
					hotness: 0,
					familiarity: 0,
					length: PlaylistWars.Playlist.tracks[i].duration,
					player: 1,
					defence: 1,
					attack: 1,
					speed: 1,
					startHealth: PlaylistWars.Util.Parameters.startHealth,
					health: PlaylistWars.Util.Parameters.startHealth,
					x: 0,
					y: 0
				}
				player1Tracks.push(thisTrack);
			}
			var player2Tracks = new Array();
			for (var i = 0; i < PlaylistWars.ComputerPlaylist.tracks.length; i++) {
				var thisTrack = {
					trackUri: PlaylistWars.ComputerPlaylist.tracks[i].uri,
					track: PlaylistWars.ComputerPlaylist.tracks[i],
					hotness: 0,
					familiarity: 0,
					length: PlaylistWars.ComputerPlaylist.tracks[i].duration,
					player: 1,
					defence: 1,
					attack: 1,
					speed: 1,
					startHealth: PlaylistWars.Util.Parameters.startHealth,
					health: PlaylistWars.Util.Parameters.startHealth,
					x: 0,
					y: 0
				}
				player2Tracks.push(thisTrack);
			}
			var player1 = {
				spotifyAnonymousUserId: sp.core.getAnonymousUserId(),
				Tracks: player1Tracks
			}
			var player2 = {
				spotifyAnonymousUserId: 0,
				Tracks: player2Tracks
			}
			var players = new Array();
			players.push(player1);
			players.push(player2);
			var date = new Date();
			PlaylistWars.GameInfo = {
				GameId: 0,
				GameTimestamp: date.getTime(),
				Players: players,
				WinningPlayerIndex: null,
				Scores: {
					player1: 0,
					player2: 0
				}
			}
			// now we need to fire off our echonest sorter-outter
			PlaylistWars.Util.StartEchnoNestRetrieval();
			
			// TODO
		},
		Countdown: function() {
			// WOOT OK
			// If we have the lobby up, whatever
			$('#lobby').show();
			
			// show player 1
			for (var i = 0; i < PlaylistWars.GameInfo.Players[0].Tracks.length; i++) {
				var track = PlaylistWars.GameInfo.Players[0].Tracks[i];
				var thisRow = $('<tr class="lobby-row" x=><td class="lobby-row-name"></td><td class="attack"></td><td class="speed"></td><td class="defence"></td></tr>');
				var trackName = track.track.data.name;
				
				if (trackName.length > 15) {
					trackName = trackName.substring(0,12) + '...';
				}
				
				thisRow.find('.lobby-row-name').html('<span>' + trackName + '</span>');
				// attack
				for (var x = 0; x < track.attack; x++) {
					thisRow.find('.attack').append('<img src="img/attack.png" />');
				}
				
				// speed
				for (var x = 0; x < track.speed; x++) {
					thisRow.find('.speed').append('<img src="img/speed.png" />');
				}
				
				// defence
				for (var x = 0; x < track.defence; x++) {
					thisRow.find('.defence').append('<img src="img/defence.png" />');
				}
				
				// add to the lobby table
				$('#lobby-player-1-playlist table').append(thisRow);
			}
			// show player 2
			for (var i = 0; i < PlaylistWars.GameInfo.Players[1].Tracks.length; i++) {
				var track = PlaylistWars.GameInfo.Players[1].Tracks[i];
				var thisRow = $('<tr class="lobby-row" x=><td class="lobby-row-name"></td><td class="attack"></td><td class="speed"></td><td class="defence"></td></tr>');
				var trackName = track.track.data.name;
				
				if (trackName.length > 15) {
					trackName = trackName.substring(0,12) + '...';
				}
				
				thisRow.find('.lobby-row-name').html('<span>' + trackName + '</span>');
				// attack
				for (var x = 0; x < track.attack; x++) {
					thisRow.find('.attack').append('<img src="img/attack.png" />');
				}
				
				// speed
				for (var x = 0; x < track.speed; x++) {
					thisRow.find('.speed').append('<img src="img/speed.png" />');
				}
				
				// defence
				for (var x = 0; x < track.defence; x++) {
					thisRow.find('.defence').append('<img src="img/defence.png" />');
				}
				
				// add to the lobby table
				$('#lobby-player-2-playlist table').append(thisRow);
			}
			
			// prepare the game
			// reset our grid
			//return;
			PlaylistWars.Draw.ResetGrid();
			
			// call playgame
			PlaylistWars.Engine.PlayGame();
			
			// draw it
			PlaylistWars.Draw.Draw();
			
			
			// countdown to the start of the game
			PlaylistWars.Engine.CountdownNumber = 5;
			var t = setTimeout('PlaylistWars.Engine.CountdownCounter()', 5000);
		},
		CountdownNumber: 5,
		CountdownCounter: function() {
			console.log('PlaylistWars.Engine.CountdownCounter()');
			PlaylistWars.Engine.CountdownNumber--;
			
			if (PlaylistWars.Engine.CountdownNumber == 0) {
				// get rid of the lobby
				$('#lobby').hide();
				$('#gamespace').addClass('gamespace-show');
				// start ticking
				PlaylistWars.Engine.Tick(200);
				return;
			}
			
			// show the countdown
			$('#countdown').show();
			switch (PlaylistWars.Engine.CountdownNumber) {
				case 2: $('#countdown span').html('Get Ready!'); break;
				case 1: $('#countdown span').html('GO!'); break;
				default: $('#countdown span').html(PlaylistWars.Engine.CountdownNumber + '...'); break;
			}
			var t = setTimeout('PlaylistWars.Engine.CountdownCounter()', 1000);
		},
		PlayGame: function() {
			console.log('PlaylistWars.Engine.PlayGame()');
			// randomly put our tracks into the game grid
			var randomGameSquare = function(){
				console.log('PlaylistWars.Engine.PlayGame().randomGameSquare()');
				var ok = false;
				while (!ok){
					// pick a random x and y
					var randX = Math.floor(Math.random() * (PlaylistWars.Gamespace.width + 1));
					var randY = Math.floor(Math.random() * (PlaylistWars.Gamespace.height + 1));
					
					// check nothing is in this spot
					if (PlaylistWars.Gamespace.Grid[randX][randY] == null) {
						PlaylistWars.Gamespace.Grid[randX][randY] = true;
						return {x:randX, y:randY};
					}
				}
			};
			
			// player 1
			for (var x = 0; x < PlaylistWars.GameInfo.Players[0].Tracks.length; x++) {	// for each track
				var randomCoordinates = randomGameSquare();
				
				PlaylistWars.GameInfo.Players[0].Tracks[x].x = randomCoordinates.x;
				PlaylistWars.GameInfo.Players[0].Tracks[x].y = randomCoordinates.y;
			}
			// player 2
			for (var x = 0; x < PlaylistWars.GameInfo.Players[1].Tracks.length; x++) {	// for each track
				var randomCoordinates = randomGameSquare();
				
				PlaylistWars.GameInfo.Players[1].Tracks[x].x = randomCoordinates.x;
				PlaylistWars.GameInfo.Players[1].Tracks[x].y = randomCoordinates.y;
			}
			
			// create our tick timer
		},
		Tick: function(milliseconds) {
			console.log('PlaylistWars.Engine.Tick()');
			var atLeastOneTrack = false;
			// for each player
			// player 1
			for (var x = 0; x < PlaylistWars.GameInfo.Players[0].Tracks.length; x++) {	// for each track
				var track = PlaylistWars.GameInfo.Players[0].Tracks[x];
				if (track.health > 0) {		// only do something if the track is not dead
					PlaylistWars.Engine.DoTree(track, PlaylistWars.GameInfo.Players[1].Tracks);
					atLeastOneTrack = true;
				}
			}
			if (!atLeastOneTrack) {
				PlaylistWars.Engine.GameOver();
				return;
			}
			atLeastOneTrack = false;
			// player 2
			for (var x = 0; x < PlaylistWars.GameInfo.Players[1].Tracks.length; x++) {	// for each track
				var track = PlaylistWars.GameInfo.Players[1].Tracks[x];
				if (track.health > 0) {		// only do something if the track is not dead
					PlaylistWars.Engine.DoTree(track, PlaylistWars.GameInfo.Players[0].Tracks);
					atLeastOneTrack = true;
				}
			}
			if (!atLeastOneTrack) {
				PlaylistWars.Engine.GameOver();
				return;
			}
			// update the scoreboard
			
			// if called with a param, redraw the grid and set a timer
			if (typeof milliseconds != 'undefined') {
				PlaylistWars.Draw.Draw();
				var t = setTimeout('PlaylistWars.Engine.Tick(' + milliseconds + ')',milliseconds);
			}
			
		},
		GameOver: function() {
			alert('game over');
		},
		DoTree: function(source, enemies) {
			console.log('PlaylistWars.Engine.DoTree()');
			
			// can only do something if we have health
			if (source.health > 0) {
			
				// get the nearest enemy that is alive
				var nearestEnemy = null;
				for (var x = 0; x < enemies.length; x++) {
					if (enemies[x].health > 0) {
						if (nearestEnemy == null) {
							nearestEnemy = enemies[x];
						}
						else if (PlaylistWars.Util.Distance(source, enemies[x]) < PlaylistWars.Util.Distance(source, nearestEnemy)) {
							nearestEnemy = enemies[x];
						}
					}
				}

				if (PlaylistWars.Decisions.InMeleeRange(source, nearestEnemy)) {
					if (PlaylistWars.Decisions.ShouldRetreat(source)) {
						PlaylistWars.Actions.Move(source, nearestEnemy, true);
					}
					else {
						var damage = PlaylistWars.Actions.Attack(source, nearestEnemy);
						// TODO: Miss code
						if (damage > 0) {
							console.log('hit! damage: ' + damage);
							nearestEnemy.health -= damage;
							if (nearestEnemy.health <= 0) {	// killed em
								nearestEnemy.health = 0;
								
								// TODO Kill message
								// set the square to blank
								PlaylistWars.Gamespace.Grid[nearestEnemy.x][nearestEnemy.y] = null;
							}
						}
					}
				}
				else {
					PlaylistWars.Actions.Move(source, nearestEnemy, false);
				}
			}
			
		}
	},
	
	Draw: {
		GridElement: null,
		ResetGrid: function() {
			// kill whatever is in the element
			var thisGridElement = $('<div id="gamespace"></div>');
			
			// loop through each cell in the grid
			for (var y = 0; y < PlaylistWars.Gamespace.height; y++) {
				// for each row, create a row element
				var thisRow = $('<tr class="row" x=></tr>');
				thisGridElement.append(thisRow);
				
				for (var x = 0; x < PlaylistWars.Gamespace.width; x++) {
					var thisCell = PlaylistWars.Gamespace.Grid[x][y];
					// create a cell element
					var thisCell = $('<td class="cell" x=' + x + ' y=' + y + '></td>');
					thisRow.append(thisCell);
				}
			}
			
			// replace the existing gamespace
			$(PlaylistWars.Draw.GridElement).html(thisGridElement);
			
			// run any generic fiddles
		},
		Draw: function() {
			console.log('PlaylistWars.Draw.Draw()');
			// go through all the playlists and draw the tracks
			var drawThis = function(player, track) {
				console.log('PlaylistWars.Draw.Draw().drawThis()');
				//var thisCell = $(PlaylistWars.Draw.GridElement).find('.cell[x=' + track.x +'][y=' + track.y +']');
				var thisCell = $(PlaylistWars.Draw.GridElement).find('tr:nth-child(' + (track.y + 1) +')').find('td:nth-child(' + (track.x + 1) + ')');
				
				// style the player onto it
				if (player == 1) {
					thisCell.addClass('player1');
					//thisCell.css('background-color', 'blue')
				}
				else {
					thisCell.addClass('player2');
					//thisCell.css('background-color', 'red');
				}
				
				// health
				thisCell.html(track.health);
				if (track.health <= 0) {
					thisCell.removeClass().addClass('cell');
					thisCell.addClass('dead');
				}
				
				// put a little info bubble above with the track name
				// TODO
			};
			// player 1
			for (var x = 0; x < PlaylistWars.GameInfo.Players[0].Tracks.length; x++) {	// for each track
				var track = PlaylistWars.GameInfo.Players[0].Tracks[x];
				drawThis(1, track);
			}
			// player 2
			for (var x = 0; x < PlaylistWars.GameInfo.Players[1].Tracks.length; x++) {	// for each track
				var track = PlaylistWars.GameInfo.Players[1].Tracks[x];
				drawThis(2, track);
			}
		}
	}
};

UTIL = {
  exec: function( controller, action ) {
    var ns = PlaylistWars,
        action = ( action === undefined ) ? "init" : action;

    if ( controller !== "" && ns[controller] && typeof ns[controller][action] == "function" ) {
      ns[controller][action]();
    }
  },

  init: function() {
    var body = document.body,
        controller = body.getAttribute( "data-controller" ),
        action = body.getAttribute( "data-action" );

    UTIL.exec( "common" );
    //UTIL.exec( controller );
    //UTIL.exec( controller, action );
  }
};

$( document ).ready( UTIL.init );
