var _ = require('lodash'),
    Q = require( 'q' ),
    util = require('./util.js'),
    google = require('googleapis'),
    service = google.gmail('v1');

var pickInputs = {
        'id': { key: 'id', validate: { req: true } },
        'userId': { key: 'userId', validate: { req: true } }
    };

var trash_msg = function( app, service, user, msg_id ) {
    var deferred = Q.defer();
    service.users.messages.delete( { 'id': msg_id, 'userId': user } , function( err ) {
        if ( err ) { return deferred.reject( err ) }
        else       { return deferred.resolve() }
    } );

    return deferred.promise;
};

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var OAuth2 = google.auth.OAuth2,
            oauth2Client = new OAuth2(),
            credentials = dexter.provider('google').credentials();

        // set credential
        oauth2Client.setCredentials({
            access_token: _.get(credentials, 'access_token')
        });
        google.options({ auth: oauth2Client });

        var ids  = step.input( 'id' );
        var user = step.input( 'userId' ).first();

        var deletes = [ ];
        var app = this;

        ids.each( function( id ) {
            if ( id ) deletes.push( trash_msg( app, service, user, id ) );
        } )

        Q.all( deletes )
          .then( function() { app.complete() } )
          .fail( function( err ) { app.fail( err ) } );
    }
};
