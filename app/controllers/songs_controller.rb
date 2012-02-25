class SongsController < ApplicationController
  
  def show
    # param is venueid
    venue_id=params[:id]
    
    s=Songs.find_by_foursquare_venue_id_and_currently_playing(venue_id, 1)
    if s
      render :json => { :song=>s }
    else
      raise_404
    end
    
  end
  
  def create
    song = Songs.new(params[:song])
    song.currently_playing=1;
    song.start_play_time=Time.now;
    if song.save
      #logger.debug song.inspect
      render :json => {  }
      Songs.find_all_by_foursquare_venue_id(song.foursquare_venue_id).each do |s|
        if s.id!=song.id
          s.currently_playing=0;
          s.save
        end
      end
    else
      raise_404
    end
    
  end  
  
end
