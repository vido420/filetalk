// ==========================================================================
// Frontend.AppController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.appController = SC.Object.create(
/** @scope Frontend.appController */ {
	tab: 'connection',
	tabObserver: function() {
		var tab = this.get('tab');
		SC.page.get('navigationView').set('value', tab);
	}.observes('tab')
}) ;
