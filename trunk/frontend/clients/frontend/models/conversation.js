// ==========================================================================
// Frontend.Conversation
// ==========================================================================

require('core');

/** @class

  (Document your class here)

  @extends SC.Record
  @author AuthorName
  @version 0.1
*/
Frontend.Conversation = SC.Record.extend(
/** @scope Frontend.Conversation.prototype */ {
	scrollPos: 0,
	chatHTML: '&nbsp',
	userlist: [],
}) ;

Frontend.Conversation.removeAll = function() {
	var records = Frontend.Conversation.findAll();
	if (records == null) { return; }
	for (var i = records.length - 1; i >= 0; i--) {
		SC.Store.removeRecord(records[i]);
	}
};
