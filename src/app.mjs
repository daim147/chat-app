import express from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import Filter from 'bad-words';
import { generateMessage, generateLocationMessage } from './utils/messages.mjs';
import { getUser, removeUser, addUser, getUsersInRoom } from './utils/users.mjs';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, '../public')));

io.on('connection', (socket) => {
	console.log('New WebSocket connection');

	socket.on('join', (options, callback) => {
		const { error, user } = addUser({ id: socket.id, ...options });

		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		socket.emit('message', generateMessage('Admin', 'Welcome!'));

		socket.broadcast
			.to(user.room)
			.emit('message', generateMessage('Admin', `${user.username} has joined!`));

		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room),
		});

		callback();
	});

	socket.on('sendMessage', (message, callback) => {
		const user = getUser(socket.id);
		io.to(user.room).emit(
			'message',
			generateMessage(user.username, new Filter().clean(message)),
			callback
		);
		callback();
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);

		if (user) {
			io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));

			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room),
			});
		}
	});

	socket.on('sendLocation', (coords, callback) => {
		const user = getUser(socket.id);
		io.to(user.room).emit(
			'location',
			generateLocationMessage(
				user.username,
				`https://google.com/maps?q=${coords.latitude},${coords.longitude}`
			)
		);
		callback();
	});
});

export default server;
