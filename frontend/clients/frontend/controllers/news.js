// ==========================================================================
// Frontend.NewsController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.newsController = SC.Object.create(
/** @scope Frontend.newsController */ {
	requestNews: function() {
		var request = new Ajax.Request('/backend/news', {
			method: 'get',
			requestHeaders: Frontend.appController.buildHeaders(),
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response) {
			},
			onFailure: function() {
			}
		});
	},
	news: '',
	newsObserver: function() {
		var newsField = SC.page.getPath('newsView.newsContent');
		newsField.set('innerHTML', Frontend.newsController.get('news'));
	}.observes('news'),
}) ;
