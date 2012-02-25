class ApplicationController < ActionController::Base
  #protect_from_forgery
end

def raise_404
  raise ActionController::RoutingError.new('Not Found')
end
