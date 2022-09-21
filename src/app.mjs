import express from 'express';
import { createServer } from 'http';
import { join } from 'path';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import Filter from 'bad-words';

import { generateMessage, generateLocationMessage } from './utils/messages.mjs';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(join(__dirname, '../public')));

io.on('connection', (socket) => {
	console.log('New WebSocket connection');
	socket.emit('message', generateMessage('Daim', 'Welcome !'));

	socket.broadcast.emit('message', generateMessage('Daim', 'A new user has joined !'));

	socket.on('sendMessage', (message, callback) => {
		io.emit('message', new Filter().clean(message), callback);
	});

	socket.on('disconnect', () => {
		io.emit('message', generateMessage('Daim', 'A user has left !'));
	});

	socket.on('sendLocation', (coords, callback) => {
		io.emit(
			'location',
			generateLocationMessage(
				'Daim',
				`https://google.com/maps?q=${coords.latitude},${coords.longitude}`
			),
			callback
		);
	});
});

export default server;
