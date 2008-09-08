// ==========================================================================
// Frontend.NavController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.navController = SC.Object.create(
/** @scope Frontend.navController */ {
	tab: 'connection',
	tabObserver: function() {
		var tab = this.get('tab');
		SC.page.get('navigationView').set('value', tab);
		if (tab == 'chat') {
			SC.page.get('contentView').set('content', SC.page.get('chatView'));
			if (Frontend.appController.get('isPolling') == false) {
				Frontend.appController.startPolling();
			}
		} else if (tab == 'news') {
			SC.page.get('contentView').set('content', SC.page.get('newsView'));			
		} else if (tab == 'connection') {
			SC.page.get('contentView').set('content', SC.page.get('loginView'));
		}
	}.observes('tab'),
	openChat: function() {
		var currentTab = Frontend.navController.get('tab');
		if (currentTab == 'connection') {
			Frontend.errorMessageController.showErrorDialog("NotLoggedIn_Title".loc(),
				"NotLoggedIn_Message".loc(), null);
		} else if (currentTab == 'chat') {
		} else {
			Frontend.navController.set('tab', 'chat');
		}		
	},
	openPrivate: function() {
		var conversations = Frontend.Conversation.findAll();
		var currentConversation = Frontend.chatController.get('currentConversation');
		for (var i = 0; i < conversations.length; i++) {
			if (conversations[i] == currentConversation) {
				if (i == conversations.length - 1) {
					Frontend.chatController.set('currentConversation', conversations[0]);
				} else {
					Frontend.chatController.set('currentConversation', conversations[i + 1]);
				}
				break;
			}
		}
		Frontend.userlistController.refresh();
		Frontend.chatController.updateChatView();
	},
	openFiles: function() {
		Frontend.appController.notImplemented();		
	},
	openNews: function() {
		var currentTab = Frontend.navController.get('tab');
		if (currentTab == 'connection') {
			Frontend.errorMessageController.showErrorDialog("NotLoggedIn_Title".loc(),
				"NotLoggedIn_Message".loc(), null);
		} else if (currentTab == 'news') {
		} else {
			Frontend.newsController.requestNews();
			Frontend.navController.set('tab', 'news');
		}
	},
}) ;
