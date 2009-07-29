// ==========================================================================
// Frontend
// ==========================================================================

Frontend = SC.Object.create({

	server: SC.Server.create({ prefix: ['Frontend'] }),

	// When you are in development mode, this array will be populated with
	// any fixtures you create for testing and loaded automatically in your
	// main method.  When in production, this will be an empty array.
	FIXTURES: []

});

// ==========================================================================
// Backend
// ==========================================================================

Backend = SC.Object.create({

	urlFor: function(loc) {
		return '/backend' + loc;
	}
});
