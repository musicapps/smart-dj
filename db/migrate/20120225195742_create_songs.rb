class CreateSongs < ActiveRecord::Migration
  def change
    create_table :songs do |t|
      t.string :foursquare_venue_id
      t.string :dj_foursquare_id
      t.string :echo_nest_song_id
      t.timestamp :start_play_time
      t.boolean :currently_playing
      t.float :song_length

      t.timestamps
    end
  end
end
