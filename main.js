function RequestListener (request , response){
    console.log('RequestListener( request:['+
    'method:' + request.method +','+
    'url:' + request.url +','+
    'httpVersion:' + request.httpVersion +','+ 
    'headers:' + JSON.stringify(request.headers) +
    '], response: ' + response + ' )');
    return RequestListener.impl(request,response);
}

/// Forward declaration of Listener class
function Listener(){ Listener.ctor.apply(this,arguments); }
function PathListener(){ PathListener.ctor.apply(this,arguments); }

/// node.js exports
if(exports){
    exports.RequestListener = RequestListener;
    exports.Listener = Listener;
    exports.PathListener = PathListener;
}

(function(){
    
    function ListenerChain(){
        this.chain = [];
    }
    
    var listenerChain = new ListenerChain();
    
    ListenerChain.prototype.add = function ListenerChain__add( listener ){
        if ( listener instanceof Listener )
        {
            this.chain.push(listener);
        }
        else throw 'Invalid Argument: listener must be instaceof Listener';
    };
    
    ListenerChain.prototype.selectByUrl = function ListenerChain__selectByUrl(url){
        for( var x in this.chain ) if ( this.chain[x].matchUrl(url) ) return this.chain[x];
        return null;
    };
    
    RequestListener.impl = function RequestListener( request , response ){
        var listener = listenerChain.selectByUrl(request.url);
        if(listener) return listener.handle(request, response);
        response.writeHead(503, 'Internal Server Error', {
            'X-Served-By': 'me'
            });
        response.end('Unable to find registered Listener\n');
    };
    
    
    function ListenerBase(){
        console.log('ListenerBase::ListenerBase()');    
    }
    
    ListenerBase.prototype.matchUrl = function ListenerBase__matchUrl(){ return false; };
    
    Listener.prototype = new ListenerBase();
    
    Listener.ctor = function Listener__ctor(){
        console.log('Listener::ctor( argc: '+arguments.length+' )');
    };
    
    Listener.prototype.handle = function Listener__handle( request , response ){
        response.setHeader("Content-Type", "text/html");
        response.writeHead(200, 'OK', {
            'X-Served-By': 'me'
            });
        response.end('Hello, HTTP!\n');
    };
    
    PathListener.prototype = new Listener();
    
    PathListener.ctor = function PathListener__ctor(path){
        console.log('PathListener::ctor( argc: '+arguments.length+' )');
        this.path = path;
        listenerChain.add(this);
    };
    
    PathListener.prototype.matchUrl = function PathListener__matchUrl(url){
        return url == this.path;
    };
    
})();


(function(){
    if(require.main === module){
        console.log('Called as main script');
    } else return;
    
    var http = require('http');
    var server = http.createServer(RequestListener);
    
    var pl = new PathListener('/');
    pl.handle = function Listener__handle( request , response ){
        response.writeHead(200, 'OK', {
            'X-Served-By': 'me',
            'Content-Type': 'text/html'
            });
        response.end('Hello, from Path Listener "/" !\n');
    };
    
    pl = new PathListener('/bla');
    pl.handle = function Listener__handle( request , response ){
        response.writeHead(200, 'OK', {
            'X-Served-By': 'me',
            'Content-Type': 'text/html'
            });
        response.end('Hello, from Path Listener "/bla" !\n');
    };
    
    server.listen(process.env.PORT || '8080', '0.0.0.0');
})();