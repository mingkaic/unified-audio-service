const grpc = require('shared_grpc');
const routes = require('./routes');

const port = process.env.PORT || '8080';
const service = 'uas';

grpc.buildServer(service, port, {
	"getCaption": routes.getCaption,
	"getPopular": routes.getPopular,
	"search": routes.search
});
