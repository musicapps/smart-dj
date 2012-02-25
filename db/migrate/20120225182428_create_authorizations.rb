class CreateAuthorizations < ActiveRecord::Migration
  def change
    create_table :authorizations do |t|
      t.string :source
      t.string :source_id
      t.string :auth_id

      t.timestamps
    end
  end
end
