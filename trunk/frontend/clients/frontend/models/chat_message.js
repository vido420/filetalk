// ==========================================================================
// Frontend.ChatMessage
// ==========================================================================

require('core');

/** @class

  (Document your class here)

  @extends SC.Record
  @author AuthorName
  @version 0.1
*/
Frontend.ChatMessage = SC.Record.extend(
/** @scope Frontend.ChatMessage.prototype */ {

});

Frontend.ChatMessage.removeAll = function() {
	var records = Frontend.ChatMessage.findAll();
	if (records == null) { return; }
	for (var i = records.length - 1; i >= 0; i--) {
		SC.Store.removeRecord(records[i]);
	}
};
