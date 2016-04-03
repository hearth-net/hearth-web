'use strict';

/**
 * @ngdoc service
 * @name hearth.services.ProfileUtils
 * @description Helper class for all Hearth profiles (user himself, other users, community profiles...)
 */

angular.module('hearth.services').factory('ProfileUtils', ['Karma', function(Karma) {

	var factory = {};

	var PROFILE_TYPES = {
		USER: 'user',
		COMMUNITY: 'community'
	}

	/**
	 *	Function that takes the profile and its type and processes all necessary transforms on it
	 *
	 *	@param {Object} paramObject	-	{Object}	profile [required] the object to be transformed
	 *								-	{String}	type [required] [one of PROFILE_TYPES]
	 *	@return {Object} paramObject.profile -	the transformed and ready for use profile object
	 */
	function transformDataForUsage(paramObject) {
		if (!(paramObject && paramObject.profile && paramObject.type && !!(PROFILE_TYPES[paramObject.type.toUpperCase()]))) throw new Error('Insufficient paramObject to transform input data correctly.');
		paramObject.type = paramObject.type.toUpperCase();

		// common for all types
		// copyMottoIfNecessary(paramObject.profile);
		fillWebs(paramObject.profile);
		splitInterests(paramObject.profile);

		// type-specific
		switch (paramObject.type) {
			case PROFILE_TYPES.USER:
				// nothing yet ..
				break;

			case PROFILE_TYPES.COMMUNITY:
				// nothing yet ..
				break;
		}

		return paramObject.profile;
	};

	// SETUP
	var MAX_MOTTO_LENGTH = 70;

	// FUNCTIONS
	function copyMottoIfNecessary(profile) {
		if (!profile.motto) {
			profile.motto = profile.about || '';
			if (profile.motto.length > (MAX_MOTTO_LENGTH)) profile.motto = profile.motto.slice(0, MAX_MOTTO_LENGTH - 3) + '...';
		}
		return profile;
	}

	function fillWebs(profile) {
		if (!profile.webs || !profile.webs.length) profile.webs = [''];
		return profile;
	}

	function splitInterests(profile) {
		profile.interests = (profile.interests ? profile.interests.join(',') : '');
		return profile;
	}

	// FUNCTION EXPOSITION
	factory.transformDataForUsage = transformDataForUsage;
	factory.single = {
		copyMottoIfNecessary: copyMottoIfNecessary
	};
	factory.params = {
		PROFILE_TYPES: PROFILE_TYPES,
		MAX_MOTTO_LENGTH: MAX_MOTTO_LENGTH
	};

	// RETURN
	return factory;
}]);