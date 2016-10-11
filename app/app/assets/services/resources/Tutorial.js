'use strict';

/**
 * @ngdoc service
 * @name hearth.services.Tutorial
 * @description 
 */
angular.module('hearth.services').factory('Tutorial', [
	'$resource',

	function($resource) {
		return $resource($$config.apiPath + '/users/:user_id/tutorial', {
			user_id: '@user_id',
		}, {
			getAll: {
				method: 'GET',
				isArray: true,
				params: {
					all: 1
				}
			},
			get: {
				method: 'GET',
				isArray: true
			},
			ignore: {
				url: $$config.apiPath + '/users/:user_id/tutorial/ignore',
				method: 'PUT'
			}
		});
	}
]);