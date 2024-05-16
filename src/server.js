var PROTO_PATH = __dirname + "/../proto/index.proto";

var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
var contact_proto = grpc.loadPackageDefinition(packageDefinition).contactsproto;

const contacts = require("./mockData");

/**
 * Implements the SayHello RPC method.
 */
function sayHello(call, callback) {
  callback(null, { message: "Hello guys" + call.request.name });
}

function getContacts(call, callback) {
  callback(null, { contacts });
}

function getContact(call, callback) {
  const contactId = call.request.id;
  const contact = contacts.find((c) => c.id === contactId);
  callback(null, contact);
}

function deleteContact(call, callback) {
  const contactId = call.request.id;
  const index = contacts.findIndex((c) => c.id === contactId);
  contacts.splice(index, 1);
  callback(null, {});
}

function createContact(call, callback) {
  const { fullName, email, avatar } = call.request;
  const newContact = {
    id: Date.now().toString(),
    fullName,
    email,
    avatar,
    isFavorite: false,
  };
  contacts.push(newContact);
  callback(null, newContact);
}

function setContactFavorite(call, callback) {
  const { id, isFavorite } = call.request;
  const contact = contacts.find((c) => c.id === id);
  contact.isFavorite = isFavorite;
  callback(null, contact);
}

function main() {
  var server = new grpc.Server();
  server.addService(contact_proto.Contacts.service, {
    sayHello: sayHello,
    getContacts: getContacts,
    getContact: getContact,
    deleteContact,
    createContact,
    setContactFavorite,
  });

  const port = 50051;

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, runningPort) => {
      if (error) {
        console.error(error);
      } else {
        console.log(`Server started at port ${runningPort}`);
      }
    }
  );
}

main();
