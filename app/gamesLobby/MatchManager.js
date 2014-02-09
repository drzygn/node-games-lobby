// Stores the matches.
var
  _ = require ('underscore'),
  ResultService = require('./ResultService.js');

function MatchManager (resultListener) {
  // When instantiating a match, the game instance should pass its results to
  // the resultListener provided.
  this.resultListener = resultListener;

  //------------------------------------------------------
  // matches:
  this.matches = {};
  // Matches that are either WAITING or PLAYING.
  //    object key: matchID.
  //    object val: match object (see below).

  // match object:
  //  id                 - UUID identifying the match.
  //  owner              - player who started the match.
  //  gameID             - gameID of the game.
  //  creationDate       - Date the match was created.
  //  playerUsernames    - Usernames of players in the match.
  //  minPlayers         - Number of players required for the match to begin.
  //  state              - one of:
  //    WAITING - waiting for enough players to join.
  //    PLAYING - currently playing.
  //------------------------------------------------------
}

MatchManager.prototype.createMatch = function(
  matchID,
  gameID,
  Game,
  owner
) {

  var match = {
    id:                matchID,
    gameID:            gameID,
    owner:             owner,
    Game:              Game,
    gameInstance:      null,
    state:             'WAITING',
    creationDate:      Date.now(),
    playerUsernames:   [ owner ],
    minPlayers:        Game.getConfig('minPlayers')
  };

  this.matches[matchID] = match;

  // Return the match in case we'd like to modify it directly.
  return match;
};

MatchManager.prototype.addPlayerToMatch = function(username, match) {
  match.playerUsernames.push(username);

  if (match.playerUsernames.length === match.minPlayers) {
    this.startPlayingMatch(match);
  }
};

MatchManager.prototype.startPlayingMatch = function(match) {
  console.log('MatchManager startPlayingMatch', match);
  match.state = 'PLAYING';

  // Instantiate a ResultService for the game instance to use.
  var resultService   = new ResultService(match.id, this.resultListener);

  // Instantiate the game.
  var Game            = match.Game;
  var gameInstance    = new Game(resultService, match.playerUsernames);
  match.gameInstance = gameInstance;
};


MatchManager.prototype.getMatch = function(matchID) {
  return this.matches[matchID];
};

// Return WAITING matches in order of their creation date.
// gameID is optional.
MatchManager.prototype.getWaitingMatches = function(gameID) {
  var whereClause = {state: 'WAITING'};
  if (gameID !== undefined) {
    whereClause.gameID = gameID;
  }

  var waitingMatches = _.where(
    this.matches,
    whereClause
  ).sort(function(a,b) {
    return a.creationDate > b.creationDate;
  });

  if (waitingMatches === undefined) {
    waitingMatches = [];
  }

  return waitingMatches;
};

// Return the oldest WAITING match ID.
// gameIS is optional.
MatchManager.prototype.getFirstWaitingMatch = function(gameID) {
  var whereClause = {state: 'WAITING'};
  if (gameID !== undefined) {
    whereClause.gameID = gameID;
  }

  firstMatch = _.findWhere(
    this.matches,
    whereClause
  ).sort(function(a,b) {
    return a.creationDate > b.creationDate;
  });

  return firstMatch;
};

module.exports = MatchManager;
