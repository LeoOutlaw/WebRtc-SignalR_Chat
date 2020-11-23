
$(function () {
    $('#chat_title_bar').click(function (e) {
        $("#chat_box").slideToggle("slow");
        return false;
    });

    var _myConnection;
    var windown;
    var chat = $.connection.chatHub;
    //saber quem esta logado no momento
    registerClientMethods(chat);

    $.connection.hub.start().done(function () {
        //mostra ao servidor que esta conectado
        registerEvents(chat);

    });

    function registerEvents(chat) {
        var UserName = $('#hdnSession').data('value');
        var UserID = parseInt($('#hdnSessionId').data('value'));
        chat.server.connect(UserName, UserID);
    }

    function registerClientMethods(chat) {
        // Calls when user successfully logged in
        chat.client.onConnected = function (id, userName, allUsers, messages, userid) {
            $('#hdId').val(id);
            $('#hdUserName').val(userName);
            // Add All Users
            for (i = 0; i < allUsers.length; i++) {
                AddUser(chat, allUsers[i].Id, allUsers[i].Username, userid);
            }
            // Add Existing Messages
            for (i = 0; i < messages.length; i++) {
                AddMessage(messages[i].FromUserName, messages[i].Messager);
            }
        }

        chat.client.startCallRequest = function (My_connection_id, ToUser_id) {
            chat.server.startCallRequest(ToUser_id, My_connection_id);

            var url = Arg.url("Home/Contact", { call_id: ToUser_id, my_id: My_connection_id , name: "caller" });
            window.location = url;
        }

        chat.client.receiveCallRequest = function (my_id, otherUserId, callerName) {
            console.log("Recebeu uma chamada!");
            //if (confirm(callerName + " esta a ligar-te aceitar? ")) {
            var url = Arg.url("Home/Contact", { call_id: otherUserId , my_id: my_id, name: "reciever"});
            window.location = url;
            /*} else {
                txt = "You pressed Cancel!";
            }*/
        }

        // On New User Connected
        chat.client.onNewUserConnected = function (id, name, userid) {
            AddUser(chat, id, name, userid);
        }

        // On User Disconnected
        chat.client.onUserDisconnected = function (id, userName) {
            $('#' + id).remove();

        }

        chat.client.newMessage = function (data, otherId) {
            var message = JSON.parse(data),
                connection = _myConnection || _createConnection(null);

            // An SDP message contains connection and media information, and is either an 'offer' or an 'answer'
            if (message.sdp) {
                connection.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
                    if (connection.remoteDescription.type == 'offer') {
                        console.log('received offer, sending answer...');

                        // Create an SDP response
                        connection.createAnswer(function (desc) {
                            // Which becomes our local session description
                            connection.setLocalDescription(desc, function () {
                                // And send it to the originator, where it will become their RemoteDescription
                                chat.server.send(otherId, JSON.stringify({ 'sdp': connection.localDescription }));
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
            windown = otherId;
            _myConnection = connection;
        }

        chat.client.sendPrivateMessage = function (windowId, fromUserName, chatTitle, message) {
            var ctrId = 'private_' + windowId;
            if ($('#' + ctrId).length == 0) {
                createPrivateChatWindow(chat, windowId, ctrId, fromUserName, chatTitle);
            }
            else {
                var rType = CheckHiddenWindow();
                if ($('#' + ctrId).parent().css('display') == "none") {
                    $('#' + ctrId).parent().parent().effect("shake", { times: 2 }, 1000);
                    rType = true;
                }
                if (fromUserName != chatTitle) {
                    $('#' + ctrId).chatbox("option", "boxManager").addMyMsg(fromUserName, message);
                } else {
                    $('#' + ctrId).chatbox("option", "boxManager").addMsg(fromUserName, message);
                }

            }

            $('#typing_' + windowId).hide();
        }

        chat.client.GetLastMessages = function (TouserID, CurrentChatMessages) {
            var ctrId = 'private_' + TouserID;
            var AllmsgHtml = "";
            for (i = 0; i < CurrentChatMessages.length; i++) {
                if (CurrentChatMessages[i].FromUserID == parseInt($('#hdnSessionId').data('value'))) {
                    AllmsgHtml += "<div style=\"display: block; max-width: 200px;\" class=\"ui-chatbox-myMsg\">";
                    if (i == CurrentChatMessages.length - 1) {
                        if ($('#' + ctrId).children().last().html() != "<b>" + CurrentChatMessages[i].FromUserName + ": </b><span>" + CurrentChatMessages[i].Messager + "</span>") {
                            AllmsgHtml += "<b>" + CurrentChatMessages[i].FromUserName + ": </b><span>" + CurrentChatMessages[i].Messager + "</span>";
                        }
                    }
                    else {
                        AllmsgHtml += "<b>" + CurrentChatMessages[i].FromUserName + ": </b><span>" + CurrentChatMessages[i].Messager + "</span>";
                    }
                    AllmsgHtml += "</div>";
                } else {
                    AllmsgHtml += "<div style=\"display: block; max-width: 200px;\" class=\"ui-chatbox-msg\">";
                    if (i == CurrentChatMessages.length - 1) {
                        if ($('#' + ctrId).children().last().html() != "<b>" + CurrentChatMessages[i].FromUserName + " </b><span>" + CurrentChatMessages[i].Messager + "</span>") {
                            AllmsgHtml += "<b>" + CurrentChatMessages[i].FromUserName + ": </b><span>" + CurrentChatMessages[i].Messager + "</span>";
                        }
                    }
                    else {
                        AllmsgHtml += "<b>" + CurrentChatMessages[i].FromUserName + ": </b><span>" + CurrentChatMessages[i].Messager + "</span>";
                    }
                    AllmsgHtml += "</div>";
                }
            }
            $('#' + ctrId).prepend(AllmsgHtml);
        }

        chat.client.ReceiveTypingRequest = function (userId) {
            var ctrId = 'private_' + userId;
            if ($('#' + ctrId).length > 0) {
                jQuery('#typing_' + userId).show();
                jQuery('#typing_' + userId).delay(6000).fadeOut("slow");
            }
        }

        function CheckHiddenWindow() {
            var hidden, state;

            if (typeof document.hidden !== "undefined") {
                state = "visibilityState";
            } else if (typeof document.mozHidden !== "undefined") {
                state = "mozVisibilityState";
            } else if (typeof document.msHidden !== "undefined") {
                state = "msVisibilityState";
            } else if (typeof document.webkitHidden !== "undefined") {
                state = "webkitVisibilityState";
            }

            if (document[state] == "hidden")
                return true;
            else
                return false;

        }


        function AddUser(chat, id, name, userid) {
            var currentuserid = parseInt($('#hdnSessionId').data('value'));
            var connectionid = $('#hdId').val();
            var code = "";
            if (connectionid == "") {
                if (userid == currentuserid) {
                    $('#hdId').val(id);
                    connectionid = id;
                    $('#hdUserName').val(name);
                }
            }
            if (connectionid != id) {
                if ($('#' + id).length == 0) {
                    code = $('<a id="' + id + '" style="text-align: center" class="col-sm-12 bg-success" >  ' + name + '<a>');
                    $(code).dblclick(function () {
                        var id = $(this).attr('id');
                        if (connectionid != id) {
                            OpenPrivateChatWindow(chat, id, name);
                        }
                    });
                }
            }
            else {
                if ($('#curruser_' + id).length == 0) {
                    code = $('<div id="curruser_' + id + '" style="text-align: center" class="col-sm-12 bg-info"  >' + name + '<div>');
                }
            }
            $("#chat_box").append(code);
        }

        function OpenPrivateChatWindow(chat, id, userName) {
            var ctrId = 'private_' + id;
            if ($('#' + ctrId).length > 0) return;
            createPrivateChatWindow(chat, id, ctrId, userName, userName);
        }

        function createPrivateChatWindow(chat, userId, ctrId, userName, chatTitle) {
            $("#chat_div").append("<div id=\"" + ctrId + "\"></div>")
            showList.push(ctrId);
            $('#' + ctrId).chatbox({
                id: ctrId,
                user_id: userId,
                title: chatTitle,
                user: userName,
                offset: getNextOffset(),
                width: 200,
                messageSent: function (id, user, msg) {
                    chat.server.sendPrivateMessage(userId, msg);
                    TypingFlag = true;
                },
                userFile: function (file) {
                    const BYTES_PER_CHUNK = 1200;
                    var currentChunk;
                    var fileReader = new FileReader();

                    _myConnection = _myConnection || new RTCPeerConnection(null); // null = no ICE servers

                    // A new ICE candidate was found
                    _myConnection.onicecandidate = function (event) {
                        if (event.candidate) {
                            // Let's send it to our peer via SignalR
                            chat.server.send(userId, JSON.stringify({ "candidate": event.candidate }));
                        }
                    };

                    var channel = _myConnection.createDataChannel("chat");

                    channel.onopen = function (event) {
                        console.log('is open')
                        currentChunk = 0;
                        // send some metadata about our file
                        // to the receiver
                        channel.send(JSON.stringify({
                            fileName: file.name,
                            fileSize: file.size
                        }));
                        readNextChunk();
                    }
                    channel.onmessage = function (event) {
                        console.log(event.data);
                        /*data = JSON.parse(data);
                        arrayToStoreChunks.push(data.message);
                        var ctrId = 'private_1';
                        console.log(ctrId);
                        $('#' + ctrId).chatbox("option", "fileManager").onFileSelected(event.data);*/

                    }
                    channel.onclose = function (event) {
                        console.log('close')
                        channel.close();
                        _myConnection.close();
                        _myConnection = null;
                    }

                    function readNextChunk() {
                        var start = BYTES_PER_CHUNK * currentChunk;
                        var end = Math.min(file.size, start + BYTES_PER_CHUNK);
                        fileReader.readAsArrayBuffer(file.slice(start, end));
                    }

                    fileReader.onload = function () {
                        channel.send(fileReader.result);
                        currentChunk++;

                        if (BYTES_PER_CHUNK * currentChunk < file.size) {
                            readNextChunk();
                        }
                    };

                    _myConnection.createOffer(function (desc) {
                        // Set the generated SDP to be our local session description
                        _myConnection.setLocalDescription(desc, function () {
                            // And send it to our peer, where it will become their RemoteDescription
                            chat.server.send(userId, JSON.stringify({ "sdp": desc }));
                        });
                    }, function (error) { console.log('Error creating session description: ' + error); });


                    this.fileManager.previewFile(file);

                },
                boxClosed: function (removeid) {
                    $('#' + removeid).remove();
                    var idx = showList.indexOf(removeid);
                    if (idx != -1) {
                        showList.splice(idx, 1);
                        diff = config.width + config.gap;
                        for (var i = idx; i < showList.length; i++) {
                            offset = $("#" + showList[i]).chatbox("option", "offset");
                            $("#" + showList[i]).chatbox("option", "offset", offset - diff);
                        }
                    }
                },
                startCall: function (user_id) {
                    chat.server.startCall(userId);
                }
            });
            $('#' + ctrId).siblings().css("position", "relative");
            $('#' + ctrId).siblings().append("<div id=\"typing_" + userId + "\" style=\"width:20px; height:20px; display:none; position:absolute; right:14px; top:8px\"><img height=\"20\" src=\" /></div>");
            $('#' + ctrId).siblings().find('textarea').on('input', function (e) {
                if (TypingFlag == true) {
                    chat.server.sendUserTypingRequest(userId);
                }
                TypingFlag = false;
            });

            var FromUserID = parseInt($('#hdnSessionId').data('value'));
            var ToUserID = userId;
            chat.server.requestLastMessage(FromUserID, ToUserID);
        }



        // list of boxes shown on the page
        var showList = new Array();
        var config = {
            width: 200, //px
            gap: 20,
            maxBoxes: 5
        };

        var getNextOffset = function () {
            return (config.width + config.gap) * showList.length;
        };

        var TypingFlag = true;

        function ResetTypingFlag() {
            TypingFlag = true;
        }

        function AddMessage(userName, message) {
            //$('#divChatWindow').append('<div class="message"><span class="userName">' + userName + '</span>: ' + message + '</div>');
            //var height = $('#divChatWindow')[0].scrollHeight;
            //$('#divChatWindow').scrollTop(height);
        }

        function _createConnection( userId) {
            console.log('creating RTCPeerConnection...');

            // Create a new PeerConnection
            _myConnection = new RTCPeerConnection(null); // null = no ICE servers

            // A new ICE candidate was found
            _myConnection.onicecandidate = function (event) {
                if (event.candidate) {
                    // Let's send it to our peer via SignalR
                    chat.server.send(userId, JSON.stringify({ "candidate": event.candidate }));
                }
            };

            _myConnection.ondatachannel = function (event) {
                var channel = event.channel;
                var incomingFileInfo;
                var incomingFileData;
                var bytesReceived;
                var downloadInProgress = false;
                channel.onopen = function (event) {
                    channel.send('Hi back!');
                }
                channel.onmessage = function (event) {
                    if (downloadInProgress === false) {
                        startDownload(event.data);
                    } else {
                        progressDownload(event.data);
                    }
                }

                channel.onclose = function (event) {
                    console.log('close')
                    channel.close();
                    _myConnection.close();
                    _myConnection = null;
                }

                function startDownload(data) {
                    incomingFileInfo = JSON.parse(data.toString());
                    incomingFileData = [];
                    bytesReceived = 0;
                    downloadInProgress = true;
                    console.log('incoming file <b>' + incomingFileInfo.fileName + '</b> of ' + incomingFileInfo.fileSize + ' bytes');
                }

                function progressDownload(data) {
                    bytesReceived += data.byteLength;
                    incomingFileData.push(data);
                    console.log('progress: ' + ((bytesReceived / incomingFileInfo.fileSize) * 100).toFixed(2) + '%');
                    if (bytesReceived === incomingFileInfo.fileSize) {
                        var ctrId = 'private_' + windown;
                        console.log(ctrId);
                        $('#' + ctrId).chatbox("option", "fileManager").onFileSelected(incomingFileData, incomingFileInfo);
                    }
                }
                
            };

            return _myConnection;
        }

        
    }

});
