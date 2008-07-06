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
		sc_super(null);
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
							'"><div><a href="',	item.action, '">',
							item.name, '</a></div></li>',
						].join('');
					}).join(''),
				'</ul>',
			'</div>',
		].join('');
	},

	valueObserver: function() {
		var items = [
			{id:'chat', action:'chat.html', name:'Chat'},
			{id:'private', action:'private.html', name:'Private'},
			{id:'files', action:'files.html', name:'Files'},
			{id:'news', action:'news.html', name:'News'},
			{id:'connection', action:'index.html', name:'Connect'},
		];
		this.set('innerHTML', this.formatter(items, this));
	}.observes('value'),
});
