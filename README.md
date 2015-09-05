This application exposes a RESTful API to train and use Markov chains.

Features:
* multiple independent chains
* arbitrary order of the model
* persist as much states you like on PostgreSQL (version 9.5 or later are needed, it uses the INSERT...ON CONFLICT... aka UPSERT)
* accept sequences in JSON, text, MSGPACK (yet to be tested)
* UTF-8 support
* reasonably fast: on my laptop (dual core, 8GB RAM, no SSD) loads ~100 reddit posts per second

How to use:

Run he application with `npm start`, or a command like

`node index.js --writePort 3002 --postgresConnString 'postgres://postgres:mysecretpassword@172.17.0.1/postgres'`

the flags are all optionals, environment variables can be used too. The arguments are:


| Name | Description | default |
|------|-------------|---------|
|writePort |the port for the insertion endpoints| 3000|
|metaDataPort | the port for the metadata endpoints| 3001|
|readPort |the port to read endpoints| 3002|
|postgresConnString | the postgres connection string |postgres://postgres:mysecretpassword@127.0.0.1/postgres |,
|maxPendingInsertions |maximum number of concurrent insertions, then the server will answer with a HTTP 429| 5|
|CORS| Whether to accept cross origin requests| true|


 TO DO:
 * test MSGPACK and maybe other formats
 * add metadata endpoints
 * add an in-memory "persistor"
 * add a Redis persistor
