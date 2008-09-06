require File.join(File.dirname(__FILE__), "..", 'spec_helper.rb')

describe Update, "index action" do
  before(:each) do
    dispatch_to(Update, :index)
  end
end