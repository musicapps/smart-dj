class FeedbackController < ApplicationController
  
  def show
    # param is venueid
    venue_id=params[:id]
    
    feedback=SongFeedback.find_all_by_foursquare_venue_id(venue_id)
    songs=Songs.all    
    render :json => { :feedback=>feedback, :songs=>songs }
    
  end
  
  def create
    song=Songs.find_last_by_echo_nest_song_id(params['feedback']['echo_nest_song_id'])
    raise_404 unless song
    feedback = SongFeedback.new(:song_id=>song.id, :foursquare_venue_id=>song.foursquare_venue_id, :listener_foursquare_id=>params['feedback']['listener_foursquare_id'], :vote_attribute=>params['feedback']['vote_attribute'] )

    if feedback.save
      render :json => {  }
    else
      raise_404
    end
    
  end    
  
end
