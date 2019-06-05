module.exports = {
  development: {
    client: "mssql",
    connection: {
      host: 'dougdb.database.windows.net',
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: 'Dougdb',
      encrypt: true
    }
  }
}
