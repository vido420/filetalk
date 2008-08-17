// ==========================================================================
// Frontend.NavigationView
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.View
  @author AuthorName
  @version 0.1
*/
Frontend.NavigationView = SC.View.extend(
/** @scope Frontend.NavigationView.prototype */ {

	init: function() { 
		sc_super();
		this.valueObserver();
	},

	value: 'connection',

	formatter: function(items, view) {
    	if (!items || items.length == 0)
			return emptyElement;
    	return [
			'<div id="navigation">',
				'<ul>',
					items.map(function(item) {
						return [
							'<li id="', item.id, '" class="',
							(item.id == view.value ? 'front' : 'back'),
							'"><a href="javascript: ', item.action, '">',
							item.name, '</a></li>',
						].join('');
					}).join(''),
				'</ul>',
			'</div>',
		].join('');
	},

	valueObserver: function() {
		var connected = (this.get('value') != 'connection');
		var connectName = (connected ? 'Disconnect' : 'Connect');
		var connectAction = (connected ? 'Frontend.appController.disconnect();' : '');
		var items = [
			{id:'chat', action:'Frontend.navController.openChat();', name:'Chat'},
			{id:'private', action:'Frontend.navController.openPrivate();', name:'Private'},
			{id:'files', action:'Frontend.navController.openFiles();', name:'Files'},
			{id:'news', action:'Frontend.navController.openNews();', name:'News'},
			{id:'connection', action: connectAction, name: connectName},
		];
		this.set('innerHTML', this.formatter(items, this));
	}.observes('value'),
});
