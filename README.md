# WebApp

Web applicatin using for NodeJs for CSYE6225

## Installation Details

### Locally

**Install Node**

```javascript
sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -
sudo apt-get install nodejs
```

**Check NodeJs and npm version**

```javascript
node - v;
```

npm

```javascript
npm - v;
```

**Install all package dependencies**

```javascript
npm i
```

**Install Mysql and create a database**

```javascript
sudo apt-get install mysql-server
```

```javascript
npm install --save sqlite3
```

Create config.json file in the config folder (similar to config.test.json) with key as development and values -

- username
- password
- database
- host
- dialect

Create a database with the name set in config.json

**Start application**

```javascript
npm start
```

**Run unit tests**

```javascript
npm test
```
