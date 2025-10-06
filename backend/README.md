# Backend Setup

The backend expects at least one MongoDB connection string in a local `.env` file that lives next to `server.js`.

```bash
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/<db>?retryWrites=true&w=majority
# Optional: provide the standard driver string that Mongo Atlas shows under "Drivers"
MONGO_URI_DIRECT=mongodb://<username>:<password>@<shard-hosts>/<db>?ssl=true&replicaSet=...&authSource=admin&retryWrites=true&w=majority
```

## Why two variables?

The default Atlas copy button provides an `mongodb+srv://` URL. It requires a DNS lookup for the `_mongodb._tcp.<cluster>` SRV record. Some local networks block SRV lookups which produces the `querySrv ESERVFAIL` error you saw when running `npm start`.

Setting `MONGO_URI_DIRECT` to the regular `mongodb://` connection string gives the server a fallback that does not rely on SRV DNS. The server will try `MONGO_URI` first, and if it encounters `ESERVFAIL` or `ENOTFOUND` it automatically retries with `MONGO_URI_DIRECT`.

If you only have the direct connection string you can set `MONGO_URI_DIRECT` by itself.

## Starting the server

```bash
npm install
npm start
```

If the connection succeeds you will see `MongoDB connected via ...` in the logs followed by `Server running on port 5001`.