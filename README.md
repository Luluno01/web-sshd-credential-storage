# Web-SSHD Credential Storage

Per-user WebSSHD credential storage. Meant to be used with [web-sshd](https://github.com/Luluno01/web-sshd) and [Cloush](https://github.com/Luluno01/cloush).

## Usage

### Clone

To run a standalone WebSSHD Credential Storage, clone this repository.

```bash
git clone https://github.com/Luluno01/web-sshd-credential-storage.git --depth=1
```

### Install Dependencies

```bash
cd web-sshd-credential-storage
npm install
```

### Database

Before you run this server, you need to set up the database. The recommended database is SQLite. If you are using SQLite, the database file will be created if it does not exist; for other database such as PostgreSQL, you will need to install the corresponding database server and create database manually. Also, the database driver(s) for Sequelize (see [Sequelize installation documentation](https://sequelize.org/master/manual/getting-started.html#installing)) need to be installed in case of database server other than SQLite or PostgreSQL being used.

To indicate this server of what database connection should be used, set the environment variable `DB_URL`. For example

```bash
export DB_URL="sqlite://credentials.db"
```

Or

```bash
export DB_URL="postgres://myUser:myPassword@localhost:5432/websshd"
```

Note that the `DB_URL` environment variable is required for all database-related operations (most of the following scripts).

### Run Server

```bash
npm run serve
```

**Warning: do not expose this server directly because it does not provide authentication utility by itself.** You **MUST** set up a reverse-proxy before this server, and guard the APIs by Basic Auth (and thus SSL **MUST** be enabled).

I personally recommend you to use [Caddy](https://caddyserver.com/). Here is an example of `Caddyfile` for reverse proxy:

```
ssh.example.com {
    gzip
    root /www/ssh.example.com
    cors / https://cloush.example.com
    basicauth / yourUsername yourPassword
    header / Access-Control-Allow-Headers Authorization
    proxy / http://127.0.0.1:3000 {
        transparent
    }
}
```

Note the `cors` and `header` directives, they are compulsory if your want to access the APIs from other domain(s).

### CLI Script

There are some CLI scripts can be used to manage the database, including

* `sync`: create tables (and create database file if you are using SQLite)
* `add`: add a new credential
* `list`: list all credentials, or credentials in a specific group in database
* `update`: modify an existing credential
* `delete`: remove one or multiple credentials
* `rename`: rename a group

**Warning: existing tables will be dropped and recreated by script `sync`.**

These scripts are available via `npm`:

```bash
npm run <script>
```

For usage information, run these scripts with `--help` (`-h`) option

```bash
npm run <script> -- --help
```

You may have already noted that you should pass your arguments in this pattern (note the double dashes after the script name):

```bash
npm run <script> -- [args...]
```

### Config

```JavaScript
{
  "port": 3000,  // Listening port
  "CORS": [  // Allowed origins
    "http://localhost:3000"
  ]
}
```
