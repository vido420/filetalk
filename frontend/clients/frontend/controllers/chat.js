// ==========================================================================
// Frontend.ChatController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.chatController = SC.Object.create(
/** @scope Frontend.chatController */ {
	currentConversation: null,
	appendChat: function(msg, cid) {
		var conversation = Frontend.Conversation.find(cid ? cid : 'default');
		if (!conversation) {
			SC.Store.addRecord(Frontend.Conversation.create({ guid: cid, chatHTML: '', userlist: [] }));
			conversation = Frontend.Conversation.find(cid);
		}
		conversation.set('chatHTML', conversation.get('chatHTML') + msg);
		if (conversation == Frontend.chatController.get('currentConversation')) {
			return true;
		}
		return false;
	},
	updateChatView: function() {
		var currentConversation = Frontend.chatController.get('currentConversation');
		if (currentConversation) {
			var chatView = Frontend.appController.getChatHistoryView();
			chatView.set('innerHTML', currentConversation.get('chatHTML'));
		}
	}.observes('currentConversation'),
	send: function() {
		var messageField = SC.page.getPath('chatView.chatSplitView.chatMain.chatForm.chatMessage');
		var msg = messageField.get('value');
		if (msg != null) {
			var request = new Ajax.Request('/backend/chat', {
				method: 'post',
				requestHeaders: Frontend.appController.buildHeaders(),
				parameters: { m: msg },
				evalJS: false,
				evalJSON: false,
				onSuccess: function(response) {
				},
			   	onFailure: function() {
				}
			});
			messageField.set('value', '');
		}
	},
	startChatWithUser: function() {
		var selection = Frontend.userlistController.get('selection');
		if (!selection || selection.length < 1) {
			alert('Please select the user whom you want to invite to private chat.');
		} else if (selection.length > 1) {
			// TODO: this limitation shouldn't exist
			alert('You may only invite a single user to private chat.')
		} else {
			var request = new Ajax.Request('/backend/pchat', {
				method: 'post',
				requestHeaders: Frontend.appController.buildHeaders(),
				parameters: { user: selection[0].guid },
				evalJS: false,
				evalJSON: false,
				onSuccess: function(response) {
				},
			   	onFailure: function() {
				}
			});
		}
	},
	userNick: "error",
	showChangeNickDialog: function() {
		var userNick = Frontend.chatController.get('userNick');
		SC.page.get('nameDialog').set('isVisible', true);
		SC.page.getPath('nameDialog.nameForm.nameField').rootElement.value = userNick;
		SC.page.getPath('nameDialog.nameForm.nameField').rootElement.select();
	},
	hideChangeNickDialog: function() {
		SC.page.get('nameDialog').set('isVisible', false);
	},
	changeNick: function() {
		var nick = SC.page.getPath('nameDialog.nameForm.nameField.value');
		if (nick != null) {
			var request = new Ajax.Request('/backend/chat/set_nick', {
				method: 'post',
				requestHeaders: Frontend.appController.buildHeaders(),
				parameters: { n: nick },
				evalJS: false,
				evalJSON: false,
				onSuccess: function(response) {
					Frontend.chatController.set('userNick', ('' + response.transport.responseText));
					Frontend.chatController.hideChangeNickDialog();
				},
			   	onFailure: function() {
				}
			});
		}
	},
}) ;
