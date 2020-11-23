(function () {
    var _myConnection, // My RTCPeerConnection instance
        _myMediaStream; // My MediaStream instance
    var myNavigator;
    var whoIam = Arg.get("name");
    var otherId = Arg.get("call_id")
    var videoMini = document.getElementById('mini-video');
    var videoElement = document.getElementById('local-video')
    var muteAudio = document.getElementById('mute-audio')
    var muteVideo = document.getElementById('mute-video')
    var fullScreen = document.getElementById('fullscreen')
    var hangupButton = document.getElementById('hangup')
    hangupButton.addEventListener('click', hangup);
    muteAudio.addEventListener('click', mutingAudio)
    muteVideo.addEventListener('click', mutingVideo)
    fullScreen.addEventListener('click', screenFull)
    // Set up the SignalR connection
    var video = $.connection.videoCallHub;

    $.connection.hub.start(function () {
        console.log('connected to signal server.');
        var UserName = $('#hdnSession').data('value');
        var UserID = parseInt($('#hdnSessionId').data('value'));
        video.server.connect(UserName, UserID);
        if (whoIam == "caller") {
            console.log('init');
            init(); // Start up the app
        }
        else if (whoIam == "reciever") {
            console.log('startcall');
            startCall();
        }
    });

    function onError(error) {
        console.error(error);
    };

    function _createConnection() {
        console.log('creating RTCPeerConnection...');

        // Create a new PeerConnection
        _myConnection = new RTCPeerConnection(null); // null = no ICE servers

        // A new ICE candidate was found
        _myConnection.onicecandidate = function (event) {
            if (event.candidate) {
                // Let's send it to our peer via SignalR
                video.server.send(otherId, JSON.stringify({ "candidate": event.candidate }));
            }
        };

        // New remote media stream was added
        _myConnection.onaddstream = function (event) {      
            // Attach the stream to the Video element via adapter.js
            attachMediaStream(videoElement, event.stream);
            attachMediaStream(videoMini, _myMediaStream);
            videoMini.classList.add('active');
            hangupButton.classList.remove('hidden');
            hangupButton.classList.add('active');
        };

        return _myConnection;
    }

    video.client.userDisconnected = function (userName) {
        videoMini.classList.remove('active')
        videoMini.classList.add('hidden')
        attachMediaStream(videoElement, _myMediaStream)
        hangupButton.classList.remove('active')
        hangupButton.classList.add('hidden')
    }

    // Callback that receives notifications from the SignalR server
    video.client.newMessage = function (data) {
        var message = JSON.parse(data),
            connection = _myConnection || _createConnection(null);

        // An SDP message contains connection and media information, and is either an 'offer' or an 'answer'
        if (message.sdp) {
            connection.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
                if (connection.remoteDescription.type == 'offer') {
                    console.log('received offer, sending answer...');

                    // Add our stream to the connection to be shared
                    connection.addStream(_myMediaStream);

                    // Create an SDP response
                    connection.createAnswer(function (desc) {
                        // Which becomes our local session description
                        connection.setLocalDescription(desc, function () {
                            // And send it to the originator, where it will become their RemoteDescription
                            video.server.send(otherId, JSON.stringify({ 'sdp': connection.localDescription }));
                        });
                    }, function (error) { console.log('Error creating session description: ' + error); });
                } else if (connection.remoteDescription.type == 'answer') {
                    console.log('got an answer');
                }
            });
        } else if (message.candidate) {
            console.log('adding ice candidate...');
            connection.addIceCandidate(new RTCIceCandidate(message.candidate));
        }

        _myConnection = connection;
    };

    video.client.shareScreen = function (data) {
        console.log('shareScreen')
    }

    function init() {
        console.log('init');
        // Request permissions to the user's hardware
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        }).then(stream => {

            // Store off our stream so we can access it later if needed
            _myMediaStream = stream;

            // Add the stream to our Video element via adapter.js
            attachMediaStream(videoElement, _myMediaStream);
        }, onError);

    }

    function startCall() {
        // Request permissions to the user's hardware

        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        }).then(stream => {

            // Store off our stream so we can access it later if needed
            _myMediaStream = stream;

            // Add the stream to our Video element via adapter.js
            attachMediaStream(videoElement, _myMediaStream);

            _myConnection = _myConnection || _createConnection(null);

            // Add our stream to the peer connection
            _myConnection.addStream(_myMediaStream);

            // Create an offer to send our peer
            _myConnection.createOffer(function (desc) {
                // Set the generated SDP to be our local session description
                _myConnection.setLocalDescription(desc, function () {
                    // And send it to our peer, where it will become their RemoteDescription
                    video.server.send(otherId, JSON.stringify({ "sdp": desc }));
                });
            }, function (error) { console.log('Error creating session description: ' + error); });
        }, onError);
    }

    function hangup() {
        console.log('Ending call');
        video.server.hangupCall(otherId);
        window.location = "Index";
    }

    function mutingAudio() {
        if (muteAudio.classList.contains('on')) {
            muteAudio.classList.remove('on');
            _myMediaStream.getAudioTracks()[0].enabled = true; 
            // turn it off: CSS hides `svg path.on` and displays `svg path.off`
        } else {
            // turn it on: CSS displays `svg.on path.on` and hides `svg.on path.off`
            muteAudio.classList.add('on');
            _myMediaStream.getAudioTracks()[0].enabled = false;
        }
        
    }

    function mutingVideo() {
        if (muteVideo.classList.contains('on')) {
            muteVideo.classList.remove('on');
            _myMediaStream.getVideoTracks()[0].enabled = true;
            // turn it off: CSS hides `svg path.on` and displays `svg path.off`
        } else {
            // turn it on: CSS displays `svg.on path.on` and hides `svg.on path.off`
            muteVideo.classList.add('on');
            _myMediaStream.getVideoTracks()[0].enabled = false;
        }
    }

    function screenFull() {
        if (fullScreen.classList.contains('on')) {
            fullScreen.classList.remove('on');
            if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) { /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen();
  }
            // turn it off: CSS hides `svg path.on` and displays `svg path.off`
        } else {
            // turn it on: CSS displays `svg.on path.on` and hides `svg.on path.off`
            fullScreen.classList.add('on');
            if (document.body.requestFullscreen) {
                document.body.requestFullscreen();
            } else if (document.body.mozRequestFullScreen) { /* Firefox */
                document.body.mozRequestFullScreen();
            } else if (document.body.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                document.body.webkitRequestFullscreen();
            } else if (document.body.msRequestFullscreen) { /* IE/Edge */
                document.body.msRequestFullscreen();
            }
            
        }
    }
})();