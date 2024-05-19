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

function checkIsAuthenticated(call, callback) {
  try {
    const [authorization] = call.metadata.get("authorization");
    const credentials = authorization.split(" ")[1];
    const [username, password] = Buffer.from(credentials, "base64")
      .toString()
      .split(":");
    if (username === "user" && password === "123") {
      return true;
    }
    throw new Error("Invalid authorization");
  } catch (e) {
    callback({
      code: grpc.status.UNAUTHENTICATED,
      message: "Invalid authorization",
    });
    return false;
  }
}

function login(call, callback) {
  const { username, password } = call.request;
  if (username === "user" && password === "123") {
    const credentials = btoa(username + ":" + password);
    callback(null, { credentials });
  } else {
    callback({
      code: grpc.status.UNAUTHENTICATED,
      message: "Invalid username or password",
    });
  }
}

function getContacts(call, callback) {
  if (!checkIsAuthenticated(call, callback)) {
    return;
  }
  callback(null, { contacts });
}

function getContact(call, callback) {
  if (!checkIsAuthenticated(call, callback)) {
    return;
  }
  const contactId = call.request.id;
  const contact = contacts.find((c) => c.id === contactId);
  callback(null, contact);
}

function deleteContact(call, callback) {
  if (!checkIsAuthenticated(call, callback)) {
    return;
  }
  const contactId = call.request.id;
  const index = contacts.findIndex((c) => c.id === contactId);
  contacts.splice(index, 1);
  callback(null, {});
}

function createContact(call, callback) {
  if (!checkIsAuthenticated(call, callback)) {
    return;
  }
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
  if (!checkIsAuthenticated(call, callback)) {
    return;
  }
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
    login,
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
