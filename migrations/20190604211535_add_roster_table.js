
exports.up = function(knex, Promise) {
  return knex.schema.createTable('Roster', table => {
    table.string('Id').primary().index()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('Roster')
};
