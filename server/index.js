const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
	user: keys.pgUser,
	host: keys.pgHost,
	database: keys.pgDatabase,
	password: keys.pgPassword,
	port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));

pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)').catch((err) => console.log(err));

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
	host: keys.redisHost,
	port: keys.redisPort,
	retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

// app.get('/', (req, res) => {
//   res.send('Hi');
// });

const prometheus = require('prom-client');
const collectDefaultMetrics = prometheus.collectDefaultMetrics;

// gauge metrics
const nodeRandomValue = new prometheus.Gauge({
	name: 'node_random_value',
	help: 'random value generated in node'
});
	
const visitsValue = new prometheus.Counter({ name: 'Visits', help: 'Number of visits' });
// Probe every 5th second.
collectDefaultMetrics({ timeout: 5000 });

app.get('/', async (req, res) => {
	console.log('request made' + req);
	let randValue = Math.random();
	console.log('random value sent' + randValue);
	nodeRandomValue.set(randValue);
	visitsValue.increase();
	res.send('home page');
});

app.get('/values/all', async (req, res) => {
	const values = await pgClient.query('SELECT * from values');

	res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
	redisClient.hgetall('values', (err, values) => {
		res.send(values);
	});
});

app.post('/values', async (req, res) => {
	const index = req.body.index;

	if (parseInt(index) > 40) {
		return res.status(422).send('Index too high');
	}

	redisClient.hset('values', index, 'Nothing yet!');
	redisPublisher.publish('insert', index);
	pgClient.query('INSERT INTO values(number) VALUES($1)', [ index ]);

	res.send({ working: true });
});
app.get('/metrics', (req, res) => {
	res.set('Content-Type', prometheus.register.contentType);
	res.end(prometheus.register.metrics());
	
});

app.listen(5000, (err) => {
	console.log('Listening');
});
