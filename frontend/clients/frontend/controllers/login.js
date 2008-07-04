// ==========================================================================
// Frontend.LoginController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.loginController = SC.Object.create(
/** @scope Frontend.loginController */ {

  // TODO: Add your own code here.
	login: function() {
	//	alert(SC.page.getPath('loginForm.loginName.value') + '/' +
	//		  SC.page.getPath('loginForm.loginPassword.value'));
		SC.page.get('loginProgresDialog').set('isVisible', YES);
		/*
		Blah.request = new Ajax.Request( '/backend/login', {
			method: 'POST',
			parameters: {
				name: SC.page.getPath('loginForm.loginName.value'),
				pass: SC.page.getPath('loginForm.loginPassword.value'),
			},
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response) {
				alert("ABC");
		      },
		      onFailure: function() {
		        alert("DEF");
		      }
		    });
		*/
	},
}) ;
