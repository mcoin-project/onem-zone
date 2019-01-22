ONEmSimModule.factory('Phone', [
    'Socket',
    '$rootScope',
    'dateFilter',
    function (Socket, $rootScope, dateFilter) {

        var phoneONEm;

        return {
            stop: function () {
                if (!phoneONEm) {
                    console.log("phoneONEm not defined")
                    return;
                }
                if (phoneONEm.isConnected()) phoneONEm.terminateSessions();
                phoneONEm.stop();
                phoneONEm.unregister();
            },
            start: function (response) {
                console.log("got start response");
                Socket.connect();

                var msisdn = $rootScope.msisdn;
                var sipProxy = response.sipproxy;
                var wsProtocol = response.wsprotocol;
                console.log("[WS]: msisdn: " + msisdn);
                console.log("[WS]: SIP Proxy: " + sipProxy);
                console.log("[WS]: web socket protocol: " + wsProtocol);

                var isInCall = 0;

                //These are the variables needed for the code found at https://chromium.googlesource.com/chromium/src.git/+/lkgr/chrome/test/data/webrtc/adapter.js?autodive=0%2F
                var RTCPeerConnection = null;
                var getUserMedia = null;
                var attachMediaStream = null;
                var reattachMediaStream = null;
                var webrtcDetectedBrowser = null;
                //var webrtcDetectedVersion = null;

                //function trace(text) {
                //    // This function is used for logging.
                //    if (text[text.length - 1] == '\n') {
                //        text = text.substring(0, text.length - 1);
                //    };
                //    console.log((performance.now() / 1000).toFixed(3) + ": " + text);
                //};

                // if (navigator.mozGetUserMedia) {
                //     console.log("[WS]: This appears to be Firefox");
                //     webrtcDetectedBrowser = "firefox";
                //     //   webrtcDetectedVersion = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]);
                //     // The RTCPeerConnection object.
                //     RTCPeerConnection = mozRTCPeerConnection;
                //     // The RTCSessionDescription object.
                //     RTCSessionDescription = mozRTCSessionDescription;
                //     // Get UserMedia (only difference is the prefix).
                //     // Code from Adam Barth.
                //     getUserMedia = navigator.mozGetUserMedia.bind(navigator);
                //     // Attach a media stream to an element.
                //     attachMediaStream = function (element, stream) {
                //         console.log("[WS]: Attaching media stream");
                //         element.mozSrcObject = stream;
                //         element.play();
                //     };
                //     reattachMediaStream = function (to, from) {
                //         console.log("[WS]: Reattaching media stream");
                //         to.mozSrcObject = from.mozSrcObject;
                //         to.play();
                //     };
                if (navigator.getUserMedia) {
                    console.log("[WS]: This appears to be Chrome");
                    webrtcDetectedBrowser = "chrome";
                    //   webrtcDetectedVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
                    // The RTCPeerConnection object.
                    //RTCPeerConnection = webkitRTCPeerConnection;
                    // Get UserMedia (only difference is the prefix).
                    // Code from Adam Barth.
                    getUserMedia = navigator.getUserMedia.bind(navigator);
                    // Attach a media stream to an element.
                    attachMediaStream = function (element, stream) {
                        console.log("[WS]: Attaching media stream");
                        if (typeof element.srcObject !== 'undefined') {
                            element.srcObject = stream;
                        } else if (typeof element.mozSrcObject !== 'undefined') {
                            element.mozSrcObject = stream;
                        } else if (typeof element.src !== 'undefined') {
                            element.src = URL.createObjectURL(stream);
                        } else {
                            console.log("[WS]: Error attaching stream to element.");
                        };
                    };
                    reattachMediaStream = function (to, from) {
                        console.log("[WS]: Reattaching media stream");
                        to.src = from.src;
                    };

                    // The representation of tracks in a stream is changed in M26.
                    // Unify them for earlier Chrome versions in the coexisting period.
                    if (!webkitMediaStream.prototype.getVideoTracks) {
                        webkitMediaStream.prototype.getVideoTracks = function () {
                            return this.videoTracks;
                        };
                        webkitMediaStream.prototype.getAudioTracks = function () {
                            return this.audioTracks;
                        };
                    };
                    // New syntax of getXXXStreams method in M26.
                    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
                        webkitRTCPeerConnection.prototype.getLocalStreams = function () {
                            return this.localStreams;
                        };
                        webkitRTCPeerConnection.prototype.getRemoteStreams = function () {
                            return this.remoteStreams;
                        };
                    }
                } else {
                    console.log("[WS]: Browser does not appear to be WebRTC-capable");
                };

                //These are the buttons of the phone's user interface:
                var AnswerButton = $('.call_tools a.answer');
                var RejectButton = $('.call_tools a.cancel');
                var CallButton = $('.screen a.call');
                var ClosePanelButton = $('.screen a.closer');
                var TalkTimer = $('.answer .talktime');

                var audioElement = document.getElementById('myAudio');
                //var audioElement = $('#myAudio')[0];
                audioElement.autoplay = true;
                console.log(audioElement);
                var videoElement = document.getElementById('myVideo');
                //var videoElement = $('#myVideo')[0];
                videoElement.autoplay = true;
                console.log(videoElement);

                var nowMoment = new Date(1970, 0);
                function updateTalkTime() {
                    TalkTimer.text('Current call: ' + dateFilter(nowMoment, 'HH:mm:ss'));
                    nowMoment.setSeconds(nowMoment.getSeconds() + 1);
                };
                var talkTime = null;

                var globalSession = null;

                //// Register callbacks to desired call events
                //var eventHandlers = {
                //    'progress'  : function(e) { },
                //    'failed'    : function(e) { },
                //    'ended'     : function(e) { },
                //    'confirmed' : function(e) { },
                //    'addstream' : function(e) { }
                //};

                var optionsMask = {
                    //'eventHandlers'          : eventHandlers,
                    'sessionTimersExpires': 600,
                    'session_timers': true,
                    'useUpdate': false,
                    'use_preloaded_route': false,
                    'extraHeaders': ['X-WEBRTC-UA: zoiper'],
                    'pcConfig': {
                        'rtcpMuxPolicy': 'negotiate',
                        'iceServers':
                            [{ 'urls': ['stun:stun.l.google.com:19302'] }
                                //{ 'urls'         : [ 'stun:stunserver.org' ] }
                            ]
                    },
                    'mediaConstraints': { 'audio': true, 'video': true }
                };

                //var options = { ...optionsMask };
                var options = jQuery.extend(true, {}, optionsMask);

                function removeAllCryptoLines(sdp) {
                    function removeSingleLine(sdp) {
                        var start = sdp.indexOf("a=crypto");
                        if (start == -1)
                            return false;
                        var end = sdp.indexOf("\n", start);
                        var line = sdp.substring(start, end + 1);
                        return sdp.replace(line, "");
                    }
                    //
                    while (true) {
                        var result = removeSingleLine(sdp);
                        if (!result)
                            break;
                        sdp = result;
                    }
                    //
                    return sdp;
                };

                var socket = new JsSIP.WebSocketInterface(wsProtocol + '://' + sipProxy);

                //JsSIP configuration:
                var configuration = {
                    sockets: [socket],
                    uri: 'sip:' + msisdn + '@' + sipProxy,
                    password: 'ONEmP@$$w0rd2016',
                    useUpdate: false,
                    register: false,
                    use_preloaded_route: false,
                    register_expires: 120
                };

                // For debug run this in the browser's console and reload the page:
                // JsSIP.debug.enable('JsSIP:*');

                phoneONEm = new JsSIP.UA(configuration);

                phoneONEm.registrator().setExtraHeaders([
                    'X-WEBRTC-UA: zoiper'
                ]);

                $('a.full').click(function (e) {
                    e.preventDefault();
                    $('.phone').toggleClass('full');
                    $('body').toggleClass('full');
                    $(this).toggleClass('toggled');
                    return false;
                });

                $('a.open_dialer').click(function (e) {
                    e.preventDefault();
                    $(this).parents('.phone').find('.screen_wrp').addClass('open');
                    $(this).parents('.phone').find('div.dialer').toggleClass('open');
                    console.log('[UI]: Dialer state changed!');
                    return false;
                });

                $('.answer a.num').click(function (e) {
                    e.preventDefault();
                    var $btn = $(this);
                    var val = $(this).data('val');
                    $btn.addClass('pressed');
                    setTimeout(function () {
                        $btn.removeClass('pressed');
                    }, 400);
                    globalSession.sendDTMF(val);
                    console.log("[UI]: Sending DTMF " + val);
                    return false;
                });

                $('.dialer a.num').click(function (e) {
                    e.preventDefault();
                    var $btn = $(this);
                    var val = $(this).data('val');
                    var resizeTextarea = function (el) {
                        var offset = el[0].offsetHeight - el[0].clientHeight;
                        $(el).css('height', 'auto').css('height', el[0].scrollHeight + offset);
                    };
                    $btn.addClass('pressed');
                    setTimeout(function () {
                        $btn.removeClass('pressed');
                    }, 400);
                    $('.dialer #typed_no').val($('.dialer #typed_no').val() + val);
                    resizeTextarea($('.dialer #typed_no'));
                    return false;
                });

                $('a.delete').click(function (e) {
                    e.preventDefault();
                    var $btn = $(this);
                    $btn.addClass('pressed');
                    //setTimeout(function () {
                    //    $btn.removeClass('pressed');
                    //}, 400);
                    $('.dialer #typed_no').val($('.dialer #typed_no').val().slice(0, -1));
                    return false;
                });

                $.each($('.panel textarea[data-autoresize]'), function () {
                    var offset = this.offsetHeight - this.clientHeight;
                    var resizeTextarea = function (el) {
                        $(el).css('height', 'auto').css('height', el.scrollHeight + offset);
                    };
                    $(this).on('keyup input', function (e) {
                        resizeTextarea(this);
                    }).removeAttr('data-autoresize');
                });

                $('.panel textarea').keypress(function (e) {
                    var a = [];
                    var k = e.which;
                    a.push(8);
                    a.push(42);
                    a.push(43);
                    for (var i = 48; i < 58; i++) a.push(i);
                    if (!(a.indexOf(k) >= 0)) e.preventDefault();
                });

                $('a.numpad').click(function (e) {
                    e.preventDefault();
                    $('.answer ul.nums').toggleClass('on');
                    console.log('[UI]: In call numpad state changed');
                    return false;
                });

                $('.answer a.minimize').click(function (e) {
                    e.preventDefault();
                    $('.phone .screen_wrp').removeClass('open');
                    $('.call_notif').addClass('on');
                    $('.phone div.panel').removeClass('open');
                    console.log('[UI]: Pannels minimized from answer panel');
                    return false;
                });

                $('.call_notif a.resume').click(function (e) {
                    e.preventDefault();
                    $('.phone .screen_wrp').addClass('open');
                    $('.call_notif').removeClass('on');
                    $('.phone div.panel.answer').addClass('open');
                    console.log('[UI]: Answer panel maximized');
                    return false;
                });

                phoneONEm.start();
                phoneONEm.register();

                phoneONEm.on('connecting', function (data) {
                    console.log("[WS]: connecting");
                });

                phoneONEm.on('connected', function (data) {
                    console.log("[WS]: connected");
                });

                phoneONEm.on('disconnected', function (data) {
                    console.log("[WS]: disconnected");
                });

                phoneONEm.on('registered', function (data) {
                    console.log("[WS]: registered");
                });

                phoneONEm.on('unregistered', function (data) {
                    console.log("[WS]: unregistered");
                });

                phoneONEm.on('registrationFailed', function (data) {
                    console.log("[WS]: registrationFailed");
                });

                //phoneONEm.on('registrationExpiring', function(data){ //If the application subscribes to this event,
                //    console.log("[WS]: registrationExpiring");       //it’s responsible of calling ua.register() within the registrationExpiring event
                //});                                                  //(otherwise the registration will expire).

                phoneONEm.on('newRTCSession', function (data) {
                    console.log("[WS]: newRTCSession");
                    globalSession = data.session; //session pointer

                    $('.phone div.caller').addClass('open');

                    //Identity display:
                    console.log("[WS]: Caller ID: " + globalSession.remote_identity.uri.user);
                    console.log("[WS]: User Name: " + globalSession.remote_identity.display_name);
                    $('.phone .screen_wrp').addClass('open');
                    $('.answer #typed_no').val(globalSession.remote_identity.uri.user);
                    $('.caller #typed_no').val(globalSession.remote_identity.uri.user);
                    console.log("remote_identity:");
                    console.log(JSON.stringify(globalSession.remote_identity));
                    if (globalSession.remote_identity.display_name) {
                        document.getElementById("user_name").innerHTML = globalSession.remote_identity.display_name;
                    }
                    //$scope.usr_name = globalSession.remote_identity.display_name;

                    globalSession.on("peerconnection", function (e) {
                        console.log("[WS]: newRTCSession - peerconnection");

                        navigator.mediaDevices.getUserMedia({ video: true })
                            .then(mediaStream => {
                                document.querySelector('video').srcObject = mediaStream;
                                return mediaStream.getVideoTracks()[0];
                            });

                        navigator.mediaDevices.getUserMedia({ audio: true })
                            .then(mediaStream => {
                                document.querySelector('audio').srcObject = mediaStream;
                                return mediaStream.getAudioTracks()[0];
                            });

                    });
                    globalSession.on("connecting", function (e) {
                        console.log("[WS]: newRTCSession - connecting");
                    });
                    globalSession.on("sending", function (e) {
                        console.log("[WS]: newRTCSession - sending");
                    });
                    globalSession.on("progress", function (e) {
                        console.log("[WS]: newRTCSession - progress");
                        if (globalSession.direction === "incoming") {
                            console.log("[WS]: Playing incoming call ring:");
                            audioElement.src = "/sounds/old_british_phone.wav";
                            //attachMediaStream(audioElement,"/sounds/old_british_phone.wav");
                        } else { //outgoing
                            console.log("[WS]: Playing outgoing callback tone:");
                            audioElement.src = "/sounds/ringing_tone_uk_new.wav";
                            //attachMediaStream(audioElement,"/sounds/ringing_tone_uk_new.wav");
                        };
                        if (webrtcDetectedBrowser == "firefox") {
                            audioElement.play();
                        };
                    });
                    globalSession.on("accepted", function (e) {
                        console.log("[WS]: newRTCSession - accepted");
                        audioElement.pause();

                        //Schedule update of talk time every second:
                        talkTime = setInterval(updateTalkTime, 1000);

                        //RTCPeerConnection.getLocalStreams/getRemoteStreams are deprecated. Use RTCPeerConnection.getSenders/getReceivers instead.:
                        attachMediaStream(videoElement, globalSession.connection.getRemoteStreams()[0]);
                        if (globalSession.connection.getRemoteStreams()[0].getVideoTracks().length) {
                            videoElement.hidden = false;
                            videoElement.style.visibility = 'visible';
                            $('.phone div.answer .user').addClass('.off');
                            console.log("[WS]: with video");
                        } else {
                            videoElement.hidden = true;
                            videoElement.style.visibility = 'hidden';
                            $('.phone div.answer .user').removeClass('.off');
                            console.log("[WS]: no video");
                        };
                        isInCall = 1;
                    });
                    globalSession.on("confirmed", function (e) {
                        console.log("[WS]: newRTCSession - confirmed");
                    });
                    globalSession.on("ended", function (e) {
                        console.log("[WS]: newRTCSession - ended by " + e.originator);
                        audioElement.pause();
                        videoElement.pause();
                        videoElement.hidden = true;
                        videoElement.style.visibility = 'hidden';
                        isInCall = 0;
                        clearInterval(talkTime);
                        nowMoment = new Date(1970, 0);
                        TalkTimer.text('Current call: ' + dateFilter(nowMoment, 'HH:mm:ss'));
                        $('.phone div.answer .user').removeClass('.off');
                        $('.phone .screen_wrp').removeClass('open');
                        $('.phone div.panel').removeClass('open');
                        $('.phone .call_notif').removeClass('on');
                        $('.answer ul.nums').removeClass('on');
                        $('.answer #typed_no').val('');
                        $('.dialer #typed_no').val('');
                        $('.caller #typed_no').val('');
                        options = jQuery.extend(true, {}, optionsMask);
                    });
                    globalSession.on("failed", function (e) {
                        console.log("[WS]: newRTCSession - failed from " + e.originator + " because " + e.cause);
                        audioElement.pause();
                        videoElement.pause();
                        videoElement.hidden = true;
                        videoElement.style.visibility = 'hidden';
                        isInCall = 0;
                        clearInterval(talkTime);
                        nowMoment = new Date(1970, 0);
                        TalkTimer.text('Current call: ' + dateFilter(nowMoment, 'HH:mm:ss'));
                        $('.phone div.answer .user').removeClass('.off');
                        $('.phone .screen_wrp').removeClass('open');
                        $('.phone div.panel').removeClass('open');
                        $('.phone .call_notif').removeClass('on');
                        $('.answer ul.nums').removeClass('on');
                        $('.answer #typed_no').val('');
                        $('.dialer #typed_no').val('');
                        $('.caller #typed_no').val('');
                        options = jQuery.extend(true, {}, optionsMask);
                    });
                    globalSession.on("newDTMF", function (e) {
                        console.log("[WS]: newRTCSession - newDTMF: " + e.dtmf);
                    });
                    globalSession.on("newInfo", function (e) {
                        console.log("[WS]: newRTCSession - newInfo: " + e.info);
                    });
                    globalSession.on("hold", function (e) {
                        console.log("[WS]: newRTCSession - hold");
                    });
                    globalSession.on("unhold", function (e) {
                        console.log("[WS]: newRTCSession - unhold");
                    });
                    globalSession.on("muted", function (e) {
                        console.log("[WS]: newRTCSession - muted");
                    });
                    globalSession.on("unmuted", function (e) {
                        console.log("[WS]: newRTCSession - unmuted");
                    });
                    //globalSession.on("reinvite",function(e) { //can define callback
                    //    console.log("[WS]: newRTCSession - reinvite");
                    //});
                    //globalSession.on("update",function(e) { //can define callback
                    //    console.log("[WS]: newRTCSession - update");
                    //});
                    globalSession.on("refer", function (e) {
                        console.log("[WS]: newRTCSession - refer");
                        //e.accept(newRTCSession(globalSession)); //Is it?
                    });
                    globalSession.on("replaces", function (e) {
                        console.log("[WS]: newRTCSession - replaces");
                        //e.accept(newRTCSession(globalSession)); //Is it?
                    });
                    globalSession.on("sdp", function (e) {
                        console.log("[WS]: newRTCSession - sdp type " + e.type);
                        // I can modify SDP here!
                        // The SDP content is in the "sdp" string of "e"
                        if (webrtcDetectedBrowser == "chrome") {
                            console.log("[WS]: Fixing SDP bug!");
                            e.sdp = removeAllCryptoLines(e.sdp);
                        };
                    });
                    globalSession.on("getusermediafailed", function (e) {
                        console.log("[WS]: newRTCSession - getusermediafailed");
                    });
                    globalSession.on("peerconnection:createofferfailed", function (e) {
                        console.log("[WS]: newRTCSession - peerconnection:createofferfailed");
                    });
                    globalSession.on("peerconnection:createanswerfailed", function (e) {
                        console.log("[WS]: newRTCSession - peerconnection:createanswerfailed");
                    });
                    globalSession.on("peerconnection:setlocaldescriptionfailed", function (e) {
                        console.log("[WS]: newRTCSession - peerconnection:setlocaldescriptionfailed");
                    });
                    globalSession.on("peerconnection:setremotedescriptionfailed", function (e) {
                        console.log("[WS]: newRTCSession - peerconnection:setremotedescriptionfailed");
                    });

                    //// End call in 30 seconds:
                    //setTimeout(IncomingEndCall, 30000);

                    //function IncomingEndCall() {
                    //  //phoneONEm.terminateSessions();
                    //  globalSession.terminate();
                    //};

                });

                phoneONEm.on('newMessage', function (data) {
                    console.log("[WS]: newMessage: " + data.message);
                });

                // Answer the call:
                AnswerButton.click(function () {
                    console.log("[UI]: AnswerButton - click");
                    globalSession.answer(options);
                    $('.phone div.panel').removeClass('open');
                    $('.phone div.answer').addClass('open');
                    isInCall = 1;
                });

                // End the call or reject the call:
                RejectButton.click(function () {
                    console.log("[UI]: RejectButton - click");
                    //phoneONEm.terminateSessions();
                    globalSession.terminate();
                });

                //Make a phone call:
                CallButton.click(function () {
                    console.log("[UI]: CallButton - click; Call to " + $('.dialer #typed_no').val());
                    phoneONEm.call('sip:' + $('.dialer #typed_no').val() + '@' + sipProxy, options);
                    isInCall = 1;
                    $('.answer #typed_no').val($('.dialer #typed_no').val());
                    $('.dialer #typed_no').val('');
                    $('.phone div.panel').removeClass('open');
                    $('.screen div.answer').addClass('open');
                });

                ClosePanelButton.click(function (e) {
                    console.log("[UI]: ClosePanelButton - click");
                    $('.phone .screen_wrp').removeClass('open');
                    $('.phone div.panel').removeClass('open');
                    if (phoneONEm.isConnected()) phoneONEm.terminateSessions();
                    //if(phoneONEm.isConnected()) globalSession.terminate();
                    if (isInCall == 1) $('.phone div.answer').toggleClass('open');
                });

                window.onunload = function () {
                    if (phoneONEm.isConnected()) phoneONEm.terminateSessions();
                    phoneONEm.stop();
                    phoneONEm.unregister();
                };

            }
        }
    }
]);
