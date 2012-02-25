# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20120225221902) do

  create_table "authorizations", :force => true do |t|
    t.string   "source"
    t.string   "source_id"
    t.string   "auth_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "song_feedbacks", :force => true do |t|
    t.integer  "song_id"
    t.string   "foursquare_venue_id"
    t.string   "listener_foursquare_id"
    t.string   "vote_attribute"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "songs", :force => true do |t|
    t.string   "foursquare_venue_id"
    t.string   "dj_foursquare_id"
    t.string   "echo_nest_song_id"
    t.datetime "start_play_time"
    t.integer  "currently_playing"
    t.float    "song_length"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
