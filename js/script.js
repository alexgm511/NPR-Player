// script.js

	// create the module and name it singleApp
		// also include ngRoute for all our routing needs
	var singleApp = angular.module('singleApp', ['ngRoute']);

	// configure our routes
	singleApp.config(function($routeProvider){
		$routeProvider

			// route for the home page
			.when('/', {
				templateUrl : 'pages/home.html',
				controller  : 'mainController'
			})


			// route for the home page
			.when('/player', {
				templateUrl : 'pages/player.html',
				controller  : 'playerController'
			})
			// route for the home page

			.when('/contact', {
				templateUrl : 'pages/contact.html',
				controller  : 'contactController'
			});
	});

	var apiKey = 'MDIwNjM0OTYzMDE0NDM0Nzk1ODYxYWVjMQ001',
		//nprUrl = 'http://api.npr.org/query?id=61&fields=relatedLink,title,byline,text,audio,image,pullQuote,all&output=JSON';
		nprUrl = 'http://api.npr.org/query?id=61&fields=relatedLink,title,byline,text,audio,image,pullQuote&output=JSON';

	singleApp.factory('nprService', ['$http', function($http) {
		var doRequest = function(apiKey) {
			return $http({
				method: 'JSONP',
				url: nprUrl + '&apiKey=' + apiKey + '&callback=JSON_CALLBACK'				
			});
		}

		return {
			programs: function(apiKey) { return doRequest(apiKey) }
		};
	}]);

	singleApp.directive('nprLink', function() {
		return {
			restrict: 'EA',
			require: ['^ngModel'],
			replace: true,
			scope: {
				ngModel: '=',
				player: '='
			},
			templateUrl: 'views/nprListItem.html',
			link: function(scope, ele, attr) {
				scope.duration = scope.ngModel.audio[0].duration.$text;
			}
		}
	});


	// Create an audio service to remove it from the controller
	// since it interacts with the DOM 
	singleApp.factory('audio', ['$document', function($document) {
		var audio = $document[0].createElement('audio');
		return audio;
	}]);

	// Create a player service to handle play() and stop() of the audio service
	singleApp.factory('player', ['$rootScope', 'audio', function($rootScope, audio) {
		var player = {
			current: null,
			playing: false,
			ready: false,
			progress: 0,
			paused: false,

			play: function(program) {
				// If we are playing stop the current playback
				if (player.playing) player.stop();
				var url = program.audio[0].format.mp4.$text; // from the NPR API
				player.current = program;
				audio.src = url;
				audio.play(); // Start playback of the url
				// Store the state of the player as playing
				player.playing = true;
			},

			stop: function() {
				if (player.playing) {
					audio.pause(); // stop playback
					// Clear the state of the player
					player.playing = false;
					player.current = null;
				}
			},

			pause: function() {
				if (player.playing) {
					audio.pause(); // pause playback
					player.paused = true;
				}
			},

			currentTime: function() {
				return audio.currentTime;
			},

			currentDuration: function() {
				return audio.duration;
			}
		};
		audio.addEventListener('ended', function() {
			$rootScope.$apply(player.stop());
		});
		audio.addEventListener('timeupdate', function() {
			$rootScope.$apply(function() {
				player.progress = player.currentTime();
				player.progress_percent = (player.progress / player.currentDuration());
			});
		});
		audio.addEventListener('canplay', function() {
			$rootScope.$apply(function() {
				player.ready = true;
			});
		});
		return player;
	}]);

	singleApp.controller('playerController', ['$scope', 'nprService', 'player', function($scope, nprService, player) {
		$scope.player = player;
		nprService.programs(apiKey)
			.success(function(data, status) {
				$scope.programs = data.list.story;
			});
	}]);		

	singleApp.directive('playerView', [function() {
		return {
			restrict: 'EA',
			require: ['^ngModel'],
			scope: {
				ngModel: '='
			},
			templateUrl: 'views/playerView.html',
			link: function(scope, iElm, iAttrs, controller) {
				scope.$watch('ngModel.current', function(newVal) {
					if (newVal) {
						scope.playing = true;
						scope.title = scope.ngModel.current.title.$text;
						scope.$watch('ngModel.ready', function(newVal) {
							if (newVal) {
								scope.duration = scope.ngModel.currentDuration();
							}
						});

						scope.$watch('ngModel.progress', function(newVal) {
							scope.secondsProgress = scope.ngModel.progress;
							scope.percentComplete = scope.ngModel.progress_percent;
						});
					}
				});
				scope.stop = function() {
					scope.ngModel.stop();
					scope.playing = false;
				} 
			}
		};
	}]);

	singleApp.controller('RelatedController', ['$scope', 'player', function($scope, player) {
	  $scope.player = player;

	  $scope.$watch('player.current', function(newVal) {
	    if (newVal) {
	      $scope.related = [];
	      angular.forEach(newVal.relatedLink, function(link) {
	        $scope.related.push({link: link.link[0].$text, caption: link.caption.$text});
	      });
	    }
	  });
	}]);

	// create the controller and inject Angular's $scope
/*	singleApp.controller('playerController', ['$scope', '$http', 'audio', function($scope, $http, audio) {
			// Hidden our previous section's content
			// construct our http request
			//var audio = document.createElement('audio');
			$scope.audio = audio;
			$scope.playing = false;

			$scope.play = function(program) {
				if ($scope.playing) audio.pause();
				var url = program.audio[0].format.mp4.$text;
				audio.src = url;
				audio.play();
				// Store the state of the player as playing
				$scope.playing = true;
			}

			$scope.stop = function() {
				audio.pause();
				$scope.playing = false;
			};
			$scope.audio.addEventListener('ended', function() {
				$scope.$apply(function() {
					$scope.stop()
				});
			}); 

			$http({
				method: 'JSONP',
				url: nprUrl + '&apiKey=' + apiKey + '&callback=JSON_CALLBACK'
			}).success(function(data, status) {
				// Now we have a list of the stories (data.list.story)
				// in the data object that the NPR API
				// returns in JSON that looks like:
				//	"title": ...
				// 	"story": ...
				//		{ "id": ...
				//			"title": ...
				$scope.programs = data.list.story;
			}).error(function(data, status) {
				// Some error occurred
			});

	}]);
*/

/*
	singleApp.directive('nprLink', function() {
		return {
			restrict: 'EA',
			require: ['^ngModel'],
			replace: true,
			scope: {
				ngModel: '=',
				play: '&'
			},
			templateUrl: 'views/nprListItem.html',
			link: function(scope, ele, attr) {
				scope.duration = scope.ngModel.audio[0].duration.$text;
			}
		}
	});
*/
	// create the controller and inject Angular's $scope
	singleApp.controller('mainController', ['$scope', function($scope) {
	
			// create a message to display in our view
			$scope.message = 'Everyone come and see how good I look!';
			$scope.person = { name: "Bob Smith" };
			var updateClock = function() {
				$scope.clock = new Date();
			};
			var timer = setInterval(function() {
				$scope.$apply(updateClock);
			}, 1000);
			updateClock();
	}]);


	// create simplest adding machine
	singleApp.controller('DemoController', ['$scope', function($scope) {
		$scope.counter = 0;
		$scope.add = function(amount) { $scope.counter += amount; };
		$scope.subtract = function(amount) { $scope.counter -= amount; };
	}]);

	// create the controller and inject Angular's $scope
	singleApp.controller('contactController', ['$scope', function($scope) {
	
			// create a message to display in our view
			$scope.message = 'Contact us! JK, this is just a demo.';
	}]);
