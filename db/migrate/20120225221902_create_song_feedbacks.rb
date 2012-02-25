class CreateSongFeedbacks < ActiveRecord::Migration
  def change
    create_table :song_feedbacks do |t|
      t.integer :song_id
      t.string :foursquare_venue_id
      t.string :listener_foursquare_id
      t.string :vote_attribute

      t.timestamps
    end
  end
end
