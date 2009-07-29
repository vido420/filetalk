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
	getConversation: function(cid) {
		var conversation = Frontend.Conversation.find(cid ? cid : 'default');
		if (!conversation) {
			SC.Store.addRecord(Frontend.Conversation.create({ guid: cid, chatHTML: '', userlist: [] }));
			conversation = Frontend.Conversation.find(cid);
		}
		return conversation;
	},
	updateChatView: function() {
		var currentConversation = Frontend.chatController.get('currentConversation');
		if (currentConversation) {
			var chatView = Frontend.appController.getChatHistoryView();
			chatView.set('innerHTML', currentConversation.get('chatHTML'));
			console.log("Setting currentScrollPos to ", currentConversation.get('scrollPos'));
			this.set('currentScrollPos', currentConversation.get('scrollPos'));
		}
	}.observes('currentConversation'),
	currentScrollPos: 0,
	updateScrollPos: function() {
		var currentScrollPos = this.get('currentScrollPos');
		var scrollView = Frontend.appController.getChatHistoryViewScrollView();
		scrollView.rootElement.scrollTop = currentScrollPos;
		var currentConversation = Frontend.chatController.get('currentConversation');
		if (currentConversation) {
			currentConversation.set('scrollPos', currentScrollPos);
		}
	}.observes('currentScrollPos'),
	send: function() {
		var messageField = SC.page.getPath('chatView.chatSplitView.chatMain.chatForm.chatMessage');
		var msg = messageField.get('value');
		if (msg != null) {
			var currentConversation = Frontend.chatController.get('currentConversation');
			var params;
			if (currentConversation && currentConversation.guid != 'default')
			 	params = { m: msg, cid: currentConversation.guid };
			else
				params = { m: msg };
			var request = new Ajax.Request('/backend/chat', {
				method: 'post',
				requestHeaders: Frontend.appController.buildHeaders(),
				parameters: params,
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
			var request = new Ajax.Request('/backend/pchat/start', {
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
	invitedToConversationId: null,
	invitationQueue: [],
	showChatInvitationDialog: function(conversationId, user) {
		var invitedToConversationId = Frontend.chatController.get('invitedToConversationId');
		if (invitedToConversationId) {
			var invitation = { cid: conversationId, user: user };
			Frontend.chatController.get('invitationQueue').push(invitation);
		} else {
			Frontend.chatController.set('invitedToConversationId', conversationId);
			var text = sprintf("PrivateChat_Invitation_Text".loc(), user.get('nick'));
			SC.page.getPath('invitationDialog.invitationMessage').set('value', text);
			SC.page.get('invitationDialog').set('isVisible', true);
		}
	},
	hideChatInvitationDialog: function() {
		SC.page.get('invitationDialog').set('isVisible', false);
		Frontend.chatController.set('invitedToConversationId', null);
		var queue = Frontend.chatController.get('invitationQueue');
		if (queue.length > 0) {
			var invitation = queue.shift();
			Frontend.chatController.showChatInvitationDialog(invitation.cid, invitation.user);
		}
	},
	acceptChatInvitation: function() {
		var invitedToConversationId = Frontend.chatController.get('invitedToConversationId');
		var request = new Ajax.Request('/backend/pchat/accept', {
			method: 'post',
			requestHeaders: Frontend.appController.buildHeaders(),
			parameters: { cid: invitedToConversationId },
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response) {
			},
		   	onFailure: function() {
			}
		});
		Frontend.chatController.hideChatInvitationDialog();
	},
	refuseChatInvitation: function() {
		var invitedToConversationId = Frontend.chatController.get('invitedToConversationId');
		var request = new Ajax.Request('/backend/pchat/refuse', {
			method: 'post',
			requestHeaders: Frontend.appController.buildHeaders(),
			parameters: { cid: invitedToConversationId },
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response) {
			},
		   	onFailure: function() {
			}
		});
		Frontend.chatController.hideChatInvitationDialog();		
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
