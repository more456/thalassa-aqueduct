var assert = require('assert')
  , portfinder = require('portfinder')
  , crdt = require('crdt')
  , Data = require('../lib/Data')
  , ThalassaAgent = require('../lib/ThalassaAgent')
  , Thalassa = require('thalassa')
  ;

describe ('ThalassaAgent', function () {

  describe ('existing backend', function (done) {
    var port, server, client, host = '127.0.0.1', backendName = 'be1',
        role = 'foo', version = '1.1.1', clientPort = '80';

    before(function (done) {
      portfinder.getPort(function (err, aPort) {
        assert.ifError(err);
        port = aPort;

        server = new Thalassa.Server({ host: host, port: port });
        client = new Thalassa.Client({ host: host, port: port });
        client.register(role, version, clientPort);
        done();
      });

    });

    after(function () {
      server.close();
    });

    it ('should register/free add/remove members', function (done) {
      var data = new Data();
      var agent = new ThalassaAgent({ data: data, host: host, port: port });

      data.setBackend({ name: backendName, type: 'spindrift', role: role, version: version });
      client.connect();

      setTimeout(function() {
        var backend = data.backends.get(data.backendId(backendName));
        assert(backend);
        var members = backend.toJSON().members;
        assert.equal(members.length, 1);
        assert.equal(members[0].role, role);
        assert.equal(members[0].version, version);
        client.unregister(role, version, clientPort);

        setTimeout(function() {
          var backend = data.backends.get(data.backendId(backendName));
          assert(backend);
          var members = backend.toJSON().members;
          assert.equal(members.length, 0);
          done();
        }, 50);
      }, 50);
    });
  });

  describe ('existing service registraions', function (done) {
    var port, server, client, agent, data,
        host = '127.0.0.1', backendName = 'be1',
        role = 'foo', version = '1.1.1', clientPort = '80';

    before(function (done) {
      data = new Data();

      portfinder.getPort(function (err, aPort) {
        assert.ifError(err);
        port = aPort;

        server = new Thalassa.Server({ host: host, port: port });
        agent = new ThalassaAgent({ data: data, host: host, port: port });
        client = new Thalassa.Client({ host: host, port: port });
        client.register(role, version, clientPort);
        client.connect();
        client.on('register', function (service) {
          if (service.role === role && service.version === version) setTimeout(done, 10);
        });
      });
    });

    after(function () {
      server.close();
    });

    it ('should add/remove members on backend creation', function (done) {

      data.setBackend({ name: backendName, type: 'spindrift', role: role, version: version });

      setTimeout(function() {
        var backend = data.backends.get(data.backendId(backendName));
        assert(backend);
        var members = backend.toJSON().members;
        assert.equal(members.length, 1);
        assert.equal(members[0].role, role);
        assert.equal(members[0].version, version);
        client.unregister(role, version, clientPort);

        setTimeout(function() {
          var backend = data.backends.get(data.backendId(backendName));
          assert(backend);
          var members = backend.toJSON().members;
          assert.equal(members.length, 0);
          done();
        }, 10);
      }, 10);
    });
  });

});