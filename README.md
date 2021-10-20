# Discord Password Manager

Discord Password Manager is a discord bot created [node.js](https://nodejs.org/en/) for password management

## Installation

Install [node.js](https://nodejs.org/en/) and the package manager [npm](https://www.npmjs.com//) to install Password Manager.

```bash
npm install
```

## Usage
Change the PIN and your bot token in config.json
```javascript
{
  "prefix": "!",
  "pin": "1234",
  "token": "token"
}
```
Complete the database informations in [./database/db.js](https://github.com/Emsa001/Discord-PasswordManager/blob/main/database/db.js)
```javascript
const { Sequelize } = require("sequelize");

module.exports = new Sequelize("db_name", "db_user", "db_password", {
  host: "db_host",
  dialect: "mysql",
});
```
After that run the but using
```
node index.js
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
