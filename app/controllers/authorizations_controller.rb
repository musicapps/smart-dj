class AuthorizationsController < ApplicationController
  
  def show
    source=params[:source]
    id=params[:id]
  

    auth=Authorizations.find_by_source_and_source_id(source, id)
    if auth
      render :json => { :auth_id=>auth.auth_id }
    else
      raise_404
    end
    
  end
  
  def create
    auth = Authorizations.new(params[:auth])

    if auth.save
      render :json => {  }
    else
      raise_404
    end
  end
end
